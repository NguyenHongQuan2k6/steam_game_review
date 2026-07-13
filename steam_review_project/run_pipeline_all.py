import os
import sys
import subprocess
import time
import webbrowser

# Enable UTF-8 encoding support for Windows Console
os.environ["PYTHONIOENCODING"] = "utf-8"

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def run_step(name, script_path, critical=True):
    """Helper to run a single python script step in the pipeline."""
    print("\n" + "="*70)
    print(f" STEP: {name}")
    print(f" Executing: {script_path}")
    print("="*70)

    full_path = os.path.join(PROJECT_ROOT, script_path)
    if not os.path.exists(full_path):
        print(f"[ERROR] Script file not found: {script_path}")
        if critical:
            print("[FATAL] Aborting pipeline due to missing critical step.")
            sys.exit(1)
        return False

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        # Use sys.executable to run with the current python interpreter
        subprocess.run([sys.executable, full_path], env=env, check=True)
        print(f"[SUCCESS] Completed step: {name}\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Step '{name}' failed with exit code {e.returncode}")
        if critical:
            print("[FATAL] Aborting pipeline because this step is critical.")
            sys.exit(1)
        else:
            print("[WARNING] Proceeding to next step anyway...")
            return False
    except KeyboardInterrupt:
        print(f"\n[CANCELLED] Pipeline execution interrupted by user during step: {name}")
        sys.exit(1)

def kill_port_8000():
    """Kills any process running on port 8000 to prevent port binding conflicts."""
    print("[SYSTEM] Checking for existing processes on port 8000...")
    try:
        if sys.platform.startswith('win'):
            # Find PID on port 8000
            cmd = "netstat -ano | findstr :8000"
            output = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
            pids = set()
            for line in output.strip().split('\n'):
                parts = line.strip().split()
                if len(parts) >= 5 and parts[1].endswith(':8000'):
                    pids.add(parts[-1])
            
            for pid in pids:
                if pid != '0':
                    print(f"[SYSTEM] Killing process PID {pid} occupying port 8000...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            subprocess.run("fuser -k 8000/tcp", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        # Port is probably not occupied
        pass

def main():
    print("*" * 80)
    print("      STARTING FULL STEAM SENTIMENT ANALYSIS AUTOMATED PIPELINE RUNNER      ")
    print("*" * 80)

    # A. Check MySQL database connection
    print("\n[DATABASE] Testing MySQL database connection...")
    db_connected = False
    try:
        from sqlalchemy import create_engine, text
        import urllib.parse
        from utils.config import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
        
        SAFE_PASSWORD = urllib.parse.quote_plus(DB_PASSWORD)
        engine = create_engine(f"mysql+pymysql://{DB_USER}:{SAFE_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}", connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[DATABASE] MySQL connection successful!")
        db_connected = True
    except Exception as db_err:
        print(f"\n[DATABASE WARNING] Could not connect to MySQL database: {db_err}")
        print("[DATABASE WARNING] Pipeline steps (crawling, cleaning, model training) require MySQL.")
        print("[DATABASE WARNING] The server will run using fallback local CSV files and model artifacts.\n")

    # B. Check if model files already exist
    model_path = os.path.join(PROJECT_ROOT, "models", "sentiment_model.pkl")
    model_exists = os.path.exists(model_path)
    
    run_pipeline = False
    if db_connected:
        if model_exists:
            print("[INFO] Trained SVM model and pipeline artifacts already exist.")
            if sys.stdin.isatty():
                print("Press Enter to skip pipeline and launch server immediately, or type 'y' + Enter to force re-running the entire pipeline.")
                try:
                    choice = input("Force run pipeline? [y/N]: ").strip().lower()
                    if choice in ['y', 'yes']:
                        run_pipeline = True
                except Exception:
                    pass
            else:
                print("[INFO] Non-interactive shell. Skipping pipeline steps and starting server directly...")
        else:
            print("[INFO] Trained model not found. Starting first-time pipeline execution...")
            run_pipeline = True
    else:
        if model_exists:
            print("[INFO] Model exists. Launching server directly in offline/static mode...")
        else:
            print("[WARNING] Model not found and database is offline! The server will start, but predictions will fall back to local VADER calculations.")

    # C. Run pipeline steps if required
    if run_pipeline:
        # 1. CRAWL GAMES
        run_step("1. Crawl Game Titles from Steam Search", "src/data/crawl_raw_data.py", critical=False)

        # 2. CRAWL REVIEWS
        run_step("2. Crawl Game Reviews from Steam API", "src/data/crawl_reviews_game.py", critical=False)

        # 3. CLEAN DATA
        run_step("3. Clean Raw Game & Review Data", "src/data/cleaner.py", critical=True)

        # 4. IMPORT LABELED DATA TO MYSQL
        run_step("4. Import Labeled Excel Reviews to MySQL", "src/data/import_labeled_data.py", critical=False)

        # 5. RUN EDA AND GENERATE CHARTS
        run_step("5. Run Exploratory Data Analysis (EDA)", "src/data/eda.py", critical=False)

        # 6. TRAIN & COMPARE MODELS
        run_step("6. Train, Compare Models, & Save Best Model (SVM)", "src/models/train_model.py", critical=True)

        # 7. EVALUATE MODEL PERFORMANCE
        run_step("7. Evaluate Best Model on Test Set", "src/models/evaluate.py", critical=False)

        # 8. VISUALIZE MODEL FEATURES & PCA DIMENSIONS
        run_step("8. Visualize Model Feature Weights and PCA 2D Grid", "src/models/visualize_model.py", critical=False)
    else:
        print("\n[INFO] Skipping pipeline run. Proceeding straight to web serving.")

    # 9. START WEB SERVER & OPEN WEB APPLICATION
    print("\n" + "*" * 80)
    print("      LAUNCHING WEB SERVER AND INTERACTION DISPLAY      ")
    print("*" * 80)

    # Free up port 8000 if occupied
    kill_port_8000()

    # Add project root to path for uvicorn imports
    sys.path.append(PROJECT_ROOT)

    try:
        import uvicorn
    except ImportError:
        print("[ERROR] uvicorn library is not installed! Run 'pip install -r requirements.txt'")
        sys.exit(1)

    # Launch browser after a short delay to allow server startup
    def launch_browser():
        time.sleep(2)
        print("[SYSTEM] Opening default web browser to http://localhost:8000/new/ ...")
        webbrowser.open("http://localhost:8000/new/")

    import threading
    browser_thread = threading.Thread(target=launch_browser)
    browser_thread.daemon = True
    browser_thread.start()

    # Start FastAPI Web App
    try:
        print("[SYSTEM] Starting Web App Server. Press CTRL+C in this console window to exit.")
        uvicorn.run("src.web.backend.main:app", host="127.0.0.1", port=8000, reload=False)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Pipeline finished. Web server stopped.")

if __name__ == "__main__":
    main()
