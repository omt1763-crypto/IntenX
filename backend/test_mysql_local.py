#!/usr/bin/env python3
"""
Test XAMPP MySQL Connection
Verifies MySQL is running and interview tables are ready
"""

import mysql.connector
from mysql.connector import Error
import sys
import os
from dotenv import load_dotenv

# Load environment
load_dotenv(".env.local")

def test_mysql_connection():
    """Test MySQL connection and tables"""
    
    print("\n" + "="*60)
    print("XAMPP MySQL Connection Test")
    print("="*60)
    
    # Get config
    config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "interview_user"),
        "password": os.getenv("DB_PASSWORD", "interview_password_123"),
        "database": os.getenv("DB_NAME", "interviewverse_db"),
        "port": int(os.getenv("DB_PORT", "3306")),
    }
    
    print("\n📋 Configuration:")
    print(f"  Host: {config['host']}")
    print(f"  User: {config['user']}")
    print(f"  Database: {config['database']}")
    print(f"  Port: {config['port']}")
    
    # Test connection
    print("\n🔗 Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**config)
        
        if conn.is_connected():
            db_info = conn.get_server_info()
            print(f"✅ Connected to MySQL Server version {db_info}")
        else:
            print("❌ Connection failed")
            return False
            
    except Error as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test tables
    print("\n📊 Checking Tables...")
    try:
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✅ Users table: {user_count} records")
        
        # Check interviews table
        cursor.execute("SELECT COUNT(*) FROM interviews")
        interview_count = cursor.fetchone()[0]
        print(f"✅ Interviews table: {interview_count} records")
        
        # Show sample interview if exists
        if interview_count > 0:
            cursor.execute("SELECT id, title, duration FROM interviews ORDER BY created_at DESC LIMIT 1")
            interview = cursor.fetchone()
            if interview:
                print(f"\n📌 Latest Interview:")
                print(f"   ID: {interview[0]}")
                print(f"   Title: {interview[1]}")
                print(f"   Duration: {interview[2]}s")
        
        cursor.close()
        
    except Error as e:
        print(f"❌ Table check failed: {e}")
        return False
    finally:
        conn.close()
    
    print("\n" + "="*60)
    print("✅ All checks passed! MySQL is ready.")
    print("="*60)
    print("\nNext steps:")
    print("1. Start XAMPP MySQL (if not already running)")
    print("2. Run: python backend/main.py")
    print("3. Open: http://localhost:3000")
    print("4. Complete an interview")
    print("5. Check http://localhost/phpmyadmin to see data")
    
    return True

if __name__ == "__main__":
    try:
        success = test_mysql_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
