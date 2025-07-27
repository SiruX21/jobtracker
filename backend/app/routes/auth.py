from flask import Blueprint, request, jsonify, current_app
import jwt
import mariadb
from functools import wraps
from app import get_db
from app.config import Config
from app.services.auth_service import register_user, login_user, verify_email_token, resend_verification_email, request_password_reset, reset_password

auth_bp = Blueprint('auth', __name__)

def create_cors_response():
    """Create a CORS response with configurable origins"""
    response = jsonify()
    frontend_url = Config.get_frontend_url()
    response.headers.add('Access-Control-Allow-Origin', frontend_url)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
    data = request.json
    username = data.get("username")
    email = data.get("email") or data.get("username")  # Support email as username
    password = data.get("password")

    if not username or not password or not email:
        return jsonify({"error": "Username, email and password are required"}), 400
    
    if "@" not in email:
        return jsonify({"error": "Invalid email format"}), 400

    result = register_user(username, email, password)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 201

@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
    data = request.json
    email = data.get("username") or data.get("email")  # Support both username and email
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    result = login_user(email, password, current_app.config['SECRET_KEY'])
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({
        "token": result["token"],
        "user": result["user"]
    }), 200

@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get('token')
    
    if not token:
        return jsonify({"error": "Verification token is required"}), 400
    
    result = verify_email_token(token)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.json
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    result = resend_verification_email(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/forgot-password", methods=["POST", "OPTIONS"])
def forgot_password():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
    data = request.json
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    result = request_password_reset(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/reset-password", methods=["POST", "OPTIONS"])
def reset_password_route():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
    data = request.json
    token = data.get("token")
    new_password = data.get("password")
    
    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    
    result = reset_password(token, new_password)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), result["code"]
    
    return jsonify({"message": result["message"]}), 200

@auth_bp.route("/profile", methods=["GET", "OPTIONS"])
def get_profile():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
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
        print(f"Error in get_profile: {e}")
        return jsonify({"message": "Failed to load profile"}), 500

@auth_bp.route("/change-password", methods=["PUT", "OPTIONS"])
def change_password():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return create_cors_response()
    
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
    
    data = request.json
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")
    
    if not current_password or not new_password:
        return jsonify({"message": "Current password and new password are required"}), 400
    
    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400
    
    try:
        import bcrypt
        conn, cursor = get_db()
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), current_user['password'].encode('utf-8')):
            return jsonify({"message": "Current password is incorrect"}), 400
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password in database
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_password_hash, current_user['id']))
        conn.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except mariadb.Error as e:
        print(f"Database error during password change: {e}")
        return jsonify({"message": "Failed to change password due to server error"}), 500
    except Exception as e:
        print(f"Unexpected error during password change: {e}")
        return jsonify({"message": "Failed to change password"}), 500