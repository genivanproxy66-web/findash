import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'findash-secret-fallback-key-2024'
);

// Só o dashboard e APIs de dados precisam de login
const PROTECTED = ['/dashboard', '/api/transactions', '/api/products'];

// Rotas que usuário logado não deve acessar (vai pro dashboard)
const AUTH_PAGES = ['/login', '/register'];

// Landing page: qualquer um acessa, mas logado vai pro dashboard
const LANDING = ['/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixa _next, favicon e rotas de auth da API passarem livres
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('findash-token')?.value;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isLanding = LANDING.includes(pathname);

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      // Logado tentando acessar login, register ou landing → vai pro dashboard
      if (isAuthPage || isLanding) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    } catch {
      // Token inválido/expirado
      const response = isProtected
        ? NextResponse.redirect(new URL('/login', request.url))
        : isLanding
        ? NextResponse.next()
        : NextResponse.next();
      response.cookies.delete('findash-token');
      return response;
    }
  }

  // Sem login tentando acessar rota protegida → vai pro login
  if (isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
