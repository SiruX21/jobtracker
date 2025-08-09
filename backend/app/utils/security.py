"""
Security utilities and helpers
"""
import secrets
import string
import re
from typing import Dict, List, Optional
from app.config import Config

class SecurityUtils:
    """Security utility functions"""
    
    # Sensitive environment variables that should never be logged
    SENSITIVE_ENV_VARS = {
        'SECRET_KEY', 'DB_PASSWORD', 'MAIL_PASSWORD', 'JWT_SECRET_KEY',
        'API_KEY', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY', 'CERT', 
        'LOGO_DEV_API_TOKEN', 'AUTH_TOKEN', 'ACCESS_TOKEN'
    }
    
    # Protected environment variables that should never be deleted
    PROTECTED_ENV_VARS = {
        'PATH', 'HOME', 'USER', 'DB_HOST', 'DB_PASSWORD', 'SECRET_KEY',
        'MAIL_SERVER', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'DB_NAME', 'DB_USER'
    }
    
    @staticmethod
    def is_sensitive_env_var(key: str) -> bool:
        """Check if an environment variable is sensitive"""
        key_upper = key.upper()
        return any(sensitive in key_upper for sensitive in SecurityUtils.SENSITIVE_ENV_VARS)
    
    @staticmethod
    def is_protected_env_var(key: str) -> bool:
        """Check if an environment variable is protected from deletion"""
        return key.upper() in SecurityUtils.PROTECTED_ENV_VARS
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a cryptographically secure random token"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal attacks"""
        # Remove any path separators and dangerous characters
        sanitized = re.sub(r'[^\w\-_\.]', '', filename)
        # Remove leading dots to prevent hidden files
        sanitized = sanitized.lstrip('.')
        # Limit length
        sanitized = sanitized[:100]
        return sanitized
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email or not isinstance(email, str) or len(email) > 254:
            return False
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format"""
        if not username or not isinstance(username, str):
            return False
        
        if len(username) < 3 or len(username) > 50:
            return False
        
        # Allow alphanumeric characters, underscores, and hyphens
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, username))
    
    @staticmethod
    def sanitize_log_data(data: str, max_length: int = 100) -> str:
        """Sanitize data for logging (truncate and remove sensitive info)"""
        if not data:
            return "None"
        
        # Truncate long data
        if len(data) > max_length:
            data = data[:max_length] + "..."
        
        # Mask potential sensitive data patterns
        # Credit card numbers
        data = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD-MASKED]', data)
        # Social security numbers
        data = re.sub(r'\b\d{3}-?\d{2}-?\d{4}\b', '[SSN-MASKED]', data)
        # Generic tokens/keys (long alphanumeric strings)
        data = re.sub(r'\b[a-zA-Z0-9]{32,}\b', '[TOKEN-MASKED]', data)
        
        return data
    
    @staticmethod
    def log_security_event(event_type: str, user_id: Optional[int] = None, 
                          details: Optional[str] = None, severity: str = 'WARNING'):
        """Log security-related events"""
        message = f"SECURITY EVENT [{event_type}]"
        if user_id:
            message += f" User: {user_id}"
        if details:
            sanitized_details = SecurityUtils.sanitize_log_data(details)
            message += f" Details: {sanitized_details}"
        
        if severity.upper() == 'ERROR':
            Config.log_error(message, 'security')
        else:
            Config.log_warning(message, 'security')
    
    @staticmethod
    def rate_limit_key(request_info: Dict) -> str:
        """Generate rate limiting key based on request info"""
        # Use IP address as primary identifier
        ip = request_info.get('remote_addr', 'unknown')
        endpoint = request_info.get('endpoint', 'unknown')
        return f"{ip}:{endpoint}"
    
    @staticmethod
    def is_safe_redirect_url(url: str, allowed_hosts: List[str]) -> bool:
        """Check if a redirect URL is safe (prevents open redirect attacks)"""
        if not url:
            return False
        
        # Relative URLs are generally safe
        if url.startswith('/') and not url.startswith('//'):
            return True
        
        # Check against allowed hosts
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            return parsed.netloc in allowed_hosts
        except Exception:
            return False
