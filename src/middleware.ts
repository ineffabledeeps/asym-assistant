import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/api/auth',
    '/favicon.ico',
    '/_next',
    '/images',
    '/fonts',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml'
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(path + '/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/')
  );

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes (like /chat), check authentication
  if (pathname.startsWith('/chat')) {
    try {
      // Get the token from the request
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });

      // If no token, redirect to landing page
      if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }

      // If authenticated, allow access
      return NextResponse.next();
    } catch (error) {
      // If there's an error checking auth, redirect to landing page
      console.error('Middleware auth error:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // For all other routes, allow access (they can handle their own auth if needed)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
