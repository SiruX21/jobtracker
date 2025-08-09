import os

class Config:
    """Application configuration"""
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = int(os.getenv('DB_PORT')) if os.getenv('DB_PORT') else None
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_NAME = os.getenv('DB_NAME')
    
    # Redis Configuration
    REDIS_HOST = os.getenv('REDIS_HOST')
    REDIS_PORT = int(os.getenv('REDIS_PORT')) if os.getenv('REDIS_PORT') else None
    REDIS_DB = int(os.getenv('REDIS_DB')) if os.getenv('REDIS_DB') else None
    
    # Email Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT')) if os.getenv('MAIL_PORT') else None
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    
    # URL Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL')
    BACKEND_URL = os.getenv('BACKEND_URL')
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS').split(',') if os.getenv('CORS_ORIGINS') else []
    
    # Domain Configuration
    DOMAIN = os.getenv('DOMAIN')
    FRONTEND_DOMAIN = os.getenv('FRONTEND_DOMAIN')
    BACKEND_DOMAIN = os.getenv('BACKEND_DOMAIN')
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    @classmethod
    def get_frontend_url(cls):
        """Get the correct frontend URL based on environment"""
        return cls.FRONTEND_DOMAIN or cls.FRONTEND_URL
    
    @classmethod
    def get_backend_url(cls):
        """Get the correct backend URL based on environment"""
        return cls.BACKEND_DOMAIN or cls.BACKEND_URL
    
    @classmethod
    def get_cors_origins(cls):
        """Get the list of allowed CORS origins"""
        return cls.CORS_ORIGINS

class DevelopmentConfig(Config):
    """Development configuration"""
    pass

class ProductionConfig(Config):
    """Production configuration"""
    pass

class TestingConfig(Config):
    """Testing configuration"""
    pass

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
