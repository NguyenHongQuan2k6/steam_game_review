import os
from pathlib import Path

# ==========================================
# THƯ MỤC HỆ THỐNG (SYSTEM DIRECTORIES)
# ==========================================
# utils is at <project_root>/utils, so project_root is one level up
PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
FEATURES_DIR = DATA_DIR / "features"
MODELS_DIR = PROJECT_ROOT / "models"
LOGS_DIR = PROJECT_ROOT / "logs"

# Tạo các thư mục nếu chưa tồn tại
for folder in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, FEATURES_DIR, MODELS_DIR, LOGS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

# ==========================================
# CẤU HÌNH CƠ SỞ DỮ LIỆU (DATABASE CONFIG)
# ==========================================
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "hongquannguyen2k6@gmail.com")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "steam_data_warehouse")

# ==========================================
# CẤU HÌNH CÀO DỮ LIỆU (CRAWLER CONFIG)
# ==========================================
MAX_REVIEWS_PER_GAME = int(os.getenv("MAX_REVIEWS_PER_GAME", "200"))
CRAWL_SLEEP_TIME = float(os.getenv("CRAWL_SLEEP_TIME", "1.0"))
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# ==========================================
# CẤU HÌNH HỌC MÁY (MACHINE LEARNING CONFIG)
# ==========================================
MAX_FEATURES = int(os.getenv("MAX_FEATURES", "12000"))
TEST_SIZE = float(os.getenv("TEST_SIZE", "0.2"))
RANDOM_STATE = int(os.getenv("RANDOM_STATE", "42"))

# ==========================================
# CẤU HÌNH WEB SERVER (WEB SERVER CONFIG)
# ==========================================
WEB_HOST = os.getenv("WEB_HOST", "127.0.0.1")
WEB_PORT = int(os.getenv("WEB_PORT", "8000"))
