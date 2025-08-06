import mariadb
import functools

def with_db_retry(func):
    """Decorator to automatically retry database operations on connection failure"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        max_retries = 2
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except mariadb.Error as e:
                if attempt < max_retries - 1 and ("server has gone away" in str(e).lower() or 
                                                  "connection" in str(e).lower() or
                                                  "lost connection" in str(e).lower()):
                    print(f"Database connection lost, retrying operation... (attempt {attempt + 1})")
                    continue
                raise
        return func(*args, **kwargs)
    return wrapper

def generate_token(user_id):
    import jwt
    import datetime
    from flask import current_app

    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def format_date(date):
    if date:
        return date.isoformat()
    return None


def send_verification_email(user_email, token):
    from app.config import Config
    backend_url = Config.get_backend_url()
    verification_link = f"{backend_url}/verify_email?token={token}"
    # Logic to send email using an email service
    return verification_link


def hash_password(password):
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')