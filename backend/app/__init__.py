from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import mariadb
import os
import threading
import functools
from .config import Config, config

# Thread-local storage for database connections
db_local = threading.local()

def db_operation(func):
    """Decorator to handle database operations with automatic retry on connection failure"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        max_retries = 2
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except mariadb.Error as e:
                if attempt < max_retries - 1 and ("server has gone away" in str(e).lower() or 
                                                  "connection" in str(e).lower()):
                    print(f"Database connection lost, retrying... (attempt {attempt + 1})")
                    # Force reconnection on next get_db() call
                    if hasattr(db_local, 'connection'):
                        try:
                            db_local.connection.close()
                        except:
                            pass
                        delattr(db_local, 'connection')
                    if hasattr(db_local, 'cursor'):
                        delattr(db_local, 'cursor')
                    continue
                raise
        return func(*args, **kwargs)
    return wrapper

# Global limiter instance
limiter = Limiter(key_func=get_remote_address)

def create_app():
    app = Flask(__name__)
    
    # Load configuration based on environment
    env = os.getenv('ENVIRONMENT', 'development')
    app.config.from_object(config.get(env, config['default']))
    
    # Initialize Flask-Limiter
    limiter.init_app(app)
    
    # Configure CORS - Use configurable origins
    cors_origins = Config.get_cors_origins()
    print(f"CORS Origins: {cors_origins}")  # Debug logging
    print(f"Environment: {Config.ENVIRONMENT}")  # Debug logging
    print(f"Frontend URL: {Config.get_frontend_url()}")  # Debug logging
    
    CORS(app, 
         resources={r"/*": {"origins": cors_origins}}, 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Configure app
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    if not app.config['SECRET_KEY']:
        raise ValueError("No SECRET_KEY set for Flask application")
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    
    # Initialize database connection
    init_db()
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.jobs import jobs_bp
    from app.routes.email import email_bp
    from app.routes.logos import logos_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(jobs_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(logos_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    
    return app

def get_db():
    """Get database connection with automatic reconnection"""
    if not hasattr(db_local, 'connection') or not hasattr(db_local, 'cursor'):
        create_db_connection()
    
    # Test if connection is still alive
    try:
        db_local.cursor.execute("SELECT 1")
    except (mariadb.Error, AttributeError):
        # Connection is dead, recreate it
        create_db_connection()
    
    return db_local.connection, db_local.cursor

def create_db_connection():
    """Create a new database connection for the current thread"""
    try:
        db_local.connection = mariadb.connect(
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            autocommit=True,
            connect_timeout=10,
            read_timeout=10,
            write_timeout=10
        )
        db_local.cursor = db_local.connection.cursor(dictionary=True)
        print(f"Database connection created for thread {threading.current_thread().ident}")
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        raise

def init_db():
    """Initialize database and create tables"""
    try:
        # Create initial connection to set up tables
        create_db_connection()
        print("Database connection successful")
        
        # Create tables
        create_tables()
        
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        exit(1)

def create_tables():
    """Create database tables if they don't exist"""
    conn, cursor = get_db()
    try:
        # Users table with email verification
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255),
            verification_token_expires TIMESTAMP NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """)
        
        # Add role column if it doesn't exist (for existing databases)
        try:
            cursor.execute("""
            ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
            """)
        except mariadb.Error:
            # Column already exists
            pass
            
        print("Users table checked/created successfully.")

        # Job applications table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_title VARCHAR(255) NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            application_date DATE,
            status VARCHAR(50) DEFAULT 'Applied',
            job_url TEXT,
            notes TEXT,
            location VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        print("Job applications table checked/created successfully.")

        # Job statuses table for dynamic status management
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_statuses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            status_name VARCHAR(50) UNIQUE NOT NULL,
            color_code VARCHAR(7) NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """)
        
        # Insert default statuses if they don't exist
        default_statuses = [
            ('Applied', '#3B82F6', True),      # Blue
            ('Interview', '#10B981', False),   # Green  
            ('Offer', '#8B5CF6', False),       # Purple (changed from 'Offered' to 'Offer')
            ('Rejected', '#EF4444', False),    # Red
            ('Reviewing', '#F59E0B', False),   # Amber
            ('OA', '#06B6D4', False),          # Cyan
            ('Ghosted', '#6B7280', False)      # Gray
        ]
        
        for status_name, color_code, is_default in default_statuses:
            try:
                cursor.execute("""
                INSERT IGNORE INTO job_statuses (status_name, color_code, is_default) 
                VALUES (?, ?, ?)
                """, (status_name, color_code, is_default))
            except mariadb.Error:
                pass  # Status already exists
        
        print("Job statuses table checked/created successfully.")

    except mariadb.Error as e:
        print(f"Error during table creation: {e}")
        exit(1)
