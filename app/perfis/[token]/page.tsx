'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  id: number;
  content: string;
  status: string;
}

interface Share {
  id: number;
  label: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  disponivel: { label: 'Disponível',  cls: 'bg-emerald-500/20 text-emerald-400' },
  ativo:      { label: 'Ativo',       cls: 'bg-blue-500/20 text-blue-400'       },
  aquecendo:  { label: 'Aquecendo',   cls: 'bg-orange-500/20 text-orange-400'   },
  bloqueado:  { label: 'Bloqueado',   cls: 'bg-red-500/20 text-red-400'         },
  vendido:    { label: 'Vendido',     cls: 'bg-gray-600/40 text-gray-400'       },
};

export default function PublicProfilePage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<Share | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/profiles/access/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then((d) => { setShare(d.share); setProfiles(d.profiles); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const statusList = ['todos', 'disponivel', 'ativo', 'aquecendo', 'bloqueado', 'vendido'];
  const filtered = filter === 'todos' ? profiles : profiles.filter((p) => p.status === filter);

  const copyProfile = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const counts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 flex flex-col">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-black italic tracking-tighter">
          <span className="text-white">Fin</span><span className="text-[#10b981]">Dash</span>
        </Link>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Acesso de Perfis</span>
      </header>

      <main className="flex-1 p-6">
        {loading && (
          <div className="text-center pt-20 text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">
            Carregando...
          </div>
        )}

        {error && (
          <div className="text-center pt-20">
            <p className="text-4xl mb-4">🔒</p>
            <h2 className="text-xl font-black uppercase italic mb-2">Link não encontrado</h2>
            <p className="text-sm text-gray-500">{error}</p>
            <Link href="/" className="inline-block mt-6 text-xs font-bold text-[#10b981] hover:underline uppercase tracking-widest">
              Voltar ao início
            </Link>
          </div>
        )}

        {share && (
          <div className="max-w-4xl mx-auto">
            {/* Header do share */}
            <div className="mb-6">
              <h1 className="text-3xl font-black italic uppercase tracking-tight mb-1">{share.label}</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {profiles.length} perfis • {new Date(share.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Contadores por status */}
            <div className="flex flex-wrap gap-2 mb-6">
              {statusList.map((s) => {
                const info = STATUS_STYLE[s];
                const count = s === 'todos' ? profiles.length : (counts[s] || 0);
                if (s !== 'todos' && count === 0) return null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition border ${
                      filter === s
                        ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                        : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {s === 'todos' ? `Todos (${count})` : `${info?.label} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Lista de perfis */}
            <div className="space-y-2">
              {filtered.map((p) => {
                const st = STATUS_STYLE[p.status] || STATUS_STYLE.disponivel;
                const isSold = p.status === 'vendido';
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-[#0f172a] ${isSold ? 'opacity-50' : ''}`}
                  >
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                    <code className={`flex-1 text-xs font-mono text-gray-300 truncate ${isSold ? 'line-through text-gray-600' : ''}`}>
                      {p.content}
                    </code>
                    {!isSold && (
                      <button
                        onClick={() => copyProfile(p.id, p.content)}
                        className="flex-shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition"
                      >
                        {copied === p.id ? '✓' : 'Copiar'}
                      </button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-600 text-xs font-bold uppercase tracking-widest">
                  Nenhum perfil com este status.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
