'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: 'Fraca', color: 'bg-red-500', width: 'w-1/4' };
    if (password.length < 10) return { label: 'Média', color: 'bg-yellow-500', width: 'w-2/4' };
    if (!/[!@#$%^&*]/.test(password)) return { label: 'Boa', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Forte', color: 'bg-emerald-500', width: 'w-full' };
  })();

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.');
      return;
    }

    if (data.pending) {
      setPending(true);
      return;
    }

    router.push('/dashboard');
    router.refresh();
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
          <h2 className="text-xl font-black uppercase italic mb-1">Criar Conta</h2>
          <p className="text-xs text-gray-500 mb-2">
            Novos cadastros ficam <span className="text-yellow-400 font-bold">aguardando aprovação</span> de um administrador.
          </p>

          {pending && (
            <div className="my-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-4 py-4 rounded-lg text-center leading-relaxed">
              ✓ Cadastro realizado com sucesso!<br />
              <span className="text-gray-400 font-normal">Aguarde um administrador liberar seu acesso.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                required
              />
            </div>

            {/* Email */}
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

            {/* Senha */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
              {/* Barra de força */}
              {strength && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-[10px] font-bold ${strength.color.replace('bg-', 'text-')}`}>
                    Senha {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none pr-12 transition border ${
                    passwordsMatch
                      ? 'border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/30'
                      : passwordsMismatch
                      ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/30'
                      : 'focus:ring-2 focus:ring-[#10b981]/50'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs font-bold uppercase"
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {passwordsMatch && (
                <p className="text-[10px] font-bold text-emerald-400">✓ Senhas coincidem</p>
              )}
              {passwordsMismatch && (
                <p className="text-[10px] font-bold text-red-400">✗ Senhas não coincidem</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-black uppercase italic py-3 rounded-lg transition transform active:scale-95"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#10b981] font-bold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
