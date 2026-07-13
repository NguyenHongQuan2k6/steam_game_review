import os
import sys
import joblib

# Thiết lập đường dẫn để import helper
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from src.models.train_model import advanced_nlp_preprocessing

# ============================================================
# CẤU HÌNH ĐƯỜNG DẪN MÔ HÌNH
# ============================================================
models_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'models'))
features_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'features'))

def load_sentiment_pipeline():
    """Hàm tải mô hình và vectorizer đã lưu trên đĩa"""
    model_path = os.path.join(models_dir, 'sentiment_model.pkl')
    vectorizer_path = os.path.join(features_dir, 'tfidf_vectorizer.pkl')
    
    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        raise FileNotFoundError("[LỖI] Không tìm thấy file mô hình pkl! Hãy chạy 'python src/models/train_model.py' trước để huấn luyện và lưu mô hình.")
        
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    return model, vectorizer

def predict_sentiment(texts, model, vectorizer):
    """Hàm dự đoán cảm xúc cho một hoặc nhiều văn bản"""
    if isinstance(texts, str):
        texts = [texts]
        
    # 1. Chạy tiền xử lý NLP nâng cao (POS tagging, lemmatization, negation)
    cleaned_texts = [advanced_nlp_preprocessing(t) for t in texts]
    
    # 2. Ép văn bản thành ma trận TF-IDF số
    vectors = vectorizer.transform(cleaned_texts)
    
    # 3. Dự đoán nhãn và xác suất
    predictions = model.predict(vectors)
    
    # Do LinearSVC không hỗ trợ predict_proba, ta kiểm tra và dùng decision_function + Softmax nếu cần
    if hasattr(model, 'predict_proba'):
        probabilities = model.predict_proba(vectors)
    elif hasattr(model, 'decision_function'):
        import numpy as np
        decision_scores = model.decision_function(vectors)
        if len(decision_scores.shape) == 1:
            # Trường hợp nhị phân (binary classification)
            probabilities = np.vstack([1 - 1/(1 + np.exp(-decision_scores)), 1/(1 + np.exp(-decision_scores))]).T
        else:
            # Trường hợp đa phân lớp (multi-class classification)
            exp_scores = np.exp(decision_scores - np.max(decision_scores, axis=1, keepdims=True))
            probabilities = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    else:
        # Cơ chế dự phòng
        import numpy as np
        probabilities = np.ones((len(texts), len(model.classes_))) / len(model.classes_)
    
    label_map = {-1: "TIÊU CỰC", 0: "TRUNG TÍNH", 1: "TÍCH CỰC"}
    
    results = []
    for i, text in enumerate(texts):
        pred_label = predictions[i]
        prob = probabilities[i]
        max_prob = max(prob) * 100
        
        results.append({
            'text': text,
            'cleaned_text': cleaned_texts[i],
            'label_code': pred_label,
            'label': label_map.get(pred_label, "KHÔNG XÁC ĐỊNH"),
            'confidence': max_prob
        })
    return results

if __name__ == "__main__":
    print("="*60)
    print("AI PHÂN TÍCH CẢM XÚC STEAM - BỘ DỰ ĐOÁN (PREDICTION ENGINE)")
    print("="*60)
    
    # Tải mô hình
    print("Đang nạp bộ não AI...")
    try:
        model, vectorizer = load_sentiment_pipeline()
        print("AI đã sẵn sàng nhận lệnh!\n")
    except FileNotFoundError as e:
        print(e)
        sys.exit(1)
    
    # Chạy thử nghiệm một vài câu mẫu
    sample_reviews = [
        "This game is so smooth and runs flawlessly, I really love it!",
        "Complete trash. It crashes every 5 minutes and has terrible lag.",
        "It's just an average game. Nothing special, but decent to pass time.",
        "A bit laggy on launch but the developers are addressing the issues, good buy overall."
    ]
    
    print("=== DỰ ĐOÁN THỬ NGHIỆM MỘT VÀI CÂU MẪU ===")
    predictions = predict_sentiment(sample_reviews, model, vectorizer)
    for res in predictions:
        print(f"Bình luận: \"{res['text']}\"")
        print(f"Xử lý NLP: \"{res['cleaned_text']}\"")
        print(f"Kết quả  : {res['label']} (Độ tin cậy: {res['confidence']:.2f}%)")
        print("-" * 50)
        
    # Cho phép người dùng nhập trực tiếp từ bàn phím
    print("\n=== NHẬP BÌNH LUẬN CỦA BẠN ĐỂ AI DỰ ĐOÁN ===")
    print("(Nhập 'exit' hoặc 'quit' để thoát)")
    while True:
        try:
            user_input = input("Nhập bình luận (tiếng Anh): ").strip()
            if not user_input:
                continue
            if user_input.lower() in ['exit', 'quit']:
                break
            
            res = predict_sentiment(user_input, model, vectorizer)[0]
            print(f"Kết quả: {res['label']} (Độ tin cậy: {res['confidence']:.2f}%)")
            print("-" * 50)
        except KeyboardInterrupt:
            break
