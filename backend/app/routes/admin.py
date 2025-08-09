from flask import Blueprint, request, jsonify, current_app
import jwt
import mariadb
from functools import wraps
from app import get_db, limiter
from app.config import Config
import bcrypt
from datetime import datetime, timedelta
import secrets
import string

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        from app.utils.security import SecurityUtils
        
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                SecurityUtils.log_security_event(
                    'ADMIN_MALFORMED_TOKEN',
                    details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
                )
                return jsonify({"message": "Bearer token malformed"}), 401

        if not token:
            SecurityUtils.log_security_event(
                'ADMIN_MISSING_TOKEN',
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
                    'ADMIN_INVALID_TOKEN_USER_NOT_FOUND',
                    user_id=data.get('sub'),
                    details=f"IP: {request.remote_addr}"
                )
                return jsonify({"message": "Token is invalid or user not found"}), 401
            if not current_user['email_verified']:
                SecurityUtils.log_security_event(
                    'ADMIN_UNVERIFIED_EMAIL_ACCESS_ATTEMPT',
                    user_id=current_user['id'],
                    details=f"IP: {request.remote_addr}, Email: {current_user['email']}"
                )
                return jsonify({"message": "Email not verified"}), 403
            if current_user['role'] != 'admin':
                SecurityUtils.log_security_event(
                    'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
                    user_id=current_user['id'],
                    details=f"IP: {request.remote_addr}, Email: {current_user['email']}, Role: {current_user['role']}"
                )
                return jsonify({"message": "Admin access required"}), 403
            
            # Log successful admin access for security auditing
            Config.log_info(f"Admin access granted to {current_user['email']} for {request.endpoint} from {request.remote_addr}", 'admin')
            
            # Pass current user to the route
            request.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            SecurityUtils.log_security_event(
                'ADMIN_EXPIRED_TOKEN',
                details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
            )
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            SecurityUtils.log_security_event(
                'ADMIN_INVALID_TOKEN',
                details=f"IP: {request.remote_addr}, Endpoint: {request.endpoint}"
            )
            return jsonify({"message": "Token is invalid!"}), 401
        except mariadb.Error as e:
            Config.log_error(f"Database error during admin verification: {e}", 'admin')
            return jsonify({"message": "Authentication failed"}), 500
        except Exception as e:
            Config.log_error(f"Unexpected error during admin verification: {e}", 'admin')
            return jsonify({"message": "Authentication failed"}), 500

        return f(*args, **kwargs)
    return decorated


@admin_bp.route("/admin/dashboard", methods=["GET"])
@admin_required
@limiter.limit("30 per minute")
def admin_dashboard():
    """Get admin dashboard data"""
    from app.config import Config
    
    try:
        conn, cursor = get_db()
        current_user = request.current_user
        
        Config.log_info(f"Admin dashboard accessed by user: {current_user['email']}", 'admin')
        
        # Get total users
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        
        # Get verified users count
        cursor.execute("SELECT COUNT(*) as verified FROM users WHERE email_verified = TRUE")
        verified_users = cursor.fetchone()['verified']
        
        # Get unverified users count  
        cursor.execute("SELECT COUNT(*) as unverified FROM users WHERE email_verified = FALSE")
        unverified_users = cursor.fetchone()['unverified']
        
        # Get admin users count
        cursor.execute("SELECT COUNT(*) as admins FROM users WHERE role = 'admin'")
        admin_users = cursor.fetchone()['admins']
        
        # Get total job applications
        cursor.execute("SELECT COUNT(*) as total FROM job_applications")
        total_jobs = cursor.fetchone()['total']
        
        # Get recent users (last 10)
        cursor.execute("""
            SELECT id, username, email, email_verified, role, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        recent_users = cursor.fetchall()
        
        # Get recent job applications (last 10)
        cursor.execute("""
            SELECT ja.id, ja.company_name, ja.job_title as position_title, ja.status, 
                   ja.application_date as applied_date, u.username, u.email
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            ORDER BY ja.application_date DESC
            LIMIT 10
        """)
        recent_jobs = cursor.fetchall()
        
        Config.log_debug(f"Dashboard data - Users: {total_users}, Jobs: {total_jobs}", 'admin')
        
        return jsonify({
            "statistics": {
                "users": {
                    "total": total_users,
                    "verified": verified_users,
                    "unverified": unverified_users,
                    "admins": admin_users
                },
                "jobs": {
                    "total": total_jobs
                }
            },
            "recent_activity": {
                "users": recent_users,
                "jobs": recent_jobs
            }
        })
        
    except mariadb.Error as e:
        Config.log_error(f"Database error in admin dashboard: {e}", 'admin')
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        Config.log_error(f"Error in admin dashboard: {e}", 'admin')
        return jsonify({"error": "Failed to load dashboard"}), 500

@admin_bp.route("/admin/users", methods=["GET"])
@admin_required
@limiter.limit("30 per minute")
def get_users():
    """Get paginated users list"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        
        print(f"Admin users request - page: {page}, per_page: {per_page}, search: '{search}'")
        
        conn, cursor = get_db()
        
        # Build search query
        where_clause = ""
        params = []
        
        if search:
            # Search in username, email, and role
            where_clause = "WHERE (username LIKE ? OR email LIKE ? OR role LIKE ?)"
            search_term = f"%{search}%"
            params = [search_term, search_term, search_term]
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM users {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        print(f"Total users found: {total}")
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get users
        query = f"""
            SELECT id, username, email, email_verified, role, created_at
            FROM users {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        cursor.execute(query, params)
        users = cursor.fetchall()
        
        print(f"Returning {len(users)} users for page {page}")
        
        return jsonify({
            "users": users,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": total_pages
            },
            "search": search
        })
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({"error": "Failed to get users"}), 500

@admin_bp.route("/admin/jobs", methods=["GET"])
@admin_required
@limiter.limit("30 per minute")
def get_all_jobs():
    """Get paginated job applications list"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        status_filter = request.args.get('status', '').strip()
        
        conn, cursor = get_db()
        
        # Build search query
        where_conditions = []
        params = []
        
        if search:
            where_conditions.append("(ja.company_name LIKE ? OR ja.job_title LIKE ? OR u.username LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
        if status_filter:
            where_conditions.append("ja.status = ?")
            params.append(status_filter)
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) as total 
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            {where_clause}
        """
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get jobs
        query = f"""
            SELECT ja.id, ja.company_name, ja.job_title as position_title, ja.status,
                   ja.application_date as applied_date, ja.location, u.username, u.email
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            {where_clause}
            ORDER BY ja.application_date DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        
        return jsonify({
            "jobs": jobs,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": total_pages
            }
        })
        
    except Exception as e:
        print(f"Error getting jobs: {e}")
        return jsonify({"error": "Failed to get jobs"}), 500

@admin_bp.route("/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
@limiter.limit("10 per minute")
def update_user(user_id):
    """Update user details"""
    try:
        data = request.get_json()
        
        conn, cursor = get_db()
        
        # Update user
        cursor.execute("""
            UPDATE users 
            SET username = ?, email = ?, role = ?, email_verified = ?
            WHERE id = ?
        """, (data['username'], data['email'], data['role'], data['email_verified'], user_id))
        
        conn.commit()
        
        return jsonify({"message": "User updated successfully"})
        
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({"error": "Failed to update user"}), 500

@admin_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
@limiter.limit("5 per minute")
def delete_user(user_id):
    """Delete a user"""
    try:
        conn, cursor = get_db()
        
        # Delete user (this will cascade to job_applications due to foreign key)
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        
        return jsonify({"message": "User deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({"error": "Failed to delete user"}), 500

@admin_bp.route("/admin/jobs/<int:job_id>", methods=["DELETE"])
@admin_required
@limiter.limit("10 per minute")
def delete_job_admin(job_id):
    """Delete a job application"""
    try:
        conn, cursor = get_db()
        
        cursor.execute("DELETE FROM job_applications WHERE id = ?", (job_id,))
        conn.commit()
        
        return jsonify({"message": "Job application deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting job: {e}")
        return jsonify({"error": "Failed to delete job application"}), 500

@admin_bp.route("/admin/users", methods=["POST"])
@admin_required
@limiter.limit("5 per minute")
def create_admin_user():
    """Create a new admin user"""
    try:
        data = request.get_json()
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        conn, cursor = get_db()
        
        # Create user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, email_verified, created_at)
            VALUES (?, ?, ?, 'admin', TRUE, ?)
        """, (data['username'], data['email'], password_hash.decode('utf-8'), datetime.now()))
        
        conn.commit()
        
        return jsonify({"message": "Admin user created successfully"})
        
    except mariadb.IntegrityError:
        return jsonify({"error": "Username or email already exists"}), 400
    except Exception as e:
        Config.log_error(f"Error creating admin user: {e}", 'admin')
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
        
        # Logo cache stats - handle potential Redis connection issues
        cache_stats = {"error": "Cache service unavailable"}
        try:
            from app.services.logo_cache_service import logo_cache
            cache_stats = logo_cache.get_cache_stats()
        except Exception as cache_error:
            Config.log_warning(f"Cache service error: {cache_error}", 'admin')
            cache_stats = {"error": f"Cache service error: {str(cache_error)}"}
        
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
        Config.log_error(f"Error getting system info: {e}", 'admin')
        return jsonify({"error": "Failed to get system info"}), 500

@admin_bp.route('/admin/system/clear-cache', methods=['POST'])
@admin_required
def clear_system_cache():
    """Clear system cache"""
    try:
        from app.services.logo_cache_service import logo_cache
        logo_cache.clear_cache()
        return jsonify({"message": "Cache cleared successfully"})
    except Exception as e:
        print(f"Error clearing cache: {e}")
        return jsonify({"error": "Failed to clear cache"}), 500

@admin_bp.route('/admin/system/environment', methods=['GET'])
@admin_required
def get_environment_variables():
    """Get environment variables (sensitive ones hidden)"""
    from app.utils.security import SecurityUtils
    
    try:
        import os
        
        env_vars = {}
        sensitive_count = 0
        
        for key, value in os.environ.items():
            # Check if this is a sensitive variable
            if SecurityUtils.is_sensitive_env_var(key):
                # Show that it exists but hide the value
                env_vars[key] = '***HIDDEN***'
                sensitive_count += 1
            else:
                env_vars[key] = value
        
        return jsonify({
            'environment_variables': env_vars,
            'sensitive_count': sensitive_count
        })
    except Exception as e:
        Config.log_error(f"Error getting environment variables: {e}", 'admin')
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/system/environment', methods=['PUT'])
@admin_required
def update_environment_variable():
    """Update an environment variable"""
    try:
        import os
        data = request.get_json()
        
        if not data or 'key' not in data or 'value' not in data:
            return jsonify({'error': 'Key and value are required'}), 400
        
        # Update environment variable
        os.environ[data['key']] = data['value']
        
        return jsonify({'message': f'Environment variable {data["key"]} updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/system/environment/<key>', methods=['DELETE'])
@admin_required
def delete_environment_variable(key):
    """Delete an environment variable"""
    from app.utils.security import SecurityUtils
    
    try:
        import os
        
        # Protect critical variables
        if SecurityUtils.is_protected_env_var(key):
            SecurityUtils.log_security_event(
                'PROTECTED_ENV_DELETE_ATTEMPT',
                user_id=request.current_user.get('id'),
                details=f"Attempted to delete protected variable: {key}"
            )
            return jsonify({'error': 'Cannot delete protected environment variable'}), 403
        
        if key in os.environ:
            del os.environ[key]
            Config.log_info(f'Environment variable {key} deleted by admin user {request.current_user.get("email")}', 'admin')
            return jsonify({'message': f'Environment variable {key} deleted successfully'})
        else:
            return jsonify({'error': 'Environment variable not found'}), 404
    except Exception as e:
        Config.log_error(f"Error deleting environment variable: {e}", 'admin')
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/admin/system/reset-passwords", methods=["POST"])
@admin_required
def reset_passwords():
    """Reset passwords for all users (emergency function)"""
    try:
        data = request.get_json()
        new_password = data.get('new_password', secrets.token_urlsafe(12))
        
        # Hash the new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        conn, cursor = get_db()
        
        # Update all user passwords
        cursor.execute("UPDATE users SET password_hash = ?", (password_hash.decode('utf-8'),))
        affected_rows = cursor.rowcount
        conn.commit()
        
        return jsonify({
            "message": f"Reset passwords for {affected_rows} users",
            "new_password": new_password
        })
        
    except Exception as e:
        Config.log_error(f"Error resetting passwords: {e}", 'admin')
        return jsonify({"error": "Failed to reset passwords"}), 500

# Job Status Management Endpoints (Admin Access)
@admin_bp.route("/admin/job-statuses", methods=["GET"])
@admin_required
def admin_get_job_statuses():
    """Get all job statuses with statistics"""
    try:
        conn, cursor = get_db()
        
        # Get all statuses with usage count
        cursor.execute("""
            SELECT 
                js.status_name, 
                js.color_code, 
                js.is_default,
                js.created_at,
                COUNT(ja.id) as usage_count
            FROM job_statuses js
            LEFT JOIN job_applications ja ON js.status_name = ja.status
            GROUP BY js.status_name, js.color_code, js.is_default, js.created_at
            ORDER BY js.is_default DESC, usage_count DESC, js.status_name ASC
        """)
        statuses = cursor.fetchall()
        
        # Convert datetime objects to ISO format
        for status in statuses:
            if status.get('created_at'):
                status['created_at'] = status['created_at'].isoformat()
        
        return jsonify({
            "statuses": statuses
        }), 200
    except mariadb.Error as e:
        print(f"Database error getting job statuses: {e}")
        return jsonify({"error": "Failed to fetch job statuses"}), 500
    except Exception as e:
        print(f"Unexpected error getting job statuses: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@admin_bp.route("/admin/job-statuses/<status_name>", methods=["DELETE"])
@admin_required
def admin_delete_job_status(status_name):
    """Delete a job status (only if not default and not in use)"""
    try:
        conn, cursor = get_db()
        
        # Check if status is default
        cursor.execute("SELECT is_default FROM job_statuses WHERE status_name = ?", (status_name,))
        status = cursor.fetchone()
        
        if not status:
            return jsonify({"error": "Status not found"}), 404
        
        if status['is_default']:
            return jsonify({"error": "Cannot delete default status"}), 400
        
        # Check if status is in use
        cursor.execute("SELECT COUNT(*) as count FROM job_applications WHERE status = ?", (status_name,))
        usage = cursor.fetchone()
        
        if usage['count'] > 0:
            return jsonify({
                "error": f"Cannot delete status. It is used in {usage['count']} job applications"
            }), 400
        
        # Delete the status
        cursor.execute("DELETE FROM job_statuses WHERE status_name = ?", (status_name,))
        
        return jsonify({"message": "Status deleted successfully"}), 200
    except mariadb.Error as e:
        print(f"Database error deleting job status: {e}")
        return jsonify({"error": "Failed to delete job status"}), 500
    except Exception as e:
        print(f"Unexpected error deleting job status: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500
