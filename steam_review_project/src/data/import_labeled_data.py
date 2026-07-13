import pandas as pd
import os
import sys

# Gọi trạm trung chuyển Database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db_helper import engine

# 1. Trỏ ĐÚNG thư mục chứa các file Excel của team
current_dir = os.path.dirname(os.path.abspath(__file__))
folder_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'data', 'processed', 'labeling_batches'))

print(f"Đang quét thư mục:\n {folder_path}\n")

if not os.path.exists(folder_path):
    print("Không tìm thấy thư mục!")
    sys.exit()

# Gom tất cả các file Excel
all_items = os.listdir(folder_path)
files = [os.path.join(folder_path, f) for f in all_items if f.endswith('.xlsx')]

if len(files) == 0:
    print("Không thấy file Excel nào!")
    sys.exit()

print(f"Lọc được {len(files)} file Excel. Đang tiến hành gom dữ liệu...\n")

# Tạo một danh sách rỗng để chứa dữ liệu từ tất cả các file
list_of_dataframes = []

for file in files:
    print(f"Đang đọc: {os.path.basename(file)}")
    df = pd.read_excel(file, engine='openpyxl')
    
    # Chỉ bốc những dòng ĐÃ ĐƯỢC GÁN NHÃN ra khỏi file
    if 'sentiment_label' in df.columns:
        df_valid = df.dropna(subset=['sentiment_label']).copy()
        df_valid = df_valid[df_valid['sentiment_label'].astype(str).str.strip() != '']
        list_of_dataframes.append(df_valid)

# 2. Gộp tất cả các file lại thành 1 "Bảng Master" siêu to khổng lồ
if len(list_of_dataframes) > 0:
    master_df = pd.concat(list_of_dataframes, ignore_index=True)
    
    # 3. Làm sạch nhãn (Cắt bỏ cái đuôi .0 đáng ghét do Excel sinh ra)
    master_df['sentiment_label'] = master_df['sentiment_label'].astype(str).str.replace('.0', '', regex=False).str.strip()
    
    print(f"\nĐã gom thành công {len(master_df)} bình luận có nhãn. Đang tạo bảng 'labeled_reviews' trong MySQL...")
    
    # 4. TẠO BẢNG MỚI TOANH TRONG MYSQL
    # Tham số if_exists='replace' sẽ tự động tạo bảng mới. 
    # Nếu chạy lần sau, nó sẽ xóa bảng cũ và nạp bản cập nhật mới nhất từ team.
    master_df.to_sql('labeled_reviews', con=engine, if_exists='replace', index=False)
    
    print(f"Đã tạo xong bảng 'labeled_reviews' với {len(master_df)} dòng cực kỳ sạch sẽ!")
else:
    print("Không tìm thấy bất kỳ dòng nào được gán nhãn trong các file Excel!")