'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Tipos ──────────────────────────────────────────────────── */
interface SessionUser { id: number; name: string; email: string; role: string; group_id: number; }
interface Transaction  { id: number; client: string; value: number; type: string; category: string; timestamp: number; }
interface Product      { id: number; date: string; comum: number; com_doc: number; verif: number; bm: number; bm_1k: number; repo: number; }
interface UserRow      { id: number; name: string; email: string; role: string; active: boolean; created_at: string; }
interface Note         { id: number; title: string; content: string; is_public: boolean; share_token: string; updated_at: string; }
interface Profile      { id: number; content: string; status: string; file_source: string; created_at: string; }
interface ProfileShare { id: number; token: string; label: string; created_at: string; profile_count: number; }

/* ─── Constantes de status ───────────────────────────────────── */
const STATUS_META: Record<string, { label: string; cls: string }> = {
  disponivel: { label: 'Disponível', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ativo:      { label: 'Ativo',      cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30'         },
  aquecendo:  { label: 'Aquecendo',  cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30'   },
  bloqueado:  { label: 'Bloqueado',  cls: 'bg-red-500/20 text-red-400 border-red-500/30'            },
  vendido:    { label: 'Vendido',    cls: 'bg-gray-600/30 text-gray-400 border-gray-600/30'         },
};
const NEON_MAX_BYTES = 512 * 1024 * 1024; // 512 MB free tier

export default function Dashboard() {
  const router = useRouter();

  /* ─── UI state ───────────────────────────────────────────────── */
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [loading, setLoading]         = useState(true);

  /* ─── Data state ─────────────────────────────────────────────── */
  const [sessionUser, setSessionUser]   = useState<SessionUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [users, setUsers]               = useState<UserRow[]>([]);
  const [dbUsage, setDbUsage]           = useState<number | null>(null);

  /* ─── Notes state ────────────────────────────────────────────── */
  const [notes, setNotes]           = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle]   = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteCopied, setNoteCopied] = useState(false);

  /* ─── Profiles state ─────────────────────────────────────────── */
  const [profiles, setProfiles]           = useState<Profile[]>([]);
  const [profileShares, setProfileShares] = useState<ProfileShare[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());
  const [profileFilter, setProfileFilter] = useState('todos');
  const [shareLabel, setShareLabel]       = useState('');
  const [shareCopied, setShareCopied]     = useState('');
  const [uploadingProfiles, setUploadingProfiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Fetch helpers ──────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    const [txRes, prRes, meRes] = await Promise.all([
      fetch('/api/transactions'),
      fetch('/api/products'),
      fetch('/api/auth/me'),
    ]);
    if (txRes.ok) setTransactions(await txRes.json());
    if (prRes.ok) setProducts(await prRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setSessionUser(me);
      if (me?.role === 'admin' || me?.role === 'superadmin') {
        const ur = await fetch('/api/admin/users');
        if (ur.ok) setUsers(await ur.json());
      }
    }
    const du = await fetch('/api/db/usage');
    if (du.ok) { const d = await du.json(); setDbUsage(d.bytes_used); }
    setLoading(false);
  }, []);

  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/notes');
    if (res.ok) setNotes(await res.json());
  }, []);

  const fetchProfiles = useCallback(async () => {
    const res = await fetch('/api/profiles');
    if (res.ok) setProfiles(await res.json());
  }, []);

  const fetchProfileShares = useCallback(async () => {
    const res = await fetch('/api/profiles/access');
    if (res.ok) setProfileShares(await res.json());
  }, []);

  useEffect(() => { fetchData(); fetchNotes(); }, [fetchData, fetchNotes]);

  useEffect(() => {
    if (activeTab === 'perfis') { fetchProfiles(); fetchProfileShares(); }
  }, [activeTab, fetchProfiles, fetchProfileShares]);

  /* ─── Transactions ───────────────────────────────────────────── */
  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement).value;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: get('clientName'), value: parseFloat(get('saleValue')), type: get('saleType'), category: get('saleCategory'), timestamp: Date.now() }),
    });
    form.reset();
    fetchData();
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm('Excluir?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const clearFinance = async () => {
    if (!confirm('Limpar histórico?')) return;
    await Promise.all(transactions.map((tx) => fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' })));
    fetchData();
  };

  /* ─── Products ───────────────────────────────────────────────── */
  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const gi = (n: string) => parseInt((form.elements.namedItem(n) as HTMLInputElement).value) || 0;
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:    (form.elements.namedItem('pDate') as HTMLInputElement).value,
        comum:   gi('pComum'),
        com_doc: gi('pComDoc'),
        verif:   gi('pVerif'),
        bm:      gi('pBM'),
        bm_1k:   gi('pBM1k'),
        repo:    gi('pRepo'),
      }),
    });
    form.reset();
    setModalOpen(false);
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Excluir?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  /* ─── Notes ──────────────────────────────────────────────────── */
  const newNote = async () => {
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Nova anotação', content: '' }) });
    if (res.ok) { const n = await res.json(); await fetchNotes(); openNote(n); }
  };
  const openNote = (n: Note) => { setActiveNote(n); setNoteTitle(n.title); setNoteContent(n.content); };
  const saveNote = async () => {
    if (!activeNote) return;
    setNoteSaving(true);
    const res = await fetch(`/api/notes/${activeNote.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: noteTitle, content: noteContent }) });
    if (res.ok) { const u = await res.json(); setActiveNote(u); await fetchNotes(); }
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
    const res = await fetch(`/api/notes/${activeNote.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_public: !activeNote.is_public }) });
    if (res.ok) { const u = await res.json(); setActiveNote(u); await fetchNotes(); }
  };
  const copyShareLink = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(`${window.location.origin}/notas/${activeNote.share_token}`);
    setNoteCopied(true);
    setTimeout(() => setNoteCopied(false), 2000);
  };

  /* ─── Profiles ───────────────────────────────────────────────── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo muito grande (máx. 2 MB).'); return; }
    setUploadingProfiles(true);
    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) { alert('Arquivo vazio.'); setUploadingProfiles(false); return; }
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, file_source: file.name }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`✓ ${data.count} perfis importados!`);
      await fetchProfiles();
      const du = await fetch('/api/db/usage');
      if (du.ok) { const d = await du.json(); setDbUsage(d.bytes_used); }
    } else {
      alert(data.error || 'Erro ao importar.');
    }
    setUploadingProfiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeStatus = async (id: number, status: string) => {
    await fetch(`/api/profiles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const deleteProfile = async (id: number) => {
    if (!confirm('Excluir este perfil?')) return;
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedProfiles((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleSelectProfile = (id: number) => {
    setSelectedProfiles((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const selectAllVisible = () => {
    const visible = filteredProfiles.map((p) => p.id);
    setSelectedProfiles((prev) => {
      const allSelected = visible.every((id) => prev.has(id));
      const s = new Set(prev);
      if (allSelected) visible.forEach((id) => s.delete(id));
      else visible.forEach((id) => s.add(id));
      return s;
    });
  };

  const createShareLink = async () => {
    if (selectedProfiles.size === 0) return;
    const res = await fetch('/api/profiles/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: shareLabel || 'Acesso', profileIds: Array.from(selectedProfiles) }),
    });
    if (res.ok) {
      const data = await res.json();
      const url = `${window.location.origin}/perfis/${data.token}`;
      navigator.clipboard.writeText(url);
      setShareCopied(url);
      setSelectedProfiles(new Set());
      setShareLabel('');
      await fetchProfileShares();
      setTimeout(() => setShareCopied(''), 4000);
    }
  };

  const deleteShareLink = async (token: string) => {
    if (!confirm('Excluir este link? O cliente perderá acesso.')) return;
    await fetch(`/api/profiles/access/${token}`, { method: 'DELETE' });
    await fetchProfileShares();
  };

  const copyLinkToClipboard = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/perfis/${token}`);
    setShareCopied(token);
    setTimeout(() => setShareCopied(''), 2000);
  };

  /* ─── Auth ───────────────────────────────────────────────────── */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const updateUser = async (id: number, patch: { active?: boolean; role?: string }) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const ur = await fetch('/api/admin/users');
    if (ur.ok) setUsers(await ur.json());
  };

  const switchTab = (tab: string) => { setActiveTab(tab); setSidebarOpen(false); };

  /* ─── Computed ───────────────────────────────────────────────── */
  let totalIncome = 0, totalExpense = 0;
  transactions.forEach((tx) => { if (tx.type === 'Receita') totalIncome += Number(tx.value); else totalExpense += Number(tx.value); });
  const balance = totalIncome - totalExpense;

  const monthlyGroups: Record<string, { name: string; inc: number; exp: number }> = {};
  transactions.forEach((tx) => {
    const d = new Date(Number(tx.timestamp));
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyGroups[k]) monthlyGroups[k] = { name: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }), inc: 0, exp: 0 };
    if (tx.type === 'Receita') monthlyGroups[k].inc += Number(tx.value); else monthlyGroups[k].exp += Number(tx.value);
  });

  const filteredProfiles = profileFilter === 'todos' ? profiles : profiles.filter((p) => p.status === profileFilter);
  const profileCounts = profiles.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});

  const usedMB   = dbUsage !== null ? (dbUsage / (1024 * 1024)).toFixed(1) : '…';
  const usedPct  = dbUsage !== null ? Math.min(100, (dbUsage / NEON_MAX_BYTES) * 100) : 0;
  const barColor = usedPct > 80 ? 'bg-red-500' : usedPct > 60 ? 'bg-yellow-400' : 'bg-emerald-500';

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'superadmin';

  const navItem = (id: string, label: string, icon: React.ReactNode) => (
    <div onClick={() => switchTab(id)} className={`sidebar-item flex items-center gap-3 p-3 text-sm font-medium transition cursor-pointer ${activeTab === id ? 'sidebar-item-active' : 'text-gray-400'}`}>
      {icon} {label}
    </div>
  );

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-gray-800">
        <div className="text-[#10b981] font-black text-xl italic">FinDash</div>
        <div className="flex items-center gap-3">
          {sessionUser && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#10b981] flex items-center justify-center font-bold text-black text-xs uppercase">{sessionUser.name?.[0] || 'U'}</div>
              <span className="text-xs font-bold text-white truncate max-w-[100px]">{sessionUser.name || sessionUser.email}</span>
              {isAdmin && <span className="text-[9px] font-black uppercase bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded">Admin</span>}
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0e14] border-r border-gray-800 transform transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-1">
              <span className="text-white">Fin</span><span className="text-[#10b981]">Dash</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Gestão de Perfis</p>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] text-gray-600 font-bold uppercase mb-3 tracking-widest">Principal</p>
            {navItem('dashboard', 'Visão Geral', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>)}
            {navItem('products', 'Produtos',    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>)}
            {navItem('perfis',   'Perfis',      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)}
            {navItem('monthly',  'Relatórios',  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>)}
            {navItem('notes',    'Anotações',   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>)}
            {isAdmin && navItem('users', 'Usuários', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>)}

            {/* Storage bar */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="text-[10px] text-gray-600 font-bold uppercase mb-3 tracking-widest">Armazenamento</p>
              <div className="px-1 space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-500">Neon PostgreSQL</span>
                  <span className={usedPct > 80 ? 'text-red-400' : usedPct > 60 ? 'text-yellow-400' : 'text-emerald-400'}>
                    {usedMB} MB / 512 MB
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usedPct}%` }} />
                </div>
                {usedPct > 80 && (
                  <p className="text-[9px] text-red-400 font-bold uppercase">⚠ Banco próximo do limite!</p>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* User info + logout */}
        <div className="p-6 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#10b981] flex items-center justify-center font-bold text-black uppercase flex-shrink-0">{sessionUser?.name?.[0] || 'U'}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{sessionUser?.name || '...'}</p>
                {isAdmin && <span className="text-[9px] font-black uppercase bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded flex-shrink-0">Admin</span>}
              </div>
              <p className="text-[10px] text-gray-500 truncate">{sessionUser?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest transition py-1.5 border border-gray-800 hover:border-red-500/30 rounded">
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Carregando...</div>
          </div>
        )}

        {/* ── Visão Geral ─────────────────────────────────────────── */}
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
                    <option>Serviços</option><option>Software</option><option>Hardware</option><option>Outros</option>
                  </select>
                </div>
                <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase italic py-2 rounded-lg transition transform active:scale-95">Registrar</button>
              </form>
            </section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card-glass p-5 rounded-xl"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Saldo Atual</p><h3 className="text-3xl font-black italic">R${fmt(balance)}</h3></div>
              <div className="card-glass p-5 rounded-xl border-l-4 border-emerald-500"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Receitas</p><h3 className="text-3xl font-black italic text-emerald-400">R${fmt(totalIncome)}</h3></div>
              <div className="card-glass p-5 rounded-xl border-l-4 border-red-500"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Despesas</p><h3 className="text-3xl font-black italic text-red-400">R${fmt(totalExpense)}</h3></div>
              <div className="card-glass p-5 rounded-xl"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Registros</p><h3 className="text-3xl font-black italic">{transactions.length}</h3></div>
            </div>
            <section className="card-glass rounded-xl overflow-hidden mb-12">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h4 className="font-bold text-lg uppercase italic tracking-tight">Histórico Recente</h4>
                <button onClick={clearFinance} className="text-[10px] font-bold text-red-500 uppercase">Limpar Tudo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/20"><th className="px-6 py-4">Descrição</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Ação</th></tr></thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isInc = tx.type === 'Receita';
                      return (
                        <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-bold text-sm">{tx.client}</td>
                          <td className={`px-6 py-4 font-black italic ${isInc ? 'text-emerald-400' : 'text-red-400'}`}>R${fmt(Number(tx.value))}</td>
                          <td className="px-6 py-4"><span className={`status-badge ${isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{tx.type}</span></td>
                          <td className="px-6 py-4 text-[10px] text-gray-500">{new Date(Number(tx.timestamp)).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4"><button onClick={() => deleteTransaction(tx.id)} className="text-gray-600 hover:text-red-500 text-lg">×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ── Produtos ────────────────────────────────────────────── */}
        {!loading && activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Produtos</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Controle diário de estoque</p>
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
                      <th>P - VERIFICADO</th>
                      <th>PÁGINAS</th>
                      <th>BM 260</th>
                      <th>BM 1.4K</th>
                      <th className="bg-yellow-500/20 text-yellow-400">PROXY</th>
                      <th className="bg-red-500/20 text-red-400">Q. VENDAS</th>
                      <th>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((row) => {
                      const q = (row.comum||0)+(row.com_doc||0)+(row.verif||0)+(row.bm||0)+(row.bm_1k||0)+(row.repo||0);
                      return (
                        <tr key={row.id}>
                          <td className="bg-gray-800/50 font-bold">{new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                          <td>{row.comum   ? `${row.comum} PERFIL`   : '-'}</td>
                          <td>{row.verif   ? `${row.verif} PERFIL`   : '-'}</td>
                          <td>{row.com_doc ? `${row.com_doc} PÁG`    : '-'}</td>
                          <td>{row.bm      ? `${row.bm} BM`          : '-'}</td>
                          <td>{row.bm_1k   ? `${row.bm_1k} BM`      : '-'}</td>
                          <td>{row.repo    ? `${row.repo} PROXY`     : '-'}</td>
                          <td className="font-bold text-red-400 bg-red-400/5">{q}</td>
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

        {/* ── Perfis ──────────────────────────────────────────────── */}
        {!loading && activeTab === 'perfis' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Perfis</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {profiles.length} perfis cadastrados
                </p>
              </div>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingProfiles}
                  className="bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-black uppercase italic px-5 py-2 rounded-lg text-xs transition"
                >
                  {uploadingProfiles ? 'Importando...' : '+ Upload .txt'}
                </button>
              </div>
            </div>

            {/* Filtros por status */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['todos', 'disponivel', 'ativo', 'aquecendo', 'bloqueado', 'vendido'] as const).map((s) => {
                const count = s === 'todos' ? profiles.length : (profileCounts[s] || 0);
                const meta  = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setProfileFilter(s)}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition ${
                      profileFilter === s ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}>
                    {s === 'todos' ? `Todos (${count})` : `${meta.label} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Barra de seleção flutuante */}
            {selectedProfiles.size > 0 && (
              <div className="sticky top-0 z-10 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
                <span className="text-xs font-black text-[#10b981] uppercase">{selectedProfiles.size} selecionados</span>
                <input
                  type="text"
                  value={shareLabel}
                  onChange={(e) => setShareLabel(e.target.value)}
                  placeholder="Nome do cliente / rótulo do link"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none text-white placeholder-gray-600"
                />
                <button onClick={createShareLink} className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase text-xs px-4 py-1.5 rounded-lg transition flex-shrink-0">
                  🔗 Criar Link de Acesso
                </button>
                <button onClick={() => setSelectedProfiles(new Set())} className="text-gray-500 hover:text-white text-xs font-bold uppercase">Cancelar</button>
              </div>
            )}

            {shareCopied && shareCopied.startsWith('http') && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-bold">
                ✓ Link copiado! <span className="font-mono text-blue-300 break-all">{shareCopied}</span>
              </div>
            )}

            {/* Tabela de perfis */}
            <div className="card-glass rounded-xl overflow-hidden mb-8">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-16 text-gray-600 text-xs font-bold uppercase tracking-widest">
                  {profiles.length === 0 ? 'Nenhum perfil importado. Faça upload de um arquivo .txt.' : 'Nenhum perfil com este status.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/20">
                        <th className="px-4 py-3">
                          <input type="checkbox" className="accent-[#10b981]"
                            checked={filteredProfiles.length > 0 && filteredProfiles.every((p) => selectedProfiles.has(p.id))}
                            onChange={selectAllVisible} />
                        </th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Conteúdo</th>
                        <th className="px-4 py-3">Arquivo</th>
                        <th className="px-4 py-3">Alterar Status</th>
                        <th className="px-4 py-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map((p) => {
                        const meta = STATUS_META[p.status] || STATUS_META.disponivel;
                        return (
                          <tr key={p.id} className={`border-b border-gray-800/50 hover:bg-white/5 transition ${selectedProfiles.has(p.id) ? 'bg-[#10b981]/5' : ''}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" className="accent-[#10b981]"
                                checked={selectedProfiles.has(p.id)}
                                onChange={() => toggleSelectProfile(p.id)} />
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <code className="text-xs font-mono text-gray-300 truncate block">{p.content}</code>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-gray-600 truncate max-w-[100px]">{p.file_source || '—'}</td>
                            <td className="px-4 py-3">
                              <select
                                value={p.status}
                                onChange={(e) => changeStatus(p.id, e.target.value)}
                                className="text-[10px] font-bold uppercase bg-white/5 border border-white/10 rounded px-2 py-1 focus:outline-none text-gray-300"
                              >
                                <option value="disponivel">Disponível</option>
                                <option value="ativo">Ativo</option>
                                <option value="aquecendo">Aquecendo</option>
                                <option value="bloqueado">Bloqueado</option>
                                <option value="vendido">Vendido</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => deleteProfile(p.id)} className="text-gray-600 hover:text-red-500 text-lg">×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Links de acesso criados */}
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight mb-4">Links de Acesso Criados</h3>
              {profileShares.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest card-glass rounded-xl">Nenhum link criado ainda.</div>
              ) : (
                <div className="space-y-3">
                  {profileShares.map((s) => (
                    <div key={s.id} className="card-glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{s.label}</p>
                        <p className="text-[10px] text-gray-500">
                          {s.profile_count} perfis · {new Date(s.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <code className="text-[9px] text-gray-600 truncate block">{`${typeof window !== 'undefined' ? window.location.origin : ''}/perfis/${s.token}`}</code>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyLinkToClipboard(s.token)}
                          className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          {shareCopied === s.token ? '✓ Copiado' : '🔗 Copiar'}
                        </button>
                        <button
                          onClick={() => deleteShareLink(s.token)}
                          className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Relatórios ──────────────────────────────────────────── */}
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
                      <div className="text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Receitas</p><p className="text-emerald-400 font-bold">R$ {fmt(g.inc)}</p></div>
                      <div className="text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Despesas</p><p className="text-red-400 font-bold">R$ {fmt(g.exp)}</p></div>
                      <div className="text-center border-l border-gray-800 pl-8"><p className="text-[9px] text-gray-500 uppercase font-bold">Saldo</p><p className={`font-black ${bal >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {fmt(bal)}</p></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(monthlyGroups).length === 0 && (
                <div className="text-center py-16 text-gray-600 text-xs font-bold uppercase tracking-widest">Nenhuma transação registrada.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Anotações ───────────────────────────────────────────── */}
        {!loading && activeTab === 'notes' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Anotações</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Bloco de notas pessoal</p>
              </div>
              <button onClick={newNote} className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase italic px-6 py-2 rounded-lg text-xs transition self-start sm:self-auto">+ Nova Anotação</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
              <div className="flex flex-col gap-2">
                {notes.length === 0 && <div className="card-glass rounded-xl p-6 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">Nenhuma anotação</div>}
                {notes.map((n) => (
                  <button key={n.id} onClick={() => openNote(n)}
                    className={`w-full text-left p-3 rounded-xl border transition ${activeNote?.id === n.id ? 'border-[#10b981]/50 bg-[#10b981]/10' : 'border-white/5 bg-[#0f172a] hover:bg-white/5'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm truncate">{n.title || 'Sem título'}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${n.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>{n.is_public ? 'Público' : 'Privado'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{n.content || 'Vazia'}</p>
                    <p className="text-[9px] text-gray-600 mt-1">{new Date(n.updated_at).toLocaleDateString('pt-BR')}</p>
                  </button>
                ))}
              </div>
              <div className="card-glass rounded-xl flex flex-col border border-white/5 min-h-[500px]">
                {!activeNote ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 py-20">
                    <div className="text-center"><p className="text-4xl mb-3">📝</p><p className="text-xs font-bold uppercase tracking-widest">Selecione ou crie uma anotação</p></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-wrap">
                      <button onClick={saveNote} disabled={noteSaving} className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 transition disabled:opacity-50">{noteSaving ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={toggleVisibility} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded transition ${activeNote.is_public ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}>{activeNote.is_public ? '🔓 Público' : '🔒 Privado'}</button>
                      {activeNote.is_public && <button onClick={copyShareLink} className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">{noteCopied ? '✓ Copiado!' : '🔗 Copiar Link'}</button>}
                      <div className="flex-1" />
                      <button onClick={() => deleteNote(activeNote.id)} className="text-[10px] font-black uppercase px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Excluir</button>
                    </div>
                    <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} onBlur={saveNote} placeholder="Título da anotação" className="w-full px-6 pt-5 pb-2 text-2xl font-black italic bg-transparent border-none outline-none text-white placeholder-gray-700" />
                    <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} onBlur={saveNote} placeholder="Escreva sua anotação aqui..." className="flex-1 w-full px-6 py-3 bg-transparent border-none outline-none text-sm text-gray-300 leading-relaxed resize-none placeholder-gray-700 custom-scrollbar min-h-[360px]" />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Usuários (admin) ─────────────────────────────────────── */}
        {!loading && activeTab === 'users' && isAdmin && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Usuários</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Gerencie acessos ao painel</p>
            </div>
            <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 font-bold">
                Novos cadastros chegam como <span className="uppercase">Pendentes</span> — ative para liberar o acesso. Ao ativar, o usuário é incluído no seu grupo de dados.
              </p>
            </div>
            <div className="card-glass rounded-xl overflow-hidden mb-12">
              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-800">
                {users.map((u) => {
                  const isFixed = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'].includes(u.email);
                  return (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#10b981]/20 flex items-center justify-center font-black text-[#10b981] text-sm uppercase flex-shrink-0">{u.name?.[0] || '?'}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`status-badge ${u.role === 'admin' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-gray-700 text-gray-300'}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                          <span className={`status-badge ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{u.active ? 'Ativo' : 'Pendente'}</span>
                        </div>
                      </div>
                      {!isFixed ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateUser(u.id, { active: !u.active })} className={`flex-1 text-[10px] font-black uppercase py-1.5 rounded transition ${u.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>{u.active ? 'Desativar' : 'Ativar'}</button>
                          <button onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })} className="flex-1 text-[10px] font-black uppercase py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">{u.role === 'admin' ? '− Admin' : '+ Admin'}</button>
                        </div>
                      ) : <p className="text-[10px] text-gray-600 font-bold uppercase">Admin fixo — não editável</p>}
                    </div>
                  );
                })}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/20"><th className="px-5 py-4">Usuário</th><th className="px-5 py-4">E-mail</th><th className="px-5 py-4">Cargo</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Ações</th></tr></thead>
                  <tbody>
                    {users.map((u) => {
                      const isFixed = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'].includes(u.email);
                      return (
                        <tr key={u.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                          <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center font-black text-[#10b981] text-xs uppercase flex-shrink-0">{u.name?.[0] || '?'}</div><span className="font-bold text-sm">{u.name}</span></div></td>
                          <td className="px-5 py-3 text-xs text-gray-400">{u.email}</td>
                          <td className="px-5 py-3"><span className={`status-badge ${u.role === 'admin' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-gray-700 text-gray-300'}`}>{u.role === 'admin' ? 'Admin' : 'Usuário'}</span></td>
                          <td className="px-5 py-3"><span className={`status-badge ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{u.active ? 'Ativo' : 'Pendente'}</span></td>
                          <td className="px-5 py-3">
                            {isFixed ? <span className="text-[10px] text-gray-600 font-bold uppercase">Fixo</span> : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateUser(u.id, { active: !u.active })} className={`text-[10px] font-black uppercase px-2.5 py-1 rounded transition ${u.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>{u.active ? 'Desativar' : 'Ativar'}</button>
                                <button onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })} className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">{u.role === 'admin' ? '− Admin' : '+ Admin'}</button>
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
      </main>

      {/* ── Modal: Lançar Produtos ────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="card-glass p-8 rounded-2xl w-full max-w-lg border border-[#10b981]/50">
            <h3 className="text-xl font-black uppercase italic mb-6">Lançar Quantidades</h3>
            <form onSubmit={handleProductSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Data do Lançamento</label>
                <input name="pDate" type="date" className="w-full p-2 rounded" required />
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">P - Comum</label><input name="pComum"  type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">P - Verificado</label><input name="pVerif"  type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Páginas</label><input name="pComDoc" type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">BM 260</label><input name="pBM"    type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">BM 1.4k</label><input name="pBM1k"  type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Proxy</label><input name="pRepo"  type="number" defaultValue="0" min="0" className="w-full p-2 rounded" /></div>
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
