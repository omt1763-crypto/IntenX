'use client'

import { useEffect, useState } from 'react'

export default function StatusPage() {
  const [status, setStatus] = useState({
    loading: true,
    env: null,
    connection: null,
    table: null,
    ready: false
  })

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/admin/status')
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
    }

    checkStatus()
  }, [])

  if (status.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🔍 Authentication Setup Status
          </h1>
          <p className="text-slate-600">Complete system diagnostics</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Environment */}
          <div
            className={`p-6 rounded-lg border-2 ${
              status.env?.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg mb-2">Environment Variables</h2>
                <div className="text-sm space-y-1">
                  <p className="text-slate-600">
                    {status.env?.ok ? '✅ All variables set' : '❌ ' + status.env?.message}
                  </p>
                </div>
              </div>
              <span className="text-3xl">{status.env?.ok ? '✅' : '❌'}</span>
            </div>
          </div>

          {/* Supabase Connection */}
          <div
            className={`p-6 rounded-lg border-2 ${
              status.connection?.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg mb-2">Supabase Connection</h2>
                <div className="text-sm space-y-1">
                  <p className="text-slate-600">
                    {status.connection?.ok
                      ? '✅ Connected'
                      : '❌ ' + status.connection?.message}
                  </p>
                </div>
              </div>
              <span className="text-3xl">{status.connection?.ok ? '✅' : '❌'}</span>
            </div>
          </div>

          {/* Users Table */}
          <div
            className={`p-6 rounded-lg border-2 ${
              status.table?.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg mb-2">Users Table</h2>
                <div className="text-sm space-y-1">
                  <p className="text-slate-600">
                    {status.table?.ok
                      ? '✅ Table exists'
                      : '⏳ ' + status.table?.message}
                  </p>
                  {!status.table?.ok && (
                    <p className="text-xs mt-2">
                      Visit <a href="/init-db" className="text-blue-600 hover:underline">
                        /init-db
                      </a>{' '}
                      to create table
                    </p>
                  )}
                </div>
              </div>
              <span className="text-3xl">{status.table?.ok ? '✅' : '⏳'}</span>
            </div>
          </div>

          {/* Overall Status */}
          <div
            className={`p-6 rounded-lg border-2 ${
              status.ready
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg mb-2">Overall Status</h2>
                <div className="text-sm space-y-1">
                  <p className="text-slate-600">
                    {status.ready
                      ? '✅ Ready for testing'
                      : '⏳ Setup in progress'}
                  </p>
                </div>
              </div>
              <span className="text-3xl">{status.ready ? '✅' : '⏳'}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h2 className="font-bold text-lg mb-4">📋 Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-700">
            {status.table?.ok ? (
              <>
                <li>
                  Go to{' '}
                  <a href="/auth/signup" className="text-blue-600 hover:underline">
                    /auth/signup
                  </a>{' '}
                  to test registration
                </li>
                <li>Create an account to verify the signup flow</li>
                <li>
                  Visit{' '}
                  <a href="/auth/login" className="text-blue-600 hover:underline">
                    /auth/login
                  </a>{' '}
                  to test login
                </li>
                <li>Check browser localStorage to verify JWT token storage</li>
              </>
            ) : (
              <>
                <li>
                  Click{' '}
                  <a href="/init-db" className="text-blue-600 hover:underline">
                    here to create the users table
                  </a>
                </li>
                <li>Follow the automatic setup or manual instructions</li>
                <li>Return to this page after table creation</li>
                <li>Then proceed with testing authentication flows</li>
              </>
            )}
          </ol>
        </div>

        {/* Debug Info */}
        {status.debug && (
          <div className="mt-6 bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-auto">
            <p className="font-bold mb-2">Debug Info:</p>
            <pre>{JSON.stringify(status.debug, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
