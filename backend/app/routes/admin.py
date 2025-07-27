from flask import Blueprint, request, jsonify, current_app
import jwt
import mariadb
from functools import wraps
from app import get_db
from app.config import Config
import bcrypt
from datetime import datetime, timedelta
import secrets
import string

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
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
            if current_user['role'] != 'admin':
                return jsonify({"message": "Admin access required"}), 403
                
            # Pass current user to the route
            request.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
        except mariadb.Error as e:
            print(f"Database error during admin verification: {e}")
            return jsonify({"message": "Could not verify admin token"}), 500

        return f(*args, **kwargs)
    return decorated

@admin_bp.route("/admin/dashboard", methods=["GET"])
@admin_required
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        print("Admin dashboard called - getting database connection")
        conn, cursor = get_db()
        print("Database connection obtained successfully")
        
        # Get user statistics
        print("Getting user statistics...")
        cursor.execute("SELECT COUNT(*) as total_users FROM users")
        total_users = cursor.fetchone()['total_users']
        print(f"Total users: {total_users}")
        
        cursor.execute("SELECT COUNT(*) as verified_users FROM users WHERE email_verified = TRUE")
        verified_users = cursor.fetchone()['verified_users']
        print(f"Verified users: {verified_users}")
        
        cursor.execute("SELECT COUNT(*) as admin_users FROM users WHERE role = 'admin'")
        admin_users = cursor.fetchone()['admin_users']
        print(f"Admin users: {admin_users}")
        
        # Get job statistics
        print("Getting job statistics...")
        cursor.execute("SELECT COUNT(*) as total_jobs FROM job_applications")
        total_jobs = cursor.fetchone()['total_jobs']
        print(f"Total jobs: {total_jobs}")
        
        cursor.execute("SELECT status, COUNT(*) as count FROM job_applications GROUP BY status")
        job_status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
        print(f"Job status counts: {job_status_counts}")
        
        # Get recent activity
        print("Getting recent activity...")
        cursor.execute("""
            SELECT u.username, u.email, u.created_at, u.role, u.email_verified
            FROM users u
            ORDER BY u.created_at DESC
            LIMIT 10
        """)
        recent_users = cursor.fetchall()
        print(f"Recent users count: {len(recent_users)}")
        
        cursor.execute("""
            SELECT ja.id, ja.company_name, ja.job_title as position_title, ja.status, ja.application_date as applied_date, u.username
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            ORDER BY ja.application_date DESC
            LIMIT 10
        """)
        recent_jobs = cursor.fetchall()
        print(f"Recent jobs count: {len(recent_jobs)}")
        
        print("Preparing response...")
        return jsonify({
            "statistics": {
                "users": {
                    "total": total_users,
                    "verified": verified_users,
                    "admins": admin_users,
                    "unverified": total_users - verified_users
                },
                "jobs": {
                    "total": total_jobs,
                    "by_status": job_status_counts
                }
            },
            "recent_activity": {
                "users": [dict(user) for user in recent_users],
                "jobs": [dict(job) for job in recent_jobs]
            }
        })
        
    except Exception as e:
        print(f"Error getting admin dashboard: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to load dashboard"}), 500

@admin_bp.route("/admin/users", methods=["GET"])
@admin_required
def get_all_users():
    """Get all users with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        
        offset = (page - 1) * per_page
        
        conn, cursor = get_db()
        
        # Build search query
        where_clause = ""
        params = []
        if search:
            where_clause = "WHERE username LIKE ? OR email LIKE ?"
            params = [f"%{search}%", f"%{search}%"]
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as total FROM users {where_clause}", params)
        total = cursor.fetchone()['total']
        
        # Get users
        cursor.execute(f"""
            SELECT id, username, email, email_verified, role, created_at, updated_at
            FROM users {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, params + [per_page, offset])
        
        users = cursor.fetchall()
        
        return jsonify({
            "users": [dict(user) for user in users],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({"error": "Failed to get users"}), 500

@admin_bp.route("/admin/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        conn, cursor = get_db()
        
        # Get user details
        cursor.execute("""
            SELECT id, username, email, email_verified, role, created_at, updated_at
            FROM users WHERE id = ?
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user's jobs
        cursor.execute("""
            SELECT id, company_name, job_title as position_title, status, application_date as applied_date, location
            FROM job_applications WHERE user_id = ?
            ORDER BY application_date DESC
        """, (user_id,))
        jobs = cursor.fetchall()
        
        return jsonify({
            "user": dict(user),
            "jobs": [dict(job) for job in jobs],
            "job_count": len(jobs)
        })
        
    except Exception as e:
        print(f"Error getting user details: {e}")
        return jsonify({"error": "Failed to get user details"}), 500

@admin_bp.route("/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    """Update user details (admin only)"""
    try:
        data = request.get_json()
        conn, cursor = get_db()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User not found"}), 404
        
        # Build update query
        update_fields = []
        params = []
        
        if 'username' in data:
            update_fields.append("username = ?")
            params.append(data['username'])
        
        if 'email' in data:
            update_fields.append("email = ?")
            params.append(data['email'])
        
        if 'email_verified' in data:
            update_fields.append("email_verified = ?")
            params.append(data['email_verified'])
        
        if 'role' in data and data['role'] in ['user', 'admin']:
            update_fields.append("role = ?")
            params.append(data['role'])
        
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
        
        # Prevent removing the last admin
        if 'role' in data and data['role'] == 'user':
            cursor.execute("SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'")
            admin_count = cursor.fetchone()['admin_count']
            
            cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
            current_role = cursor.fetchone()['role']
            
            if admin_count <= 1 and current_role == 'admin':
                return jsonify({"error": "Cannot remove the last admin user"}), 400
        
        params.append(user_id)
        
        cursor.execute(f"""
            UPDATE users SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, params)
        
        conn.commit()
        
        return jsonify({"message": "User updated successfully"})
        
    except mariadb.IntegrityError as e:
        return jsonify({"error": "Username or email already exists"}), 400
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({"error": "Failed to update user"}), 500

@admin_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Delete a user and all their data"""
    try:
        conn, cursor = get_db()
        
        # Check if user exists and get their role
        cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Prevent deleting the last admin
        if user['role'] == 'admin':
            cursor.execute("SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'")
            admin_count = cursor.fetchone()['admin_count']
            if admin_count <= 1:
                return jsonify({"error": "Cannot delete the last admin user"}), 400
        
        # Delete user (CASCADE will delete their jobs)
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        
        return jsonify({"message": "User deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({"error": "Failed to delete user"}), 500

@admin_bp.route("/admin/jobs", methods=["GET"])
@admin_required
def get_all_jobs():
    """Get all job applications with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        offset = (page - 1) * per_page
        
        conn, cursor = get_db()
        
        # Build search query
        where_clauses = []
        params = []
        
        if search:
            where_clauses.append("(ja.company_name LIKE ? OR ja.job_title LIKE ? OR u.username LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
        if status:
            where_clauses.append("ja.status = ?")
            params.append(status)
        
        where_clause = ""
        if where_clauses:
            where_clause = "WHERE " + " AND ".join(where_clauses)
        
        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) as total 
            FROM job_applications ja 
            JOIN users u ON ja.user_id = u.id 
            {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        # Get jobs
        cursor.execute(f"""
            SELECT ja.id, ja.company_name, ja.job_title as position_title, ja.status, ja.application_date as applied_date, 
                   ja.location, u.username, u.email, ja.user_id
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            {where_clause}
            ORDER BY ja.application_date DESC
            LIMIT ? OFFSET ?
        """, params + [per_page, offset])
        
        jobs = cursor.fetchall()
        
        return jsonify({
            "jobs": [dict(job) for job in jobs],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        print(f"Error getting jobs: {e}")
        return jsonify({"error": "Failed to get jobs"}), 500

@admin_bp.route("/admin/jobs/<int:job_id>", methods=["DELETE"])
@admin_required
def delete_job(job_id):
    """Delete a job application"""
    try:
        conn, cursor = get_db()
        
        # Check if job exists
        cursor.execute("SELECT id FROM job_applications WHERE id = ?", (job_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Job not found"}), 404
        
        # Delete job
        cursor.execute("DELETE FROM job_applications WHERE id = ?", (job_id,))
        conn.commit()
        
        return jsonify({"message": "Job deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting job: {e}")
        return jsonify({"error": "Failed to delete job"}), 500

@admin_bp.route("/admin/create-admin", methods=["POST"])
@admin_required
def create_admin_user():
    """Create a new admin user"""
    try:
        data = request.get_json()
        required_fields = ['username', 'email', 'password']
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn, cursor = get_db()
        
        # Check if username or email already exists
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", 
                      (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create admin user (auto-verified)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, email_verified, role)
            VALUES (?, ?, ?, TRUE, 'admin')
        """, (data['username'], data['email'], password_hash))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        return jsonify({
            "message": "Admin user created successfully",
            "user_id": user_id,
            "username": data['username'],
            "email": data['email']
        }), 201
        
    except mariadb.IntegrityError:
        return jsonify({"error": "Username or email already exists"}), 400
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return jsonify({"error": "Failed to create admin user"}), 500

@admin_bp.route("/admin/system/info", methods=["GET"])
@admin_required
def get_system_info():
    """Get system information"""
    try:
        conn, cursor = get_db()
        
        # Database info
        cursor.execute("SELECT VERSION() as version")
        db_version = cursor.fetchone()['version']
        
        cursor.execute("SHOW TABLE STATUS")
        tables = cursor.fetchall()
        
        # Logo cache stats
        from app.services.logo_cache_service import logo_cache
        cache_stats = logo_cache.get_cache_stats()
        
        return jsonify({
            "database": {
                "version": db_version,
                "tables": [{"name": table['Name'], "rows": table['Rows']} for table in tables]
            },
            "cache": cache_stats,
            "environment": {
                "debug": current_app.config.get('DEBUG'),
                "environment": current_app.config.get('ENVIRONMENT', 'unknown')
            }
        })
        
    except Exception as e:
        print(f"Error getting system info: {e}")
        return jsonify({"error": "Failed to get system info"}), 500

@admin_bp.route('/system/clear-cache', methods=['POST'])
@admin_required
def clear_system_cache():
    """Clear all system caches"""
    try:
        from app.services.logo_cache_service import LogoCacheService
        
        # Clear logo cache
        cache_service = LogoCacheService()
        cache_service.clear_all_cached_logos()
        
        return jsonify({'message': 'All caches cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system/environment', methods=['GET'])
@admin_required
def get_environment_variables():
    """Get all environment variables (excluding sensitive ones)"""
    try:
        import os
        
        # List of sensitive environment variables to exclude
        sensitive_vars = {
            'DB_PASSWORD', 'JWT_SECRET_KEY', 'EMAIL_PASSWORD', 
            'LOGODEV_API_KEY', 'CLEARBIT_API_KEY', 'SECRET_KEY'
        }
        
        # Get all environment variables
        env_vars = {}
        for key, value in os.environ.items():
            if key.upper() not in sensitive_vars:
                env_vars[key] = value
            else:
                # Show that it exists but hide the value
                env_vars[key] = '***HIDDEN***'
        
        return jsonify({
            'environment_variables': env_vars,
            'sensitive_count': len([k for k in os.environ.keys() if k.upper() in sensitive_vars])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system/environment', methods=['PUT'])
@admin_required
def update_environment_variable():
    """Update an environment variable"""
    try:
        import os
        data = request.get_json()
        
        if not data or 'key' not in data or 'value' not in data:
            return jsonify({'error': 'Key and value are required'}), 400
        
        key = data['key']
        value = data['value']
        
        # List of protected environment variables that shouldn't be modified
        protected_vars = {
            'PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'OLDPWD', 'TERM',
            'LANG', 'LC_ALL', 'PYTHONPATH', 'PYTHONHOME'
        }
        
        if key.upper() in protected_vars:
            return jsonify({'error': f'Cannot modify protected variable: {key}'}), 400
        
        # Update the environment variable
        os.environ[key] = str(value)
        
        return jsonify({'message': f'Environment variable {key} updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system/environment/<key>', methods=['DELETE'])
@admin_required
def delete_environment_variable(key):
    """Delete an environment variable"""
    try:
        import os
        
        # List of protected environment variables that shouldn't be deleted
        protected_vars = {
            'PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'OLDPWD', 'TERM',
            'LANG', 'LC_ALL', 'PYTHONPATH', 'PYTHONHOME', 'DB_HOST',
            'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET_KEY'
        }
        
        if key.upper() in protected_vars:
            return jsonify({'error': f'Cannot delete protected variable: {key}'}), 400
        
        if key in os.environ:
            del os.environ[key]
            return jsonify({'message': f'Environment variable {key} deleted successfully'})
        else:
            return jsonify({'error': f'Environment variable {key} not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/admin/system/reset-passwords", methods=["POST"])
@admin_required
def generate_password_reset_link():
    """Generate password reset link for a user (admin only)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        conn, cursor = get_db()
        
        # Check if user exists
        cursor.execute("SELECT email, username FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Generate reset token
        reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        expiry = datetime.now() + timedelta(hours=1)
        
        # Store reset token
        cursor.execute("""
            UPDATE users 
            SET verification_token = ?, verification_token_expires = ?
            WHERE id = ?
        """, (reset_token, expiry, user_id))
        
        conn.commit()
        
        # Generate reset link (you can customize this based on your frontend)
        reset_link = f"{Config.get_frontend_url()}/reset-password?token={reset_token}"
        
        return jsonify({
            "message": "Password reset link generated",
            "reset_link": reset_link,
            "user": {
                "username": user['username'],
                "email": user['email']
            },
            "expires": expiry.isoformat()
        })
        
    except Exception as e:
        print(f"Error generating reset link: {e}")
        return jsonify({"error": "Failed to generate reset link"}), 500
