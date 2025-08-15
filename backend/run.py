from app import create_app
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables from root .env file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

app = create_app()

if __name__ == "__main__":
    # For local development, you can use Granian directly
    # or run: granian --interface asgi --host 0.0.0.0 --port 5000 --reload --workers 1 run:app
    
    print("For development, run:")
    print("granian --interface asgi --host 0.0.0.0 --port 5000 --reload --workers 1 run:app")
    print("\nOr for production:")
    print("granian --interface asgi --host 0.0.0.0 --port 5000 --access-log --workers 1 run:app")
    
    # Fallback: import and run with granian programmatically
    try:
        import subprocess
        import sys
        
        debug_flag = "--reload" if os.getenv('DEBUG', 'False').lower() == 'true' else ""
        cmd = [
            "granian", 
            "--interface", "asgi",
            "--host", "0.0.0.0", 
            "--port", "5000",
            "--workers", "1",  # Single worker for container compatibility
            "--access-log"
        ]
        
        if debug_flag:
            cmd.append(debug_flag)
            
        cmd.append("run:app")
        
        print(f"Starting Quart server with Granian: {' '.join(cmd)}")
        subprocess.run(cmd)
        
    except FileNotFoundError:
        print("Granian not found. Install with: pip install granian")
        print("Falling back to Quart development server...")
        app.run(host="0.0.0.0", port=5000, debug=os.getenv('DEBUG', 'False').lower() == 'true')
