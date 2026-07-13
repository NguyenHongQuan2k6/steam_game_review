import os
import sys
import joblib
import pandas as pd
import numpy as np

# Thiết lập encoding UTF-8 cho Windows console để tránh lỗi UnicodeEncodeError
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass # Trong trường hợp chạy ở môi trường không hỗ trợ reconfigure

# Thiết lập đường dẫn để import các thư viện
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'models'))
features_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'features'))
export_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'debug_exports'))

os.makedirs(export_dir, exist_ok=True)

def main():
    print("="*60)
    print("XUẤT DANH SÁCH ĐẶC TRƯNG VÀ TRỌNG SỐ (FEATURES & WEIGHTS)")
    print("="*60)

    model_path = os.path.join(models_dir, 'sentiment_model.pkl')
    vectorizer_path = os.path.join(features_dir, 'tfidf_vectorizer.pkl')

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        print("[LỖI] Không tìm thấy file mô hình pkl! Hãy chạy 'python src/models/train_model.py' trước.")
        sys.exit(1)

    print("Đang nạp mô hình và bộ chuyển đổi TF-IDF...")
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    # Lấy danh sách từ khóa (features) và chỉ số IDF tương ứng
    feature_names = vectorizer.get_feature_names_out()
    idf_scores = vectorizer.idf_

    # Khởi tạo DataFrame lưu trữ
    df_features = pd.DataFrame({
        'Feature': feature_names,
        'IDF': idf_scores
    })

    # Kiểm tra loại mô hình và lấy trọng số hoặc độ quan trọng tương ứng
    model_type = type(model).__name__
    print(f"Loại mô hình phát hiện được: {model_type}")

    if hasattr(model, 'coef_'):
        # LinearSVC, LogisticRegression
        coefs = model.coef_
        classes = model.classes_
        print(f"Mô hình có hệ số coefficient (coef_). Hình dáng: {coefs.shape}")
        
        if len(coefs.shape) == 1 or coefs.shape[0] == 1:
            # Phân loại nhị phân
            weight = coefs[0] if len(coefs.shape) == 2 else coefs
            class_name = classes[1] if len(classes) > 1 else "Positive"
            df_features[f'Weight_Class_{class_name}'] = weight
        else:
            # Phân loại đa lớp
            for i, class_label in enumerate(classes):
                df_features[f'Weight_Class_{class_label}'] = coefs[i]
                
    elif hasattr(model, 'feature_log_prob_'):
        # MultinomialNB
        log_prob = model.feature_log_prob_
        classes = model.classes_
        print(f"Mô hình Naive Bayes có log xác suất đặc trưng. Hình dáng: {log_prob.shape}")
        
        for i, class_label in enumerate(classes):
            df_features[f'LogProb_Class_{class_label}'] = log_prob[i]
            
    elif hasattr(model, 'feature_importances_'):
        # RandomForest, DecisionTree, XGBoost, v.v.
        importances = model.feature_importances_
        print("Mô hình dạng cây có độ quan trọng đặc trưng (feature_importances_).")
        df_features['Feature_Importance'] = importances
    else:
        print("[CẢNH BÁO] Không tìm thấy hệ số weights hay feature_importances_ cho mô hình này.")

    excel_path = os.path.join(export_dir, '5_Feature_Weights.xlsx')
    csv_path = os.path.join(export_dir, '5_Feature_Weights.csv')

    print(f"\nĐang lưu danh sách đặc trưng...")
    
    # Lưu ra Excel
    try:
        df_features.to_excel(excel_path, index=False)
        print(f"  -> Đã lưu Excel tại: {excel_path}")
    except Exception as e:
        print(f"  -> Lỗi khi lưu Excel: {e}")
        
    # Lưu ra CSV
    try:
        df_features.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"  -> Đã lưu CSV tại: {csv_path}")
    except Exception as e:
        print(f"  -> Lỗi khi lưu CSV: {e}")

    print("\nHOÀN THÀNH XUẤT CÁC FEATURES THÀNH CÔNG!")
    print(f"Số lượng features đã xuất: {len(df_features)}")

if __name__ == "__main__":
    main()
