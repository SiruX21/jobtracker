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
    
    # Redis Configuration
    REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    
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
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,https://job.siru.dev').split(',')
    
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
        # Check if we're running in production by looking at environment variables
        if (cls.ENVIRONMENT == 'production' or 
            'siru.dev' in os.getenv('FRONTEND_URL', '') or
            'siru.dev' in os.getenv('DOMAIN', '')):
            return cls.FRONTEND_DOMAIN or os.getenv('FRONTEND_URL', 'https://job.siru.dev')
        return cls.FRONTEND_URL
    
    @classmethod
    def get_backend_url(cls):
        """Get the correct backend URL based on environment"""
        # Check if we're running in production by looking at environment variables
        if (cls.ENVIRONMENT == 'production' or 
            'siru.dev' in os.getenv('BACKEND_URL', '') or
            'siru.dev' in os.getenv('DOMAIN', '')):
            return cls.BACKEND_DOMAIN or os.getenv('BACKEND_URL', 'https://api.siru.dev')
        return cls.BACKEND_URL
    
    @classmethod
    def get_cors_origins(cls):
        """Get the list of allowed CORS origins"""
        # Start with base origins from environment
        origins = []
        
        # Add CORS_ORIGINS from environment
        if hasattr(cls, 'CORS_ORIGINS') and cls.CORS_ORIGINS:
            origins.extend(cls.CORS_ORIGINS)
        
        # Always add development URLs for local testing
        dev_origins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
        for origin in dev_origins:
            if origin not in origins:
                origins.append(origin)
        
        # Always add production URLs
        prod_origins = ['https://job.siru.dev', 'https://api.siru.dev']
        for origin in prod_origins:
            if origin not in origins:
                origins.append(origin)
                
        # Add current frontend URL if not already included
        frontend_url = cls.get_frontend_url()
        if frontend_url and frontend_url not in origins:
            origins.append(frontend_url)
            
        print(f"Final CORS origins: {origins}")  # Debug logging
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
    BACKEND_URL = os.getenv('BACKEND_URL', 'https://api.siru.dev')

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
