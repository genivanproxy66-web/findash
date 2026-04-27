'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* body vazio — ignora */ }

      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Erro ao entrar. Tente novamente.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
      setError('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter">
            <span className="text-white">Fin</span>
            <span className="text-[#10b981]">Dash</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
            Gestão de Perfis
          </p>
        </div>

        {/* Card */}
        <div className="card-glass rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-black uppercase italic mb-1">Entrar</h2>
          <p className="text-xs text-gray-500 mb-8">Acesse seu painel financeiro</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs font-bold uppercase"
                >
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-black uppercase italic py-3 rounded-lg transition transform active:scale-95"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-[#10b981] font-bold hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
