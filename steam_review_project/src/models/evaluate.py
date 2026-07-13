import os
import sys
import joblib
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Đảm bảo in tiếng Việt không lỗi font trên console Windows
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# ============================================================
# BƯỚC 1: DÒ ĐƯỜNG DẪN LẤY BỘ NÃO VÀ ĐỀ THI
# ============================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'models'))
features_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'features'))

try:
    # Đọc tên mô hình động nếu có
    model_name_path = os.path.join(models_dir, 'best_model_name.pkl')
    model_name = joblib.load(model_name_path) if os.path.exists(model_name_path) else "SVM (LinearSVC)"
    print(f"Đang nạp mô hình {model_name} vào hệ thống chấm điểm")
    # Lấy bộ não AI
    model = joblib.load(os.path.join(models_dir, 'sentiment_model.pkl'))
    
    # Lấy đề thi cuối kỳ
    X_test, y_test = joblib.load(os.path.join(features_dir, 'test_data.pkl'))

    # ============================================================
    # BƯỚC 2: BẮT ĐẦU LÀM BÀI VÀ CHẤM ĐIỂM
    # ============================================================
    print("Đang dự đoán 60 câu bình luận\n")
    y_pred = model.predict(X_test)


    print("-" * 55)
    # Báo cáo này sẽ cho biết % đoán trúng của từng loại nhãn (-1, 0, 1)
    print(classification_report(y_test, y_pred))
    print("-" * 55)

    # ============================================================
    # BƯỚC 3: VẼ MA TRẬN NHẦM LẪN (CONFUSION MATRIX)
    # ============================================================
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(8, 6))
    # Dùng Seaborn để vẽ ma trận màu cho dễ nhìn
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Tiêu cực (-1)', 'Trung tính (0)', 'Tích cực (1)'],
                yticklabels=['Tiêu cực (-1)', 'Trung tính (0)', 'Tích cực (1)'])
    
    # Lưu biểu đồ ma trận nhầm lẫn
    output_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'model_charts'))
    os.makedirs(output_dir, exist_ok=True)
    chart_path = os.path.join(output_dir, '7_Evaluation_Confusion_Matrix.png')
    plt.savefig(chart_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Đã lưu Ma trận Nhầm lẫn tại: {chart_path}")

except FileNotFoundError:
    print("Không tìm thấy file 'sentiment_model.pkl' hoặc 'test_data.pkl'.")
except Exception as e:
    print(f"Có lỗi xảy ra: {e}")