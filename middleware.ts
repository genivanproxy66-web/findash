import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'findash-secret-fallback-key-2024'
);

const PROTECTED = ['/dashboard'];
const AUTH_ONLY = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const token = request.cookies.get('findash-token')?.value;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isApiData = pathname.startsWith('/api/transactions') || pathname.startsWith('/api/products');
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      if (isAuthOnly) return NextResponse.redirect(new URL('/dashboard', request.url));
      return NextResponse.next();
    } catch {
      const res = isProtected || isApiData
        ? NextResponse.redirect(new URL('/login', request.url))
        : NextResponse.next();
      res.cookies.delete('findash-token');
      return res;
    }
  }

  if (isProtected || isApiData) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
