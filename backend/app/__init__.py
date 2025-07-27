from flask import Flask
from flask_cors import CORS
import mariadb
import os
from .config import Config, config

db_conn = None
db_cursor = None

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
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(jobs_bp)
    app.register_blueprint(email_bp)
    
    return app

def init_db():
    global db_conn, db_cursor
    try:
        db_conn = mariadb.connect(
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            autocommit=True
        )
        db_cursor = db_conn.cursor(dictionary=True)
        print("Database connection successful")
        
        # Create tables
        create_tables()
        
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        exit(1)

def create_tables():
    try:
        # Users table with email verification
        db_cursor.execute("""
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
        db_cursor.execute("""
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

def get_db():
    return db_conn, db_cursor
