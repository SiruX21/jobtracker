#!/usr/bin/env python3
"""
Script to promote existing users to admin role in the Job Tracker system.
Run this script to promote any existing user to admin role.
"""

import os
import sys
import bcrypt
import mariadb
from datetime import datetime

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def create_admin_user():
    """Promote an existing user to admin role"""
    
    print("=== Job Tracker Admin User Promotion ===\n")
    
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
        
        # Get user to promote to admin
        print("Enter the email of the user you want to make admin:")
        email = input("Email: ").strip()
        
        # Validate input
        if not email:
            print("❌ Error: Email is required.")
            return
        
        # Check if user exists
        cursor.execute("SELECT id, username, email, role FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        if not existing_user:
            print("❌ Error: No user found with that email address.")
            print("💡 Tip: The user must already have an account in the system.")
            return
        
        # Check if user is already an admin
        if existing_user['role'] == 'admin':
            print(f"✅ User {existing_user['email']} is already an admin.")
            return
        
        # Confirm promotion
        print(f"\nFound user:")
        print(f"   Username: {existing_user['username']}")
        print(f"   Email: {existing_user['email']}")
        print(f"   Current Role: {existing_user['role']}")
        
        confirm = input(f"\nPromote this user to admin? (y/N): ").strip().lower()
        if confirm != 'y' and confirm != 'yes':
            print("Operation cancelled.")
            return
        
        # Promote user to admin
        cursor.execute("UPDATE users SET role = 'admin' WHERE id = ?", (existing_user['id'],))
        conn.commit()
        
        print(f"\n✅ User promoted to admin successfully!")
        print(f"   User ID: {existing_user['id']}")
        print(f"   Username: {existing_user['username']}")
        print(f"   Email: {existing_user['email']}")
        print(f"   New Role: admin")
        
        print(f"\n🎉 User can now access the admin panel with their existing credentials.")
        print(f"   Admin Panel: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/admin")
        return
        
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
