import os

class Config:
    """Application configuration"""
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-this-in-production')
    
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'db')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'example')
    DB_NAME = os.getenv('DB_NAME', 'auth_db')
    
    # Email Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.zoho.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 465))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    
    # URL Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Domain Configuration (for production)
    DOMAIN = os.getenv('DOMAIN', 'localhost')
    FRONTEND_DOMAIN = os.getenv('FRONTEND_DOMAIN', f'http://{DOMAIN}:5173')
    BACKEND_DOMAIN = os.getenv('BACKEND_DOMAIN', f'http://{DOMAIN}:5000')
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    @classmethod
    def get_frontend_url(cls):
        """Get the correct frontend URL based on environment"""
        if cls.ENVIRONMENT == 'production':
            return cls.FRONTEND_DOMAIN
        return cls.FRONTEND_URL
    
    @classmethod
    def get_backend_url(cls):
        """Get the correct backend URL based on environment"""
        if cls.ENVIRONMENT == 'production':
            return cls.BACKEND_DOMAIN
        return cls.BACKEND_URL
    
    @classmethod
    def get_cors_origins(cls):
        """Get the list of allowed CORS origins"""
        origins = cls.CORS_ORIGINS.copy()
        # Always include the current frontend URL
        frontend_url = cls.get_frontend_url()
        if frontend_url not in origins:
            origins.append(frontend_url)
        return origins

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FRONTEND_URL = 'http://localhost:5173'
    BACKEND_URL = 'http://localhost:5000'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # In production, these would be set via environment variables
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://job.siru.dev')
    BACKEND_URL = os.getenv('BACKEND_URL', 'https://api.job.siru.dev')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
