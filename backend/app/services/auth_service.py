import hashlib
import jwt
import datetime
import secrets
import mariadb
from app import get_db
from app.services.email_service import send_verification_email, send_password_reset_email

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_password, provided_password):
    return stored_password == hashlib.sha256(provided_password.encode()).hexdigest()

def generate_auth_token(user_id, secret_key):
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')
    except Exception as e:
        print(f"Error generating token: {e}")
        return None

def generate_verification_token():
    return secrets.token_urlsafe(32)

def register_user(username, email, password):
    """Register a new user with email verification"""
    conn, cursor = get_db()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (email, username))
    if cursor.fetchone():
        return {"error": "User already exists", "code": 409}

    # Ensure last_verification_sent column exists
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_verification_sent DATETIME NULL")
    except mariadb.Error:
        pass  # Ignore if already exists

    # Generate verification token
    verification_token = generate_verification_token()
    verification_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    try:
        # Hash password and create user
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, verification_token, verification_token_expires, last_verification_sent)
            VALUES (?, ?, ?, ?, ?, NULL)
        """, (username, email, hashed_password, verification_token, verification_expires))

        user_id = cursor.lastrowid

        # Send verification email
        send_verification_email(email, verification_token)

        return {"success": True, "user_id": user_id, "message": "Registration successful. Please check your email to verify your account."}

    except mariadb.Error as e:
        print(f"Database error during registration: {e}")
        return {"error": "Registration failed", "code": 500}

def login_user(email, password, secret_key):
    """Login user with email verification check"""
    conn, cursor = get_db()
    
    try:
        cursor.execute("SELECT id, password_hash, email_verified FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            return {"error": "Invalid credentials", "code": 401}
        
        if not verify_password(user['password_hash'], password):
            return {"error": "Invalid credentials", "code": 401}
        
        if not user['email_verified']:
            return {"error": "Please verify your email before logging in", "code": 403}
        
        # Generate auth token
        token = generate_auth_token(user['id'], secret_key)
        if not token:
            return {"error": "Failed to generate token", "code": 500}
        
        return {"success": True, "token": token, "user": {"id": user['id'], "email_verified": user['email_verified']}}
        
    except mariadb.Error as e:
        print(f"Database error during login: {e}")
        return {"error": "Login failed", "code": 500}

def verify_email_token(token):
    """Verify email using verification token"""
    conn, cursor = get_db()
    
    try:
        cursor.execute("""
            SELECT id FROM users 
            WHERE verification_token = ? 
            AND verification_token_expires > NOW() 
            AND email_verified = FALSE
        """, (token,))
        
        user = cursor.fetchone()
        if not user:
            return {"error": "Invalid or expired verification token", "code": 400}
        
        # Update user as verified
        cursor.execute("""
            UPDATE users 
            SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
            WHERE id = ?
        """, (user['id'],))
        
        return {"success": True, "message": "Email verified successfully"}
        
    except mariadb.Error as e:
        print(f"Database error during email verification: {e}")
        return {"error": "Verification failed", "code": 500}

def resend_verification_email(email):
    """Resend verification email"""
    print(f"[FUNCTION ENTRY] resend_verification_email called for: {email}", flush=True)
    conn, cursor = get_db()
    try:
        print(f"[resend_verification_email] Requested for: {email}", flush=True)
        cursor.execute("SELECT id, email_verified, last_verification_sent FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        print(f"[resend_verification_email] DB user: {user}", flush=True)
        if not user:
            print("[resend_verification_email] User not found.", flush=True)
            return {"error": "User not found", "code": 404}
        if user['email_verified']:
            print("[resend_verification_email] Email already verified.", flush=True)
            return {"error": "Email already verified", "code": 400}
        # Cooldown check
        now = datetime.datetime.utcnow()
        last_sent = user.get('last_verification_sent')
        print(f"[resend_verification_email] last_verification_sent: {last_sent}", flush=True)
        if last_sent:
            if isinstance(last_sent, str):
                try:
                    last_sent = datetime.datetime.strptime(last_sent, "%Y-%m-%d %H:%M:%S")
                except Exception as ex:
                    print(f"[resend_verification_email] Failed to parse last_sent: {ex}", flush=True)
                    last_sent = None
            if last_sent:
                seconds_since = (now - last_sent).total_seconds()
                print(f"[resend_verification_email] seconds_since last sent: {seconds_since}", flush=True)
                if seconds_since < 60:
                    print(f"[resend_verification_email] Cooldown active: {60-seconds_since} seconds left.", flush=True)
                    return {"error": f"Please wait {int(60-seconds_since)} seconds before resending verification email.", "code": 429}
        # Generate new verification token
        verification_token = generate_verification_token()
        verification_expires = now + datetime.timedelta(hours=24)
        print(f"[resend_verification_email] Generated token: {verification_token}", flush=True)
        cursor.execute("""
            UPDATE users 
            SET verification_token = ?, verification_token_expires = ?, last_verification_sent = ? 
            WHERE id = ?
        """, (verification_token, verification_expires, now.strftime("%Y-%m-%d %H:%M:%S"), user['id']))
        print(f"[resend_verification_email] DB updated for user {user['id']}", flush=True)
        send_verification_email(email, verification_token)
        print(f"[resend_verification_email] Email send function called.", flush=True)
        return {"success": True, "message": "Verification email sent"}
    except mariadb.Error as e:
        print(f"Database error during resend verification: {e}", flush=True)
        return {"error": "Failed to resend verification email", "code": 500}

def request_password_reset(email):
    """Request a password reset for a user"""
    conn, cursor = get_db()
    
    # Check if user exists
    cursor.execute("SELECT id, username FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if not user:
        # Return success message even if user doesn't exist for security
        return {"success": True, "message": "If an account with that email exists, a password reset link has been sent"}
    
    try:
        # Generate reset token
        reset_token = generate_verification_token()
        reset_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # 1 hour expiry
        
        # Store reset token in database
        cursor.execute("""
            UPDATE users 
            SET reset_token = ?, reset_token_expires = ?
            WHERE id = ?
        """, (reset_token, reset_expires, user['id']))
        
        # Send password reset email
        send_password_reset_email(email, reset_token)
        
        return {"success": True, "message": "If an account with that email exists, a password reset link has been sent"}
        
    except mariadb.Error as e:
        print(f"Database error during password reset request: {e}")
        return {"error": "Failed to process password reset request", "code": 500}
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return {"error": "Failed to send password reset email", "code": 500}

def reset_password(token, new_password):
    """Reset password using a valid reset token"""
    conn, cursor = get_db()
    
    try:
        # Find user with valid reset token
        cursor.execute("""
            SELECT id, email, reset_token_expires 
            FROM users 
            WHERE reset_token = ? AND reset_token_expires > ?
        """, (token, datetime.datetime.utcnow()))
        
        user = cursor.fetchone()
        
        if not user:
            return {"error": "Invalid or expired reset token", "code": 400}
        
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update password and clear reset token
        cursor.execute("""
            UPDATE users 
            SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL
            WHERE id = ?
        """, (hashed_password, user['id']))
        
        return {"success": True, "message": "Password has been reset successfully"}
        
    except mariadb.Error as e:
        print(f"Database error during password reset: {e}")
        return {"error": "Failed to reset password", "code": 500}