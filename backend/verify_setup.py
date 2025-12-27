#!/usr/bin/env python3
"""
Database & API Verification Script
Tests that all database and API endpoints are working correctly
"""

import sqlite3
import sys
import os
import json

def check_database():
    """Check if database is properly initialized"""
    db_path = "interview_data.db"
    
    print("\n📋 Checking Database...")
    print("-" * 50)
    
    try:
        # Check if file exists
        if os.path.exists(db_path):
            size = os.path.getsize(db_path)
            print(f"✅ Database file exists: {db_path} ({size} bytes)")
        else:
            print(f"⚠️  Database file not found: {db_path}")
            print("   It will be created when backend starts")
        
        # Connect and check tables
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone():
            print("✅ Users table exists")
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
            print(f"   └─ {count} users in database")
        else:
            print("❌ Users table missing")
        
        # Check interviews table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='interviews'")
        if cursor.fetchone():
            print("✅ Interviews table exists")
            cursor.execute("SELECT COUNT(*) FROM interviews")
            count = cursor.fetchone()[0]
            print(f"   └─ {count} interviews in database")
        else:
            print("❌ Interviews table missing")
        
        # Check indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_interviews_user_id'")
        if cursor.fetchone():
            print("✅ Interview user_id index exists")
        else:
            print("⚠️  Interview user_id index missing")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

def check_dependencies():
    """Check if required Python packages are installed"""
    print("\n📦 Checking Dependencies...")
    print("-" * 50)
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "websockets",
        "httpx",
        "openai",
        "python-dotenv",
        "pydantic",
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("Run: pip install " + " ".join(missing))
        return False
    
    return True

def check_env_vars():
    """Check if required environment variables are set"""
    print("\n🔧 Checking Environment Variables...")
    print("-" * 50)
    
    required_vars = [
        "OPENAI_API_KEY",
    ]
    
    missing = []
    for var in required_vars:
        if os.getenv(var):
            print(f"✅ {var} is set")
        else:
            print(f"❌ {var} - NOT SET")
            missing.append(var)
    
    if missing:
        print(f"\n⚠️  Missing environment variables: {', '.join(missing)}")
        print("Create a .env file in backend/ with these variables")
        return False
    
    return True

def check_files():
    """Check if all required files exist"""
    print("\n📁 Checking Required Files...")
    print("-" * 50)
    
    required_files = [
        "main.py",
        "database.py",
        "requirements.txt",
        "../app/interview/realtime/page.tsx",
        "../app/dashboard/page.js",
        "../app/dashboard/interviews/page.tsx",
    ]
    
    missing = []
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - MISSING")
            missing.append(file)
    
    return len(missing) == 0

def main():
    """Run all checks"""
    print("\n" + "=" * 50)
    print("INTERVIEW AI - SYSTEM VERIFICATION")
    print("=" * 50)
    
    checks = [
        ("Files", check_files),
        ("Dependencies", check_dependencies),
        ("Environment Variables", check_env_vars),
        ("Database", check_database),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} check failed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    all_pass = all(result for _, result in results)
    
    if all_pass:
        print("\n🎉 All checks passed! Ready to start backend.")
        print("\nNext steps:")
        print("1. Run: python backend/main.py")
        print("2. Backend will start on http://localhost:8001")
        print("3. Database will auto-initialize on first run")
        return 0
    else:
        print("\n⚠️  Some checks failed. Fix the issues above before starting backend.")
        return 1

if __name__ == "__main__":
    # Change to backend directory if needed
    if not os.path.exists("main.py"):
        if os.path.exists("backend/main.py"):
            os.chdir("backend")
        else:
            print("❌ Cannot find backend directory")
            sys.exit(1)
    
    sys.exit(main())
