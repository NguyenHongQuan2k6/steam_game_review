import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from utils.config import LOGS_DIR

def get_logger(name: str) -> logging.Logger:
    """
    Thiết lập và cấu hình logger chuẩn cho dự án.
    Hỗ trợ xuất log ra console và lưu trữ vào file xoay vòng với định dạng UTF-8.
    """
    logger = logging.getLogger(name)
    
    # Nếu logger đã được cấu hình các handlers thì không cấu hình lại
    if logger.hasHandlers():
        return logger
        
    logger.setLevel(logging.INFO)
    
    # Tạo định dạng log
    log_format = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Handler xuất ra Console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    # Hỗ trợ in tiếng Việt và ký tự đặc biệt trên console
    try:
        if sys.stdout.encoding != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    logger.addHandler(console_handler)
    
    # Handler ghi ra File log xoay vòng (tối đa 5MB/file, giữ lại 3 backups)
    log_file_path = LOGS_DIR / "steam_review_project.log"
    try:
        file_handler = RotatingFileHandler(
            filename=log_file_path,
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8"
        )
        file_handler.setFormatter(log_format)
        logger.addHandler(file_handler)
    except Exception as e:
        # Nếu không tạo được file log (ví dụ lỗi quyền ghi), in cảnh báo và tiếp tục với console handler
        print(f"[LOGGER WARNING] Không thể tạo file handler tại {log_file_path}: {e}")
        
    return logger
