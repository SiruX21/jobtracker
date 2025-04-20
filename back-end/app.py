from flask import Flask, request, jsonify
import mariadb
import hashlib

app = Flask(__name__)

# DB connection
conn = mariadb.connect(
    user="root",
    password="example",
    host="db",
    port=3306,
    database="auth_db"
)
cur = conn.cursor()

# Init table
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT
)
""")
conn.commit()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    try:
        cur.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hash_password(password)))
        conn.commit()
        return jsonify({"message": "User registered"}), 201
    except mariadb.IntegrityError:
        return jsonify({"error": "User already exists"}), 409

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    cur.execute("SELECT password_hash FROM users WHERE username=?", (username,))
    row = cur.fetchone()
    if row and row[0] == hash_password(password):
        return jsonify({"message": "Login successful"})
    return jsonify({"error": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
