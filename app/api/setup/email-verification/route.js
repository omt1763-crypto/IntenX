import { NextResponse } from 'next/server'

/**
 * Email verification setup endpoint
 * Not currently in use - implementation moved to individual endpoints
 */
export async function GET(req) {
  return NextResponse.json({
    message: 'Email verification system is active',
    status: 'ready',
  })
}