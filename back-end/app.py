from flask import Flask, request, jsonify
from flask_cors import CORS
import mariadb
import hashlib
import jwt
import datetime
import os
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)


app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
if not app.config['SECRET_KEY']:
    raise ValueError("No SECRET_KEY set for Flask application")


db_conn = None
db_cursor = None
try:
    db_conn = mariadb.connect(
        user="root",
        password="example",
        host="db",
        port=3306,
        database="auth_db",
        autocommit=True
    )
    db_cursor = db_conn.cursor(dictionary=True)
    print("Database connection successful")
except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
    exit(1)


try:
    db_cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
    """)
    print("Users table checked/created successfully.")

    db_cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        job_title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        application_date DATE,
        status VARCHAR(50) DEFAULT 'Applied',
        job_url TEXT,
        notes TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    print("Job applications table checked/created successfully.")

except mariadb.Error as e:
    print(f"Error during table creation: {e}")
    exit(1)


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
    except Exception as e:
        print(f"Error generating token: {e}")
        return None


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
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            db_cursor.execute("SELECT * FROM users WHERE id = ?", (data['sub'],))
            current_user = db_cursor.fetchone()
            if not current_user:
                 return jsonify({"message": "Token is invalid or user not found"}), 401
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


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    if "@" not in username:
         return jsonify({"error": "Invalid email format for username"}), 400

    hashed_password = hash_password(password)
    try:
        db_cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed_password))
        return jsonify({"message": "User registered successfully"}), 201
    except mariadb.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    except mariadb.Error as e:
        print(f"Database error during registration: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    except Exception as e:
        print(f"Unexpected error during registration: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    try:
        db_cursor.execute("SELECT id, password_hash FROM users WHERE username=?", (username,))
        user = db_cursor.fetchone()

        if user and user['password_hash'] == hash_password(password):
            token = generate_token(user['id'])
            if token:
                return jsonify({"token": token})
            else:
                return jsonify({"error": "Failed to generate authentication token"}), 500
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except mariadb.Error as e:
        print(f"Database error during login: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    except Exception as e:
        print(f"Unexpected error during login: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route("/jobs", methods=["POST"])
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
        sql = """
            INSERT INTO job_applications
            (user_id, job_title, company_name, application_date, status, job_url, notes, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        values = (user_id, job_title, company_name, application_date, status, job_url, notes, location)
        db_cursor.execute(sql, values)
        new_job_id = db_cursor.lastrowid
        db_cursor.execute("SELECT * FROM job_applications WHERE id = ?", (new_job_id,))
        new_job = db_cursor.fetchone()
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


@app.route("/jobs", methods=["GET"])
@token_required
def get_jobs(current_user):
    user_id = current_user['id']
    try:
        db_cursor.execute("SELECT * FROM job_applications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        jobs = db_cursor.fetchall()
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


@app.route("/jobs/<int:job_id>", methods=["GET"])
@token_required
def get_job(current_user, job_id):
    user_id = current_user['id']
    try:
        db_cursor.execute("SELECT * FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
        job = db_cursor.fetchone()
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


@app.route("/jobs/<int:job_id>", methods=["PUT"])
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
        sql = f"UPDATE job_applications SET {set_clause} WHERE id = ? AND user_id = ?"
        db_cursor.execute(sql, tuple(values))

        if db_cursor.rowcount == 0:
            db_cursor.execute("SELECT id FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
            if not db_cursor.fetchone():
                 return jsonify({"error": "Job application not found or access denied"}), 404
            else:
                 return jsonify({"message": "No changes detected or applied"}), 200

        db_cursor.execute("SELECT * FROM job_applications WHERE id = ?", (job_id,))
        updated_job = db_cursor.fetchone()
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


@app.route("/jobs/<int:job_id>", methods=["DELETE"])
@token_required
def delete_job(current_user, job_id):
    user_id = current_user['id']
    try:
        db_cursor.execute("DELETE FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
        if db_cursor.rowcount > 0:
            return jsonify({"message": "Job application deleted successfully"})
        else:
            db_cursor.execute("SELECT id FROM job_applications WHERE id = ? AND user_id = ?", (job_id, user_id))
            if not db_cursor.fetchone():
                 return jsonify({"error": "Job application not found or access denied"}), 404
            else:
                 return jsonify({"error": "Deletion failed unexpectedly"}), 500
    except mariadb.Error as e:
        print(f"Database error deleting job {job_id}: {e}")
        return jsonify({"error": "Failed to delete job application"}), 500
    except Exception as e:
        print(f"Unexpected error deleting job {job_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


@app.teardown_appcontext
def close_db(exception=None):
    global db_cursor, db_conn
    if db_cursor:
        try:
            db_cursor.close()
            print("Database cursor closed.")
        except mariadb.Error as e:
            print(f"Error closing cursor: {e}")
        db_cursor = None
    if db_conn:
        try:
            db_conn.close()
            print("Database connection closed.")
        except mariadb.Error as e:
            print(f"Error closing connection: {e}")
        db_conn = None