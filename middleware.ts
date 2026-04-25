import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'findash-secret-fallback-key-2024'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Passa livre: _next, favicon e API de auth
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('findash-token')?.value;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/transactions') ||
    pathname.startsWith('/api/products');

  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  // Sem token tentando acessar rota protegida → login
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      // Logado tentando acessar login/register → dashboard
      if (isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Token inválido → limpa cookie e redireciona se necessário
      const response = isProtected
        ? NextResponse.redirect(new URL('/login', request.url))
        : NextResponse.next();
      response.cookies.delete('findash-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
