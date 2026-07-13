import pandas as pd
import re
import os
import sys

# ============================================================
# GỌI TRẠM TRUNG CHUYỂN DATABASE
# ============================================================
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import load_from_mysql, save_to_mysql

# (Đã loại bỏ định nghĩa trùng lặp của clean_game_data)
    
def clean_and_convert_price_to_vnd(price_val) -> str:
    if not price_val:
        return "N/A"
    price_str = str(price_val).strip()
    if price_str.lower() in ["free", "free to play", "miễn phí", "0"]:
        return "Miễn phí"
        
    # If already VND (contains ₫, đ, vnd)
    if "₫" in price_str or "đ" in price_str.lower() or "vnd" in price_str.lower() or "vnđ" in price_str.lower():
        digits_str = "".join([c for c in price_str if c.isdigit()])
        if digits_str:
            try:
                vnd = float(digits_str)
                return f"{int(vnd):,} ₫".replace(",", ".")
            except Exception:
                pass
                
    # If already USD (contains $ or usd)
    if "$" in price_str or "usd" in price_str.lower():
        digits_str = "".join([c for c in price_str if c.isdigit() or c == '.'])
        if digits_str:
            try:
                usd = float(digits_str)
                vnd = usd * 25000.0
                return f"{int(round(vnd)):,} ₫".replace(",", ".")
            except Exception:
                pass
                
    # If Euro (contains € or eur)
    if "€" in price_str or "eur" in price_str.lower():
        digits_str = "".join([c for c in price_str if c.isdigit() or c == '.' or c == ','])
        if ',' in digits_str and '.' not in digits_str:
            digits_str = digits_str.replace(',', '.')
        digits_only = "".join([c for c in digits_str if c.isdigit() or c == '.'])
        if digits_only:
            try:
                eur = float(digits_only)
                vnd = eur * 27000.0
                return f"{int(round(vnd)):,} ₫".replace(",", ".")
            except Exception:
                pass

    # If it is just a number
    cleaned_num = price_str.replace(".", "").replace(",", "")
    if cleaned_num.isdigit():
        try:
            val = float(cleaned_num)
            if val > 10000:
                return f"{int(val):,} ₫".replace(",", ".")
            else:
                if "." in price_str or "," in price_str:
                    val_float = float(price_str.replace(",", "."))
                    vnd = val_float * 25000.0
                    return f"{int(round(vnd)):,} ₫".replace(",", ".")
                else:
                    vnd = val * 25000.0
                    return f"{int(round(vnd)):,} ₫".replace(",", ".")
        except Exception:
            pass
            
    return price_str

def clean_game_data():
    print("Đang rút dữ liệu Game raw từ kho MySQL")
    
    # 1. Đọc thẳng từ MySQL thay vì đọc file JSON
    df = load_from_mysql("SELECT * FROM raw_games")
    
    if df is None or df.empty:
        print("Bảng raw_games trống! Hãy chạy cào dữ liệu trước.")
        return

    print("Đang tiến hành làm sạch dữ liệu Game")
    
    # 2. Làm sạch tên game (lowercase, xóa ký tự thương hiệu)
    df['title_clean'] = df['title_raw'].str.lower().str.replace('™', '', regex=False).str.replace('®', '', regex=False)
    
    # 3. Làm sạch ngày phát hành (xóa \n và khoảng trắng thừa)
    df['release_date_clean'] = df['release_date_raw'].str.replace('\n', ' ', regex=False).str.strip()
    df['release_date_clean'] = df['release_date_clean'].replace(r'\s+', ' ', regex=True)
    df['release_date_clean'] = pd.to_datetime(df['release_date_clean'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # 4. Làm sạch giá tiền (Đồng bộ và chuyển đổi sang VND)
    def clean_row_prices(row):
        # Lấy giá raw tốt nhất (ưu tiên price_display_raw đã được cào và xử lý sơ bộ)
        p_raw = row.get('price_display_raw') if 'price_display_raw' in row.index else None
        if pd.isnull(p_raw) or str(p_raw).strip() == "" or str(p_raw).strip().upper() == "N/A":
            p_raw = row.get('price_raw') if 'price_raw' in row.index else None
            
        if pd.isnull(p_raw) or str(p_raw).strip() == "" or str(p_raw).strip().upper() == "N/A":
            return "N/A", 0.0
            
        p_str = str(p_raw).strip()
        if 'free' in p_str.lower():
            return "Miễn phí", 0.0
            
        # Chuẩn hóa về chuỗi hiển thị VND
        price_display = clean_and_convert_price_to_vnd(p_str)
        
        # Trích xuất giá trị số float (mệnh giá là Đồng) từ chuỗi hiển thị
        if price_display == "Miễn phí" or price_display == "N/A":
            price_clean = 0.0
        elif "₫" in price_display:
            try:
                # Chỉ lấy số từ chuỗi hiển thị VND
                digits = "".join([c for c in price_display if c.isdigit()])
                price_clean = float(digits) if digits else 0.0
            except ValueError:
                price_clean = 0.0
        else:
            # Fallback nếu không có ký hiệu đ (ví dụ lỗi chuỗi chưa chuyển đổi thành công)
            digits_only = "".join([c for c in price_display if c.isdigit()])
            if digits_only:
                try:
                    price_clean = float(digits_only)
                except ValueError:
                    price_clean = 0.0
            else:
                price_clean = 0.0
                
        return price_display, price_clean

    # Áp dụng hàm để lấy đồng thời cả price_display và price_clean
    prices_tuples = df.apply(clean_row_prices, axis=1)
    df['price_display'] = [p[0] for p in prices_tuples]
    df['price_clean'] = [p[1] for p in prices_tuples]
    
    # Loại bỏ các hàng có price_display là N/A
    df = df[df['price_display'] != 'N/A']
    
    # 5. Cắt bỏ tracking code trong URL hoặc chuẩn hóa theo app_id
    if 'app_id' in df.columns:
        df['game_url_clean'] = df['app_id'].apply(lambda x: f"https://store.steampowered.com/app/{x}/" if pd.notnull(x) and str(x).strip() != "" else None)
    elif 'game_url' in df.columns:
        df['game_url_clean'] = df['game_url'].str.split('?').str[0]
    else:
        df['game_url_clean'] = None

    # Xử lý cột image_url (Tự động dựng link tĩnh nếu null)
    def fill_image_url(row):
        img_url = row.get('image_url')
        app_id = row.get('app_id')
        if pd.isnull(img_url) or str(img_url).strip() == "":
            if pd.notnull(app_id) and str(app_id).strip() != "":
                return f"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{app_id}/header.jpg"
            return None
        return img_url

    df['image_url'] = df.apply(fill_image_url, axis=1)

    # (Đã xử lý đồng thời trong bước làm sạch giá tiền 4)
    
    # Đảm bảo tất cả các cột đầu ra tồn tại
    required_cols = ['app_id', 'title_clean', 'release_date_clean', 'price_clean', 'game_url_clean', 'image_url', 'price_display', 'crawl_time']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None
    
    # Lựa chọn lại các cột cần thiết
    df_final = df[required_cols]
    
    # Xóa trùng lặp dựa trên app_id để đảm bảo mỗi game chỉ có 1 dòng sạch nhất
    df_final = df_final.copy()
    df_final.drop_duplicates(subset=['app_id'], keep='last', inplace=True)
    
    # 6. Đẩy thẳng lên MySQL (Tạo bảng cleaned_games)
    save_to_mysql(df_final, table_name='cleaned_games', mode='replace')
    
    # BỔ SUNG: Xuất ra file CSV để đồng bộ dữ liệu tĩnh với Backend/Frontend
    try:
        csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed', 'cleaned_games_data.csv'))
        df_final.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"Đã xuất cleaned_games_data.csv tại: {csv_path}")
    except Exception as csv_err:
        print(f"Lỗi xuất cleaned_games_data.csv: {csv_err}")


def clean_all_reviews_text():
    print("\nĐang rút toàn bộ dữ liệu Đánh giá thô từ kho MySQL")
    
    # 1. Rút dữ liệu từ Database
    df = load_from_mysql("SELECT * FROM raw_reviews")
    
    if df is None or df.empty:
        print("Bảng raw_reviews trống!")
        return

    # 2. Xóa trùng lặp: Đảm bảo 1 bình luận không bị nạp vào 2 lần
    so_luong_truoc = len(df)
    df.drop_duplicates(subset=['review_id'], keep='last', inplace=True)
    print(f"Đã gộp {so_luong_truoc} bình luận. Sau khi lọc trùng còn {len(df)} bình luận độc lập.")

    # Loại bỏ hoàn toàn các bình luận chứa emoji
    def has_emoji(text):
        if not isinstance(text, str):
            return False
        emoji_pattern = re.compile(
            '['
            '\U0001f600-\U0001f64f'  # emoticons
            '\U0001f300-\U0001f5ff'  # symbols & pictographs
            '\U0001f680-\U0001f6ff'  # transport & map symbols
            '\U0001f1e0-\U0001f1ff'  # flags
            '\U0001f900-\U0001f9ff'  # Supplemental Symbols and Pictographs
            '\U0001fa70-\U0001faff'  # Symbols and Pictographs Extended-A
            '\u2600-\u27BF'          # Dingbats and Misc Symbols
            ']+', flags=re.UNICODE
        )
        return bool(emoji_pattern.search(text))

    print("Đang lọc bỏ các bình luận có chứa emoji...")
    so_luong_truoc_emoji = len(df)
    df = df[~df['review_text_raw'].apply(has_emoji)]
    print(f"Đã loại bỏ {so_luong_truoc_emoji - len(df)} bình luận chứa emoji. Còn lại {len(df)} bình luận.")

    # 3. Hàm NLP làm sạch văn bản
    def nlp_clean_text(text):
        if not isinstance(text, str):
            return ""
        text = text.lower()
        # Chỉ giữ lại a-z và khoảng trắng, xóa toàn bộ ký tự đặc biệt/emoji
        text = re.sub(r'[^a-z\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()
        
    print("Đang chạy bộ lọc ngôn ngữ (NLP)")
    df['review_text_clean'] = df['review_text_raw'].apply(nlp_clean_text)
    
    # Xóa các dòng rỗng
    df = df[df['review_text_clean'] != '']
    
    # Bổ sung sẵn cột 'sentiment_label' rỗng (None) để lát nữa tiện gán nhãn
    df['sentiment_label'] = None
    
    # Lựa chọn các cột quan trọng
    df_final = df[['app_id', 'review_id', 'review_text_clean', 'playtime_forever', 'crawl_time', 'sentiment_label']]
    
    # 4. Đẩy lên bảng cleaned_reviews trong MySQL
    save_to_mysql(df_final, table_name='cleaned_reviews', mode='replace')
    
    # BỔ SUNG: Xuất ra file CSV để đồng bộ dữ liệu tĩnh với Backend/Frontend
    try:
        csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed', 'cleaned_reviews.csv'))
        df_final.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"Đã xuất cleaned_reviews.csv tại: {csv_path}")
    except Exception as csv_err:
        print(f"Lỗi xuất cleaned_reviews.csv: {csv_err}")


if __name__ == "__main__":
    print("Bắt đầu dọn dẹp dữ liệu từ SQL")
    clean_game_data()
    clean_all_reviews_text()
    print("Hoàn tất")