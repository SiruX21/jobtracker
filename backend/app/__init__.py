from flask import Flask
from flask_cors import CORS
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

def create_app():
    app = Flask(__name__)
    
    # Load configuration based on environment
    env = os.getenv('ENVIRONMENT', 'development')
    app.config.from_object(config.get(env, config['default']))
    
    # Configure CORS - Use configurable origins
    CORS(app, 
         resources={r"/*": {"origins": Config.get_cors_origins()}}, 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
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
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(jobs_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(logos_bp, url_prefix='/api')
    
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """)
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

    except mariadb.Error as e:
        print(f"Error during table creation: {e}")
        exit(1)
