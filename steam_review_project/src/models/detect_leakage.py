import pandas as pd
import numpy as np
import sys
import os
import time
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, f1_score, classification_report
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Đảm bảo in tiếng Việt không lỗi font trên console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import các helper của dự án
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import load_from_mysql
from src.models.train_model import advanced_nlp_preprocessing

def detect_leakage():
    print("="*70)
    # AI DETECTING DATA LEAKAGE SYSTEM
    print(" HỆ THỐNG PHÁT HIỆN RÒ RỈ DỮ LIỆU (DATA LEAKAGE DETECTOR)")
    print("="*70)

    # 1. Rút dữ liệu thô từ MySQL để phân tích
    print("\nNạp dữ liệu gốc từ database")
    query = """
    SELECT review_text_clean, sentiment_label 
    FROM labeled_reviews 
    WHERE sentiment_label IS NOT NULL AND sentiment_label != ''
    """
    df_raw = load_from_mysql(query)
    
    if df_raw is None or df_raw.empty:
        print("Không tìm thấy dữ liệu trong bảng labeled_reviews.")
        return
        
    df_raw['sentiment_label'] = pd.to_numeric(df_raw['sentiment_label'], errors='coerce')
    df_raw = df_raw.dropna(subset=['sentiment_label'])
    df_raw['sentiment_label'] = df_raw['sentiment_label'].astype(int)
    df_raw = df_raw[df_raw['sentiment_label'].isin([-1, 0, 1])]

    print(f"Tổng số bản ghi thu thập được: {len(df_raw)}")

    # -------------------------------------------------------------------------
    # PHẦN 1: PHÁT HIỆN RÒ RỈ TRÙNG LẶP VĂN BẢN (DUPLICATE TEXT LEAKAGE)
    # -------------------------------------------------------------------------
    print("\n" + "-"*60)
    print("PHÂN TÍCH RÒ RỈ TRÙNG LẶP VĂN BẢN (DUPLICATE LEAK)")
    print("-"*60)

    # Đếm trùng lặp văn bản
    total_reviews = len(df_raw)
    duplicated_reviews = df_raw.duplicated(subset=['review_text_clean']).sum()
    print(f"Tổng số reviews: {total_reviews}")
    print(f"Số lượng reviews trùng lặp văn bản: {duplicated_reviews} ({duplicated_reviews/total_reviews*100:.2f}%)")

    # Giả lập chia Train/Test 80-20 giống train_model.py
    # Áp dụng NLP Preprocessing trước để lấy chính xác dữ liệu đưa vào mô hình
    print("Đang chạy NLP Preprocessing cho dữ liệu kiểm tra")
    df_raw['review_text_nlp'] = df_raw['review_text_clean'].apply(advanced_nlp_preprocessing)
    
    X = df_raw['review_text_nlp']
    y = df_raw['sentiment_label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Tìm kiếm các mẫu xuất hiện ở cả tập Train và tập Test
    train_texts = set(X_train)
    leaked_in_test = [text for text in X_test if text in train_texts]
    leaked_count = len(leaked_in_test)
    
    print(f"\nKẾT QUẢ PHÂN TÍCH RÒ RỈ:")
    print(f"Số lượng câu trong tập Test đã xuất hiện trong tập Train: {leaked_count} / {len(X_test)} câu")
    print(f"Tỉ lệ rò rỉ dữ liệu trong tập Test: {leaked_count/len(X_test)*100:.2f}%")
    
    if leaked_count > 0:
        print("\nVí dụ các câu trùng lặp xuất hiện ở cả tập Huấn luyện & Kiểm thử:")
        # Thống kê các câu bị lặp nhiều nhất
        leaked_series = pd.Series(leaked_in_test)
        print(leaked_series.value_counts().head(5))

    # -------------------------------------------------------------------------
    # PHẦN 2: PHÁT HIỆN RÒ RỈ VÀ THIÊN LỆCH NHÃN VÀO TẬP KIỂM THỬ (VADER TARGET LEAK)
    # -------------------------------------------------------------------------
    print("\n" + "-"*60)
    print("PHÂN TÍCH RÒ RỈ THÔNG TIN NHÃN QUA BỘ LỌC VADER")
    print("-"*60)

    # Chạy VADER để xem có bao nhiêu nhãn bị thay đổi
    sia = SentimentIntensityAnalyzer()
    vader_cleaned_labels = []
    change_count = 0
    for idx, row in df_raw.iterrows():
        text = str(row['review_text_clean'])
        label = row['sentiment_label']
        scores = sia.polarity_scores(text)
        compound = scores['compound']
        
        if compound > 0.35:
            new_label = 1
        elif compound < -0.35:
            new_label = -1
        else:
            new_label = label
            
        if new_label != label:
            change_count += 1
        vader_cleaned_labels.append(new_label)
        
    print(f"- Số nhãn bị thay đổi bởi VADER trên toàn bộ dataset: {change_count} / {len(df_raw)} ({change_count/len(df_raw)*100:.2f}%)")

    # -------------------------------------------------------------------------
    # PHẦN 3: GIẢ LẬP ĐỂ CHỨNG MINH SỰ CHÊNH LỆCH ĐIỂM SỐ (SIMULATION EXPERIMENT)
    # -------------------------------------------------------------------------
    print("\n" + "-"*60)
    print("GIẢ LẬP ĐỂ SO SÁNH HIỆU NĂNG THỰC TẾ VS HIỆU NĂNG ẢO")
    print("-"*60)
    
    # Thiết lập Vectorizer giống hệt train_model.py
    negation_words = {'not', 'no', 'nor', 'none', 'never', 'nothing', 'nowhere', 'cannot'}
    base_stopwords = set(ENGLISH_STOP_WORDS) - negation_words
    gamer_stopwords = {
        'play', 'playing', 'played', 'just', 'like', 'get', 'got', 'don', 've', 'make', 'did',
        'game', 'games', 'character', 'characters', 'player', 'players', 'developer', 'developers',
        'hour', 'hours', 'time', 'playtime', 'steam'
    }
    custom_stopwords = list(base_stopwords.union(gamer_stopwords))
    
    # Hàm con hỗ trợ huấn luyện và đánh giá nhanh
    def evaluate_pipeline(X_tr, X_te, y_tr, y_te, description):
        tfidf = TfidfVectorizer(max_features=12000, ngram_range=(1, 3), stop_words=custom_stopwords, sublinear_tf=True)
        X_tr_vec = tfidf.fit_transform(X_tr)
        X_te_vec = tfidf.transform(X_te)
        
        model = LinearSVC(max_iter=2000, random_state=42, C=1.0, class_weight='balanced')
        model.fit(X_tr_vec, y_tr)
        
        preds = model.predict(X_te_vec)
        acc = accuracy_score(y_te, preds)
        f1 = f1_score(y_te, preds, average='macro')
        
        print(f"\n[{description}]")
        print(f"Accuracy: {acc*100:.2f}%")
        print(f"F1-macro: {f1:.4f}")
        return acc, f1

    # --- KỊCH BẢN A: Quy trình lỗi hiện tại (Có Data Leakage) ---
    # 1. Nhãn được làm sạch trước khi split
    df_leak = df_raw.copy()
    df_leak['sentiment_label'] = vader_cleaned_labels
    X_l = df_leak['review_text_nlp']
    y_l = df_leak['sentiment_label']
    X_tr_l, X_te_l, y_tr_l, y_te_l = train_test_split(X_l, y_l, test_size=0.2, random_state=42, stratify=y_l)
    
    acc_a, f1_a = evaluate_pipeline(X_tr_l, X_te_l, y_tr_l, y_te_l, "KỊCH BẢN A: Quy trình hiện tại (Bị rò rỉ cả Trùng lặp & VADER)")

    # --- KỊCH BẢN B: Quy trình sạch (Không rò rỉ) ---
    # 1. Loại bỏ trùng văn bản trước
    df_clean = df_raw.drop_duplicates(subset=['review_text_clean'], keep='first').copy()
    
    # 2. Chia train-test dựa trên nhãn GỐC (chưa sửa đổi bằng VADER)
    X_c = df_clean['review_text_nlp']
    y_c = df_clean['sentiment_label']
    X_tr_c, X_te_c, y_tr_c, y_te_c = train_test_split(X_c, y_c, test_size=0.2, random_state=42, stratify=y_c)
    
    # 3. Chỉ áp dụng VADER để sửa nhãn trên tập TRAIN
    y_tr_c_cleaned = []
    for txt, lbl in zip(X_tr_c, y_tr_c):
        # Dùng text_clean gốc để tính điểm VADER chính xác nhất
        # (Ở đây ta mô phỏng nhanh bằng cách lấy điểm VADER trực tiếp)
        scores = sia.polarity_scores(str(txt))
        compound = scores['compound']
        if compound > 0.35:
            new_lbl = 1
        elif compound < -0.35:
            new_lbl = -1
        else:
            new_lbl = lbl
        y_tr_c_cleaned.append(new_lbl)
    
    y_tr_c_series = pd.Series(y_tr_c_cleaned, index=y_tr_c.index)
    
    # Đánh giá mô hình trên tập kiểm thử SẠCH (không trùng, nhãn kiểm thử giữ nguyên gốc)
    acc_b, f1_b = evaluate_pipeline(X_tr_c, X_te_c, y_tr_c_series, y_te_c, "KỊCH BẢN B: Quy trình chuẩn (Đã xóa trùng lặp & chỉ sửa nhãn tập Train)")

    # -------------------------------------------------------------------------
    # KẾT LUẬN CUỐI CÙNG
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("BẢNG TỔNG HỢP SO SÁNH & ĐÁNH GIÁ ẢNH HƯỞNG")
    print("="*70)
    print(f"1. Độ chính xác (Accuracy) ảo: {acc_a*100:.2f}%  VS  Thực tế: {acc_b*100:.2f}% (Chênh lệch: {(acc_a-acc_b)*100:.2f}%)")
    print(f"2. Chỉ số F1-macro ảo     : {f1_a:.4f}  VS  Thực tế: {f1_b:.4f} (Chênh lệch: {f1_a-f1_b:.4f})")
if __name__ == "__main__":
    detect_leakage()
