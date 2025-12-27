'use client'

import { useState } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'

export default function ResetDatabasePage() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleReset = async () => {
    if (!confirmed) {
      alert('Please check the confirmation box first')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
      setConfirmed(false)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-red-900 mb-2">🗑️ Reset Database</h1>
          <p className="text-red-700">Warning: This action cannot be undone</p>
        </div>

        {/* Warning Box */}
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6 mb-8">
          <div className="flex gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ This will permanently delete:</h2>
              <ul className="space-y-2 text-red-800">
                <li>✗ All users</li>
                <li>✗ All jobs</li>
                <li>✗ All applicants</li>
                <li>✗ All interviews</li>
                <li>✗ All candidate profiles</li>
                <li>✗ All recruiter stats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Confirm Reset</h3>
          
          <label className="flex items-center gap-3 mb-8 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded"
            />
            <span className="text-gray-700">
              I understand this will delete ALL data and cannot be undone
            </span>
          </label>

          <button
            onClick={handleReset}
            disabled={!confirmed || isResetting}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
              confirmed && !isResetting
                ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            {isResetting ? 'Resetting...' : 'Reset Database Now'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-8 ${
            result.success 
              ? 'bg-green-50 border-2 border-green-400' 
              : 'bg-red-50 border-2 border-red-400'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ Reset Successful!' : '❌ Reset Failed'}
            </h3>
            
            {result.success && (
              <div>
                <p className={`mb-6 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                <div className="bg-white rounded p-4 mb-6 space-y-2">
                  <h4 className="font-bold text-gray-900">Next Steps:</h4>
                  {result.nextSteps?.map((step: string, i: number) => (
                    <p key={i} className="text-gray-700">
                      {i + 1}. {step}
                    </p>
                  ))}
                </div>
                <a
                  href="/signup"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all"
                >
                  Go to Signup →
                </a>
              </div>
            )}
            
            {!result.success && (
              <p className="text-red-800">{result.error}</p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-8">
          <h4 className="font-bold text-blue-900 mb-2">📊 Check Your Data</h4>
          <ul className="space-y-2 text-blue-800">
            <li>• <a href="/debug/data" className="underline hover:text-blue-600">View all data</a></li>
            <li>• <a href="/debug/recruiter" className="underline hover:text-blue-600">View recruiter data</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
