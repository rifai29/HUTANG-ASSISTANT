import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, RefreshCw, MessageSquare, PieChart as PieChartIcon, Wallet, LogOut, LogIn } from 'lucide-react';
import { Debt, DebtStats as IDebtStats } from './types';
import { DebtForm } from './components/debts/DebtForm';
import { cn, formatCurrency } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from './context/AuthContext';
import { useDb } from './context/DbContext';

export default function App() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const { addDebt, updateDebt, deleteDebt, subscribeToDebts } = useDb();
  
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owe' | 'owed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToDebts((data) => {
        setDebts(data);
      });
      return unsubscribe;
    } else {
      setDebts([]);
    }
  }, [user]);

  const stats = useMemo<IDebtStats>(() => {
    const unpaid = debts.filter(d => d.status === 'pending');
    const totalOwedToMe = unpaid.filter(d => d.type === 'owed').reduce((sum, d) => sum + d.amount, 0);
    const totalIOwe = unpaid.filter(d => d.type === 'owe').reduce((sum, d) => sum + d.amount, 0);
    return {
      totalOwedToMe,
      totalIOwe,
      netBalance: totalOwedToMe - totalIOwe,
    };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts
      .filter(d => {
        const matchesSearch = d.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (d.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || d.type === filterType;
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
      });
  }, [debts, searchQuery, filterType, filterStatus]);

  const handleFormSubmit = async (data: Partial<Debt>) => {
    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, data);
      } else {
        await addDebt(data);
      }
      setEditingDebt(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      try {
        await deleteDebt(id);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data');
      }
    }
  };

  const handleToggleStatus = async (debt: Debt) => {
    try {
      await updateDebt(debt.id, {
        status: debt.status === 'paid' ? 'pending' : 'paid',
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status');
    }
  };

  const fetchAiSummary = async () => {
    setIsAiLoading(true);
    try {
      const resp = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debts: debts.filter(d => d.status === 'pending') })
      });
      const data = await resp.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
      setAiSummary('Gagal mengambil ringkasan AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  const chartData = [
    { name: 'Piutang', value: stats.totalOwedToMe, color: '#10b981' },
    { name: 'Hutang', value: stats.totalIOwe, color: '#f43f5e' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-8">
            <Wallet className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Catatan Hutang</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Kelola hutang dan piutang Anda dengan mudah, aman, dan dapatkan ringkasan cerdas dari AI.
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Masuk dengan Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Debts Pro</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={logout} className="p-2 text-slate-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation - Hidden on mobile */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="h-14 border-b border-slate-200 flex items-center px-6 shrink-0">
          <div className="bg-indigo-600 p-1.5 rounded mr-3">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Debts Pro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Menu Utama</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
            <PieChartIcon className="w-4 h-4" />
            Dashboard Ringkasan
          </a>
          <div className="pt-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Laporan AI</div>
            <div className="px-3 py-2">
              <button 
                onClick={fetchAiSummary}
                disabled={isAiLoading || debts.length === 0}
                className="w-full text-left text-xs font-medium text-slate-600 flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Dapatkan Analisis
              </button>
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-900 truncate">{user.displayName || 'User'}</p>
                <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Dashboard Keuangan</h2>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">Ringkasan transaksi dan analisis saldo anda.</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto bg-white p-3 sm:p-0 rounded-2xl sm:bg-transparent border sm:border-0 border-slate-100">
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Status Bersih</p>
              <p className={cn(
                "text-xs md:text-sm font-bold tracking-tight",
                stats.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatCurrency(stats.netBalance)}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] md:text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Catatan Baru
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Piutang</p>
            <p className="text-base md:text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(stats.totalOwedToMe)}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hutang Aktif</p>
            <p className="text-base md:text-xl font-bold text-indigo-600 tracking-tight">{formatCurrency(stats.totalIOwe)}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 relative overflow-hidden flex items-center justify-between">
            <div className="relative z-10">
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Insight</p>
              <div className="text-[10px] md:text-[11px] text-slate-600 italic line-clamp-1 md:line-clamp-2 max-w-sm">
                {isAiLoading ? 'Menganalisis data...' : aiSummary || 'Gunakan tombol analisis di sidebar.'}
              </div>
            </div>
            <MessageSquare className="w-8 h-8 md:w-12 md:h-12 text-slate-50 absolute -right-2 -bottom-2 opacity-10" />
          </div>
        </div>

        {/* Detailed Table/Card Section */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl md:rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
            <h3 className="text-xs md:text-sm font-bold text-slate-700">Rincian Transaksi Detail</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                />
              </div>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-300 rounded-lg text-[10px] font-medium text-slate-600 bg-white focus:outline-none"
              >
                <option value="all">Semua Tipe</option>
                <option value="owe">Hutang</option>
                <option value="owed">Piutang</option>
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-300 rounded-lg text-[10px] font-medium text-slate-600 bg-white focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Tertunda</option>
                <option value="paid">Lunas</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-auto flex-1 high-density-scrollbar">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-white border-b border-slate-200 text-[10px] uppercase text-slate-400 font-bold tracking-widest z-10">
                <tr>
                  <th className="px-6 py-3">Nama / ID</th>
                  <th className="px-6 py-3">Jumlah</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3 text-center">Tanggal</th>
                  <th className="px-6 py-3">Keterangan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredDebts.length > 0 ? (
                    filteredDebts.map((debt) => (
                      <motion.tr 
                        key={debt.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "hover:bg-slate-50 border-b border-slate-50 transition-colors",
                          debt.status === 'paid' && "opacity-60"
                        )}
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{debt.contactName}</p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">#{debt.id.slice(-6)}</p>
                        </td>
                        <td className={cn(
                          "px-6 py-4 font-bold font-mono text-sm",
                          debt.type === 'owe' ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {formatCurrency(debt.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                            debt.type === 'owe' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {debt.type === 'owe' ? 'HUTANG' : 'PIUTANG'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-500">
                          {new Date(debt.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                          {debt.notes || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleStatus(debt)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all hover:scale-105",
                              debt.status === 'paid' 
                                ? "bg-slate-100 text-slate-500" 
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {debt.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => {
                              setEditingDebt(debt);
                              setIsFormOpen(true);
                            }}
                            className="text-indigo-600 font-bold hover:underline text-[10px]"
                          >
                            EDIT
                          </button>
                          <button 
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-rose-400 font-bold hover:underline text-[10px]"
                          >
                            HAPUS
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <p className="text-slate-400 font-medium text-sm italic">Data tidak ditemukan</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDebts.length > 0 ? (
                  filteredDebts.map((debt) => (
                    <motion.div
                      key={debt.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "bg-white border border-slate-100 rounded-xl p-4 shadow-sm",
                        debt.status === 'paid' && "opacity-60"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900">{debt.contactName}</h4>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">#{debt.id.slice(-6)}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                          debt.type === 'owe' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {debt.type === 'owe' ? 'HUTANG' : 'PIUTANG'}
                        </span>
                      </div>
                      
                      <div className="text-lg font-mono font-bold text-slate-900 mb-3">
                        {formatCurrency(debt.amount)}
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                        <div className="text-[10px] text-slate-500">
                          {new Date(debt.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleToggleStatus(debt)}
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              debt.status === 'paid' ? "text-slate-400" : "text-amber-600"
                            )}
                          >
                            {debt.status === 'paid' ? 'LUNASKAN' : 'BELUM'}
                          </button>
                          <button 
                            onClick={() => {
                              setEditingDebt(debt);
                              setIsFormOpen(true);
                            }}
                            className="text-indigo-600 text-[10px] font-bold uppercase"
                          >
                            EDIT
                          </button>
                          <button 
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-rose-400 text-[10px] font-bold uppercase"
                          >
                            HAPUS
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 text-xs italic">Data tidak ditemukan</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="mt-auto p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-500 uppercase tracking-widest shrink-0">
            <span>Menampilkan {filteredDebts.length} dari {debts.length} transaksi total</span>
          </div>
        </div>
      </main>

      <DebtForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDebt(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDebt}
      />
    </div>
  );
}

