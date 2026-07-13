import os
import sys
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA

# Đảm bảo in tiếng Việt không lỗi font trên console Windows
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# ============================================================
# BƯỚC 1: DÒ ĐƯỜNG DẪN KHO CHỨA NGUYÊN LIỆU & BỘ NÃO
# ============================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
features_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'features'))
models_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'models'))
output_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'eda_charts'))

os.makedirs(output_dir, exist_ok=True)

try:
    # Đọc tên mô hình động nếu có
    model_name_path = os.path.join(models_dir, 'best_model_name.pkl')
    model_name = joblib.load(model_name_path) if os.path.exists(model_name_path) else "SVM (LinearSVC)"
    print(f"Đang nạp Model {model_name} và Dữ liệu")
    model = joblib.load(os.path.join(models_dir, 'sentiment_model.pkl'))
    vectorizer = joblib.load(os.path.join(features_dir, 'tfidf_vectorizer.pkl'))
    X = joblib.load(os.path.join(features_dir, 'X_matrix.pkl'))
    y = joblib.load(os.path.join(features_dir, 'y_labels.pkl'))

    # ============================================================
    # BIỂU ĐỒ 1: TOP TỪ VỰNG QUYẾT ĐỊNH (FEATURE IMPORTANCE)
    # ============================================================
    print("\nĐang phân tích trọng số từ vựng ")
    
    # Lấy danh sách 1500 từ vựng
    feature_names = vectorizer.get_feature_names_out()
    
    # Xác định chỉ số chính xác của lớp Tiêu cực (-1) và Tích cực (1) từ model.classes_
    classes_list = list(model.classes_)
    neg_idx = classes_list.index(-1) if -1 in classes_list else 0
    pos_idx = classes_list.index(1) if 1 in classes_list else len(classes_list) - 1
    
    # model.coef_ chứa điểm số (trọng số) mà AI gán cho từng từ.
    neg_coefficients = model.coef_[neg_idx]
    pos_coefficients = model.coef_[pos_idx]

    # Lấy top 15 từ mang tính quyết định nhất cho mỗi phe
    top_neg_indices = np.argsort(neg_coefficients)[-15:]
    top_pos_indices = np.argsort(pos_coefficients)[-15:]

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    # Vẽ biểu đồ phe Tiêu Cực
    sns.barplot(x=neg_coefficients[top_neg_indices], y=feature_names[top_neg_indices], ax=axes[0], color='salmon')
    axes[0].set_title('Top 15 từ AI dùng để dự đoán CHÊ (-1)', fontsize=14, fontweight='bold')
    axes[0].set_xlabel('Trọng số (Mức độ ảnh hưởng)', fontsize=12)

    # Vẽ biểu đồ phe Tích Cực
    sns.barplot(x=pos_coefficients[top_pos_indices], y=feature_names[top_pos_indices], ax=axes[1], color='lightgreen')
    axes[1].set_title('Top 15 từ AI dùng để dự đoán KHEN (1)', fontsize=14, fontweight='bold')
    axes[1].set_xlabel('Trọng số (Mức độ ảnh hưởng)', fontsize=12)

    plt.tight_layout()
    chart1_path = os.path.join(output_dir, '4_model_feature_importance.png')
    plt.savefig(chart1_path, dpi=300)
    plt.close()
    print(f"Đã lưu Biểu đồ 1 (Trọng số từ vựng) tại: {chart1_path}")

    # ============================================================
    # BIỂU ĐỒ 2: ÉP PHẲNG KHÔNG GIAN BẰNG PCA VÀ VẼ LƯỚI PHÂN LOẠI
    # ============================================================
    print("\nĐang dùng thuật toán PCA ép 1500 chiều không gian xuống 2 chiều")
    
    # Biến ma trận thưa (sparse) thành ma trận đặc (dense) để PCA đọc được
    X_dense = X.toarray()
    
    # Ép xuống 2 chiều (2 thành phần chính)
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X_dense)
    
    # Tạo DataFrame để vẽ
    df_pca = pd.DataFrame({
        'Trục X (PCA 1)': X_2d[:, 0],
        'Trục Y (PCA 2)': X_2d[:, 1],
        'Cảm xúc': y
    })
    
    # Đổi tên nhãn cho dễ nhìn
    df_pca['Cảm xúc'] = df_pca['Cảm xúc'].map({-1: 'Tiêu cực', 0: 'Trung tính', 1: 'Tích cực'})

    plt.figure(figsize=(10, 8))
    sns.scatterplot(data=df_pca, x='Trục X (PCA 1)', y='Trục Y (PCA 2)', 
                    hue='Cảm xúc', palette={'Tiêu cực': 'red', 'Trung tính': 'gray', 'Tích cực': 'green'}, 
                    alpha=0.7, s=60)
    
    plt.title('Bản đồ Vị trí các Bình luận (Đã giảm chiều PCA)', fontsize=14, fontweight='bold')
    
    chart2_path = os.path.join(output_dir, '5_pca_scatter_plot.png')
    plt.savefig(chart2_path, dpi=300)
    plt.close()
    print(f"Đã lưu Biểu đồ 2 (Bản đồ PCA) tại: {chart2_path}")

    # Xuất dữ liệu PCA ra file JSON để vẽ biểu đồ tương tác trên Web
    # Lấy mẫu tối đa 1000 điểm để hiển thị mượt mà trên web
    sample_size = min(1000, len(df_pca))
    df_sample = df_pca.sample(n=sample_size, random_state=42)
    
    pca_list = []
    for _, row in df_sample.iterrows():
        pca_list.append({
            'x': float(row['Trục X (PCA 1)']),
            'y': float(row['Trục Y (PCA 2)']),
            'label': row['Cảm xúc']
        })
        
    import json
    json_path = os.path.join(output_dir, 'pca_data.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(pca_list, f, ensure_ascii=False, indent=4)
    print(f"Đã xuất dữ liệu PCA JSON tại: {json_path}")

except FileNotFoundError:
    print("Không tìm thấy file mô hình hoặc ma trận. Cậu đã chạy file train_model.py chưa?")
except Exception as e:
    print(f"Có lỗi xảy ra: {e}")