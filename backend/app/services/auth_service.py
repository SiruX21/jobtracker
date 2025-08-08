import bcrypt
import jwt
import datetime
import secrets
import mariadb
from app import get_db
from app.services.email_service import send_verification_email, send_password_reset_email
from app.utils.password_validator import PasswordValidator


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _is_bcrypt_hash(candidate: str) -> bool:
    try:
        if not candidate:
            return False
        if isinstance(candidate, (bytes, bytearray)):
            candidate = candidate.decode('utf-8', errors='ignore')
        return candidate.startswith("$2a$") or candidate.startswith("$2b$") or candidate.startswith("$2y$")
    except Exception:
        return False


def verify_password(stored_password, provided_password):
    """Safely verify a plaintext password against a stored hash.
    Returns False if the stored hash is missing or invalid (e.g., legacy/plaintext),
    preventing crashes like `ValueError: Invalid salt`.
    """
    try:
        if not stored_password or not provided_password:
            return False

        # Normalize stored hash to string for quick validation
        if isinstance(stored_password, (bytes, bytearray)):
            stored_password_str = stored_password.decode('utf-8', errors='ignore')
        else:
            stored_password_str = str(stored_password)

        # Bcrypt hashes should start with $2a$, $2b$, or $2y$
        if not _is_bcrypt_hash(stored_password_str):
            # Not a valid bcrypt hash format
            return False

        # Prepare bytes for bcrypt
        stored_hash_bytes = stored_password_str.encode('utf-8')
        provided_bytes = (
            provided_password.encode('utf-8')
            if isinstance(provided_password, str)
            else bytes(provided_password)
        )

        return bcrypt.checkpw(provided_bytes, stored_hash_bytes)

    except (ValueError, TypeError) as e:
        # Invalid salt or bad format – treat as invalid credentials, not server error
        print(f"Password verification failed due to invalid hash format: {e}")
        return False


def verify_and_migrate_password(user_id: int, stored_password, provided_password) -> bool:
    """Verify password. If stored password is legacy/plaintext and matches the provided
    password exactly, migrate it to a bcrypt hash.
    Returns True if credentials are valid after optional migration, else False.
    """
    print(f"[VERIFY_MIGRATE] Called for user_id: {user_id}", flush=True)
    print(f"[VERIFY_MIGRATE] Stored password type: {type(stored_password)}", flush=True)
    print(f"[VERIFY_MIGRATE] Stored password length: {len(stored_password) if stored_password else 0}", flush=True)
    print(f"[VERIFY_MIGRATE] Provided password length: {len(provided_password) if provided_password else 0}", flush=True)
    
    try:
        if not stored_password or not provided_password:
            print(f"[VERIFY_MIGRATE] Missing password data", flush=True)
            return False

        # Normalize to string for checks
        stored_password_str = (
            stored_password.decode('utf-8', errors='ignore')
            if isinstance(stored_password, (bytes, bytearray))
            else str(stored_password)
        )
        
        print(f"[VERIFY_MIGRATE] Stored password (first 20 chars): {stored_password_str[:20]}...", flush=True)
        print(f"[VERIFY_MIGRATE] Is bcrypt hash: {_is_bcrypt_hash(stored_password_str)}", flush=True)

        if _is_bcrypt_hash(stored_password_str):
            # Standard bcrypt verification
            print(f"[VERIFY_MIGRATE] Using bcrypt verification", flush=True)
            result = bcrypt.checkpw(provided_password.encode('utf-8'), stored_password_str.encode('utf-8'))
            print(f"[VERIFY_MIGRATE] Bcrypt verification result: {result}", flush=True)
            return result

        # Legacy path: treat stored value as plaintext
        print(f"[VERIFY_MIGRATE] Using legacy plaintext comparison", flush=True)
        if stored_password_str == provided_password:
            print(f"[VERIFY_MIGRATE] Legacy password match! Migrating to bcrypt", flush=True)
            # Migrate to bcrypt
            try:
                new_hash = hash_password(provided_password)
                print(f"[VERIFY_MIGRATE] Generated new hash: {new_hash[:50]}...", flush=True)
                conn, cursor = get_db()
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
                print(f"[VERIFY_MIGRATE] Password migrated successfully for user {user_id}", flush=True)
            except Exception as ex:
                print(f"[VERIFY_MIGRATE] Failed to migrate legacy password for user {user_id}: {ex}", flush=True)
                # Even if migration fails, consider the password valid for this attempt
            return True

        print(f"[VERIFY_MIGRATE] Legacy password does not match", flush=True)
        return False
    except Exception as e:
        print(f"[VERIFY_MIGRATE] verify_and_migrate_password error: {e}", flush=True)
        return False


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
    
    # Validate password strength
    is_valid, validation_details = PasswordValidator.validate_password(password)
    if not is_valid:
        return {
            "error": "Password does not meet security requirements", 
            "code": 400,
            "validation_details": validation_details
        }
    
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
    print(f"[AUTH_SERVICE] login_user called with email: {email}", flush=True)
    print(f"[AUTH_SERVICE] Password provided: {'Yes' if password else 'No'}", flush=True)
    print(f"[AUTH_SERVICE] Password length: {len(password) if password else 0}", flush=True)
    
    conn, cursor = get_db()
    
    try:
        print(f"[AUTH_SERVICE] Querying database for email: {email}", flush=True)
        cursor.execute("SELECT id, password_hash, email_verified FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"[AUTH_SERVICE] No user found with email: {email}", flush=True)
            return {"error": "Invalid credentials", "code": 401}
        
        print(f"[AUTH_SERVICE] User found - ID: {user['id']}, email_verified: {user['email_verified']}", flush=True)
        print(f"[AUTH_SERVICE] Stored password hash: {user['password_hash'][:50]}..." if user['password_hash'] else "No hash stored", flush=True)
        print(f"[AUTH_SERVICE] Password hash type: {type(user['password_hash'])}", flush=True)
        print(f"[AUTH_SERVICE] Password hash length: {len(user['password_hash']) if user['password_hash'] else 0}", flush=True)
        
        # Verify and migrate legacy passwords if necessary
        print(f"[AUTH_SERVICE] Calling verify_and_migrate_password", flush=True)
        password_valid = verify_and_migrate_password(user['id'], user['password_hash'], password)
        print(f"[AUTH_SERVICE] Password verification result: {password_valid}", flush=True)
        
        if not password_valid:
            print(f"[AUTH_SERVICE] Password verification failed for user: {email}", flush=True)
            return {"error": "Invalid credentials", "code": 401}
        
        if not user['email_verified']:
            print(f"[AUTH_SERVICE] Email not verified for user: {email}", flush=True)
            return {"error": "Please verify your email before logging in", "code": 403}
        
        # Generate auth token
        print(f"[AUTH_SERVICE] Generating auth token for user: {user['id']}", flush=True)
        token = generate_auth_token(user['id'], secret_key)
        if not token:
            print(f"[AUTH_SERVICE] Failed to generate token for user: {user['id']}", flush=True)
            return {"error": "Failed to generate token", "code": 500}
        
        print(f"[AUTH_SERVICE] Login successful for user: {email}", flush=True)
        return {"success": True, "token": token, "user": {"id": user['id'], "email_verified": user['email_verified']}}
        
    except mariadb.Error as e:
        print(f"[AUTH_SERVICE] Database error during login: {e}", flush=True)
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
    
    # Validate password strength
    is_valid, validation_details = PasswordValidator.validate_password(new_password)
    if not is_valid:
        return {
            "error": "Password does not meet security requirements", 
            "code": 400,
            "validation_details": validation_details
        }
    
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


def initiate_email_change(user_id, current_password):
    """Step 1: Initiate email change by sending confirmation to current email"""
    conn, cursor = get_db()
    
    try:
        # Get user and verify password
        cursor.execute("SELECT id, email, password_hash FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return {"error": "User not found", "code": 404}
        
        if not verify_password(user['password_hash'], current_password):
            return {"error": "Invalid current password", "code": 400}
        
        # Generate confirmation token for current email
        confirmation_token = generate_verification_token()
        token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # 1 hour expiry
        
        # Store token in database
        cursor.execute("""
            UPDATE users 
            SET email_change_token = ?, email_change_token_expires = ?
            WHERE id = ?
        """, (confirmation_token, token_expires, user_id))
        
        # Send confirmation email to current email
        from app.services.email_service import send_email_change_confirmation
        send_email_change_confirmation(user['email'], confirmation_token)
        
        return {"success": True, "message": "Confirmation email sent to your current email address"}
        
    except mariadb.Error as e:
        print(f"Database error during email change initiation: {e}")
        return {"error": "Failed to initiate email change", "code": 500}


def confirm_email_change_request(token, new_email):
    """Step 2: Confirm email change request and send verification to new email"""
    conn, cursor = get_db()
    
    try:
        # Validate email format
        if not new_email or "@" not in new_email:
            return {"error": "Invalid email format", "code": 400}
        
        # Check if new email is already in use
        cursor.execute("SELECT id FROM users WHERE email = ?", (new_email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return {"error": "Email address is already in use", "code": 400}
        
        # Find user with valid confirmation token
        cursor.execute("""
            SELECT id, email 
            FROM users 
            WHERE email_change_token = ? AND email_change_token_expires > ?
        """, (token, datetime.datetime.utcnow()))
        
        user = cursor.fetchone()
        
        if not user:
            return {"error": "Invalid or expired confirmation token", "code": 400}
        
        # Generate new email verification token
        verification_token = generate_verification_token()
        verification_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # 24 hour expiry
        
        # Store new email and verification token
        cursor.execute("""
            UPDATE users 
            SET new_email = ?, new_email_token = ?, new_email_token_expires = ?,
                email_change_token = NULL, email_change_token_expires = NULL
            WHERE id = ?
        """, (new_email, verification_token, verification_expires, user['id']))
        
        # Send verification email to new email address
        from app.services.email_service import send_new_email_verification
        send_new_email_verification(new_email, verification_token)
        
        return {"success": True, "message": f"Verification email sent to {new_email}"}
        
    except mariadb.Error as e:
        print(f"Database error during email change confirmation: {e}")
        return {"error": "Failed to confirm email change", "code": 500}


def verify_new_email(token):
    """Step 3: Verify new email and complete the email change"""
    conn, cursor = get_db()
    
    try:
        # Find user with valid new email token
        cursor.execute("""
            SELECT id, email, new_email 
            FROM users 
            WHERE new_email_token = ? AND new_email_token_expires > ?
        """, (token, datetime.datetime.utcnow()))
        
        user = cursor.fetchone()
        
        if not user:
            return {"error": "Invalid or expired verification token", "code": 400}
        
        # Update email and clear temporary fields
        cursor.execute("""
            UPDATE users 
            SET email = new_email, 
                new_email = NULL, 
                new_email_token = NULL, 
                new_email_token_expires = NULL
            WHERE id = ?
        """, (user['id'],))
        
        return {"success": True, "message": "Email address updated successfully"}
        
    except mariadb.Error as e:
        print(f"Database error during new email verification: {e}")
        return {"error": "Failed to verify new email", "code": 500}