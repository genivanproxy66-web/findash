import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-insecure-fallback-key'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Passa livre: assets e API de auth
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Rotas públicas: notas compartilhadas e perfis compartilhados
  if (
    pathname.startsWith('/notas/') ||
    pathname.startsWith('/perfis/') ||
    pathname.startsWith('/api/notes/public/') ||
    pathname.startsWith('/api/profiles/access/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('findash-token')?.value;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/transactions') ||
    pathname.startsWith('/api/products') ||
    pathname.startsWith('/api/notes') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/profiles') ||
    pathname.startsWith('/api/db');

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
