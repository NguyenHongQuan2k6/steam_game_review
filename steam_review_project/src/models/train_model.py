import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import sys
import os
import re
import time
import joblib

# Khai báo NLTK - AI Xử lý Ngôn ngữ Tự nhiên
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet

# Tu dong tai cac bo tu dien NLTK (Chi tai 1 lan duy nhat)
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('averaged_perceptron_tagger_eng', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)
nltk.download('vader_lexicon', quiet=True)

from sklearn.model_selection import train_test_split
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB          # [MỚI] Naive Bayes
from sklearn.svm import LinearSVC                      # [MỚI] SVM
from sklearn.ensemble import RandomForestClassifier    # [MỚI] Random Forest
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score

# ============================================================
# CAI DAT DUONG DAN VA KET NOI CO SO DU LIEU
# ============================================================
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import load_from_mysql

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed'))
CHART_DIR = os.path.join(BASE_DIR, 'model_charts')
EXPORT_DIR = os.path.join(BASE_DIR, 'debug_exports')

os.makedirs(CHART_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

# ============================================================
# BUOC 1: RUT DU LIEU & KIEM TRA MAT CAN BANG
# (Giữ nguyên code gốc)
# ============================================================
def load_and_check_data():
    print("\nĐang rút dữ liệu từ Két sắt MySQL")
    query = """
    SELECT review_text_clean, sentiment_label 
    FROM labeled_reviews 
    WHERE sentiment_label IS NOT NULL AND sentiment_label != ''
    """
    df = load_from_mysql(query)
    
    if df is None or df.empty:
        print("Loi: Bảng dữ liệu trống! Hãy kiểm tra lại file Import.")
        sys.exit()
        
    df['sentiment_label'] = pd.to_numeric(df['sentiment_label'], errors='coerce')
    df = df.dropna(subset=['sentiment_label'])
    df['sentiment_label'] = df['sentiment_label'].astype(int)
    df = df[df['sentiment_label'].isin([-1, 0, 1])]
    
    # ------------------------------------------------------------
    # BỔ SUNG: LÀM SẠCH NHÃN BỊ SAI LỆCH (LABEL NOISE CLEANING) DÙNG NLTK VADER CHỦ ĐỘNG (PROACTIVE)
    # ------------------------------------------------------------
    print("Đang chạy bộ lọc tự động sửa nhãn bị lệch/sai chủ động")
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
    print(f"Đã rút thành công {len(df)} bình luận hợp lệ.")
    
    label_counts = df['sentiment_label'].value_counts().sort_index()
    color_map = {-1: 'salmon', 0: 'lightgray', 1: 'lightgreen'}
    colors = [color_map.get(label, 'blue') for label in label_counts.index]
    
    plt.figure(figsize=(8, 5))
    bars = plt.bar(label_counts.index.astype(str), label_counts.values, color=colors, edgecolor='black')
    plt.xticks(ticks=range(len(label_counts)), labels=[f"{l}" for l in label_counts.index])
    plt.title('Kiểm tra mức độ cân bằng dữ liệu (Class Distribution)', fontsize=14, fontweight='bold')
    plt.xlabel('Nhãn Cam Xuc', fontsize=12)
    plt.ylabel('Số lượng Bình luận', fontsize=12)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + (yval*0.02), int(yval), ha='center', va='bottom', fontweight='bold')
        
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, '1_Class_Distribution.png')
    plt.savefig(chart_path, dpi=300, bbox_inches='tight')
    plt.close() 
    
    return df

# ============================================================
# BUOC 2: TIEN XU LY NLP NANG CAO (3 KI THUAT)
# (Giữ nguyên code gốc)
# ============================================================
def get_wordnet_pos(treebank_tag):
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    else:
        return None

def advanced_nlp_preprocessing(text):
    if not isinstance(text, str):
        return ""
    
    text = re.sub(r'\b(not|no|never|cannot)\s+(\w+)', r'\1_\2', text)
    
    words = nltk.word_tokenize(text)
    pos_tags = nltk.pos_tag(words)
    
    lemmatizer = WordNetLemmatizer()
    final_words = []
    
    for word, tag in pos_tags:
        if '_' in word:
            final_words.append(word)
            continue
            
        wn_pos = get_wordnet_pos(tag)
        
        if wn_pos is not None:
            lemma = lemmatizer.lemmatize(word, pos=wn_pos)
            final_words.append(lemma)
            
    return " ".join(final_words)

def apply_nlp_pipeline(df):
    print("\nĐang chạy Siêu Bộ Lọc NLP (Negation, POS Filter, Lemmatization)")
    df['review_text_nlp'] = df['review_text_clean'].apply(advanced_nlp_preprocessing)
    return df

# ============================================================
# BUOC 3: CHIA TACH TAP DU LIEU
# (Giữ nguyên code gốc)
# ============================================================
def split_data(df):
    print("\nĐang chia tách dữ liệu (80% Train - 20% Test)...")
    X = df['review_text_nlp'] 
    y = df['sentiment_label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    return X_train, X_test, y_train, y_test

# ============================================================
# BUOC 4: BIEN CHU THANH SO (TF-IDF VOI BO LOC KIM CUONG)
# (Giữ nguyên code gốc)
# ============================================================
def vectorize_and_export(X_train, X_test, y_train, y_test, df_original):
    print("\nĐang ép văn bản thành Ma trận số (TF-IDF)...")
    
    negation_words = {'not', 'no', 'nor', 'none', 'never', 'nothing', 'nowhere', 'cannot'}
    base_stopwords = set(ENGLISH_STOP_WORDS) - negation_words
    gamer_stopwords = {
        'play', 'playing', 'played', 'just', 'like', 'get', 'got', 'don', 've', 'make', 'did',
        'game', 'games', 'character', 'characters', 'player', 'players', 'developer', 'developers',
        'hour', 'hours', 'time', 'playtime', 'steam'
    }
    custom_stopwords = list(base_stopwords.union(gamer_stopwords))

    tfidf = TfidfVectorizer(
        max_features=12000, 
        ngram_range=(1, 3),
        stop_words=custom_stopwords, 
        sublinear_tf=True,
        max_df=0.6,  
        min_df=5
    )
    
    X_train_vec = tfidf.fit_transform(X_train)
    X_test_vec = tfidf.transform(X_test)
    
    print("\nĐang lưu dữ liệu ra thư mục debug_exports")
    df_export = df_original[['review_text_clean', 'review_text_nlp', 'sentiment_label']]
    df_export.to_excel(os.path.join(EXPORT_DIR, '1_Data_Before_and_After_NLP.xlsx'), index=False)
    
    words = tfidf.get_feature_names_out()
    sample_size = min(500, X_train_vec.shape[0])
    df_matrix = pd.DataFrame(X_train_vec[:sample_size].todense(), columns=words)
    df_matrix_clean = df_matrix[df_matrix.columns[(df_matrix > 0).any()]]
    df_matrix_clean.to_csv(os.path.join(EXPORT_DIR, '3_TFIDF_Matrix_Sample.csv'), index=False)
    
    return X_train_vec, X_test_vec, tfidf

# ============================================================
# [MỚI] BUOC 5: HUAN LUYEN VA SO SANH 4 MODEL
# ============================================================
def train_and_compare_models(X_train_vec, X_test_vec, y_train, y_test):
    """
    Huấn luyện 4 model cùng một lúc, đo thời gian, thu thập kết quả,
    rồi vẽ biểu đồ so sánh tổng quan.
    Trả về: dict kết quả + model tốt nhất (theo F1-macro)
    """
    print("\n" + "="*60)
    print(" BUOC 5: HUAN LUYEN & SO SANH 4 MO HINH")
    print("="*60)

    # --- Định nghĩa 4 model ---
    # Lưu ý: MultinomialNB yêu cầu giá trị >= 0, TF-IDF với sublinear_tf=True vẫn >= 0 nên OK.
    # LinearSVC nhanh hơn SVC kernel RBF và phù hợp với văn bản sparse.
    # RandomForest dùng n_jobs=-1 để tận dụng đa nhân CPU.
    models_dict = {
        'Logistic Regression': LogisticRegression(
            max_iter=1000, random_state=42, C=1.5, class_weight='balanced'
        ),
        'Naive Bayes': MultinomialNB(alpha=0.1),
        'SVM (LinearSVC)': LinearSVC(
            max_iter=2000, random_state=42, C=1.0, class_weight='balanced'
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=200, random_state=42, class_weight='balanced', n_jobs=-1
        ),
    }

    target_names = ['Tiêu cực (-1)', 'Trung tính (0)', 'Tích cực (1)']
    results = []  # Danh sách kết quả để vẽ biểu đồ

    for model_name, model in models_dict.items():
        print(f"\nĐang huấn luyện: {model_name} ...")
        t_start = time.time()
        model.fit(X_train_vec, y_train)
        train_time = time.time() - t_start

        y_pred = model.predict(X_test_vec)

        acc   = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average='macro')
        f1_per_class = f1_score(y_test, y_pred, average=None, labels=[-1, 0, 1])

        print(f"  Accuracy: {acc*100:.2f}%")
        print(f"  F1-macro: {f1_macro:.4f}")
        print(f"  F1 Tiêu cực / Trung tính / Tích cực: "
              f"{f1_per_class[0]:.3f} / {f1_per_class[1]:.3f} / {f1_per_class[2]:.3f}")
        print(f"  Thời gian train: {train_time:.2f}s")
        print(classification_report(y_test, y_pred, target_names=target_names))

        results.append({
            'Model'          : model_name,
            'Accuracy'       : acc,
            'F1-macro'       : f1_macro,
            'F1 Tiêu cực'    : f1_per_class[0],
            'F1 Trung tính'  : f1_per_class[1],
            'F1 Tích cực'    : f1_per_class[2],
            'Train time (s)' : round(train_time, 2),
            'model_obj'      : model,
            'y_pred'         : y_pred,
        })

    # --- Vẽ biểu đồ so sánh ---
    _plot_model_comparison(results, target_names, y_test)

    # --- Xuất bảng ra Excel ---
    df_results = pd.DataFrame(results).drop(columns=['model_obj', 'y_pred'])
    df_results.to_excel(os.path.join(EXPORT_DIR, '4_Model_Comparison.xlsx'), index=False)
    print(f"\nĐã lưu bảng so sánh: {EXPORT_DIR}/4_Model_Comparison.xlsx")

    # --- Chọn model tốt nhất theo F1-macro ---
    best = max(results, key=lambda x: x['F1-macro'])
    print(f"\nMÔ HÌNH TỐT NHẤT: {best['Model']} (F1-macro = {best['F1-macro']:.4f})")

    return results, best


def _plot_model_comparison(results, target_names, y_test):
    """Vẽ 3 biểu đồ: (1) Accuracy & F1-macro, (2) F1 từng nhãn, (3) Confusion Matrix model tốt nhất."""

    model_names  = [r['Model'] for r in results]
    accuracies   = [r['Accuracy']  for r in results]
    f1_macros    = [r['F1-macro']  for r in results]
    f1_neg       = [r['F1 Tiêu cực']   for r in results]
    f1_neu       = [r['F1 Trung tính']  for r in results]
    f1_pos       = [r['F1 Tích cực']    for r in results]

    x = np.arange(len(model_names))
    bar_w = 0.35

    # ---- Biểu đồ 1: Accuracy vs F1-macro ----
    fig, ax = plt.subplots(figsize=(10, 6))
    bars1 = ax.bar(x - bar_w/2, accuracies, bar_w, label='Accuracy',  color='steelblue',  edgecolor='black')
    bars2 = ax.bar(x + bar_w/2, f1_macros,  bar_w, label='F1-macro',  color='darkorange', edgecolor='black')

    ax.set_xticks(x)
    ax.set_xticklabels(model_names, fontsize=11)
    ax.set_ylim(0, 1.1)
    ax.set_ylabel('Điểm số', fontsize=12)
    ax.set_title('So sánh Accuracy & F1-macro giữa 4 mô hình', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)

    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=9, fontweight='bold')
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=9, fontweight='bold')

    plt.tight_layout()
    plt.savefig(os.path.join(CHART_DIR, '4_Model_Accuracy_F1_Comparison.png'), dpi=300, bbox_inches='tight')
    plt.close()

    # ---- Biểu đồ 2: F1 từng nhãn ----
    fig, ax = plt.subplots(figsize=(11, 6))
    bar_w2 = 0.25
    bars_neg = ax.bar(x - bar_w2,   f1_neg, bar_w2, label='F1 Tiêu cực (-1)',   color='salmon',     edgecolor='black')
    bars_neu = ax.bar(x,             f1_neu, bar_w2, label='F1 Trung tính (0)',  color='lightgray',  edgecolor='black')
    bars_pos = ax.bar(x + bar_w2,   f1_pos, bar_w2, label='F1 Tích cực (1)',    color='lightgreen', edgecolor='black')

    ax.set_xticks(x)
    ax.set_xticklabels(model_names, fontsize=11)
    ax.set_ylim(0, 1.15)
    ax.set_ylabel('F1-score', fontsize=12)
    ax.set_title('F1-score từng nhãn cảm xúc theo từng mô hình', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)

    for bars in [bars_neg, bars_neu, bars_pos]:
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                    f'{bar.get_height():.2f}', ha='center', va='bottom', fontsize=8)

    plt.tight_layout()
    plt.savefig(os.path.join(CHART_DIR, '5_F1_Per_Class_Comparison.png'), dpi=300, bbox_inches='tight')
    plt.close()

    # ---- Biểu đồ 3: Confusion matrix của model tốt nhất ----
    best = max(results, key=lambda x: x['F1-macro'])
    cm = confusion_matrix(y_test, best['y_pred'])
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=target_names, yticklabels=target_names)
    plt.title(f'Ma trận nhầm lẫn — {best["Model"]}  (Model tốt nhất)', fontsize=13, fontweight='bold')
    plt.ylabel('Nhãn thực tế', fontsize=12)
    plt.xlabel('Nhãn AI dự đoán', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(CHART_DIR, '6_Best_Model_Confusion_Matrix.png'), dpi=300, bbox_inches='tight')
    plt.close()

    print("\nĐã lưu 3 biểu đồ so sánh vào thư mục model_charts/")


# ============================================================
# [MỚI] BUOC 5.5: VE BIEU DO TRONG SO CUA SVM (LinearSVC)
# ============================================================
def plot_svm_weights(svm_model, tfidf_vectorizer):
    print("\nĐang phân tích và vẽ biểu đồ trọng số (SVM - LinearSVC)")
    words   = tfidf_vectorizer.get_feature_names_out()
    classes = svm_model.classes_
    coefs   = svm_model.coef_
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    colors = ['salmon', 'lightgray', 'lightgreen']
    titles = ['Top từ khóa TIÊU CỰC (-1)', 'Top từ khóa TRUNG TÍNH (0)', 'Top từ khóa TÍCH CỰC (1)']
    
    for i, class_label in enumerate(classes):
        top_indices = np.argsort(coefs[i])[-15:]
        top_words   = words[top_indices]
        top_scores  = coefs[i][top_indices]
        
        axes[i].barh(top_words, top_scores, color=colors[i], edgecolor='black')
        axes[i].set_title(titles[i], fontsize=12, fontweight='bold')
        axes[i].set_xlabel('Trọng số (Coefficient)')
    
    plt.suptitle('SVM (LinearSVC): Từ khóa ảnh hưởng lớn nhất đến cảm xúc',
                 fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(CHART_DIR, '2_SVM_Weights.png'), dpi=300, bbox_inches='tight')
    plt.close()


# ============================================================
# [MỚI] BUOC 5.6: XUAT DANH SACH FEATURES CUNG TRONG SO
# ============================================================
def export_features_with_weights(svm_model, tfidf_vectorizer):
    print("\nĐang xuất toàn bộ từ khóa (features) cùng trọng số ra file Excel & CSV...")
    words   = tfidf_vectorizer.get_feature_names_out()
    classes = svm_model.classes_
    coefs   = svm_model.coef_
    idf     = tfidf_vectorizer.idf_
    
    df_features = pd.DataFrame({
        'Feature': words,
        'IDF': idf
    })
    
    for i, class_label in enumerate(classes):
        df_features[f'Weight_Class_{class_label}'] = coefs[i]
        
    excel_path = os.path.join(EXPORT_DIR, '5_Feature_Weights.xlsx')
    csv_path = os.path.join(EXPORT_DIR, '5_Feature_Weights.csv')
    
    try:
        df_features.to_excel(excel_path, index=False)
        print(f"Đã xuất features ra Excel tại: {excel_path}")
    except Exception as e:
        print(f"Lỗi xuất Excel: {e}")
        
    try:
        df_features.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"Đã xuất features ra CSV tại: {csv_path}")
    except Exception as e:
        print(f"Lỗi xuất CSV: {e}")


# ============================================================
# KHOI DIEU KHIEN CHINH
# ============================================================
def train_model():
    print("="*60)
    print("BẮT ĐẦU HUẤN LUYỆN MÔ HÌNH PHÂN TÍCH CẢM XÚC STEAM")
    print("="*60)

    # Bước 1-4: Giữ nguyên pipeline gốc
    dataset = load_and_check_data()
    dataset = apply_nlp_pipeline(dataset)

    X_train, X_test, y_train, y_test = split_data(dataset)
    X_train_vec, X_test_vec, tfidf_vectorizer = vectorize_and_export(
        X_train, X_test, y_train, y_test, dataset
    )

    # [MỚI] Bước 5: Train & so sánh 4 model cùng lúc
    all_results, best_result = train_and_compare_models(
        X_train_vec, X_test_vec, y_train, y_test
    )

    # Lấy riêng SVM để vẽ biểu đồ trọng số
    svm_model = next(r['model_obj'] for r in all_results if r['Model'] == 'SVM (LinearSVC)')
    plot_svm_weights(svm_model, tfidf_vectorizer)
    export_features_with_weights(svm_model, tfidf_vectorizer)

    # ============================================================
    # LƯU MODEL TỐT NHẤT & VECTORIZER RA ĐĨA
    # ============================================================
    print("\nĐang lưu mô hình tốt nhất và dữ liệu đặc trưng ra đĩa...")
    models_dir_save   = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'models'))
    features_dir_save = os.path.abspath(os.path.join(BASE_DIR, '..', 'features'))
    os.makedirs(models_dir_save,   exist_ok=True)
    os.makedirs(features_dir_save, exist_ok=True)

    # Chọn SVM (LinearSVC) làm mô hình chính để lưu lại theo yêu cầu của người dùng
    svm_result = next(r for r in all_results if r['Model'] == 'SVM (LinearSVC)')
    best_model = svm_result['model_obj']

    # 1. Lưu model tốt nhất (SVM)
    joblib.dump(best_model,      os.path.join(models_dir_save,   'sentiment_model.pkl'))
    # 2. Lưu vectorizer
    joblib.dump(tfidf_vectorizer, os.path.join(features_dir_save, 'tfidf_vectorizer.pkl'))
    # 3. Lưu tập test
    joblib.dump((X_test_vec, y_test), os.path.join(features_dir_save, 'test_data.pkl'))
    # 4. Lưu toàn bộ ma trận đặc trưng
    X_all_vec = tfidf_vectorizer.transform(dataset['review_text_nlp'])
    joblib.dump(X_all_vec,              os.path.join(features_dir_save, 'X_matrix.pkl'))
    joblib.dump(dataset['sentiment_label'], os.path.join(features_dir_save, 'y_labels.pkl'))
    # 5. [MỚI] Lưu tên model chính để predict_model.py biết dùng gì
    joblib.dump('SVM (LinearSVC)', os.path.join(models_dir_save, 'best_model_name.pkl'))

    print(f"Đã lưu mô hình SVM (LinearSVC) làm mô hình chính vào sentiment_model.pkl (độ chính xác so sánh: F1-macro = {svm_result['F1-macro']:.4f})")
    print("Đã lưu thành công tất cả các file pkl")

    print("\nQUÁ TRÌNH HUẤN LUYỆN ĐÃ KẾT THÚC THÀNH CÔNG")

if __name__ == "__main__":
    train_model()
