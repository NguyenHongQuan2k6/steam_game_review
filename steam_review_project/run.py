import os
import sys
import subprocess
import argparse

# Enable UTF-8 encoding support for Windows Console
os.environ["PYTHONIOENCODING"] = "utf-8"

# Project Root Directory
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def run_script(script_path, use_utf8_env=True):
    """Run a python script using the current python executable."""
    full_path = os.path.join(PROJECT_ROOT, script_path)
    if not os.path.exists(full_path):
        print(f"\n[ERROR] File not found: {script_path}")
        return False

    print(f"\n[SYSTEM] Running: {script_path} ...")
    
    env = os.environ.copy()
    if use_utf8_env:
        env["PYTHONIOENCODING"] = "utf-8"

    try:
        # Use sys.executable to ensure we run in the same virtual/active python environment
        result = subprocess.run([sys.executable, full_path], env=env, check=True)
        print(f"[SYSTEM] Completed: {script_path}\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Failed to execute script {script_path}: {e}\n")
        return False
    except KeyboardInterrupt:
        print(f"\n[SYSTEM] Execution of {script_path} was cancelled by user.\n")
        return False

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

def start_web_server():
    """Start the FastAPI Web Server serving the application."""
    print("\n" + "="*60)
    print(" STARTING FASTAPI WEB SERVER & 3D HUD INTERFACE ")
    print("="*60)
    
    # Free up port 8000 if occupied
    kill_port_8000()
    
    # Add root folder to sys.path to allow uvicorn to load modules correctly
    sys.path.append(PROJECT_ROOT)
    
    try:
        import uvicorn
    except ImportError:
        print("[ERROR] uvicorn is not installed! Please run: pip install -r requirements.txt")
        return

    try:
        print("[SYSTEM] Web App will be available at: http://localhost:8000")
        uvicorn.run("src.web.backend.main:app", host="127.0.0.1", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Stopped Web Server.")

def show_menu():
    """Display an interactive text-based pipeline menu."""
    while True:
        print("\n" + "="*60)
        print(" STEAM REVIEW SENTIMENT ANALYSIS - PIPELINE MANAGER ")
        print("="*60)
        print("1. Crawl raw game list from Steam Search (crawl_raw_data.py)")
        print("2. Crawl recent reviews from Steam API (crawl_reviews_game.py)")
        print("3. Clean raw game and review data (cleaner.py)")
        print("4. Perform Exploratory Data Analysis & generate charts (eda.py)")
        print("5. Train 4 models, compare results, and save best SVM (train_model.py)")
        print("6. Evaluate SVM model performance on test set (evaluate.py)")
        print("7. Visualize SVM word weights and PCA 2D scatter (visualize_model.py)")
        print("8. Run interactive prediction engine on terminal (predict_model.py)")
        print("9. Launch FastAPI Web Server serving the 3D HUD App (main.py)")
        print("0. Exit")
        print("="*60)
        
        try:
            choice = input("Enter your choice (0-9): ").strip()
            if choice == '1':
                run_script("src/data/crawl_raw_data.py")
            elif choice == '2':
                run_script("src/data/crawl_reviews_game.py")
            elif choice == '3':
                run_script("src/data/cleaner.py")
            elif choice == '4':
                run_script("src/data/eda.py")
            elif choice == '5':
                run_script("src/models/train_model.py")
            elif choice == '6':
                run_script("src/models/evaluate.py")
            elif choice == '7':
                run_script("src/models/visualize_model.py")
            elif choice == '8':
                run_script("src/models/predict_model.py")
            elif choice == '9':
                start_web_server()
            elif choice == '0':
                print("\nThank you for using the pipeline manager! Goodbye.")
                break
            else:
                print("\n[WARNING] Invalid choice. Please enter a number between 0 and 9.")
        except KeyboardInterrupt:
            print("\n\n[SYSTEM] Goodbye!")
            break

def main():
    parser = argparse.ArgumentParser(description="Pipeline orchestrator and link manager for Steam Review Sentiment Analysis.")
    parser.add_argument("--crawl-games", action="store_true", help="Crawl game list from Steam Search")
    parser.add_argument("--crawl-reviews", action="store_true", help="Crawl review list from Steam API")
    parser.add_argument("--clean", action="store_true", help="Clean raw game and review data")
    parser.add_argument("--eda", action="store_true", help="Perform EDA and save distribution & wordcloud charts")
    parser.add_argument("--train", action="store_true", help="Train 4 models, compare results and save the best SVM model")
    parser.add_argument("--evaluate", action="store_true", help="Evaluate the best model performance on test set")
    parser.add_argument("--visualize", action="store_true", help="Visualize SVM word weights and PCA 2D dimensions")
    parser.add_argument("--predict", action="store_true", help="Run interactive console prediction mode")
    parser.add_argument("--serve", action="store_true", help="Start FastAPI Web Server for 3D HUD Web App")
    
    args = parser.parse_args()
    
    has_args = any(vars(args).values())
    
    if has_args:
        if args.crawl_games:
            run_script("src/data/crawl_raw_data.py")
        if args.crawl_reviews:
            run_script("src/data/crawl_reviews_game.py")
        if args.clean:
            run_script("src/data/cleaner.py")
        if args.eda:
            run_script("src/data/eda.py")
        if args.train:
            run_script("src/models/train_model.py")
        if args.evaluate:
            run_script("src/models/evaluate.py")
        if args.visualize:
            run_script("src/models/visualize_model.py")
        if args.predict:
            run_script("src/models/predict_model.py")
        if args.serve:
            start_web_server()
    else:
        show_menu()

if __name__ == "__main__":
    main()
