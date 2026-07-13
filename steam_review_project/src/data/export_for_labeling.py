import pandas as pd
import os
import sys
import math

# Gọi trạm trung chuyển Database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import load_from_mysql

print("Đang kết nối kho dữ liệu MySQL để lấy TOÀN BỘ bình luận chưa gán nhãn")

# 1. Lấy tất cả bình luận CHƯA GÁN NHÃN
query = "SELECT review_id, review_text_clean FROM cleaned_reviews WHERE sentiment_label IS NULL OR sentiment_label = ''"
df = load_from_mysql(query)

if df is None or df.empty:
    print("Toàn bộ dữ liệu đã được gán nhãn hoặc bảng trống.")
    sys.exit()

print(f"Tìm thấy tổng cộng {len(df)} bình luận cần gán nhãn.")

# Cấu hình số dòng mỗi file để dễ quản lý (1000 dòng/file là con số lý tưởng cho team)
ROWS_PER_FILE = 1000 

# 2. Xuất ra nhiều file Excel nhỏ dựa trên tổng số lượng tìm thấy
current_dir = os.path.dirname(os.path.abspath(__file__))
output_folder = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'labeling_batches'))
os.makedirs(output_folder, exist_ok=True)

num_files = math.ceil(len(df) / ROWS_PER_FILE)

for i in range(num_files):
    start_idx = i * ROWS_PER_FILE
    end_idx = start_idx + ROWS_PER_FILE
    df_batch = df.iloc[start_idx:end_idx].copy()
    
    # Tạo cột trống để team gán nhãn
    df_batch['sentiment_label'] = ""
    
    file_name = f"data_to_label_full_{i+1}.xlsx"
    output_path = os.path.join(output_folder, file_name)
    
    df_batch.to_excel(output_path, index=False, engine='openpyxl')
    print(f"Đã xuất: {file_name} ({len(df_batch)} dòng)")

print(f"Tổng cộng {num_files} file đã được lưu tại: {output_folder}")
