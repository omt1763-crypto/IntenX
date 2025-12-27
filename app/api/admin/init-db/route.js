import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    console.log('🔧 Initializing database schema...')

    // Try to create table using raw SQL via Supabase Admin
    // This won't work with the JS client directly, so we'll check if table exists
    // and provide instructions

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count(*)', { count: 'exact' })
      .limit(1)

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist - we need to create it
      console.log('⚠️ Users table does not exist')

      // Unfortunately, Supabase JS client cannot execute raw CREATE TABLE
      // But we can use their REST API with admin key
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `

      return NextResponse.json({
        status: 'error',
        message: 'Users table does not exist',
        action: 'Please create the table manually in Supabase SQL Editor',
        sql: createTableSQL,
        instructions: [
          '1. Go to https://app.supabase.com',
          '2. Select project: efiurfmrgyisldruqbad',
          '3. SQL Editor → New Query',
          '4. Copy the SQL above',
          '5. Paste & Run'
        ]
      }, { status: 400 })
    } else if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message
      }, { status: 500 })
    } else {
      // Table exists
      return NextResponse.json({
        status: 'success',
        message: 'Users table exists and is ready!',
        ready: true
      })
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}
