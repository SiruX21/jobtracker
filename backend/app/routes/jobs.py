from quart import Blueprint, request, jsonify, current_app
import mariadb
import random
from app import get_db
from app.routes.auth import token_required

jobs_bp = Blueprint('jobs', __name__)

def ensure_status_history_table(cursor):
    """Ensure the job_status_history table exists"""
    try:
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'job_status_history'
        """)
        table_exists = cursor.fetchone()['count'] > 0
        
        if not table_exists:
            print("Creating job_status_history table...")
            # Create the table
            cursor.execute("""
                CREATE TABLE job_status_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    job_id INT NOT NULL,
                    from_status VARCHAR(255),
                    to_status VARCHAR(255) NOT NULL,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    created_by INT,
                    FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_job_id (job_id),
                    INDEX idx_changed_at (changed_at)
                )
            """)
            
            # Insert initial history for existing jobs (only if no history exists for them)
            cursor.execute("""
                INSERT INTO job_status_history (job_id, from_status, to_status, changed_at, created_by)
                SELECT 
                    ja.id as job_id,
                    NULL as from_status,
                    ja.status as to_status,
                    ja.application_date as changed_at,
                    ja.user_id as created_by
                FROM job_applications ja
                LEFT JOIN job_status_history jsh ON ja.id = jsh.job_id
                WHERE ja.status IS NOT NULL AND jsh.job_id IS NULL
            """)
            print("job_status_history table created and populated with existing job data")
            
    except Exception as e:
        print(f"Error ensuring status history table: {e}")

from functools import wraps

def set_user_id_in_request(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'current_user' in kwargs and kwargs['current_user']:
            request.current_user_id = kwargs['current_user']['id']
        return f(*args, **kwargs)
    return decorated

@jobs_bp.route("/jobs", methods=["POST"])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def create_job(current_user):
    data = await request.json
    user_id = current_user['id']
    
    # Debug logging
    print(f"📥 Received job creation request from user {user_id}")
    print(f"📋 Request data: {data}")
    
    # --- Input Validation & Sanitization ---
    errors = {}
    job_title = data.get('job_title', '').strip() if data.get('job_title') else ''
    company_name = data.get('company_name', '').strip() if data.get('company_name') else ''
    status = data.get('status', 'Applied').strip() if data.get('status') else 'Applied'
    location = data.get('location', '').strip() if data.get('location') else ''
    job_url = data.get('job_url', '').strip() if data.get('job_url') else ''
    notes = data.get('notes', '').strip() if data.get('notes') else ''
    application_date = data.get('application_date')

    if not job_title or not isinstance(job_title, str) or len(job_title) == 0 or len(job_title) > 100:
        errors['job_title'] = "Job title is required and must be a string up to 100 characters."
    if not company_name or not isinstance(company_name, str) or len(company_name) == 0 or len(company_name) > 100:
        errors['company_name'] = "Company name is required and must be a string up to 100 characters."
    if not isinstance(status, str) or len(status) > 50:
        errors['status'] = "Status must be a string up to 50 characters."
    if location and (not isinstance(location, str) or len(location) > 100):
        errors['location'] = "Location must be a string up to 100 characters."
    if job_url:
        if not isinstance(job_url, str) or len(job_url) > 2048:
            errors['job_url'] = "Job URL must be a string up to 2048 characters."
        elif job_url:  # Only validate if URL is not empty
            import re
            # Auto-prepend https:// if no protocol is specified
            if not re.match(r'^https?://', job_url):
                job_url = 'https://' + job_url
            # Validate the URL format
            if not re.match(r'^https?://[^\s]+', job_url):
                errors['job_url'] = "Job URL must be a valid URL format."
    
    if errors:
        print(f"❌ Validation errors: {errors}")
        return jsonify({"error": "Validation failed", "details": errors}), 400
    
    print(f"✅ Validation passed, creating job with data:")
    print(f"   - job_title: {job_title}")
    print(f"   - company_name: {company_name}")
    print(f"   - status: {status}")
    print(f"   - application_date: {application_date}")
    print(f"   - location: {location}")
    print(f"   - job_url: {job_url}")
    print(f"   - notes: {notes}")
    # --- End Validation ---

    try:
        conn, cursor = get_db()
        
        sql = """
            INSERT INTO job_applications
            (user_id, job_title, company_name, application_date, status, job_url, notes, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        values = (user_id, job_title, company_name, application_date, status, job_url, notes, location)
        cursor.execute(sql, values)
        new_job_id = cursor.lastrowid
        
        # Add initial status history entry
        add_status_history(cursor, new_job_id, None, status, user_id)
        
        cursor.execute("SELECT * FROM job_applications WHERE id = ?", (new_job_id,))
        new_job = cursor.fetchone()
        
        # Convert datetime objects to ISO format
        if new_job.get('application_date'):
            new_job['application_date'] = new_job['application_date'].isoformat()
        if new_job.get('created_at'):
            new_job['created_at'] = new_job['created_at'].isoformat()
        if new_job.get('updated_at'):
            new_job['updated_at'] = new_job['updated_at'].isoformat()

        conn.commit()
        conn.close()
        return jsonify(new_job), 201
    except mariadb.Error as e:
        print(f"Database error creating job: {e}")
        return jsonify({"error": "Failed to create job application due to a database error"}), 500
    except Exception as e:
        print(f"Unexpected error creating job: {e}")
        return jsonify({"error": "An unexpected error occurred while creating the job"}), 500

@jobs_bp.route("/jobs", methods=["GET"])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def get_jobs(current_user):
    user_id = current_user['id']
    is_admin = current_user.get('role') == 'admin'
    
    # Check if admin wants to see all jobs (optional query parameter)
    show_all = request.args.get('all', 'false').lower() == 'true'
    
    try:
        conn, cursor = get_db()
        
        if is_admin and show_all:
            # Admin can optionally see all jobs from all users
            cursor.execute("""
                SELECT ja.*, u.username as user_name 
                FROM job_applications ja 
                LEFT JOIN users u ON ja.user_id = u.id 
                ORDER BY ja.created_at DESC
            """)
        else:
            # Regular behavior - only user's own jobs
            cursor.execute("SELECT * FROM job_applications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        
        jobs = cursor.fetchall()
        
        # Convert datetime objects to ISO format
        for job in jobs:
            if job.get('application_date'):
                job['application_date'] = job['application_date'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
            if job.get('updated_at'):
                job['updated_at'] = job['updated_at'].isoformat()
                
        return jsonify(jobs)
    except mariadb.Error as e:
        print(f"Database error getting jobs: {e}")
        return jsonify({"error": "Failed to retrieve job applications"}), 500
    except Exception as e:
        print(f"Unexpected error getting jobs: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/jobs/<int:job_id>", methods=["GET"])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def get_job(current_user, job_id):
    user_id = current_user['id']
    is_admin = current_user.get('role') == 'admin'
    try:
        conn, cursor = get_db()
        # Admin can access any job, regular users can only access their own
        if is_admin:
            cursor.execute("SELECT * FROM job_applications WHERE id = ?", (job_id,))
        else:
            cursor.execute("SELECT * FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
        job = cursor.fetchone()
        if job:
            if job.get('application_date'):
                job['application_date'] = job['application_date'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
            if job.get('updated_at'):
                job['updated_at'] = job['updated_at'].isoformat()
            return jsonify(job)
        else:
            return jsonify({"error": "Job application not found or access denied"}), 404
    except mariadb.Error as e:
        print(f"Database error getting job {job_id}: {e}")
        return jsonify({"error": "Failed to retrieve job application"}), 500
    except Exception as e:
        print(f"Unexpected error getting job {job_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/jobs/<int:job_id>", methods=["PUT"])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def update_job(current_user, job_id):
    user_id = current_user['id']
    is_admin = current_user.get('role') == 'admin'
    data = await request.json

    # Basic validation
    errors = {}
    if 'job_title' in data and (not isinstance(data['job_title'], str) or len(data['job_title']) > 100):
        errors['job_title'] = "Job title must be a string up to 100 characters."
    if 'company_name' in data and (not isinstance(data['company_name'], str) or len(data['company_name']) > 100):
        errors['company_name'] = "Company name must be a string up to 100 characters."
    if 'status' in data and (not isinstance(data['status'], str) or len(data['status']) > 50):
        errors['status'] = "Status must be a string up to 50 characters."
    if 'location' in data and (not isinstance(data['location'], str) or len(data['location']) > 100):
        errors['location'] = "Location must be a string up to 100 characters."
    if 'job_url' in data and data['job_url']:
        if not isinstance(data['job_url'], str) or len(data['job_url']) > 2048:
             errors['job_url'] = "Job URL must be a string up to 2048 characters."
        else:
            # Simple regex to check for a plausible URL format
            import re
            if not re.match(r'^https?://', data['job_url']):
                errors['job_url'] = "Job URL must be a valid URL (e.g., http://...)."

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    allowed_fields = ['job_title', 'company_name', 'application_date', 'status', 'job_url', 'notes', 'location']
    update_fields = {}
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No valid fields provided for update"}), 400

    set_clause = ", ".join([f"{field} = ?" for field in update_fields])
    values = list(update_fields.values())
    values.append(job_id)

    try:
        conn, cursor = get_db()
        # Fetch the job to check ownership
        cursor.execute("SELECT user_id, status FROM job_applications WHERE id = ?", (job_id,))
        current_job = cursor.fetchone()
        if not current_job:
            return jsonify({"error": "Job application not found"}), 404

        # Authorization check: must be owner or admin
        if current_job['user_id'] != user_id and not is_admin:
            return jsonify({"error": "Access denied"}), 403

        # If status is being updated, track status change
        if 'status' in update_fields:
            # Track status change if status is different
            old_status = current_job['status']
            new_status = update_fields['status']
            if old_status != new_status:
                # Use the ID of the user performing the change
                add_status_history(cursor, job_id, old_status, new_status, user_id)

        # Build and execute the update query
        sql = f"UPDATE job_applications SET {set_clause} WHERE id = ?"
        cursor.execute(sql, tuple(values))

        if cursor.rowcount == 0:
            # This can happen if the submitted data is the same as the existing data
            conn.close()
            return jsonify({"message": "No changes detected or applied"}), 200

        # Fetch and return the updated job
        cursor.execute("SELECT * FROM job_applications WHERE id = ?", (job_id,))
        updated_job = cursor.fetchone()
        if updated_job.get('application_date'):
            updated_job['application_date'] = updated_job['application_date'].isoformat()
        if updated_job.get('created_at'):
            updated_job['created_at'] = updated_job['created_at'].isoformat()
        if updated_job.get('updated_at'):
            updated_job['updated_at'] = updated_job['updated_at'].isoformat()

        conn.commit()
        conn.close()
        return jsonify(updated_job)
    except mariadb.Error as e:
        # Log the detailed error for debugging
        print(f"Database error updating job {job_id}: {e}")
        # Return a generic error message to the client
        return jsonify({"error": "Failed to update job application due to a database error"}), 500
    except Exception as e:
        # Log the detailed error for debugging
        print(f"Unexpected error updating job {job_id}: {e}")
        # Return a generic error message to the client
        return jsonify({"error": "An unexpected error occurred while updating the job"}), 500

@jobs_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def delete_job(current_user, job_id):
    user_id = current_user['id']
    is_admin = current_user.get('role') == 'admin'
    try:
        conn, cursor = get_db()

        # First, verify ownership or admin status
        cursor.execute("SELECT user_id FROM job_applications WHERE id = ?", (job_id,))
        job = cursor.fetchone()

        if not job:
            return jsonify({"error": "Job application not found"}), 404

        if job['user_id'] != user_id and not is_admin:
            return jsonify({"error": "Access denied"}), 403

        # If authorized, proceed with deletion
        cursor.execute("DELETE FROM job_applications WHERE id = ?", (job_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            return jsonify({"message": "Job application deleted successfully"})
        else:
            # This case should ideally not be reached if the above checks pass
            conn.close()
            return jsonify({"error": "Deletion failed unexpectedly"}), 500
            
    except mariadb.Error as e:
        print(f"Database error deleting job {job_id}: {e}")
        return jsonify({"error": "Failed to delete job application"}), 500
    except Exception as e:
        print(f"Unexpected error deleting job {job_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

def add_status_history(cursor, job_id, from_status, to_status, user_id, notes=None):
    """Add a status change entry to the history table"""
    try:
        # Ensure the table exists
        ensure_status_history_table(cursor)
        
        cursor.execute("""
            INSERT INTO job_status_history (job_id, from_status, to_status, created_by, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (job_id, from_status, to_status, user_id, notes))
        return True
    except mariadb.Error as e:
        print(f"Error adding status history: {e}")
        return False

@jobs_bp.route('/status-history/<int:job_id>', methods=['GET'])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def get_job_status_history(current_user, job_id):
    """Get status history for a specific job"""
    try:
        conn, cursor = get_db()
        
        # Ensure the table exists
        ensure_status_history_table(cursor)
        
        # Verify user owns this job or is admin
        is_admin = current_user.get('role') == 'admin'
        if is_admin:
            cursor.execute("SELECT id FROM job_applications WHERE id = ?", (job_id,))
        else:
            cursor.execute("SELECT id FROM job_applications WHERE id = ? AND user_id = ?", (job_id, current_user['id']))
        
        if not cursor.fetchone():
            return jsonify({"error": "Job not found or access denied"}), 404
        
        # Get status history
        cursor.execute("""
            SELECT jsh.id, jsh.from_status, jsh.to_status, jsh.changed_at, jsh.notes,
                   u.username as changed_by
            FROM job_status_history jsh
            LEFT JOIN users u ON jsh.created_by = u.id
            WHERE jsh.job_id = ?
            ORDER BY jsh.changed_at ASC
        """, (job_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'id': row['id'],
                'from_status': row['from_status'],
                'to_status': row['to_status'],
                'changed_at': row['changed_at'].isoformat() if row['changed_at'] else None,
                'notes': row['notes'],
                'changed_by': row['changed_by']
            })
        
        conn.close()
        return jsonify(history), 200
        
    except mariadb.Error as e:
        print(f"Database error getting status history: {e}")
        return jsonify({"error": "Failed to get status history"}), 500
    except Exception as e:
        print(f"Unexpected error getting status history: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route('/analytics/status-flow', methods=['GET'])
@token_required
@set_user_id_in_request
# Rate limiting temporarily disabled
async def get_status_flow_analytics(current_user):
    """Get status flow data for Sankey diagram"""
    try:
        conn, cursor = get_db()
        
        # Ensure the table exists
        ensure_status_history_table(cursor)
        
        # Debug: Get total job count for this user
        cursor.execute("SELECT COUNT(*) as total_jobs FROM job_applications WHERE user_id = ?", (current_user['id'],))
        total_jobs = cursor.fetchone()['total_jobs']
        print(f"🔍 Debug: User {current_user['id']} has {total_jobs} total jobs")
        
        # Clean up any duplicate initial status entries (safety check)
        cursor.execute("""
            DELETE jsh1 FROM job_status_history jsh1
            INNER JOIN job_status_history jsh2 
            WHERE jsh1.id > jsh2.id 
            AND jsh1.job_id = jsh2.job_id 
            AND jsh1.from_status IS NULL 
            AND jsh2.from_status IS NULL 
            AND jsh1.to_status = jsh2.to_status
            AND EXISTS (SELECT 1 FROM job_applications ja WHERE ja.id = jsh1.job_id AND ja.user_id = ?)
        """, (current_user['id'],))
        
        if cursor.rowcount > 0:
            print(f"🔧 Debug: Cleaned up {cursor.rowcount} duplicate initial status entries")
        
        # Get all status transitions for user's jobs
        cursor.execute("""
            SELECT jsh.from_status, jsh.to_status, COUNT(*) as transition_count
            FROM job_status_history jsh
            INNER JOIN job_applications j ON jsh.job_id = j.id
            WHERE j.user_id = ? AND jsh.from_status IS NOT NULL
            GROUP BY jsh.from_status, jsh.to_status
            ORDER BY transition_count DESC
        """, (current_user['id'],))
        
        transitions = []
        for row in cursor.fetchall():
            transitions.append({
                'from_status': row['from_status'],
                'to_status': row['to_status'],
                'count': row['transition_count']
            })
            print(f"🔍 Debug: Transition {row['from_status']} -> {row['to_status']}: {row['transition_count']}")
        
        # Get initial status counts (applications that started with this status)
        cursor.execute("""
            SELECT jsh.to_status as status, COUNT(*) as count
            FROM job_status_history jsh
            INNER JOIN job_applications j ON jsh.job_id = j.id
            WHERE j.user_id = ? AND jsh.from_status IS NULL
            GROUP BY jsh.to_status
        """, (current_user['id'],))
        
        initial_statuses = []
        total_initial = 0
        for row in cursor.fetchall():
            initial_statuses.append({
                'status': row['status'],
                'count': row['count']
            })
            total_initial += row['count']
            print(f"🔍 Debug: Initial status {row['status']}: {row['count']}")
        
        print(f"🔍 Debug: Total initial statuses: {total_initial}")
        print(f"🔍 Debug: Total transitions: {len(transitions)}")
        
        # Debug: Check for duplicate history entries
        cursor.execute("""
            SELECT job_id, COUNT(*) as history_count
            FROM job_status_history jsh
            INNER JOIN job_applications j ON jsh.job_id = j.id
            WHERE j.user_id = ? AND jsh.from_status IS NULL
            GROUP BY job_id
            HAVING COUNT(*) > 1
        """, (current_user['id'],))
        
        duplicates = cursor.fetchall()
        if duplicates:
            print(f"🚨 Debug: Found {len(duplicates)} jobs with multiple initial status entries!")
            for dup in duplicates:
                print(f"   Job ID {dup['job_id']} has {dup['history_count']} initial status entries")
        
        conn.close()
        return jsonify({
            'transitions': transitions,
            'initial_statuses': initial_statuses
        }), 200
        
    except mariadb.Error as e:
        from app.config import Config
        Config.log_error(f"Database error getting status flow analytics: {e}", 'jobs')
        return jsonify({"error": "Failed to get analytics data"}), 500
    except Exception as e:
        from app.config import Config
        Config.log_error(f"Unexpected error getting status flow analytics: {e}", 'jobs')
        return jsonify({"error": "An unexpected error occurred"}), 500