from flask import Blueprint, request, jsonify
import mariadb
import random
from app import get_db
from app.routes.auth import token_required

jobs_bp = Blueprint('jobs', __name__)

def generate_random_color():
    """Generate a random color code for new statuses"""
    colors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', 
        '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
        '#14B8A6', '#EAB308', '#DC2626', '#7C3AED', '#059669',
        '#DB2777', '#65A30D', '#EA580C', '#4F46E5', '#0D9488'
    ]
    return random.choice(colors)

def ensure_status_exists(cursor, status_name):
    """Ensure a status exists in the job_statuses table, create if it doesn't"""
    if not status_name:
        return
    
    # Check if status exists
    cursor.execute("SELECT id FROM job_statuses WHERE status_name = ?", (status_name,))
    if not cursor.fetchone():
        # Create new status with random color
        color_code = generate_random_color()
        cursor.execute("""
            INSERT INTO job_statuses (status_name, color_code, is_default) 
            VALUES (?, ?, FALSE)
        """, (status_name, color_code))
        print(f"Created new status: {status_name} with color {color_code}")

@jobs_bp.route("/jobs", methods=["POST"])
@token_required
def create_job(current_user):
    data = request.json
    user_id = current_user['id']
    job_title = data.get('job_title')
    company_name = data.get('company_name')
    application_date = data.get('application_date')
    status = data.get('status', 'Applied')
    job_url = data.get('job_url')
    notes = data.get('notes')
    location = data.get('location')

    if not job_title or not company_name:
        return jsonify({"error": "Job title and company name are required"}), 400

    try:
        conn, cursor = get_db()
        
        # Ensure the status exists in job_statuses table
        ensure_status_exists(cursor, status)
        
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
        return jsonify({"error": "Failed to create job application"}), 500
    except Exception as e:
        print(f"Unexpected error creating job: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/jobs", methods=["GET"])
@token_required
def get_jobs(current_user):
    user_id = current_user['id']
    try:
        conn, cursor = get_db()
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
def get_job(current_user, job_id):
    user_id = current_user['id']
    try:
        conn, cursor = get_db()
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
def update_job(current_user, job_id):
    user_id = current_user['id']
    data = request.json

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
    values.append(user_id)

    try:
        conn, cursor = get_db()
        
        # Get current job data to check for status changes
        cursor.execute("SELECT * FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
        current_job = cursor.fetchone()
        
        if not current_job:
            return jsonify({"error": "Job application not found or access denied"}), 404
        
        # If status is being updated, ensure it exists in job_statuses table
        if 'status' in update_fields:
            ensure_status_exists(cursor, update_fields['status'])
            
            # Track status change if status is different
            old_status = current_job['status']
            new_status = update_fields['status']
            if old_status != new_status:
                add_status_history(cursor, job_id, old_status, new_status, user_id)
        
        sql = f"UPDATE job_applications SET {set_clause} WHERE id = ? AND user_id = ?"
        cursor.execute(sql, tuple(values))

        if cursor.rowcount == 0:
            return jsonify({"message": "No changes detected or applied"}), 200

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
        print(f"Database error updating job {job_id}: {e}")
        return jsonify({"error": "Failed to update job application"}), 500
    except Exception as e:
        print(f"Unexpected error updating job {job_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@token_required
def delete_job(current_user, job_id):
    user_id = current_user['id']
    try:
        conn, cursor = get_db()
        cursor.execute("DELETE FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
        if cursor.rowcount > 0:
            return jsonify({"message": "Job application deleted successfully"})
        else:
            cursor.execute("SELECT id FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
            if not cursor.fetchone():
                return jsonify({"error": "Job application not found or access denied"}), 404
            else:
                return jsonify({"error": "Deletion failed unexpectedly"}), 500
    except mariadb.Error as e:
        print(f"Database error deleting job {job_id}: {e}")
        return jsonify({"error": "Failed to delete job application"}), 500
    except Exception as e:
        print(f"Unexpected error deleting job {job_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/job-statuses", methods=["GET"])
@token_required
def get_job_statuses(current_user):
    """Get all available job statuses with their colors"""
    try:
        conn, cursor = get_db()
        cursor.execute("""
            SELECT status_name, color_code, is_default 
            FROM job_statuses 
            ORDER BY is_default DESC, status_name ASC
        """)
        statuses = cursor.fetchall()
        
        return jsonify({
            "statuses": statuses
        }), 200
    except mariadb.Error as e:
        print(f"Database error getting job statuses: {e}")
        return jsonify({"error": "Failed to fetch job statuses"}), 500
    except Exception as e:
        print(f"Unexpected error getting job statuses: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/job-statuses", methods=["POST"])
@token_required
def create_job_status(current_user):
    """Create a new job status with auto-generated color"""
    data = request.json
    status_name = data.get('status_name', '').strip()
    custom_color = data.get('color_code')
    
    if not status_name:
        return jsonify({"error": "Status name is required"}), 400
    
    # Generate color if not provided
    color_code = custom_color if custom_color else generate_random_color()
    
    try:
        conn, cursor = get_db()
        
        # Check if status already exists
        cursor.execute("SELECT id FROM job_statuses WHERE status_name = ?", (status_name,))
        if cursor.fetchone():
            return jsonify({"error": "Status already exists"}), 409
        
        # Insert new status
        cursor.execute("""
            INSERT INTO job_statuses (status_name, color_code, is_default) 
            VALUES (?, ?, FALSE)
        """, (status_name, color_code))
        
        return jsonify({
            "message": "Status created successfully",
            "status": {
                "status_name": status_name,
                "color_code": color_code,
                "is_default": False
            }
        }), 201
    except mariadb.Error as e:
        print(f"Database error creating job status: {e}")
        return jsonify({"error": "Failed to create job status"}), 500
    except Exception as e:
        print(f"Unexpected error creating job status: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/job-statuses/<status_name>", methods=["GET"])
@token_required
def get_job_status_color(current_user, status_name):
    """Get a specific job status color"""
    try:
        conn, cursor = get_db()
        cursor.execute("""
            SELECT status_name, color_code, is_default 
            FROM job_statuses 
            WHERE status_name = ?
        """, (status_name,))
        status = cursor.fetchone()
        
        if status:
            return jsonify(status), 200
        else:
            return jsonify({"error": "Status not found"}), 404
    except mariadb.Error as e:
        print(f"Database error getting job status: {e}")
        return jsonify({"error": "Failed to fetch job status"}), 500
    except Exception as e:
        print(f"Unexpected error getting job status: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@jobs_bp.route("/job-statuses/<status_name>", methods=["PUT"])
@token_required
def update_job_status(current_user, status_name):
    """Update a job status color"""
    data = request.json
    new_color = data.get('color_code')
    
    if not new_color:
        return jsonify({"error": "Color code is required"}), 400
    
    try:
        conn, cursor = get_db()
        
        # Update status color
        cursor.execute("""
            UPDATE job_statuses 
            SET color_code = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE status_name = ?
        """, (new_color, status_name))
        
        if cursor.rowcount > 0:
            return jsonify({"message": "Status color updated successfully"}), 200
        else:
            return jsonify({"error": "Status not found"}), 404
    except mariadb.Error as e:
        print(f"Database error updating job status: {e}")
        return jsonify({"error": "Failed to update job status"}), 500
    except Exception as e:
        print(f"Unexpected error updating job status: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

def add_status_history(cursor, job_id, from_status, to_status, user_id, notes=None):
    """Add a status change entry to the history table"""
    try:
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
def get_job_status_history(current_user, job_id):
    """Get status history for a specific job"""
    try:
        conn, cursor = get_db()
        
        # Verify user owns this job
        cursor.execute("""
            SELECT id FROM jobs WHERE id = ? AND user_id = ?
        """, (job_id, current_user['id']))
        
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
def get_status_flow_analytics(current_user):
    """Get status flow data for Sankey diagram"""
    try:
        conn, cursor = get_db()
        
        # Get all status transitions for user's jobs
        cursor.execute("""
            SELECT jsh.from_status, jsh.to_status, COUNT(*) as transition_count
            FROM job_status_history jsh
            INNER JOIN jobs j ON jsh.job_id = j.id
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
        
        # Get initial status counts (applications that started with this status)
        cursor.execute("""
            SELECT jsh.to_status as status, COUNT(*) as count
            FROM job_status_history jsh
            INNER JOIN jobs j ON jsh.job_id = j.id
            WHERE j.user_id = ? AND jsh.from_status IS NULL
            GROUP BY jsh.to_status
        """, (current_user['id'],))
        
        initial_statuses = []
        for row in cursor.fetchall():
            initial_statuses.append({
                'status': row['status'],
                'count': row['count']
            })
        
        conn.close()
        return jsonify({
            'transitions': transitions,
            'initial_statuses': initial_statuses
        }), 200
        
    except mariadb.Error as e:
        print(f"Database error getting status flow analytics: {e}")
        return jsonify({"error": "Failed to get analytics data"}), 500
    except Exception as e:
        print(f"Unexpected error getting status flow analytics: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500