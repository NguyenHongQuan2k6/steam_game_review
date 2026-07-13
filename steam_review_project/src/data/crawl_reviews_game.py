import requests
import json
import os
import glob
import time
from datetime import datetime
import sys
import re
import pandas as pd
from bs4 import BeautifulSoup

# Gọi trạm trung chuyển Database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import load_from_mysql, save_to_mysql

# ============================================================
# BUOC 1: LAY DANH SACH GAME TU MYSQL (THAY VI DOC FILE)
# ============================================================
print("[HỆ THỐNG] Đang kết nối kho dữ liệu để lấy danh sách game...")
# Dùng lệnh SQL để lấy các game không bị trùng lặp
df_games = load_from_mysql("SELECT DISTINCT app_id, title_raw FROM raw_games")

if df_games is None or df_games.empty:
    print("Lỗi: Không tìm thấy game nào trong kho MySQL! Hãy chạy file crawl_raw_data.py trước.")
    exit()

# Biến bảng Pandas trở lại thành list dictionary như luồng code cũ
games_list = df_games.to_dict('records')
print(f"Đã tải thành công {len(games_list)} tựa game từ Database!")

# --- CODE CŨ: ĐỌC TỪ FILE JSON (ĐÃ CHÚ THÍCH DỰ PHÒNG) ---
# current_dir = os.path.dirname(os.path.abspath(__file__))
# raw_data_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'raw'))
# list_of_files = glob.glob(os.path.join(raw_data_dir, 'steam_games_raw_*.json'))
# if not list_of_files:
#     print("Loi: Khong tim thay file danh sach game nao trong data/raw/")
#     exit()
# latest_file = max(list_of_files, key=os.path.getctime)
# print(f"Dang doc danh sach game tu file: {os.path.basename(latest_file)}")
# with open(latest_file, 'r', encoding='utf-8') as f:
#     games_list = json.load(f)


# ============================================================
# BUOC 2: TAO THU MUC LUU REVIEWS (Đã vô hiệu hóa vì không cần lưu file nữa)
# ============================================================
# reviews_dir = os.path.join(raw_data_dir, 'reviews')
# os.makedirs(reviews_dir, exist_ok=True)


# ============================================================
# BUOC 3: CAO DU LIEU REVIEWS QUA STEAM API
# ============================================================
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for game in games_list:
    app_id = game.get('app_id')
    title = game.get('title_raw')
    
    if not app_id:
        continue
        
    print(f"\n--- Dang xu ly game: {title} (App ID: {app_id}) ---")
    
    reviews_data = []
    cursor = '*'
    max_reviews_per_game = 200 # Gioi han so luong review can lay cho moi game
    
    while len(reviews_data) < max_reviews_per_game:
        url = f"https://store.steampowered.com/appreviews/{app_id}"
        
        params = {
            'json': 0,
            'filter': 'recent',
            'language': 'english', # Chi lay danh gia tieng Anh de de train ML
            'review_type': 'all',
            'purchase_type': 'all',
            'num_per_page': 100,
            'cursor': cursor
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Loi truy cap API cho App ID {app_id}. Ma loi: {response.status_code}")
                break
                
            data = response.json()
            html_content = data.get('html', '')
            
            soup = BeautifulSoup(html_content, 'html.parser')
            review_boxes = soup.find_all('div', class_='review_box')
            
            if not review_boxes:
                print("Da het danh gia hoac game khong co danh gia.")
                break
                
            for box in review_boxes:
                # 1. Extract recommendation ID
                rec_id = None
                content_ctn = box.find('div', class_='ReviewContentCtn')
                if content_ctn:
                    ctn_id = content_ctn.get('id', '')
                    match_id = re.search(r'\d+', ctn_id)
                    if match_id:
                        rec_id = match_id.group(0)
                
                # 2. Extract review text
                content_div = box.find('div', class_='content')
                review_text_raw = content_div.text.strip() if content_div else ""
                
                # 3. Extract playtime
                playtime_forever = 0
                hours_div = box.find('div', class_='hours')
                if hours_div:
                    hours_text = hours_div.text.lower().strip()
                    match = re.search(r'([\d\.,]+)\s*hr', hours_text)
                    if match:
                        try:
                            # Convert hours to minutes as expected by the database schema
                            hours = float(match.group(1).replace(',', ''))
                            playtime_forever = int(round(hours * 60))
                        except Exception:
                            pass
                            
                review_dict = {
                    "review_id": rec_id,
                    "review_text_raw": review_text_raw,
                    "playtime_forever": playtime_forever
                }
                reviews_data.append(review_dict)
                
            cursor = data.get('cursor')
            print(f"Da thu thap duoc {len(reviews_data)} danh gia...")
            
            time.sleep(1) # Nghi 1 giay de Steam khong block IP
            
        except Exception as e:
            print(f"Xay ra loi: {e}")
            break
            
    # ============================================================
    # BUOC 4: LƯU REVIEWS VÀO DATABASE (THAY VÌ FILE JSON)
    # ============================================================
    if reviews_data:
        print(f"\n[DATABASE] Đang đẩy {len(reviews_data)} đánh giá vào hệ thống MySQL...")
        
        # 1. Chuyển list thành bảng Pandas
        df_reviews = pd.DataFrame(reviews_data)
        
        # 2. Bổ sung các cột quan trọng để theo dõi lịch sử
        df_reviews['app_id'] = app_id
        df_reviews['crawl_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 3. Bơm thẳng vào bảng 'raw_reviews'
        save_to_mysql(df_reviews, table_name='raw_reviews', mode='append')

        # --- CODE CŨ: LUU FILE JSON CHO TUNG GAME (ĐÃ CHÚ THÍCH DỰ PHÒNG) ---
        # file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # review_file_name = f"{app_id}_reviews_raw_{file_timestamp}.json"
        # review_file_path = os.path.join(reviews_dir, review_file_name)
        # with open(review_file_path, 'w', encoding='utf-8') as f:
        #     json.dump(reviews_data, f, ensure_ascii=False, indent=4)
        # print(f"Luu thanh cong {len(reviews_data)} danh gia vao: {review_file_name}")