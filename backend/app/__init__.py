from quart import Quart
from quart_cors import cors
from quart_rate_limiter import RateLimiter
import mariadb
import os
import threading
import functools
import asyncio
from .config import Config, config

# Thread-local storage for database connections
db_local = threading.local()

def db_operation(func):
    """Decorator to handle database operations with automatic retry on connection failure"""
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        max_retries = 2
        for attempt in range(max_retries):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
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
        if asyncio.iscoroutinefunction(func):
            return await func(*args, **kwargs)
        else:
            return func(*args, **kwargs)
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
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
    
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper

# Global limiter instance
limiter = RateLimiter()

def create_app():
    app = Quart(__name__)
    
    # Load configuration based on environment
    env = os.getenv('ENVIRONMENT', 'development')
    app.config.from_object(config.get(env, config['default']))
    
    # Set required Flask/Quart configuration keys
    app.config['PROVIDE_AUTOMATIC_OPTIONS'] = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 43200
    
    # Initialize Quart-Rate-Limiter
    limiter.init_app(app)
    
    # Configure CORS - Use configurable origins
    cors_origins = Config.get_cors_origins()
    print(f"CORS Origins: {cors_origins}")  # Debug logging
    print(f"Environment: {Config.ENVIRONMENT}")  # Debug logging
    print(f"Frontend URL: {Config.get_frontend_url()}")  # Debug logging
    
    # Apply CORS to Quart app
    app = cors(app, 
               allow_origin=cors_origins,
               allow_credentials=True,
               allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
               allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
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
        connection_params = {
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'database': Config.DB_NAME,
            'autocommit': True,
            'connect_timeout': 10,
            'read_timeout': 10,
            'write_timeout': 10
        }
        
        # Add SSL configuration if provided
        if Config.DB_SSL_CA:
            connection_params['ssl_ca'] = Config.DB_SSL_CA
        if Config.DB_SSL_CERT:
            connection_params['ssl_cert'] = Config.DB_SSL_CERT
        if Config.DB_SSL_KEY:
            connection_params['ssl_key'] = Config.DB_SSL_KEY
            
        db_local.connection = mariadb.connect(**connection_params)
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

        # Add email change columns if they don't exist
        email_change_columns = [
            ("reset_token", "VARCHAR(255)"),
            ("reset_token_expires", "TIMESTAMP NULL"),
            ("new_email", "VARCHAR(255)"),
            ("email_change_token", "VARCHAR(255)"),
            ("email_change_token_expires", "TIMESTAMP NULL"),
            ("new_email_token", "VARCHAR(255)"),
            ("new_email_token_expires", "TIMESTAMP NULL"),
            ("last_verification_sent", "DATETIME NULL")
        ]
        
        for column_name, column_type in email_change_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                print(f"Added column {column_name} to users table")
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

        
        print("Database tables checked/created successfully.")

    except mariadb.Error as e:
        print(f"Error during table creation: {e}")
        exit(1)
