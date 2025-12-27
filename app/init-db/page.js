'use client'

import { useState } from 'react'

export default function InitDBPage() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const createTable = async () => {
    setStatus('loading')
    setMessage('Creating users table...')

    try {
      const response = await fetch('/api/admin/init-db')
      const data = await response.json()

      if (response.ok && data.ready) {
        setStatus('success')
        setMessage('✅ Users table created successfully!')
      } else {
        setStatus('error')
        setMessage(
          data.message || 'Failed to create table. Please follow the manual instructions below.'
        )
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            🔧 Database Initialization
          </h1>

          <p className="text-slate-600 mb-6">
            Before you can use the authentication system, we need to create the users table in Supabase.
          </p>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : status === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {message}
            </div>
          )}

          {/* Option 1: Automatic */}
          <div className="mb-8 p-6 border-2 border-green-200 rounded-lg bg-green-50">
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              ✅ Option 1: Automatic Setup (Recommended)
            </h2>
            <p className="text-slate-600 mb-4">
              Click the button below and I'll try to create the table automatically.
            </p>
            <button
              onClick={createTable}
              disabled={status === 'loading'}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {status === 'loading' ? '⏳ Creating...' : '🚀 Create Table'}
            </button>
          </div>

          {/* Option 2: Manual */}
          <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              📋 Option 2: Manual Setup
            </h2>
            <p className="text-slate-600 mb-4">
              If the automatic method doesn't work, follow these steps:
            </p>

            <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-4">
              <li>
                Go to{' '}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://app.supabase.com
                </a>
              </li>
              <li>Select project: <strong>efiurfmrgyisldruqbad</strong></li>
              <li>Click <strong>"SQL Editor"</strong> in the left sidebar</li>
              <li>Click blue <strong>"New Query"</strong> button</li>
              <li>Copy the SQL code below</li>
              <li>Paste into the SQL editor</li>
              <li>Click <strong>"Run"</strong> ⚡</li>
            </ol>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">
              <pre>{`CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

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
EXECUTE FUNCTION update_updated_at_column();`}</pre>
            </div>

            <button
              onClick={() => {
                const sql = `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

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
EXECUTE FUNCTION update_updated_at_column();`
                navigator.clipboard.writeText(sql)
                alert('SQL copied to clipboard!')
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              📋 Copy SQL
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> After creating the table, you can test signup at{' '}
              <a href="/auth/signup" className="text-blue-600 hover:underline">
                /auth/signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
