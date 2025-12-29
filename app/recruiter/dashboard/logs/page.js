'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Activity, Filter, Download, RotateCcw } from 'lucide-react'

export default function ActivityLogsPage() {
  const router = useRouter()
  const { authUser } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterAction, setFilterAction] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])

  const pageSize = 50

  // Check authorization - only admins can view logs
  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      router.push('/candidate/dashboard')
    }
  }, [authUser, router])

  // Fetch logs
  const fetchLogs = async (pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: pageSize,
      })

      if (filterAction !== 'all') {
        params.append('action', filterAction)
      }
      if (filterUser !== 'all') {
        params.append('userId', filterUser)
      }

      const response = await fetch(`/api/debug/activity-logs?${params}`)
      const data = await response.json()

      setLogs(data.logs || [])
      setTotalCount(data.count || 0)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
    setLoading(false)
  }

  // Fetch users for filter
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/debug/users-list')
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [])

  // Initial load
  useEffect(() => {
    if (authUser?.role === 'admin') {
      fetchLogs(1)
    }
  }, [authUser, filterAction, filterUser])

  if (authUser?.role !== 'admin') {
    return null
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getActionColor = (action) => {
    const colors = {
      signup: 'bg-green-100 text-green-800',
      login: 'bg-blue-100 text-blue-800',
      interview_start: 'bg-purple-100 text-purple-800',
      interview_complete: 'bg-green-100 text-green-800',
      job_create: 'bg-orange-100 text-orange-800',
      job_apply: 'bg-yellow-100 text-yellow-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          </div>
          <p className="text-gray-600">Track all user activities: signups, logins, interviews, and more</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Action</label>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Actions</option>
                <option value="signup">Signup</option>
                <option value="login">Login</option>
                <option value="interview_start">Interview Start</option>
                <option value="interview_complete">Interview Complete</option>
                <option value="job_create">Job Created</option>
                <option value="job_apply">Job Applied</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User</label>
              <select
                value={filterUser}
                onChange={(e) => {
                  setFilterUser(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setFilterAction('all')
                setFilterUser('all')
                setPage(1)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
              </div>
              <p className="mt-4 text-gray-600">Loading logs...</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">
                          {log.user?.first_name} {log.user?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{log.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.ip_address || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No activity logs found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <div className="px-4 py-2">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
