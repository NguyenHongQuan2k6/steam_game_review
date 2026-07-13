import pandas as pd
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

# ============================================================
# BƯỚC 1: TỰ ĐỘNG DÒ TÌM FILE EXCEL TRÊN MÁY TÍNH
# ============================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'data_to_label.xlsx'))

# Định vị thư mục data/features để lát nữa lưu kết quả
features_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'features'))
os.makedirs(features_dir, exist_ok=True)

try:
    print("Đang nạp tập dữ liệu từ ổ cứng")
    df = pd.read_excel(file_path, engine='openpyxl')
    
    # Lọc bỏ dòng trống nhãn
    df['sentiment_label'] = pd.to_numeric(df['sentiment_label'], errors='coerce')
    df = df.dropna(subset=['sentiment_label'])
    
    print(f"Đã nạp thành công {len(df)} bình luận\n")

    # ============================================================
    # BƯỚC 2: FEATURE ENGINEERING VỚI TF-IDF
    # ============================================================
    print("lõi toán học TF-IDF")
    
    tfidf_vectorizer = TfidfVectorizer(max_features=1500, stop_words='english')
    
    # Biến văn bản thành Ma trận số X (Đầu vào)
    X = tfidf_vectorizer.fit_transform(df['review_text_clean'].astype(str))
    
    # Tách cột Nhãn ra thành Vector y (Đầu ra / Mục tiêu học)
    y = df['sentiment_label']
    
    print(f"Hình dáng của Ma trận Dữ liệu (X): {X.shape}")
    
    # ============================================================
    # BƯỚC 3: LƯU TRỮ MA TRẬN VÀ BỘ CHUYỂN ĐỔI
    # ============================================================
    print("\nđóng gói và lưu trữ ma trận")
    
    joblib.dump(X, os.path.join(features_dir, 'X_matrix.pkl'))
    joblib.dump(y, os.path.join(features_dir, 'y_labels.pkl'))
    joblib.dump(tfidf_vectorizer, os.path.join(features_dir, 'tfidf_vectorizer.pkl'))
    
    print(f"Đã xuất 3 file (.pkl) vào thư mục: {features_dir}")

except FileNotFoundError:
    print(f"Không tìm thấy file Excel tại đường dẫn:\n{file_path}")
except Exception as e:
    print(f"Có lỗi xảy ra: {e}")