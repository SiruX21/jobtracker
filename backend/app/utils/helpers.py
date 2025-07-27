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
    verification_link = f"http://localhost:5000/verify_email?token={token}"
    # Logic to send email using an email service
    return verification_link


def hash_password(password):
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()