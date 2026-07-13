from sqlalchemy import create_engine, text
import pandas as pd
import urllib.parse
from utils.config import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
from utils.logger import get_logger

# Thiết lập logger cho module db_helper
logger = get_logger("db_helper")

# ==========================================
# CẤU HÌNH CƠ SỞ DỮ LIỆU
# ==========================================
USER = DB_USER
PASSWORD = DB_PASSWORD
HOST = DB_HOST
PORT = DB_PORT
DATABASE_NAME = DB_NAME

# BƯỚC 2: Mã hóa mật khẩu (biến @ thành %40)
SAFE_PASSWORD = urllib.parse.quote_plus(PASSWORD)

def get_engine():
    """Hàm thiết lập đường ống kết nối đến MySQL"""
    # BƯỚC 3: Dùng SAFE_PASSWORD thay vì PASSWORD
    temp_engine = create_engine(f"mysql+pymysql://{USER}:{SAFE_PASSWORD}@{HOST}:{PORT}/")
    with temp_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DATABASE_NAME}"))
    
    engine = create_engine(f"mysql+pymysql://{USER}:{SAFE_PASSWORD}@{HOST}:{PORT}/{DATABASE_NAME}")
    
    # Run automatic migrations to make sure raw_games has the new columns
    try:
        with engine.begin() as conn:
            res = conn.execute(text("SHOW TABLES LIKE 'raw_games'")).fetchone()
            if res:
                cols_res = conn.execute(text("DESCRIBE raw_games")).fetchall()
                cols = [row[0] for row in cols_res]
                if 'image_url' not in cols:
                    logger.info("[MIGRATION] Adding image_url column to raw_games...")
                    conn.execute(text("ALTER TABLE raw_games ADD COLUMN image_url TEXT"))
                if 'price_display_raw' not in cols:
                    logger.info("[MIGRATION] Adding price_display_raw column to raw_games...")
                    conn.execute(text("ALTER TABLE raw_games ADD COLUMN price_display_raw TEXT"))
    except Exception as e:
        logger.warning(f"[MIGRATION WARNING] Failed to migrate database: {e}")
        
    return engine

# Khởi tạo động cơ
engine = get_engine()

def save_to_mysql(df, table_name, mode='append'):
    try:
        logger.info(f"[DATABASE] Saving data to table '{table_name}'...")
        df.to_sql(name=table_name, con=engine, if_exists=mode, index=False)
        logger.info(f"[DATABASE] Successfully saved {len(df)} rows to database!\n")
    except Exception as e:
        logger.error(f"[DATABASE ERROR] Failed to save data: {repr(e)}")

def load_from_mysql(query):
    try:
        logger.info(f"[DATABASE] Executing query...")
        df = pd.read_sql(query, con=engine)
        logger.info(f"[DATABASE] Successfully loaded {len(df)} rows!")
        return df
    except Exception as e:
        logger.error(f"[DATABASE ERROR] Failed to load data: {repr(e)}")
        return None