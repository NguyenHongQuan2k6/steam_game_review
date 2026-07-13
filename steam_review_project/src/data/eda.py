import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys
from wordcloud import WordCloud
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# ============================================================
# CÀI ĐẶT ĐƯỜNG DẪN VÀ KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL
# ============================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

# Đảm bảo in tiếng Việt không lỗi font trên console Windows
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

from utils.db_helper import load_from_mysql
from src.models.train_model import advanced_nlp_preprocessing

# Tạo thư mục chứa ảnh
output_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'eda_charts'))
os.makedirs(output_dir, exist_ok=True)

def run_eda():
    print("="*60)
    print("BẮT ĐẦU PHÂN TÍCH DỮ LIỆU EDA (ĐỒNG BỘ TỪ MYSQL)")
    print("="*60)
    
    print("\nĐang rút dữ liệu từ Két sắt MySQL")
    query = """
    SELECT review_text_clean, sentiment_label 
    FROM labeled_reviews 
    WHERE sentiment_label IS NOT NULL AND sentiment_label != ''
    """
    df = load_from_mysql(query)
    
    if df is None or df.empty:
        print("Bảng dữ liệu trống! Hãy kiểm tra lại file Import Database.")
        sys.exit()

    df['sentiment_label'] = pd.to_numeric(df['sentiment_label'], errors='coerce')
    df = df.dropna(subset=['sentiment_label'])
    df['sentiment_label'] = df['sentiment_label'].astype(int)
    df = df[df['sentiment_label'].isin([-1, 0, 1])]
    
    # ------------------------------------------------------------
    # BỔ SUNG: LÀM SẠCH NHÃN BỊ SAI LỆCH (LABEL NOISE CLEANING) DÙNG NLTK VADER CHỦ ĐỘNG (PROACTIVE)
    # ------------------------------------------------------------
    print("Đang chạy bộ lọc tự động sửa nhãn bị lệch/sai chủ động")
    nltk.download('vader_lexicon', quiet=True)
    sia = SentimentIntensityAnalyzer()
    cleaned_labels = []
    corrected_count = 0
    
    for idx, row in df.iterrows():
        text = str(row['review_text_clean'])
        label = row['sentiment_label']
        scores = sia.polarity_scores(text)
        compound = scores['compound']
        
        # Áp dụng ngưỡng VADER để sửa nhãn chủ động từ các file Excel lỗi gán ngược/nhiễu
        if compound > 0.35:
            new_label = 1
        elif compound < -0.35:
            new_label = -1
        else:
            new_label = label
            
        if new_label != label:
            corrected_count += 1
        cleaned_labels.append(new_label)
            
    df['sentiment_label'] = cleaned_labels
    print(f"Đã tự động phát hiện và sửa {corrected_count} nhãn bị lệch từ Database!")
    print(f"Tổng số bình luận hợp lệ để phân tích: {len(df)}")

    # ============================================================
    # BIỂU ĐỒ 1: KIỂM TRA TÍNH CÂN BẰNG CỦA NHÃN CẢM XÚC
    # ============================================================
    print("\nĐang vẽ Biểu đồ Phân bố Nhãn")
    plt.figure(figsize=(8, 5))
    ax = sns.countplot(data=df, x='sentiment_label', hue='sentiment_label', palette='viridis', legend=False)
    
    plt.title('Phân bố Nhãn Cảm xúc (Thực tế trong Database)', fontsize=14, fontweight='bold')
    plt.xlabel('Cảm xúc (-1: Tiêu cực | 0: Trung tính | 1: Tích cực)', fontsize=12)
    plt.ylabel('Số lượng', fontsize=12)
    
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height())}', (p.get_x() + 0.35, p.get_height() + 2))
        
    chart1_path = os.path.join(output_dir, '1_sentiment_distribution.png')
    plt.savefig(chart1_path, bbox_inches='tight', dpi=300)
    plt.close()

    # ============================================================
    # BIỂU ĐỒ 2: KIỂM TRA ĐỘ DÀI TRUNG BÌNH CỦA BÌNH LUẬN
    # ============================================================
    print("Đang phân tích độ dài văn bản")
    df['word_count'] = df['review_text_clean'].apply(lambda x: len(str(x).split()))
    
    plt.figure(figsize=(10, 5))
    sns.histplot(data=df, x='word_count', bins=30, kde=True, color='skyblue')
    
    plt.title('Phân bố Độ dài Bình luận', fontsize=14, fontweight='bold')
    plt.xlabel('Số lượng từ trong một bình luận', fontsize=12)
    plt.ylabel('Tần suất xuất hiện', fontsize=12)
    
    chart2_path = os.path.join(output_dir, '2_word_count_distribution.png')
    plt.savefig(chart2_path, bbox_inches='tight', dpi=300)
    plt.close()

    # ============================================================
    # BIỂU ĐỒ 3: ĐÁM MÂY TỪ VỰNG VỚI BỘ LỌC NGÀNH GAME (DÙNG VĂN BẢN ĐÃ QUA BỘ LỌC NLP)
    # ============================================================
    print("Đang chạy Siêu Bộ Lọc NLP cho văn bản Word Cloud")
    df['review_text_nlp'] = df['review_text_clean'].apply(advanced_nlp_preprocessing)
    
    print("Đang tạo Đám mây từ vựng (Word Cloud) chuẩn AI")
    # Thiết lập bộ lọc từ rác y hệt như mô hình Huấn luyện
    negation_words = {'not', 'no', 'nor', 'none', 'never', 'nothing', 'nowhere', 'cannot'}
    base_stopwords = set(ENGLISH_STOP_WORDS) - negation_words
    gamer_stopwords = {
        'play', 'playing', 'played', 'just', 'like', 'get', 'got', 'don', 've', 'make', 'did',
        'game', 'games', 'character', 'characters', 'player', 'players', 'developer', 'developers',
        'hour', 'hours', 'time', 'playtime', 'steam'
    }
    custom_stopwords = base_stopwords.union(gamer_stopwords)
    
    positive_reviews = " ".join(df[df['sentiment_label'] == 1]['review_text_nlp'].astype(str))
    negative_reviews = " ".join(df[df['sentiment_label'] == -1]['review_text_nlp'].astype(str))

    wc_pos = WordCloud(width=800, height=400, background_color='white', colormap='Greens', stopwords=custom_stopwords).generate(positive_reviews)
    wc_neg = WordCloud(width=800, height=400, background_color='black', colormap='Reds', stopwords=custom_stopwords).generate(negative_reviews)

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    axes[0].imshow(wc_pos, interpolation='bilinear')
    axes[0].set_title('Từ vựng nổi bật: TÍCH CỰC', fontsize=14, color='green', fontweight='bold')
    axes[0].axis('off')

    axes[1].imshow(wc_neg, interpolation='bilinear')
    axes[1].set_title('Từ vựng nổi bật: TIÊU CỰC', fontsize=14, color='red', fontweight='bold')
    axes[1].axis('off')

    plt.tight_layout()
    chart3_path = os.path.join(output_dir, '3_word_clouds.png')
    plt.savefig(chart3_path, bbox_inches='tight', dpi=300)
    plt.close()

    # Xuất dữ liệu biểu đồ phân bố độ dài từ vựng (Review Length Histogram) ra JSON
    import numpy as np
    import json
    
    counts, bin_edges = np.histogram(df['word_count'].dropna(), bins=30)
    word_count_data = {
        "counts": counts.tolist(),
        "bin_edges": bin_edges.tolist()
    }
    
    word_count_path = os.path.join(output_dir, 'word_count_data.json')
    with open(word_count_path, 'w', encoding='utf-8') as f:
        json.dump(word_count_data, f, ensure_ascii=False, indent=4)
    print(f"Đã xuất dữ liệu phân bố độ dài từ vựng tại: {word_count_path}")

    # Xuất dữ liệu tần suất từ vựng (Word Cloud) ra JSON
    from collections import Counter
    def get_word_freq(text_series, stopwords, top_n=50):
        words = []
        for text in text_series.dropna():
            words.extend([w for w in str(text).split() if w not in stopwords and len(w) > 2])
        counter = Counter(words)
        return [{"text": w, "value": count} for w, count in counter.most_common(top_n)]
        
    pos_freq = get_word_freq(df[df['sentiment_label'] == 1]['review_text_nlp'], custom_stopwords, 50)
    neg_freq = get_word_freq(df[df['sentiment_label'] == -1]['review_text_nlp'], custom_stopwords, 50)
    
    word_freq_data = {
        "positive": pos_freq,
        "negative": neg_freq
    }
    
    word_freq_path = os.path.join(output_dir, 'word_freq.json')
    with open(word_freq_path, 'w', encoding='utf-8') as f:
        json.dump(word_freq_data, f, ensure_ascii=False, indent=4)
    print(f"Đã xuất dữ liệu tần suất từ vựng Word Cloud tại: {word_freq_path}")
    
    print("\nĐã lưu các biểu đồ mới và dữ liệu JSON tại thư mục: data/processed/eda_charts")
    print("Hoàn tất quá trình EDA.")

if __name__ == "__main__":
    run_eda()