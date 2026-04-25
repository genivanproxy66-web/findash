'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [txRes, prRes] = await Promise.all([
      fetch('/api/transactions'),
      fetch('/api/products'),
    ]);
    setTransactions(await txRes.json());
    setProducts(await prRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-gray-800">
        <div className="text-[#10b981] font-black text-xl italic">FinDash</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

            {navItem(
              'dashboard',
              'Visão Geral',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}

            {navItem(
              'products',
              'Produtos',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}

            {navItem(
              'monthly',
              'Relatórios',
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#10b981] flex items-center justify-center font-bold text-black uppercase">
              F
            </div>
            <div>
              <p className="text-sm font-bold">Modo Online</p>
              <p className="text-[10px] text-gray-500">Dados na Nuvem</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Carregando...</div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {!loading && activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Visão Geral</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{currentDate}</p>
              </div>
            </div>

            {/* Form */}
            <section className="card-glass rounded-xl p-6 border-[#10b981]/30 border mb-8">
              <form
                onSubmit={handleTransactionSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                  <input
                    name="clientName"
                    type="text"
                    placeholder="Nome/Serviço"
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor (R$)</label>
                  <input
                    name="saleValue"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none"
                    required
                  />
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
                <button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase italic py-2 rounded-lg transition transform active:scale-95"
                >
                  Registrar
                </button>
              </form>
            </section>

            {/* Stat Cards */}
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

            {/* Table */}
            <section className="card-glass rounded-xl overflow-hidden mb-12">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h4 className="font-bold text-lg uppercase italic tracking-tight">Histórico Recente</h4>
                <button onClick={clearFinance} className="text-[10px] font-bold text-red-500 uppercase">
                  Limpar Tudo
                </button>
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
                          <td className={`px-6 py-4 font-black italic ${isInc ? 'text-emerald-400' : 'text-red-400'}`}>
                            R${fmt(Number(tx.value))}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`status-badge ${isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-500">
                            {new Date(Number(tx.timestamp)).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="text-gray-600 hover:text-red-500 text-lg"
                            >
                              ×
                            </button>
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

        {/* PRODUCTS TAB */}
        {!loading && activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Produtos</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Modelo de Planilha de Controle
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-[#10b981] px-6 py-2 rounded text-black font-black uppercase text-xs italic"
              >
                + Lançar Dia
              </button>
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
                      const qVendas =
                        (row.comum || 0) +
                        (row.com_doc || 0) +
                        (row.rest || 0) +
                        (row.verif || 0) +
                        (row.bm || 0) +
                        (row.repo || 0);
                      return (
                        <tr key={row.id}>
                          <td className="bg-gray-800/50 font-bold">
                            {new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </td>
                          <td>{row.comum ? row.comum + ' PERFIL' : '-'}</td>
                          <td>{row.com_doc ? row.com_doc + ' PERFIL' : '-'}</td>
                          <td>{row.rest ? row.rest + ' PERFIL' : '-'}</td>
                          <td>{row.verif ? row.verif + ' PERFIL' : '-'}</td>
                          <td>{row.bm ? row.bm + ' BM' : '-'}</td>
                          <td>{row.repo ? row.repo + ' PERFIL' : '-'}</td>
                          <td className="font-bold text-red-400 bg-red-400/5">{qVendas}</td>
                          <td>
                            <button
                              onClick={() => deleteProduct(row.id)}
                              className="text-gray-700 hover:text-red-500"
                            >
                              ×
                            </button>
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

        {/* MONTHLY REPORT TAB */}
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
                  <div
                    key={i}
                    className="card-glass p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4"
                  >
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

      {/* Modal Produto */}
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
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-800 py-2 rounded text-xs font-bold"
                >
                  CANCELAR
                </button>
                <button type="submit" className="flex-1 bg-[#10b981] py-2 rounded text-black font-black italic">
                  SALVAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
