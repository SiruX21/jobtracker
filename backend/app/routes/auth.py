from quart import Blueprint, request, jsonify, current_app
import jwt
import mariadb
import bcrypt
from functools import wraps
from app import get_db
from app.config import Config
from app.services.auth_service import register_user, login_user, verify_email_token, resend_verification_email, request_password_reset, reset_password, initiate_email_change, confirm_email_change_request, verify_new_email, verify_password
from app.utils.password_validator import PasswordValidator


auth_bp = Blueprint('auth', __name__)

# Test endpoint for CORS verification
@auth_bp.route("/test", methods=["GET", "POST", "OPTIONS"])
async def test_cors():
    """Test endpoint to verify CORS is working"""
    return jsonify({
        "message": "CORS test successful", 
        "method": request.method,
        "origin": request.headers.get('Origin', 'No origin header')
    }), 200

def token_required(f):
    @wraps(f)
    async def decorated(*args, **kwargs):
        from app.utils.security import SecurityUtils
        
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                SecurityUtils.log_security_event(
                    'MALFORMED_TOKEN',
                    details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
                )
                return jsonify({"message": "Bearer token malformed"}), 401

        if not token:
            SecurityUtils.log_security_event(
                'MISSING_TOKEN',
                details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
            )
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            conn, cursor = get_db()
            cursor.execute("SELECT * FROM users WHERE id = ?", (data['sub'],))
            current_user = cursor.fetchone()
            if not current_user:
                SecurityUtils.log_security_event(
                    'INVALID_TOKEN_USER_NOT_FOUND',
                    user_id=data.get('sub'),
                    details=f"IP: {request.remote_addr}"
                )
                return jsonify({"message": "Token is invalid or user not found"}), 401
            if not current_user['email_verified']:
                SecurityUtils.log_security_event(
                    'UNVERIFIED_EMAIL_ACCESS_ATTEMPT',
                    user_id=current_user['id'],
                    details=f"IP: {request.remote_addr}, Email: {current_user['email']}"
                )
                return jsonify({"message": "Email not verified"}), 403
        except jwt.ExpiredSignatureError:
            SecurityUtils.log_security_event(
                'EXPIRED_TOKEN',
                details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
            )
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            SecurityUtils.log_security_event(
                'INVALID_TOKEN',
                details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
            )
            return jsonify({"message": "Token is invalid!"}), 401
        except mariadb.Error as e:
            Config.log_error(f"Database error during token verification: {e}", 'auth')
            return jsonify({"message": "Authentication failed"}), 500
        except Exception as e:
            Config.log_error(f"Unexpected error during token verification: {e}", 'auth')
            return jsonify({"message": "Authentication failed"}), 500

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST"])
# Rate limiting temporarily disabled
async def register():
    from app.utils.security import SecurityUtils
    
    data = await request.json
    
    # --- Input Validation & Sanitization ---
    errors = {}
    username = data.get("username")
    email = data.get("email") or data.get("username")  # Support email as username
    password = data.get("password")

    if not SecurityUtils.validate_username(username):
        errors['username'] = "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens."
    
    if not SecurityUtils.validate_email(email):
        errors['email'] = "Invalid email format."
    
    if not password or not isinstance(password, str) or len(password) < 6:
        errors['password'] = "Password is required and must be at least 6 characters."

    if errors:
        SecurityUtils.log_security_event(
            'INVALID_REGISTRATION_ATTEMPT',
            details=f"Email: {SecurityUtils.sanitize_log_data(email or 'None')}, Errors: {list(errors.keys())}"
        )
        return jsonify({"error": "Validation failed", "details": errors}), 400
    # --- End Validation ---

    result = register_user(username, email, password)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 201

@auth_bp.route("/login", methods=["POST"])
# Rate limiting temporarily disabled
async def login():
    from app.config import Config
    
    Config.log_debug(f"Login request received from {request.remote_addr}", 'auth')
    
    data = await request.json
    Config.log_debug(f"Login request data keys: {list(data.keys()) if data else 'None'}", 'auth')
    
    # --- Input Validation & Sanitization ---
    errors = {}
    email = data.get("username") or data.get("email")  # Support both username and email
    password = data.get("password")

    Config.log_debug(f"Extracted email: {email}", 'auth')

    if not email or not isinstance(email, str) or len(email) > 100:
        errors['email'] = "Email/username is required and must be under 100 characters."
    if not password or not isinstance(password, str):
        errors['password'] = "Password is required."

    if errors:
        Config.log_debug(f"Validation errors: {errors}", 'auth')
        return jsonify({"error": "Validation failed", "details": errors}), 400
    # --- End Validation ---

    Config.log_debug(f"Calling login_user with email: {email}", 'auth')
    result = login_user(email, password, current_app.config['SECRET_KEY'])
    Config.log_debug(f"login_user result: {'success' if 'success' in result else 'error'}", 'auth')

    if "error" in result:
        Config.log_debug(f"Login failed with error: {result['error']}, code: {result.get('code', 500)}", 'auth')
        return jsonify({"error": result["error"]}), result["code"]

    Config.log_info(f"Login successful for email: {email}", 'auth')
    return jsonify({
        "token": result["token"],
        "user": result["user"]
    }), 200

@auth_bp.route("/verify-email", methods=["GET"])
# Rate limiting temporarily disabled
def verify_email():
    token = request.args.get('token')
    
    if not token:
        return jsonify({"error": "Verification token is required"}), 400
    
    result = verify_email_token(token)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/resend-verification", methods=["POST"])
# Rate limiting temporarily disabled
async def resend_verification():
    data = await request.json
    
    # --- Input Validation & Sanitization ---
    email = data.get("email")
    
    if not email or not isinstance(email, str) or len(email) > 100:
        return jsonify({"error": "Valid email is required"}), 400
    
    import re
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return jsonify({"error": "Invalid email format"}), 400
    # --- End Validation ---
    
    result = resend_verification_email(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
# Rate limiting temporarily disabled
async def forgot_password():
    from app.utils.security import SecurityUtils
    
    data = await request.json
    
    # --- Input Validation & Sanitization ---
    email = data.get("email")
    
    if not SecurityUtils.validate_email(email):
        SecurityUtils.log_security_event(
            'INVALID_PASSWORD_RESET_ATTEMPT',
            details=f"Invalid email format: {SecurityUtils.sanitize_log_data(email or 'None')}"
        )
        return jsonify({"error": "Valid email is required"}), 400
    # --- End Validation ---

    result = request_password_reset(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/reset-password", methods=["POST"])
# Rate limiting temporarily disabled
async def reset_password_route():
    from app.utils.security import SecurityUtils
    
    data = await request.json
    
    # --- Input Validation & Sanitization ---
    token = data.get("token")
    new_password = data.get("password")
    
    if not token or not isinstance(token, str) or len(token) > 500:
        SecurityUtils.log_security_event(
            'INVALID_RESET_TOKEN',
            details=f"IP: {request.remote_addr}, Token length: {len(token) if token else 0}"
        )
        return jsonify({"error": "Valid reset token is required"}), 400
    
    if not new_password or not isinstance(new_password, str) or len(new_password) < 6:
        SecurityUtils.log_security_event(
            'WEAK_PASSWORD_RESET_ATTEMPT',
            details=f"IP: {request.remote_addr}, Password length: {len(new_password) if new_password else 0}"
        )
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    # --- End Validation ---
    
    result = reset_password(token, new_password)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    SecurityUtils.log_security_event(
        'PASSWORD_RESET_SUCCESS',
        details=f"IP: {request.remote_addr}",
        severity='INFO'
    )
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    # For GET requests, require authentication
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"message": "Bearer token malformed"}), 401

    if not token:
        return jsonify({"message": "Token is missing!"}), 401

    try:
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        conn, cursor = get_db()
        cursor.execute("SELECT * FROM users WHERE id = ?", (data['sub'],))
        current_user = cursor.fetchone()
        if not current_user:
            return jsonify({"message": "Token is invalid or user not found"}), 401
        if not current_user['email_verified']:
            return jsonify({"message": "Email not verified"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired!"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Token is invalid!"}), 401
    except mariadb.Error as e:
        print(f"Database error during token verification: {e}")
        return jsonify({"message": "Could not verify token due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during token verification: {e}")
        return jsonify({"message": "Could not verify token"}), 500
    
    try:
        # Handle created_at field safely
        created_at = None
        if current_user.get('created_at'):
            if hasattr(current_user['created_at'], 'isoformat'):
                created_at = current_user['created_at'].isoformat()
            else:
                created_at = str(current_user['created_at'])
        
        return jsonify({
            "id": current_user['id'],
            "email": current_user['email'],
            "created_at": created_at,
            "email_verified": current_user.get('email_verified', False)
        }), 200
    except Exception as e:
        Config.log_error(f"Error in get_profile: {e}", 'auth')
        return jsonify({"message": "Failed to load profile"}), 500

@auth_bp.route("/change-password", methods=["PUT"])
# Rate limiting temporarily disabled
async def change_password():
    # For PUT requests, require authentication
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"message": "Bearer token malformed"}), 401

    if not token:
        return jsonify({"message": "Token is missing!"}), 401

    try:
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        conn, cursor = get_db()
        cursor.execute("SELECT * FROM users WHERE id = ?", (data['sub'],))
        current_user = cursor.fetchone()
        if not current_user:
            return jsonify({"message": "Token is invalid or user not found"}), 401
        if not current_user['email_verified']:
            return jsonify({"message": "Email not verified"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired!"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Token is invalid!"}), 401
    except mariadb.Error as e:
        print(f"Database error during token verification: {e}")
        return jsonify({"message": "Could not verify token due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during token verification: {e}")
        return jsonify({"message": "Could not verify token"}), 500
    
    data = await request.json
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")
    
    if not current_password or not new_password:
        return jsonify({"message": "Current password and new password are required"}), 400
    
    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400
    
    try:
        conn, cursor = get_db()
        
        # Ensure we're getting the password hash from database consistently
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user['id'],))
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"message": "User not found"}), 404
            
        stored_password_hash = user_data['password_hash']
        if not verify_password(stored_password_hash, current_password):
            return jsonify({"message": "Current password is incorrect"}), 400
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password in database - use password_hash column consistently
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, current_user['id']))
        conn.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except mariadb.Error as e:
        print(f"Database error during password change: {e}")
        return jsonify({"message": "Failed to change password due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during password change: {e}")
        return jsonify({"message": "Failed to change password"}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
# Rate limiting temporarily disabled
async def delete_account():
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"message": "Bearer token malformed"}), 401

    if not token:
        return jsonify({"message": "Token is missing!"}), 401

    try:
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        conn, cursor = get_db()
        cursor.execute("SELECT * FROM users WHERE id = ?", (data['sub'],))
        current_user = cursor.fetchone()
        if not current_user:
            return jsonify({"message": "Token is invalid or user not found"}), 401
        if not current_user['email_verified']:
            return jsonify({"message": "Email not verified"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired!"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Token is invalid!"}), 401
    except mariadb.Error as e:
        print(f"Database error during token verification: {e}")
        return jsonify({"message": "Could not verify token due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during token verification: {e}")
        return jsonify({"message": "Could not verify token"}), 500
    
    request_data = await request.json
    password = request_data.get("password")
    
    if not password:
        return jsonify({"message": "Password is required to delete account"}), 400
    
    try:
        conn, cursor = get_db()
        
        # Get the current password hash from database consistently
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user['id'],))
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"message": "User not found"}), 404
            
        stored_password_hash = user_data['password_hash']
        
        # Verify password using safe helper
        if not verify_password(stored_password_hash, password):
            return jsonify({"message": "Password is incorrect"}), 400
        
        # Delete user's job applications first (due to foreign key constraint)
        cursor.execute("DELETE FROM job_applications WHERE user_id = ?", (current_user['id'],))
        
        # Delete the user account
        cursor.execute("DELETE FROM users WHERE id = ?", (current_user['id'],))
        conn.commit()
        
        return jsonify({"message": "Account deleted successfully"}), 200
        
    except mariadb.Error as e:
        print(f"Database error during account deletion: {e}")
        return jsonify({"message": "Failed to delete account due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during account deletion: {e}")
        return jsonify({"message": "Failed to delete account"}), 500

@auth_bp.route("/request-email-change", methods=["POST"])
@token_required
# Rate limiting temporarily disabled
def request_email_change_route(current_user):
    """Simplified email change endpoint that matches frontend expectations"""
    try:
        data = request.get_json()
        new_email = data.get('newEmail')
        password = data.get('password')
        user_id = current_user['id']
        
        # --- Input Validation & Sanitization ---
        errors = {}
        if not new_email or not isinstance(new_email, str) or len(new_email) > 100:
            errors['newEmail'] = "New email is required and must be under 100 characters."
        else:
            import re
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', new_email):
                errors['newEmail'] = "Invalid email format."
        
        if not password or not isinstance(password, str):
            errors['password'] = "Password is required."
        
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400
        # --- End Validation ---
        
        # Verify current password first
        conn, cursor = get_db()
        cursor.execute("SELECT password_hash, email FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        # Import and use the verify_password function from auth_service
        from app.services.auth_service import verify_password
        if not verify_password(user['password_hash'], password):
            conn.close()
            return jsonify({"error": "Invalid password"}), 401
        
        # Check if new email is different from current
        if new_email == user['email']:
            conn.close()
            return jsonify({"error": "New email must be different from current email"}), 400
        
        # Check if new email is already in use
        cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (new_email, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Email is already in use"}), 409
        
        # Generate tokens for two-step verification
        import secrets
        from datetime import datetime, timedelta
        
        current_email_token = secrets.token_urlsafe(32)
        new_email_token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=24)
        
        # Store the email change request
        cursor.execute("""
            UPDATE users 
            SET new_email = ?, 
                email_change_token = ?, 
                new_email_token = ?,
                email_change_token_expires = ?,
                new_email_token_expires = ?
            WHERE id = ?
        """, (new_email, current_email_token, new_email_token, expires, expires, user_id))
        
        conn.commit()
        conn.close()
        
        # Send confirmation emails
        from app.services.email_service import send_email_change_confirmation, send_new_email_verification
        
        try:
            # Send confirmation to current email
            send_email_change_confirmation(user['email'], current_email_token)
            # Send verification to new email  
            send_new_email_verification(new_email, new_email_token)
        except Exception as e:
            print(f"Failed to send email change confirmation: {e}")
            return jsonify({"error": "Failed to send confirmation emails"}), 500
        
        return jsonify({
            "success": True, 
            "message": "Email change requests sent. Please check both your current and new email addresses."
        }), 200
        
    except Exception as e:
        print(f"Error in request_email_change: {e}")
        return jsonify({"error": "Failed to process email change request"}), 500

@auth_bp.route("/initiate-email-change", methods=["POST"])
@token_required
# Rate limiting temporarily disabled
def initiate_email_change_route():
    """Step 1: Initiate email change process"""
    data = request.get_json()
    current_password = data.get("current_password")
    
    if not current_password:
        return jsonify({"error": "Current password is required"}), 400
    
    # Get user ID from token
    token = request.headers.get('Authorization').split(" ")[1]
    user_data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
    user_id = user_data['sub']
    
    result = initiate_email_change(user_id, current_password)
    
    if "error" in result:
        return jsonify(result), result.get("code", 500)
    
    return jsonify(result), 200

@auth_bp.route("/confirm-email-change", methods=["GET", "POST"])
# Rate limiting temporarily disabled
def confirm_email_change_route():
    """Step 2: Confirm email change and provide new email"""
    if request.method == "GET":
        # Handle email confirmation link click
        token = request.args.get('token')
        
        if not token:
            return """
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #dc2626;">Invalid Link</h2>
                    <p>Email change confirmation token is missing.</p>
                </body>
            </html>
            """, 400
        
        # Show form to enter new email
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enter New Email</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f8fafc;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                }}
                .container {{
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    max-width: 400px;
                    width: 100%;
                }}
                .logo {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin: 0 auto 20px;
                }}
                h1 {{
                    color: #2d3748;
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .form-group {{
                    margin-bottom: 20px;
                }}
                label {{
                    display: block;
                    margin-bottom: 8px;
                    color: #374151;
                    font-weight: 500;
                }}
                input[type="email"] {{
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 16px;
                    box-sizing: border-box;
                }}
                button {{
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                }}
                button:hover {{
                    opacity: 0.9;
                }}
                .message {{
                    margin-top: 20px;
                    padding: 12px;
                    border-radius: 6px;
                    text-align: center;
                    display: none;
                }}
                .success {{
                    background: #d1f2eb;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }}
                .error {{
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">📧</div>
                <h1>Enter New Email</h1>
                <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
                    Please enter your new email address to complete the email change.
                </p>
                
                <form id="emailForm">
                    <div class="form-group">
                        <label for="newEmail">New Email Address</label>
                        <input type="email" id="newEmail" name="newEmail" required>
                    </div>
                    <button type="submit">Send Verification Email</button>
                </form>
                
                <div id="message" class="message"></div>
            </div>
            
            <script>
                document.getElementById('emailForm').onsubmit = async function(e) {{
                    e.preventDefault();
                    
                    const newEmail = document.getElementById('newEmail').value;
                    const messageDiv = document.getElementById('message');
                    const button = document.querySelector('button');
                    
                    button.disabled = true;
                    button.textContent = 'Sending...';
                    
                    try {{
                        const response = await fetch('/api/auth/confirm-email-change', {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/json'
                            }},
                            body: JSON.stringify({{
                                token: '{token}',
                                new_email: newEmail
                            }})
                        }});
                        
                        const result = await response.json();
                        
                        if (response.ok) {{
                            messageDiv.className = 'message success';
                            messageDiv.textContent = result.message;
                            messageDiv.style.display = 'block';
                            document.getElementById('emailForm').style.display = 'none';
                        }} else {{
                            messageDiv.className = 'message error';
                            messageDiv.textContent = result.error || 'An error occurred';
                            messageDiv.style.display = 'block';
                        }}
                    }} catch (error) {{
                        messageDiv.className = 'message error';
                        messageDiv.textContent = 'Network error occurred';
                        messageDiv.style.display = 'block';
                    }}
                    
                    button.disabled = false;
                    button.textContent = 'Send Verification Email';
                }};
            </script>
        </body>
        </html>
        """
    
    elif request.method == "POST":
        # Handle form submission with new email
        data = request.get_json()
        token = data.get("token")
        new_email = data.get("new_email")
        
        if not token or not new_email:
            return jsonify({"error": "Token and new email are required"}), 400
        
        result = confirm_email_change_request(token, new_email)
        
        if "error" in result:
            return jsonify(result), result.get("code", 500)
        
        return jsonify(result), 200

@auth_bp.route("/verify-new-email", methods=["GET"])
def verify_new_email_route():
    """Step 3: Verify new email address"""
    token = request.args.get('token')
    
    if not token:
        return """
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Invalid Link</h2>
                <p>Email verification token is missing.</p>
            </body>
        </html>
        """, 400
    
    result = verify_new_email(token)
    
    if "error" in result:
        from app.config import Config
        frontend_url = Config.get_frontend_url()
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Email Verification Failed</h2>
                <p>{result["error"]}</p>
                <a href="{frontend_url}" style="color: #2563eb;">Go to App</a>
            </body>
        </html>
        """, result["code"]
    
    # Success
    from app.config import Config
    frontend_url = Config.get_frontend_url()
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #16a34a;">Email Changed Successfully!</h2>
            <p>Your email address has been updated. You can now use your new email to log in.</p>
            <a href="{frontend_url}" style="color: #2563eb; text-decoration: none; background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px;">Go to App</a>
        </body>
    </html>
    """

@auth_bp.route('/validate-password', methods=['POST'])
# Rate limiting temporarily disabled
def validate_password_endpoint():
    """Validate password strength"""
    try:
        data = request.get_json()
        password = data.get('password', '')
        
        is_valid, validation_details = PasswordValidator.validate_password(password)
        
        response = jsonify({
            "valid": is_valid,
            "details": validation_details
        })
        
        return response
        
    except Exception as e:
        Config.log_error(f"Error validating password: {e}", 'auth')
        return jsonify({"error": "Internal server error"}), 500