import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for frontend (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for backend/API routes (full permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// User type
export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'candidate' | 'recruiter' | 'company'
  created_at: string
  updated_at: string
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data
}

// Create user
export async function createUser(userData: {
  first_name: string
  last_name: string
  email: string
  password_hash: string
  role: 'candidate' | 'recruiter' | 'company'
}): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([userData])
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin.from('users').select('*')
  if (error) throw error
  return data || []
}

// Update user
export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete user
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) throw error
}
