'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Note {
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export default function PublicNotePage() {
  const { token } = useParams<{ token: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notes/public/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then(setNote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-black italic tracking-tighter">
          <span className="text-white">Fin</span><span className="text-[#10b981]">Dash</span>
        </Link>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Anotação Compartilhada</span>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-12">
        <div className="w-full max-w-2xl">
          {loading && (
            <div className="text-center text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse pt-20">
              Carregando...
            </div>
          )}

          {error && (
            <div className="text-center pt-20">
              <p className="text-4xl mb-4">🔒</p>
              <h2 className="text-xl font-black uppercase italic mb-2">Anotação não encontrada</h2>
              <p className="text-sm text-gray-500">{error}</p>
              <Link href="/" className="inline-block mt-6 text-xs font-bold text-[#10b981] hover:underline uppercase tracking-widest">
                Voltar ao início
              </Link>
            </div>
          )}

          {note && (
            <article className="card-glass rounded-2xl p-8 border border-white/10">
              <div className="mb-6 pb-6 border-b border-white/5">
                <h1 className="text-3xl font-black italic tracking-tight mb-3">{note.title}</h1>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Por {note.author}</span>
                  <span>·</span>
                  <span>{new Date(note.updated_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {note.content || <span className="text-gray-600 italic">Sem conteúdo.</span>}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
