'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const features = [
  {
    icon: '📊',
    title: 'Controle Financeiro',
    desc: 'Registre entradas e saídas em tempo real. Visualize saldo, receitas e despesas de forma clara e organizada.',
  },
  {
    icon: '👤',
    title: 'Gestão de Perfis',
    desc: 'Controle todos os tipos de perfil vendidos: Comum, Com Doc, Restabelecido, Verificado, BM 260 e Reposição.',
  },
  {
    icon: '📅',
    title: 'Relatório Mensal',
    desc: 'Visualize o fluxo consolidado mês a mês. Saiba exatamente quanto entrou, saiu e qual foi o saldo de cada período.',
  },
  {
    icon: '🔐',
    title: 'Acesso Seguro',
    desc: 'Sistema de login com senhas criptografadas (bcrypt). Sessão protegida por JWT com validade de 7 dias.',
  },
  {
    icon: '☁️',
    title: 'Dados na Nuvem',
    desc: 'Nenhum dado salvo no navegador. Tudo armazenado no Neon PostgreSQL — acesse de qualquer dispositivo.',
  },
  {
    icon: '⚡',
    title: 'Rápido e Responsivo',
    desc: 'Interface otimizada para desktop e celular. Carregamento instantâneo com Next.js 15 e Tailwind CSS.',
  },
];

const profiles = [
  { label: 'Perfil Comum', color: 'border-blue-500/40 text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Perfil Com Doc', color: 'border-purple-500/40 text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Perfil Restabelecido', color: 'border-orange-500/40 text-orange-400', bg: 'bg-orange-500/10' },
  { label: 'Perfil Verificado', color: 'border-emerald-500/40 text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'BM 260', color: 'border-yellow-500/40 text-yellow-400', bg: 'bg-yellow-500/10' },
  { label: 'Perfil Reposição', color: 'border-pink-500/40 text-pink-400', bg: 'bg-pink-500/10' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Registre-se com e-mail e senha. Os dois primeiros usuários recebem acesso de administrador automaticamente.' },
  { n: '02', title: 'Lance seus dados', desc: 'Registre receitas, despesas e as quantidades de perfis vendidos por dia de forma rápida e intuitiva.' },
  { n: '03', title: 'Analise seus resultados', desc: 'Acompanhe o saldo, total de vendas e relatório mensal consolidado em tempo real.' },
];

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('findash-theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('findash-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const d = isDark;

  const bg = d ? 'bg-[#0a0e14]' : 'bg-slate-50';
  const text = d ? 'text-slate-100' : 'text-slate-900';
  const muted = d ? 'text-slate-400' : 'text-slate-500';
  const subtle = d ? 'text-slate-600' : 'text-slate-400';
  const cardBg = d ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200';
  const cardHover = d ? 'hover:border-emerald-500/30' : 'hover:border-emerald-400';
  const divider = d ? 'border-white/5' : 'border-slate-200';
  const navBg = scrolled
    ? d
      ? 'bg-[#0a0e14]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50'
      : 'bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/50'
    : 'bg-transparent border border-transparent';

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`}>

      {/* FLOATING NAV */}
      <nav className={`fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 transition-all duration-300 ${navBg}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="text-xl font-black italic tracking-tighter">
            <span className={d ? 'text-white' : 'text-slate-900'}>Fin</span>
            <span className="text-emerald-400">Dash</span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {['Funcionalidades', 'Perfis', 'Como Funciona'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-').replace('ç', 'c').replace('õ', 'o')}`}
                className={`text-xs font-bold uppercase tracking-widest transition hover:text-emerald-400 ${muted}`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl transition border ${d ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
              title="Alternar tema"
            >
              {isDark ? (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <Link href="/login" className={`hidden md:block text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition border ${d ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'} ${muted} hover:text-emerald-400`}>
              Entrar
            </Link>
            <Link href="/register" className="text-xs font-black uppercase italic px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition">
              Começar
            </Link>

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden p-2 rounded-xl transition ${d ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={`md:hidden mt-3 pt-3 border-t ${divider} flex flex-col gap-3 pb-2`}>
            {['Funcionalidades', 'Perfis', 'Como Funciona'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-').replace('ç', 'c').replace('õ', 'o')}`}
                onClick={() => setMenuOpen(false)}
                className={`text-xs font-bold uppercase tracking-widest px-2 py-1 transition hover:text-emerald-400 ${muted}`}>
                {item}
              </a>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest px-2 py-1 transition hover:text-emerald-400 ${muted}`}>
              Entrar
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 ${d ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border ${d ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500/40 bg-emerald-50 text-emerald-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistema em produção · Neon PostgreSQL
            </div>

            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none mb-6">
              Controle total
              <br />
              <span className="text-emerald-400">dos seus perfis.</span>
            </h1>

            <p className={`text-lg md:text-xl mb-10 max-w-xl leading-relaxed ${muted}`}>
              Registre entradas e saídas, acompanhe a venda de perfis por categoria e visualize relatórios mensais — tudo em um painel profissional e seguro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic text-sm rounded-2xl transition transform hover:scale-105 active:scale-95">
                Criar conta grátis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-black uppercase italic text-sm rounded-2xl transition border ${d ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-100'}`}>
                Já tenho conta
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t ${divider}`}>
            {[
              { value: '6', label: 'Tipos de Perfil' },
              { value: '100%', label: 'Dados na Nuvem' },
              { value: 'JWT', label: 'Sessão Segura' },
              { value: '24/7', label: 'Disponibilidade' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black italic text-emerald-400">{s.value}</p>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${muted}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className={`py-24 px-4 border-t ${divider}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-400`}>Funcionalidades</p>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">Tudo que você precisa</h2>
            <p className={`mt-4 text-base ${muted} max-w-xl mx-auto`}>Uma plataforma completa para organizar o financeiro do seu negócio de perfis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className={`p-6 rounded-2xl border transition-all duration-200 ${cardBg} ${cardHover}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-black uppercase italic text-sm mb-2">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROFILE TYPES */}
      <section id="perfis" className={`py-24 px-4 border-t ${divider}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-400">Categorias</p>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">Tipos de perfil suportados</h2>
            <p className={`mt-4 text-base ${muted} max-w-xl mx-auto`}>Registre e acompanhe cada categoria separadamente para saber exatamente o que está vendendo.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <div key={p.label} className={`flex items-center gap-4 p-5 rounded-2xl border ${p.bg} ${p.color} transition-all hover:scale-105`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${p.color.split(' ')[1].replace('text', 'bg')}`} />
                <span className="font-black uppercase text-xs tracking-widest">{p.label}</span>
              </div>
            ))}
          </div>
          <div className={`mt-8 p-6 rounded-2xl border ${cardBg} text-center`}>
            <p className={`text-sm font-bold ${muted}`}>
              Cada lançamento registra a <span className="text-emerald-400">quantidade vendida por dia</span> e calcula automaticamente o total de vendas.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className={`py-24 px-4 border-t ${divider}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-400">Passo a passo</p>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="text-6xl font-black italic text-emerald-500/20 mb-4">{s.n}</div>
                <h3 className="font-black uppercase italic text-lg mb-3">{s.title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH / SECURITY */}
      <section className={`py-24 px-4 border-t ${divider}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`rounded-3xl border p-10 md:p-16 ${cardBg} text-center`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-400">Tecnologia</p>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tight mb-4">Seguro e moderno por padrão</h2>
            <p className={`text-base ${muted} max-w-lg mx-auto mb-12`}>Construído com as melhores tecnologias do mercado para garantir performance e segurança dos seus dados.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Next.js 15', detail: 'App Router' },
                { name: 'Neon PostgreSQL', detail: 'Serverless' },
                { name: 'bcrypt', detail: 'Hash de Senha' },
                { name: 'JWT', detail: 'Auth Segura' },
                { name: 'Tailwind CSS', detail: 'UI Responsiva' },
                { name: 'Vercel', detail: 'Deploy em Produção' },
              ].map((t) => (
                <div key={t.name} className={`px-5 py-3 rounded-xl border text-left transition ${cardBg} ${cardHover}`}>
                  <p className="font-black text-sm">{t.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>{t.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-24 px-4 border-t ${divider}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tight mb-6">
            Comece agora,
            <br />
            <span className="text-emerald-400">é grátis.</span>
          </h2>
          <p className={`text-lg ${muted} mb-10`}>Crie sua conta em segundos e tenha controle total do seu financeiro de perfis.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic text-base rounded-2xl transition transform hover:scale-105 active:scale-95">
            Criar conta grátis
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-10 px-4 border-t ${divider}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black italic tracking-tighter">
            <span className={d ? 'text-white' : 'text-slate-900'}>Fin</span>
            <span className="text-emerald-400">Dash</span>
          </span>
          <p className={`text-xs font-bold ${subtle} uppercase tracking-widest`}>
            © {new Date().getFullYear()} FinDash · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className={`text-xs font-bold uppercase tracking-widest transition hover:text-emerald-400 ${muted}`}>Entrar</Link>
            <Link href="/register" className={`text-xs font-bold uppercase tracking-widest transition hover:text-emerald-400 ${muted}`}>Criar Conta</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
