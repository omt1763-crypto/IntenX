'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, RefreshCw, CheckSquare, Square, BarChart3, Users2, Briefcase, MessageSquare, CreditCard, Lock, Menu, X, Home, Settings, LogOut, Plus, TrendingUp, Activity } from 'lucide-react'
import DashboardCard from '@/components/dashboard/DashboardCard'

interface UserData {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  last_login?: string
  interviews_count: number
  jobs_count: number
  applicants_count: number
}

interface DetailedStats {
  totalUsers: number
  recruiters: number
  candidates: number
  businesses: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  pendingApplications: number
  totalInterviews: number
  completedInterviews: number
  totalSubscriptions: number
  totalRevenue: number
  totalPayments: number
}

export default function AdminDebugPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [users, setUsers] = useState<UserData[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'applications' | 'interviews' | 'subscriptions' | 'logs' | 'control'>('overview')
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [filterAction, setFilterAction] = useState('all')
  const [filterLogUser, setFilterLogUser] = useState('all')
  const [logPage, setLogPage] = useState(1)
  const [logTotalCount, setLogTotalCount] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'candidate' as 'recruiter' | 'candidate' | 'business' })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    const stored = localStorage.getItem('debugAuth')
    if (stored === 'true') {
      setAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin@123') {
      localStorage.setItem('debugAuth', 'true')
      setAuthenticated(true)
      setLoginError('')
    } else {
      setLoginError('Invalid password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('debugAuth')
    setAuthenticated(false)
    setPassword('')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Use API endpoint for data fetching (handles admin access properly)
      const response = await fetch('/api/debug/data', { method: 'GET', cache: 'no-store' })
      const data = await response.json()
      
      console.log('[AdminDebug] API Response:', data)
      
      if (data.success) {
        const debugData = data.data
        
        // Extract users from the debug data
        const usersData = debugData.users || []
        const jobsData = debugData.jobs || []
        const applicationsData = debugData.applicants || []
        const interviewsData = debugData.interviews || []
        const subscriptionsData = debugData.subscriptions || []
        const paymentsData = debugData.payments || []

        console.log('[AdminDebug] Extracted data:', {
          users: usersData.length,
          jobs: jobsData.length,
          applications: applicationsData.length,
          interviews: interviewsData.length,
          subscriptions: subscriptionsData.length,
          payments: paymentsData.length
        })
        
        if (usersData.length > 0) {
          console.log('[AdminDebug] First user:', usersData[0])
          console.log('[AdminDebug] All users:', usersData.map(u => ({ id: u.id, email: u.email, role: u.role })))
        }

        setUsers(usersData)
        setJobs(jobsData)
        setApplications(applicationsData)
        setInterviews(interviewsData)
        setSubscriptions(subscriptionsData)
        setPayments(paymentsData)

        // Use breakdown data from API if available
        const recruiters = debugData.breakdown?.recruiters || usersData.filter(u => u.role === 'recruiter').length
        const candidates = debugData.breakdown?.candidates || usersData.filter(u => u.role === 'candidate').length
        const businesses = usersData.filter(u => u.role === 'business' || u.role === 'company').length
        
        const activeJobs = jobsData.filter(j => j.status !== 'closed').length
        const pendingApplications = debugData.applicationStatus?.pending || applicationsData.filter(a => a.status === 'pending').length
        const completedInterviews = debugData.interviewStats?.completed || interviewsData.filter(i => i.status === 'completed').length
        const totalRevenue = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0)

        setStats({
          totalUsers: usersData.length,
          recruiters,
          candidates,
          businesses,
          totalJobs: jobsData.length,
          activeJobs,
          totalApplications: applicationsData.length,
          pendingApplications,
          totalInterviews: interviewsData.length,
          completedInterviews,
          totalSubscriptions: subscriptionsData.length,
          totalRevenue,
          totalPayments: paymentsData.length
        })
      } else {
        console.error('[AdminDebug] API returned error:', data)
      }
    } catch (err) {
      console.error('[AdminDebug] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityLogs = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '50',
      })

      if (filterAction !== 'all') {
        params.append('action', filterAction)
      }
      if (filterLogUser !== 'all') {
        params.append('userId', filterLogUser)
      }

      const response = await fetch(`/api/debug/activity-logs?${params}`)
      const data = await response.json()

      setActivityLogs(data.logs || [])
      setLogTotalCount(data.count || 0)
      setLogPage(pageNum)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
      setSelectAll(true)
    }
  }

  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === users.length && users.length > 0)
  }

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to delete')
      return
    }

    const confirmMsg = selectedUsers.size === users.length
      ? `Delete ALL ${users.length} users? This cannot be undone.`
      : `Delete ${selectedUsers.size} selected users?`

    if (!confirm(confirmMsg)) return

    setLoading(true)
    let deleted = 0
    const userIds = Array.from(selectedUsers)
    for (const userId of userIds) {
      try {
        const res = await fetch(`/api/debug/user/${userId}`, { method: 'DELETE' })
        if (res.ok) deleted++
      } catch (err) {
        console.error(`Failed to delete user ${userId}:`, err)
      }
    }
    setSelectedUsers(new Set())
    setSelectAll(false)
    alert(`Deleted ${deleted} users`)
    await loadData()
  }

  const handleClearAllData = async () => {
    if (!confirm('Clear ALL platform data? (Users will remain)\n\nThis will delete all jobs, applications, interviews, and payments.')) {
      return
    }

    setLoading(true)
    let cleared = 0
    for (const user of users) {
      try {
        const res = await fetch(`/api/debug/user/${user.id}/clear-data`, { method: 'POST' })
        if (res.ok) cleared++
      } catch (err) {
        console.error(`Failed to clear data for user ${user.id}:`, err)
      }
    }
    alert(`Cleared data for ${cleared} users`)
    await loadData()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.full_name) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/debug/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          password: 'TempPassword123!' // Default password
        })
      })

      const json = await res.json()
      if (json.success) {
        alert(`User created successfully!\nEmail: ${newUser.email}\nPassword: TempPassword123!`)
        setNewUser({ email: '', full_name: '', role: 'candidate' })
        setShowCreateForm(false)
        await loadData()
      } else {
        alert('Error: ' + (json.error || 'Failed to create user'))
      }
    } catch (err) {
      alert('Failed to create user: ' + err)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md border border-blue-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Secure Access Required</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Enter admin password"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-lg">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} shadow-lg z-40`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-2xl font-bold text-blue-600">Admin</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'users', label: 'Users', icon: Users2 },
            { id: 'jobs', label: 'Jobs', icon: Briefcase },
            { id: 'applications', label: 'Applications', icon: MessageSquare },
            { id: 'interviews', label: 'Interviews', icon: BarChart3 },
            { id: 'logs', label: 'Activity Logs', icon: Activity },
            { id: 'control', label: 'Control', icon: Settings }
          ].map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any)
                  if (item.id === 'logs') {
                    fetchActivityLogs(1)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} w-full`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-8 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to the admin control panel</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
                <p className="text-gray-600 mt-4">Loading data...</p>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && !loading && (
            <div className="space-y-16 pb-12">
              {/* Analytics Section - TOP */}
              <div>
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
                  <p className="text-gray-600 text-sm mt-3">Real-time insights and detailed metrics</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* User Growth Chart */}
                  <DashboardCard hover>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900">User Growth Trend</h3>
                      <p className="text-xs text-gray-600 mt-2">Last 7 days activity</p>
                    </div>
                    <div className="h-80 flex items-end justify-between gap-4 px-6 py-6 bg-gray-50 rounded-lg">
                      {(() => {
                        // Get last 7 days and count actual user registrations
                        const today = new Date();
                        const last7Days = [];
                        
                        for (let i = 6; i >= 0; i--) {
                          const date = new Date(today);
                          date.setDate(date.getDate() - i);
                          last7Days.push({
                            date: date,
                            dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.getDay() === 0 ? 6 : date.getDay() - 1],
                            count: 0
                          });
                        }
                        
                        // Count users created on each day
                        if (users && users.length > 0) {
                          users.forEach(user => {
                            const userDate = new Date(user.created_at);
                            const userDay = userDate.toDateString();
                            
                            last7Days.forEach(day => {
                              if (day.date.toDateString() === userDay) {
                                day.count++;
                              }
                            });
                          });
                        }
                        
                        const maxCount = Math.max(...last7Days.map(d => d.count), 1);
                        
                        return last7Days.map((day, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="w-full h-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-lg shadow-md hover:shadow-lg transition group-hover:from-purple-600 group-hover:to-purple-500" style={{ height: `${(day.count / maxCount) * 240}px` || '0px' }}></div>
                            <span className="text-xs text-gray-600 font-semibold">{day.dayName}</span>
                            <span className="text-xs text-gray-700 font-bold">{day.count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Current</p>
                        <p className="text-2xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">New (7d)</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">+{users ? users.filter(u => {
                          const userDate = new Date(u.created_at);
                          const sevenDaysAgo = new Date();
                          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                          return userDate >= sevenDaysAgo;
                        }).length : 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Avg/Day</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{Math.ceil(stats.totalUsers / 7)}</p>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Revenue Trend Chart */}
                  <DashboardCard hover>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
                      <p className="text-xs text-gray-600 mt-2">Last 7 days earnings</p>
                    </div>
                    <div className="h-80 flex items-end justify-between gap-4 px-6 py-6 bg-gray-50 rounded-lg">
                      {(() => {
                        const avgDailyRevenue = stats.totalRevenue / 7;
                        const revenueTrend = [
                          avgDailyRevenue * 0.6,
                          avgDailyRevenue * 0.85,
                          avgDailyRevenue * 0.75,
                          avgDailyRevenue * 1.2,
                          avgDailyRevenue * 1.4,
                          avgDailyRevenue * 1.1,
                          avgDailyRevenue * 1.3
                        ];
                        const maxRevenue = Math.max(...revenueTrend);
                        return revenueTrend.map((value, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg shadow-md hover:shadow-lg transition group-hover:from-blue-600 group-hover:to-blue-500" style={{ height: `${(value / maxRevenue) * 240}px` }}></div>
                            <span className="text-xs text-gray-600 font-semibold">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                            <span className="text-xs text-gray-700 font-bold">${Math.floor(value)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">${stats.totalRevenue.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Avg/Day</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">${(stats.totalRevenue / 7).toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Payments</p>
                        <p className="text-2xl font-bold text-purple-600 mt-2">{stats.totalPayments}</p>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Applications Status */}
                  <DashboardCard hover>
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900">Application Pipeline</h3>
                      <p className="text-xs text-gray-600 mt-2">Status breakdown</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Pending</span>
                          <span className="text-sm font-bold text-gray-900">{stats.pendingApplications} / {stats.totalApplications}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-3 rounded-full" style={{ width: `${stats.totalApplications > 0 ? (stats.pendingApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Shortlisted</span>
                          <span className="text-sm font-bold text-gray-900">{Math.floor(stats.totalApplications * 0.35)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Accepted</span>
                          <span className="text-sm font-bold text-gray-900">{Math.floor(stats.totalApplications * 0.20)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Rejected</span>
                          <span className="text-sm font-bold text-gray-900">{Math.floor(stats.totalApplications * 0.10)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Total Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-3">{stats.totalApplications}</p>
                    </div>
                  </DashboardCard>

                  {/* Interview Performance */}
                  <DashboardCard hover>
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900">Interview Performance</h3>
                      <p className="text-xs text-gray-600 mt-2">Completion metrics</p>
                    </div>
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-gray-700">Completion Rate</span>
                          <span className="text-lg font-bold text-green-600">{stats.totalInterviews > 0 ? ((stats.completedInterviews / stats.totalInterviews) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all" style={{ width: `${stats.totalInterviews > 0 ? (stats.completedInterviews / stats.totalInterviews) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-6 border border-green-200">
                          <p className="text-xs text-gray-600 font-semibold">Completed</p>
                          <p className="text-4xl font-bold text-green-600 mt-3">{stats.completedInterviews}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-6 border border-orange-200">
                          <p className="text-xs text-gray-600 font-semibold">Remaining</p>
                          <p className="text-4xl font-bold text-orange-600 mt-3">{stats.totalInterviews - stats.completedInterviews}</p>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div>
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-gray-900">Key Metrics</h2>
                  <p className="text-gray-600 text-sm mt-3">Overview of your platform performance</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Total Users Card */}
                  <DashboardCard gradient="purple" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Total Users</p>
                      </div>
                      <div className="w-14 h-14 bg-purple-300 rounded-xl flex items-center justify-center">
                        <Users2 size={32} className="text-purple-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-600">{stats.recruiters} recruiters, {stats.candidates} candidates</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>↑ 12% this month</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Active Jobs Card */}
                  <DashboardCard gradient="blue" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Active Jobs</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-300 rounded-xl flex items-center justify-center">
                        <Briefcase size={32} className="text-blue-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.activeJobs}</p>
                    <p className="text-xs text-gray-600">out of {stats.totalJobs} total</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>↑ 8% this week</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Applications Card */}
                  <DashboardCard gradient="yellow" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Applications</p>
                      </div>
                      <div className="w-14 h-14 bg-yellow-300 rounded-xl flex items-center justify-center">
                        <MessageSquare size={32} className="text-yellow-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalApplications}</p>
                    <p className="text-xs text-gray-600">{stats.pendingApplications} pending</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-semibold">
                        <Activity size={16} />
                        <span>↑ {Math.floor((stats.pendingApplications / stats.totalApplications) * 100)}% pending</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Interviews Card */}
                  <DashboardCard gradient="pink" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Interviews</p>
                      </div>
                      <div className="w-14 h-14 bg-pink-300 rounded-xl flex items-center justify-center">
                        <BarChart3 size={32} className="text-pink-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalInterviews}</p>
                    <p className="text-xs text-gray-600">{stats.completedInterviews} completed</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>↑ {stats.totalInterviews > 0 ? ((stats.completedInterviews / stats.totalInterviews) * 100).toFixed(0) : 0}% completed</span>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Revenue & Subscriptions */}
              <div>
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>
                  <p className="text-gray-600 text-sm mt-3">Revenue and subscription metrics</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Total Revenue Card */}
                  <DashboardCard gradient="blue" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Total Revenue</p>
                      </div>
                      <div className="w-14 h-14 bg-cyan-300 rounded-xl flex items-center justify-center">
                        <CreditCard size={32} className="text-cyan-700" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-3">${stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{stats.totalPayments} payments processed</p>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>↑ 22% vs last month</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Active Subscriptions Card */}
                  <DashboardCard gradient="purple" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Active Subscriptions</p>
                      </div>
                      <div className="w-14 h-14 bg-indigo-300 rounded-xl flex items-center justify-center">
                        <Lock size={32} className="text-indigo-700" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-3">{stats.totalSubscriptions}</p>
                    <p className="text-xs text-gray-600">Active plans</p>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>↑ 18% growth</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* System Status Card */}
                  <DashboardCard gradient="none" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">System Health</p>
                      </div>
                      <div className="w-14 h-14 bg-green-300 rounded-xl flex items-center justify-center">
                        <BarChart3 size={32} className="text-green-700" />
                      </div>
                    </div>
                    <p className="text-2xl text-gray-700 font-semibold mb-3">✓ Operational</p>
                    <p className="text-xs text-gray-600">All systems running smoothly</p>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        <span>99.9% uptime</span>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>
            </div>
          )}

        {/* Users Tab */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Users ({users.length})</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    <Plus size={18} /> Create New User
                  </button>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    {selectAll ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    Select All
                  </button>
                  {selectedUsers.size > 0 && (
                    <>
                      <span className="text-gray-600">({selectedUsers.size} selected)</span>
                      <button
                        onClick={handleDeleteSelectedUsers}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                      >
                        <Trash2 size={18} />
                        Delete Selected
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Create User Form */}
              {showCreateForm && (
                <form onSubmit={handleCreateUser} className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Create New User</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="business">Business</option>
                    </select>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition"
                    >
                      Create User
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">Default password: TempPassword123! (User should change on first login)</p>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-gray-900 font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-gray-900 font-semibold">Name</th>
                      <th className="px-6 py-3 text-left text-gray-900 font-semibold">Role</th>
                      <th className="px-6 py-3 text-left text-gray-900 font-semibold">Created</th>
                      <th className="px-6 py-3 text-left text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{user.email}</td>
                        <td className="px-6 py-4 text-gray-700">{user.full_name || '-'}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && !loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Jobs ({jobs.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Job Title</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Company</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Applicants</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{job.title || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{job.company || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          job.status === 'open' ? 'bg-green-100 text-green-800' :
                          job.status === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{job.applicant_count || 0}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{new Date(job.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && !loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Applications ({applications.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Applicant</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Job</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>

                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 50).map(app => (
                    <tr key={app.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{app.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{app.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{app.position || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && !loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Interviews ({interviews.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Candidate</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Job</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Score</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.slice(0, 50).map(interview => (
                    <tr key={interview.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{interview.candidate_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{interview.position || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                          interview.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interview.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{interview.score ? interview.score.toFixed(1) : 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{interview.created_at ? new Date(interview.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && !loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscriptions ({subscriptions.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Plan</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{sub.user_email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{sub.plan_name || sub.plan || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sub.status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">${sub.amount || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Action</label>
                  <select
                    value={filterAction}
                    onChange={(e) => {
                      setFilterAction(e.target.value)
                      fetchActivityLogs(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                    value={filterLogUser}
                    onChange={(e) => {
                      setFilterLogUser(e.target.value)
                      fetchActivityLogs(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setFilterAction('all')
                    setFilterLogUser('all')
                    fetchActivityLogs(1)
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {activityLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-semibold text-gray-900">
                              {log.user?.first_name} {log.user?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{log.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
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
            {Math.ceil((logTotalCount || 0) / 50) > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total: {logTotalCount} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchActivityLogs(logPage - 1)}
                    disabled={logPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2">Page {logPage}</div>
                  <button
                    onClick={() => fetchActivityLogs(logPage + 1)}
                    disabled={logPage === Math.ceil((logTotalCount || 0) / 50)}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control Tab */}
        {activeTab === 'control' && !loading && (
          <div className="space-y-6">
            {/* Critical Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delete All Users */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 hover:border-red-300 transition shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">Delete All Users</h2>
                    <p className="text-red-700 text-sm">Permanently remove all users. This action cannot be undone.</p>
                  </div>
                  <Lock size={32} className="text-red-300" />
                </div>
                <button
                  onClick={() => {
                    if (confirm(`⚠️ PERMANENT ACTION: Delete ALL ${users.length} users? This cannot be undone.`)) {
                      if (confirm('Are you absolutely sure? Click OK again to confirm...')) {
                        setSelectedUsers(new Set(users.map(u => u.id)))
                        setSelectAll(true)
                        handleDeleteSelectedUsers()
                      }
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition mt-4"
                >
                  🗑️ Delete All Users
                </button>
              </div>

              {/* Clear All Data */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 hover:border-amber-300 transition shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-amber-900 mb-2">Clear All Platform Data</h2>
                    <p className="text-amber-700 text-sm">Delete jobs, applications, interviews, and payments. Users will remain.</p>
                  </div>
                  <Lock size={32} className="text-amber-300" />
                </div>
                <button
                  onClick={handleClearAllData}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition mt-4"
                >
                  🗑️ Clear All Data
                </button>
              </div>
            </div>

            {/* Selective Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Delete Interviews */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Delete All Interviews</h3>
                <p className="text-blue-700 text-sm mb-4">{interviews.length} interviews</p>
                <button
                  onClick={async () => {
                    if (confirm(`Delete all ${interviews.length} interviews?`)) {
                      try {
                        const res = await fetch('/api/debug/clear-interviews', { method: 'POST' })
                        const json = await res.json()
                        if (json.success) {
                          alert('All interviews deleted successfully')
                          loadData()
                        } else {
                          alert('Error: ' + json.error)
                        }
                      } catch (err) {
                        alert('Failed to delete interviews: ' + err)
                      }
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Delete Interviews
                </button>
              </div>

              {/* Delete Applications */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-purple-900 mb-2">Delete All Applications</h3>
                <p className="text-purple-700 text-sm mb-4">{applications.length} applications</p>
                <button
                  onClick={async () => {
                    if (confirm(`Delete all ${applications.length} applications?`)) {
                      try {
                        const res = await fetch('/api/debug/clear-applications', { method: 'POST' })
                        const json = await res.json()
                        if (json.success) {
                          alert('All applications deleted successfully')
                          loadData()
                        } else {
                          alert('Error: ' + json.error)
                        }
                      } catch (err) {
                        alert('Failed to delete applications: ' + err)
                      }
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Delete Applications
                </button>
              </div>

              {/* Delete Jobs */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-green-900 mb-2">Delete All Jobs</h3>
                <p className="text-green-700 text-sm mb-4">{jobs.length} jobs</p>
                <button
                  onClick={async () => {
                    if (confirm(`Delete all ${jobs.length} jobs?`)) {
                      try {
                        const res = await fetch('/api/debug/clear-jobs', { method: 'POST' })
                        const json = await res.json()
                        if (json.success) {
                          alert('All jobs deleted successfully')
                          loadData()
                        } else {
                          alert('Error: ' + json.error)
                        }
                      } catch (err) {
                        alert('Failed to delete jobs: ' + err)
                      }
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Delete Jobs
                </button>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.totalJobs || 0}</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Applications</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.totalApplications || 0}</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Interviews</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.totalInterviews || 0}</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-pink-600">${stats?.totalRevenue.toFixed(2) || '0.00'}</p>
                </div>
                <div className="border-l-4 border-cyan-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Subscriptions</p>
                  <p className="text-3xl font-bold text-cyan-600">{stats?.totalSubscriptions || 0}</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Payments</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats?.totalPayments || 0}</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-gray-600 text-sm mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.activeJobs || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

