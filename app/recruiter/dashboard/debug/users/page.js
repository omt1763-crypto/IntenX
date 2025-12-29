'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Users, LogIn, Clock } from 'lucide-react'

export default function UsersDebugPage() {
  const router = useRouter()
  const { authUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Check authorization
  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      router.push('/candidate/dashboard')
    }
  }, [authUser, router])

  // Fetch users
  useEffect(() => {
    if (authUser?.role === 'admin') {
      fetchUsers()
    }
  }, [authUser])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/all-users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }

  if (authUser?.role !== 'admin') {
    return null
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      recruiter: 'bg-blue-100 text-blue-800',
      candidate: 'bg-green-100 text-green-800',
      company: 'bg-purple-100 text-purple-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const getLastLoginAgo = (timestamp) => {
    if (!timestamp) return 'Never logged in'
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return formatDate(timestamp)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          </div>
          <p className="text-gray-600">View all registered users and their last login activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Logged In Today</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter((u) => {
                    if (!u.last_login_at) return false
                    const lastLogin = new Date(u.last_login_at)
                    const today = new Date()
                    return lastLogin.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <LogIn className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Never Logged In</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter((u) => !u.last_login_at).length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
              </div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Login Count</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">
                          {getLastLoginAgo(user.last_login_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.last_login_at ? formatDate(user.last_login_at) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.login_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
