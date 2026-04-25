import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'findash-secret-fallback-key-2024'
);

const PUBLIC = ['/login', '/register'];
const AUTH_API = '/api/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(AUTH_API) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const token = request.cookies.get('findash-token')?.value;
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      if (isPublic) return NextResponse.redirect(new URL('/', request.url));
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('findash-token');
      return res;
    }
  }

  if (isPublic) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
