import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
import sys
import pandas as pd
import time

# ============================================================
# CẤU HÌNH & GỬI YÊU CẦU (REQUEST)
# ============================================================
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
url = 'https://store.steampowered.com/search/?sort_by=_ASC&supportedlang=vietnamese&cc=vn'

# Gọi trạm trung chuyển Database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import save_to_mysql

def clean_and_convert_price_to_usd(price_val) -> str:
    if not price_val:
        return "N/A"
    price_str = str(price_val).strip()
    if price_str.lower() in ["free", "free to play", "miễn phí", "0"]:
        return "Free"
        
    # If already USD
    if "$" in price_str or "usd" in price_str.lower():
        if not price_str.startswith("$"):
            digits = "".join([c for c in price_str if c.isdigit() or c == '.'])
            try:
                return f"${float(digits):.2f}"
            except Exception:
                pass
        return price_str
        
    # If VND (contains ₫, đ, vnd)
    if "₫" in price_str or "đ" in price_str.lower() or "vnd" in price_str.lower() or "vnđ" in price_str.lower():
        digits_str = "".join([c for c in price_str if c.isdigit()])
        if digits_str:
            try:
                vnd = float(digits_str)
                usd = vnd / 25000.0
                if usd > 10000:
                    usd = usd / 100.0
                return f"${usd:.2f}"
            except Exception:
                pass
                
    # If it is just a number
    cleaned_num = price_str.replace(".", "").replace(",", "")
    if cleaned_num.isdigit():
        try:
            val = float(cleaned_num)
            if val > 10000:
                return f"${val / 25000.0:.2f}"
            else:
                return f"${val / 100.0:.2f}"
        except Exception:
            pass
            
    return price_str

def fetch_steam_app_details(app_id):
    """
    Scrapes game details directly from Steam Store HTML page for a given app_id.
    Returns a dict with 'image_url', 'price_display_raw', and 'game_url'.
    """
    if not app_id:
        return {"image_url": None, "price_display_raw": None, "game_url": None}
        
    store_url = f"https://store.steampowered.com/app/{app_id}/?cc=us"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    cookies = {
        'birthtime': '946684800',
        'wants_mature_content': '1',
        'lastagecheckage': '1-0-2000'
    }
    
    try:
        response = requests.get(store_url, headers=headers, cookies=cookies, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 1. Extract Image
            img_tag = soup.find('img', class_='game_header_image_full')
            image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None
            
            # 2. Extract Price
            price_display_raw = None
            
            # Case A: Discounted game
            discount_div = soup.find('div', class_='discount_final_price')
            if discount_div:
                price_display_raw = discount_div.text.strip()
                
            # Case B: Standard price game
            if not price_display_raw:
                purchase_div = soup.find('div', class_='game_purchase_price')
                if purchase_div:
                    price_display_raw = purchase_div.text.strip()
                    
            # Case C: Alternate price divs (for bundle/packages/free to play)
            if not price_display_raw:
                purchase_action_divs = soup.find_all('div', class_='game_purchase_action')
                for div in purchase_action_divs:
                    price_div = div.find('div', class_='price')
                    if price_div:
                        price_display_raw = price_div.text.strip()
                        break
                        
            # Case D: Free to play banner
            if not price_display_raw:
                free_banner = soup.find('div', class_='game_purchase_price')
                if free_banner and "free" in free_banner.text.lower():
                    price_display_raw = "Free"
                    
            if not price_display_raw:
                price_display_raw = "N/A"
                
            game_url = f"https://store.steampowered.com/app/{app_id}/"
            return {
                "image_url": image_url,
                "price_display_raw": price_display_raw,
                "game_url": game_url
            }
        else:
            print(f"[WARNING] Steam Store returned status {response.status_code} for app_id {app_id}")
    except Exception as e:
        print(f"[WARNING] Failed to scrape app details for {app_id}: {e}")
        
    return {
        "image_url": None,
        "price_display_raw": None,
        "game_url": f"https://store.steampowered.com/app/{app_id}/"
    }

print("Đang tải mã HTML từ Steam...")
response = requests.get(url, headers=headers)

list_raw_games = []

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    games = soup.find_all('a', class_='search_result_row')
    
    # Lấy mốc thời gian cào dữ liệu ngay lúc này
    crawl_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print("Bắt đầu trích xuất dữ liệu thô (Raw Data)...")

    # ============================================================
    # TRÍCH XUẤT DỮ LIỆU NGUYÊN BẢN
    # ============================================================
    for game in games:
        title_elem = game.find('span', class_='title')
        
        if title_elem:
            app_id = game.get('data-ds-appid')
            # 1. Tìm Ngày phát hành thô
            release_elem = game.find('div', class_='search_released')
            raw_release = release_elem.text if release_elem else ""

            # 2. Tìm Giá tiền thô (Steam thường để giá cuối cùng ở thẻ này)
            price_elem = game.find('div', class_='discount_final_price')
            raw_price = price_elem.text if price_elem else ""
            if not raw_price:
                price_elem_alt = game.find('div', class_='search_price')
                if price_elem_alt:
                    raw_price = price_elem_alt.text.strip()

            # Gọi Steam Store API appdetails để lấy link ảnh và giá chính xác
            print(f"Đang truy vấn chi tiết game: {title_elem.text} (ID: {app_id})...")
            details = fetch_steam_app_details(app_id)
            
            image_url = details.get('image_url')
            price_display_raw = details.get('price_display_raw')
            
            # Fallback nếu API details không trả về giá trị
            if not price_display_raw and raw_price:
                price_display_raw = raw_price.strip()
            if not price_display_raw:
                price_display_raw = "N/A"
                
            # Đảm bảo URL game trực tiếp theo đúng format yêu cầu
            game_url = details.get('game_url') or f"https://store.steampowered.com/app/{app_id}/"

            # 3. Đóng gói vào Từ điển (Dictionary)
            game_dict = {
                "app_id": app_id,
                "title_raw": title_elem.text,
                "release_date_raw": raw_release,
                "price_raw": raw_price,
                "game_url": game_url,
                "image_url": image_url,
                "price_display_raw": clean_and_convert_price_to_usd(price_display_raw),
                "crawl_time": crawl_time
            }
            list_raw_games.append(game_dict)
            
            # Sleep 0.5s để tránh bị block IP/rate-limit
            time.sleep(0.5)

    # ============================================================
    # LƯU DỮ LIỆU VÀO DATABASE (THAY VÌ FILE JSON)
    # ============================================================
    if list_raw_games:
        print("\n[DATABASE] Đang chuẩn bị đẩy dữ liệu vào hệ thống...")
        
        # 1. Chuyển danh sách thành bảng dữ liệu Pandas
        df_games = pd.DataFrame(list_raw_games)
        
        # 2. Bơm thẳng vào bảng 'raw_games' trong MySQL
        save_to_mysql(df_games, table_name='raw_games', mode='append')

        # --- CODE CŨ: LƯU FILE JSON (ĐÃ CHÚ THÍCH DỰ PHÒNG) ---
        # current_dir = os.path.dirname(os.path.abspath(__file__))
        # thu_muc_luu = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'raw'))
        # os.makedirs(thu_muc_luu, exist_ok=True)
        # file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # ten_file = os.path.join(thu_muc_luu, f'steam_games_raw_{file_timestamp}.json')
        # with open(ten_file, 'w', encoding='utf-8') as f:
        #     json.dump(list_raw_games, f, ensure_ascii=False, indent=4)
        # print(f"Dữ liệu Raw đã được lưu tại: {ten_file}")

else:
    print(f"Lỗi kết nối. Steam trả về mã: {response.status_code}")