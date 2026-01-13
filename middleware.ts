import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search
  const hash = request.nextUrl.hash
  
  // If request is from old domain, redirect to new domain
  if (host.includes('intenx-1.onrender.com')) {
    const url = request.nextUrl.clone()
    url.host = 'www.aiinterviewx.com'
    
    // If there's a recovery token in the hash, ensure we go to reset-password page
    if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
      // Redirect to reset-password with the hash preserved
      url.pathname = '/auth/reset-password'
    }
    
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
