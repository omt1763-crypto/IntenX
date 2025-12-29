import { supabaseAdmin } from './supabase'

/**
 * Log an activity to the activity_logs table
 * @param {string} userId - The user ID performing the action
 * @param {string} action - The action type (signup, login, interview_start, etc.)
 * @param {string} entityType - Type of entity (user, interview, job, applicant)
 * @param {string} entityId - ID of the entity
 * @param {string} description - Human readable description
 * @param {object} metadata - Additional metadata
 * @param {string} ipAddress - User's IP address
 * @param {string} userAgent - User's browser agent
 */
export async function logActivity({
  userId,
  action,
  entityType = null,
  entityId = null,
  description = '',
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) {
  try {
    if (!userId || !action) {
      console.warn('[ActivityLog] Missing required fields: userId, action')
      return
    }

    console.log(`[ActivityLog] Logging ${action} for user ${userId}`)

    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata,
        },
      ])

    if (error) {
      console.error('[ActivityLog] Error logging activity:', error)
    } else {
      console.log(`[ActivityLog] ✅ ${action} logged successfully`)
    }
  } catch (err) {
    console.error('[ActivityLog] Exception:', err)
  }
}

/**
 * Update last_login and login_count for a user
 */
export async function updateLastLogin(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: supabaseAdmin.rpc('increment_login_count', { user_id: userId }),
      })
      .eq('id', userId)

    if (error) {
      console.error('[LastLogin] Error updating last login:', error)
    }
  } catch (err) {
    console.error('[LastLogin] Exception:', err)
  }
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(filters = {}) {
  try {
    const {
      userId = null,
      action = null,
      entityType = null,
      limit = 100,
      offset = 0,
    } = filters

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*, user:users(id, first_name, last_name, email, role)', { count: 'exact' })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[GetLogs] Error fetching logs:', error)
      return { data: [], count: 0, error }
    }

    return { data, count, error: null }
  } catch (err) {
    console.error('[GetLogs] Exception:', err)
    return { data: [], count: 0, error: err }
  }
}
