// /api/debug/auth/route.js
// Server-side debug authentication
export async function POST(request) {
  try {
    // Check if debug is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD !== 'true') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Debug dashboard is disabled',
          code: 'DEBUG_DISABLED'
        }),
        { status: 403 }
      )
    }

    // Check if in production
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
      console.warn('[Security] Debug dashboard access attempt in production')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Debug dashboard not available in production',
          code: 'PRODUCTION_LOCKED'
        }),
        { status: 403 }
      )
    }

    const { password } = await request.json()

    // Verify password
    if (password !== process.env.DEBUG_DASHBOARD_PASSWORD) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_PASSWORD'
        }),
        { status: 401 }
      )
    }

    // Generate session token
    const token = Buffer.from(
      `${Date.now()}.${Math.random().toString(36).substring(7)}`
    ).toString('base64')

    return new Response(
      JSON.stringify({
        success: true,
        token,
        message: 'Debug session authenticated'
      }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `debugToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
        }
      }
    )
  } catch (error) {
    console.error('[Debug Auth] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { status: 500 }
    )
  }
}
