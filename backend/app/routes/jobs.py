from flask import Blueprint, request, jsonify
import mariadb
from app import get_db
from app.routes.auth import token_required

jobs_bp = Blueprint('jobs', __name__)

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
        sql = """
            INSERT INTO job_applications
            (user_id, job_title, company_name, application_date, status, job_url, notes, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        values = (user_id, job_title, company_name, application_date, status, job_url, notes, location)
        cursor.execute(sql, values)
        new_job_id = cursor.lastrowid
        cursor.execute("SELECT * FROM job_applications WHERE id = ?", (new_job_id,))
        new_job = cursor.fetchone()
        
        # Convert datetime objects to ISO format
        if new_job.get('application_date'):
            new_job['application_date'] = new_job['application_date'].isoformat()
        if new_job.get('created_at'):
            new_job['created_at'] = new_job['created_at'].isoformat()
        if new_job.get('updated_at'):
            new_job['updated_at'] = new_job['updated_at'].isoformat()

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
        sql = f"UPDATE job_applications SET {set_clause} WHERE id = ? AND user_id = ?"
        cursor.execute(sql, tuple(values))

        if cursor.rowcount == 0:
            cursor.execute("SELECT id FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
            if not cursor.fetchone():
                return jsonify({"error": "Job application not found or access denied"}), 404
            else:
                return jsonify({"message": "No changes detected or applied"}), 200

        cursor.execute("SELECT * FROM job_applications WHERE id = ?", (job_id,))
        updated_job = cursor.fetchone()
        if updated_job.get('application_date'):
            updated_job['application_date'] = updated_job['application_date'].isoformat()
        if updated_job.get('created_at'):
            updated_job['created_at'] = updated_job['created_at'].isoformat()
        if updated_job.get('updated_at'):
            updated_job['updated_at'] = updated_job['updated_at'].isoformat()

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