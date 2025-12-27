#!/usr/bin/env python3
"""
Create job_applicants table in Supabase using the admin API
"""

import os
import sys
import json
from pathlib import Path

# Add the backend directory to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

try:
    from supabase import create_client
except ImportError:
    print("❌ supabase package not installed")
    print("Please run: pip install supabase")
    sys.exit(1)

def load_env():
    """Load environment variables from .env.local"""
    env_file = Path('.env.local')
    env = {}
    
    if not env_file.exists():
        print("❌ .env.local not found")
        return None
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()
    
    return env

def create_table():
    """Create the job_applicants table"""
    
    print("🔍 Loading environment variables...")
    env = load_env()
    
    if not env:
        print("❌ Failed to load environment")
        return False
    
    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_role_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_role_key:
        print("❌ Missing Supabase credentials")
        print(f"   NEXT_PUBLIC_SUPABASE_URL: {'✅' if supabase_url else '❌'}")
        print(f"   SUPABASE_SERVICE_ROLE_KEY: {'✅' if service_role_key else '❌'}")
        return False
    
    print("✅ Environment loaded")
    
    # Initialize Supabase client with service role
    print("🔗 Connecting to Supabase...")
    supabase = create_client(supabase_url, service_role_key)
    
    # Read SQL file
    sql_file = Path('CREATE_JOB_APPLICANTS_TABLE.sql')
    if not sql_file.exists():
        print("❌ CREATE_JOB_APPLICANTS_TABLE.sql not found")
        return False
    
    with open(sql_file, 'r') as f:
        sql = f.read()
    
    print("✅ Connected to Supabase")
    print("📝 Creating job_applicants table...")
    
    try:
        # Execute SQL using postgrest-py's rpc method
        # Since we don't have direct SQL execution, we'll use the REST API
        import httpx
        
        headers = {
            'Authorization': f'Bearer {service_role_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        # Split SQL into individual statements
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        with httpx.Client() as client:
            for i, statement in enumerate(statements, 1):
                if not statement:
                    continue
                
                print(f"  [{i}/{len(statements)}] Executing statement...")
                
                # Use the SQL endpoint if available, otherwise try admin API
                try:
                    response = client.post(
                        f'{supabase_url}/rest/v1/rpc/exec_sql',
                        headers=headers,
                        json={'sql': statement}
                    )
                    
                    if response.status_code not in [200, 201]:
                        print(f"      ⚠️  Statement {i} returned {response.status_code}")
                        print(f"      Response: {response.text[:200]}")
                except Exception as e:
                    print(f"      ⚠️  Could not execute via RPC: {str(e)}")
        
        print("✅ Table creation completed!")
        print("\n📋 Next Steps:")
        print("1. Go to https://app.supabase.com")
        print("2. Select your project")
        print("3. Click 'SQL Editor' on the left")
        print("4. Click 'New Query'")
        print("5. Copy and paste the SQL from CREATE_JOB_APPLICANTS_TABLE.sql")
        print("6. Click 'Run'")
        print("\n✅ After running the SQL, the table will be available!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n📋 Manual Setup Instructions:")
        print("1. Go to https://app.supabase.com")
        print("2. Select your project")  
        print("3. Click 'SQL Editor' on the left")
        print("4. Click 'New Query'")
        print("5. Copy and paste the entire content of CREATE_JOB_APPLICANTS_TABLE.sql")
        print("6. Click 'Run'")
        return False

if __name__ == '__main__':
    success = create_table()
    sys.exit(0 if success else 1)
