'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Transaction {
  id: number;
  client: string;
  value: number;
  type: string;
  category: string;
  timestamp: number;
}

interface Product {
  id: number;
  date: string;
  comum: number;
  com_doc: number;
  rest: number;
  verif: number;
  bm: number;
  repo: number;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  is_public: boolean;
  share_token: string;
  updated_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteCopied, setNoteCopied] = useState(false);

  const fetchData = useCallback(async () => {
    const [txRes, prRes, meRes] = await Promise.all([
      fetch('/api/transactions'),
      fetch('/api/products'),
      fetch('/api/auth/me'),
    ]);
    setTransactions(await txRes.json());
    setProducts(await prRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setSessionUser(me);
      if (me?.role === 'admin') {
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) setUsers(await usersRes.json());
      }
    }
    setLoading(false);
  }, []);

  const updateUser = async (id: number, patch: { active?: boolean; role?: string }) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const usersRes = await fetch('/api/admin/users');
    if (usersRes.ok) setUsers(await usersRes.json());
  };

  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/notes');
    if (res.ok) setNotes(await res.json());
  }, []);

  const newNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nova anotação', content: '' }),
    });
    if (res.ok) {
      const note = await res.json();
      await fetchNotes();
      openNote(note);
    }
  };

  const openNote = (note: Note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const saveNote = async () => {
    if (!activeNote) return;
    setNoteSaving(true);
    const res = await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: noteTitle, content: noteContent }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActiveNote(updated);
      await fetchNotes();
    }
    setNoteSaving(false);
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Excluir anotação?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (activeNote?.id === id) setActiveNote(null);
    await fetchNotes();
  };

  const toggleVisibility = async () => {
    if (!activeNote) return;
    const res = await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !activeNote.is_public }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActiveNote(updated);
      await fetchNotes();
    }
  };

  const copyShareLink = () => {
    if (!activeNote) return;
    const url = `${window.location.origin}/notas/${activeNote.share_token}`;
    navigator.clipboard.writeText(url);
    setNoteCopied(true);
    setTimeout(() => setNoteCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    fetchData();
    fetchNotes();
  }, [fetchData, fetchNotes]);

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: get('clientName'),
        value: parseFloat(get('saleValue')),
        type: get('saleType'),
        category: get('saleCategory'),
        timestamp: Date.now(),
      }),
    });
    form.reset();
    fetchData();
  };

  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const getInt = (name: string) =>
      parseInt((form.elements.namedItem(name) as HTMLInputElement).value) || 0;
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: (form.elements.namedItem('pDate') as HTMLInputElement).value,
        comum: getInt('pComum'),
        com_doc: getInt('pComDoc'),
        rest: getInt('pRest'),
        verif: getInt('pVerif'),
        bm: getInt('pBM'),
        repo: getInt('pRepo'),
      }),
    });
    form.reset();
    setModalOpen(false);
    fetchData();
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm('Excluir?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Excluir?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const clearFinance = async () => {
    if (!confirm('Limpar histórico?')) return;
    await Promise.all(transactions.map((tx) => fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' })));
    fetchData();
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'Receita') totalIncome += Number(tx.value);
    else totalExpense += Number(tx.value);
  });
  const balance = totalIncome - totalExpense;

  const monthlyGroups: Record<string, { name: string; inc: number; exp: number }> = {};
  transactions.forEach((tx) => {
    const d = new Date(Number(tx.timestamp));
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyGroups[k])
      monthlyGroups[k] = {
        name: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        inc: 0,
        exp: 0,
      };
    if (tx.type === 'Receita') monthlyGroups[k].inc += Number(tx.value);
    else monthlyGroups[k].exp += Number(tx.value);
  });

  const currentDate = new Date()
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const navItem = (id: string, label: string, icon: React.ReactNode) => (
    <div
      onClick={() => switchTab(id)}
      className={`sidebar-item flex items-center gap-3 p-3 text-sm font-medium transition ${
        activeTab === id ? 'sidebar-item-active' : 'text-gray-400'
      }`}
    >
      {icon}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-gray-800">
        <div className="text-[#10b981] font-black text-xl italic">FinDash</div>
        <div className="flex items-center gap-3">
          {sessionUser && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#10b981] flex items-center justify-center font-bold text-black text-xs uppercase">
                {sessionUser.name?.[0] || 'U'}
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[100px]">
                {sessionUser.name || sessionUser.email}
              </span>
              {sessionUser.role === 'admin' && (
                <span className="text-[9px] font-black uppercase bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0e14] border-r border-gray-800 transform transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex-1">
          <div className="mb-10">
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-1">
              <span className="text-white">Fin</span>
              <span className="text-[#10b981]">Dash</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Gestão de Perfis</p>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] text-gray-600 font-bold uppercase mb-4 tracking-widest">Principal</p>
            {navItem('dashboard', 'Visão Geral',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}
            {navItem('products', 'Produtos',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
            {navItem('monthly', 'Relatórios',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {navItem('notes', 'Anotações',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}

            {sessionUser?.role === 'admin' && navItem('users', 'Usuários',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}

            <p className="text-[10px] text-gray-600 font-bold uppercase mt-8 mb-4 tracking-widest">Armazenamento</p>
            <div className="px-3 py-2 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neon PostgreSQL</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#10b981] flex items-center justify-center font-bold text-black uppercase flex-shrink-0">
              {sessionUser?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{sessionUser?.name || '...'}</p>
                {sessionUser?.role === 'admin' && (
                  <span className="text-[9px] font-black uppercase bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 truncate">{sessionUser?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest transition py-1.5 border border-gray-800 hover:border-red-500/30 rounded"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Carregando...</div>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Visão Geral</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{currentDate}</p>
              </div>
            </div>
            <section className="card-glass rounded-xl p-6 border-[#10b981]/30 border mb-8">
              <form onSubmit={handleTransactionSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                  <input name="clientName" type="text" placeholder="Nome/Serviço" className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor (R$)</label>
                  <input name="saleValue" type="number" step="0.01" placeholder="0,00" className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo</label>
                  <select name="saleType" className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none">
                    <option value="Receita">Receita (+)</option>
                    <option value="Despesa">Despesa (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                  <select name="saleCategory" className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none">
                    <option value="Serviços">Serviços</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase italic py-2 rounded-lg transition transform active:scale-95">
                  Registrar
                </button>
              </form>
            </section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card-glass p-5 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Saldo Atual</p>
                <h3 className="text-3xl font-black italic">R${fmt(balance)}</h3>
              </div>
              <div className="card-glass p-5 rounded-xl border-l-4 border-emerald-500">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Receitas</p>
                <h3 className="text-3xl font-black italic text-emerald-400">R${fmt(totalIncome)}</h3>
              </div>
              <div className="card-glass p-5 rounded-xl border-l-4 border-red-500">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Despesas</p>
                <h3 className="text-3xl font-black italic text-red-400">R${fmt(totalExpense)}</h3>
              </div>
              <div className="card-glass p-5 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Registros</p>
                <h3 className="text-3xl font-black italic">{transactions.length}</h3>
              </div>
            </div>
            <section className="card-glass rounded-xl overflow-hidden mb-12">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h4 className="font-bold text-lg uppercase italic tracking-tight">Histórico Recente</h4>
                <button onClick={clearFinance} className="text-[10px] font-bold text-red-500 uppercase">Limpar Tudo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/20">
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isInc = tx.type === 'Receita';
                      return (
                        <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-bold text-sm">{tx.client}</td>
                          <td className={`px-6 py-4 font-black italic ${isInc ? 'text-emerald-400' : 'text-red-400'}`}>R${fmt(Number(tx.value))}</td>
                          <td className="px-6 py-4">
                            <span className={`status-badge ${isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{tx.type}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-500">{new Date(Number(tx.timestamp)).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => deleteTransaction(tx.id)} className="text-gray-600 hover:text-red-500 text-lg">×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {!loading && activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Produtos</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Modelo de Planilha de Controle</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="bg-[#10b981] px-6 py-2 rounded text-black font-black uppercase text-xs italic">+ Lançar Dia</button>
            </div>
            <div className="card-glass rounded-xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full sheet-table text-white">
                  <thead className="bg-black/40">
                    <tr className="text-[9px] uppercase tracking-tighter">
                      <th className="bg-gray-800">DATA</th>
                      <th>P - COMUM</th>
                      <th>P - COM DOC</th>
                      <th>P - RESTABELE</th>
                      <th>P - VERIFICADO</th>
                      <th>BM 260</th>
                      <th className="bg-yellow-500/20 text-yellow-400">P - REPOSICAO</th>
                      <th className="bg-red-500/20 text-red-400">Q. VENDAS</th>
                      <th>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((row) => {
                      const qVendas = (row.comum||0)+(row.com_doc||0)+(row.rest||0)+(row.verif||0)+(row.bm||0)+(row.repo||0);
                      return (
                        <tr key={row.id}>
                          <td className="bg-gray-800/50 font-bold">{new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                          <td>{row.comum ? row.comum + ' PERFIL' : '-'}</td>
                          <td>{row.com_doc ? row.com_doc + ' PERFIL' : '-'}</td>
                          <td>{row.rest ? row.rest + ' PERFIL' : '-'}</td>
                          <td>{row.verif ? row.verif + ' PERFIL' : '-'}</td>
                          <td>{row.bm ? row.bm + ' BM' : '-'}</td>
                          <td>{row.repo ? row.repo + ' PERFIL' : '-'}</td>
                          <td className="font-bold text-red-400 bg-red-400/5">{qVendas}</td>
                          <td><button onClick={() => deleteProduct(row.id)} className="text-gray-700 hover:text-red-500">×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'monthly' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Fluxo Mensal</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Consolidado por mês</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {Object.values(monthlyGroups).map((g, i) => {
                const bal = g.inc - g.exp;
                return (
                  <div key={i} className="card-glass p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="font-black italic uppercase text-lg">{g.name}</span>
                    <div className="flex gap-8 items-center flex-wrap justify-center">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Receitas</p>
                        <p className="text-emerald-400 font-bold">R$ {fmt(g.inc)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Despesas</p>
                        <p className="text-red-400 font-bold">R$ {fmt(g.exp)}</p>
                      </div>
                      <div className="text-center border-l border-gray-800 pl-8">
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Saldo</p>
                        <p className={`font-black ${bal >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {fmt(bal)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* NOTES TAB */}
      {!loading && activeTab === 'notes' && (
        <div className="animate-fade-in h-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Anotações</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Bloco de notas pessoal</p>
            </div>
            <button onClick={newNote} className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase italic px-6 py-2 rounded-lg text-xs transition">
              + Nova Anotação
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-260px)] min-h-[400px]">
            {/* Lista */}
            <div className="md:w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
              {notes.length === 0 && (
                <div className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest pt-8">
                  Nenhuma anotação
                </div>
              )}
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNote(n)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    activeNote?.id === n.id
                      ? 'border-[#10b981]/50 bg-[#10b981]/10'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm truncate">{n.title || 'Sem título'}</p>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                      n.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {n.is_public ? 'Público' : 'Privado'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">{n.content || 'Vazia'}</p>
                  <p className="text-[9px] text-gray-600 mt-1">{new Date(n.updated_at).toLocaleDateString('pt-BR')}</p>
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="flex-1 card-glass rounded-xl flex flex-col overflow-hidden border border-white/5">
              {!activeNote ? (
                <div className="flex-1 flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <p className="text-4xl mb-3">📝</p>
                    <p className="text-xs font-bold uppercase tracking-widest">Selecione ou crie uma anotação</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-wrap">
                    <button
                      onClick={saveNote}
                      disabled={noteSaving}
                      className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 transition disabled:opacity-50"
                    >
                      {noteSaving ? 'Salvando...' : 'Salvar'}
                    </button>

                    <button
                      onClick={toggleVisibility}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded transition ${
                        activeNote.is_public
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {activeNote.is_public ? '🔓 Público' : '🔒 Privado'}
                    </button>

                    {activeNote.is_public && (
                      <button
                        onClick={copyShareLink}
                        className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                      >
                        {noteCopied ? '✓ Copiado!' : '🔗 Copiar Link'}
                      </button>
                    )}

                    <div className="flex-1" />

                    <button
                      onClick={() => deleteNote(activeNote.id)}
                      className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      Excluir
                    </button>
                  </div>

                  {/* Título */}
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    onBlur={saveNote}
                    placeholder="Título da anotação"
                    className="w-full px-6 pt-5 pb-2 text-2xl font-black italic bg-transparent border-none outline-none text-white placeholder-gray-700"
                  />

                  {/* Conteúdo */}
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onBlur={saveNote}
                    placeholder="Escreva sua anotação aqui..."
                    className="flex-1 w-full px-6 py-3 bg-transparent border-none outline-none text-sm text-gray-300 leading-relaxed resize-none placeholder-gray-700 custom-scrollbar"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB — admin only */}
      {!loading && activeTab === 'users' && sessionUser?.role === 'admin' && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Usuários</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Gerencie acessos ao painel</p>
          </div>

          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-400 font-bold">
              Novos cadastros chegam como <span className="uppercase">Pendentes</span> e ficam bloqueados até você ativar.
            </p>
          </div>

          <div className="card-glass rounded-xl overflow-hidden mb-12">
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-gray-800">
              {users.map((u) => {
                const isFixed = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'].includes(u.email);
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#10b981]/20 flex items-center justify-center font-black text-[#10b981] text-sm uppercase flex-shrink-0">
                        {u.name?.[0] || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`status-badge ${u.role === 'admin' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-gray-700 text-gray-300'}`}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                        <span className={`status-badge ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {u.active ? 'Ativo' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    {!isFixed && (
                      <div className="flex gap-2">
                        <button onClick={() => updateUser(u.id, { active: !u.active })}
                          className={`flex-1 text-[10px] font-black uppercase py-1.5 rounded transition ${u.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                          {u.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                          className="flex-1 text-[10px] font-black uppercase py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">
                          {u.role === 'admin' ? '− Admin' : '+ Admin'}
                        </button>
                      </div>
                    )}
                    {isFixed && <p className="text-[10px] text-gray-600 font-bold uppercase">Admin fixo — não editável</p>}
                  </div>
                );
              })}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/20">
                    <th className="px-5 py-4">Usuário</th>
                    <th className="px-5 py-4">E-mail</th>
                    <th className="px-5 py-4">Cargo</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isFixed = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'].includes(u.email);
                    return (
                      <tr key={u.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center font-black text-[#10b981] text-xs uppercase flex-shrink-0">
                              {u.name?.[0] || '?'}
                            </div>
                            <span className="font-bold text-sm">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`status-badge ${u.role === 'admin' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-gray-700 text-gray-300'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`status-badge ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {u.active ? 'Ativo' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {isFixed ? (
                            <span className="text-[10px] text-gray-600 font-bold uppercase">Fixo</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateUser(u.id, { active: !u.active })}
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded transition ${u.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                {u.active ? 'Desativar' : 'Ativar'}
                              </button>
                              <button onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                                className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">
                                {u.role === 'admin' ? '− Admin' : '+ Admin'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="card-glass p-8 rounded-2xl w-full max-w-lg border border-[#10b981]/50">
            <h3 className="text-xl font-black uppercase italic mb-6">Lançar Quantidades</h3>
            <form onSubmit={handleProductSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Data do Lançamento</label>
                <input name="pDate" type="date" className="w-full p-2 rounded" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">P - Comum</label>
                <input name="pComum" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">P - Com Doc</label>
                <input name="pComDoc" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">P - Restabele</label>
                <input name="pRest" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">P - Verificado</label>
                <input name="pVerif" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">BM 260</label>
                <input name="pBM" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">P - Reposicao</label>
                <input name="pRepo" type="number" defaultValue="0" className="w-full p-2 rounded" />
              </div>
              <div className="col-span-2 flex gap-3 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-800 py-2 rounded text-xs font-bold">CANCELAR</button>
                <button type="submit" className="flex-1 bg-[#10b981] py-2 rounded text-black font-black italic">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
