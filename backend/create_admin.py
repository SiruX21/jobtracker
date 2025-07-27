#!/usr/bin/env python3
"""
Script to create the first admin user for the Job Tracker system.
Run this script after setting up the database to create your admin account.
"""

import os
import sys
import bcrypt
import mariadb
from datetime import datetime

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def create_admin_user():
    """Create the first admin user"""
    
    print("=== Job Tracker Admin User Setup ===\n")
    
    # Get database configuration from environment
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'auth_db')
    }
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = mariadb.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected to database successfully\n")
        
        # Check if any admin users already exist
        cursor.execute("SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()['admin_count']
        
        if admin_count > 0:
            print(f"⚠️  Warning: {admin_count} admin user(s) already exist.")
            response = input("Do you want to create another admin user? (y/N): ").strip().lower()
            if response != 'y' and response != 'yes':
                print("Admin user creation cancelled.")
                return
        
        # Get admin user details
        print("Please enter the admin user details:")
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        
        # Validate input
        if not username or not email:
            print("❌ Error: Username and email are required.")
            return
        
        # Check if username or email already exists
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
        existing_user = cursor.fetchone()
        if existing_user:
            print("❌ Error: Username or email already exists.")
            return
        
        # Get password (with confirmation)
        import getpass
        while True:
            password = getpass.getpass("Password: ")
            if len(password) < 6:
                print("❌ Error: Password must be at least 6 characters long.")
                continue
            
            password_confirm = getpass.getpass("Confirm Password: ")
            if password != password_confirm:
                print("❌ Error: Passwords do not match.")
                continue
            
            break
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create admin user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, email_verified, role, created_at, updated_at)
            VALUES (?, ?, ?, TRUE, 'admin', ?, ?)
        """, (username, email, password_hash, datetime.now(), datetime.now()))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        print(f"\n✅ Admin user created successfully!")
        print(f"   User ID: {user_id}")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Role: admin")
        print(f"   Email Verified: Yes")
        
        print(f"\n🎉 You can now log in to the admin panel with these credentials.")
        print(f"   Admin Panel: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/admin")
        
    except mariadb.Error as e:
        print(f"❌ Database error: {e}")
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_admin_user()
