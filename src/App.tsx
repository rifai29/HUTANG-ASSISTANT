import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  PieChart as PieChartIcon, 
  Wallet, 
  LogOut, 
  LogIn, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Check, 
  Clock, 
  Trash2, 
  Edit2, 
  User, 
  Filter, 
  Calendar 
} from 'lucide-react';
import { Debt, DebtStats as IDebtStats } from './types';
import { DebtForm } from './components/debts/DebtForm';
import { cn, formatCurrency } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <Wallet className="absolute w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">Memuat sistem...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-slate-100 via-slate-50 to-indigo-50/30">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 text-center relative overflow-hidden"
        >
          {/* Decorative glowing top light */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-indigo-600" />
          
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/80 mx-auto mb-6">
            <Wallet className="text-white w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Catatan Hutang</h1>
          <p className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-5">Professional Ledger</p>
          
          <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            Aplikasi modern untuk mengelola, melacak, dan menganalisis catatan hutang & piutang secara real-time dengan bantuan AI asisten.
          </p>
          
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Masuk dengan Akun Google
          </button>
        </motion.div>
        
        <p className="mt-6 text-[10px] font-medium text-slate-400 tracking-wider uppercase">Aman • Cepat • Terintegrasi Cloud</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-100">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">Debts Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {user.displayName?.charAt(0) || user.email?.charAt(0)}
          </div>
          <button 
            onClick={logout} 
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="h-16 md:h-20 border-b border-slate-200 flex items-center px-6 shrink-0 gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">Debts Pro</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider leading-none mt-0.5">FINANCIAL JOURNAL</p>
          </div>
        </div>
        
        <nav className="flex-1 p-5 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Menu Utama</div>
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-50/80 text-indigo-700 rounded-xl text-xs md:text-[13px] font-bold hover:bg-indigo-50 transition-all border border-indigo-100/50">
            <PieChartIcon className="w-4 h-4 text-indigo-600" />
            Dashboard Ringkasan
          </a>
          <div className="pt-5 border-t border-slate-100 mt-5">
            <button 
              onClick={fetchAiSummary}
              disabled={isAiLoading || debts.length === 0}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl text-xs md:text-[13px] font-bold transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>Analisis AI</span>
            </button>
          </div>
        </nav>
        
        <div className="p-5 border-t border-slate-100 bg-slate-50/65">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-indigo-100">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm font-bold text-slate-950 truncate leading-snug">{user.displayName || 'User'}</p>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6 overflow-y-auto md:overflow-hidden min-h-0 bg-[#f8fafc]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:gap-4 shrink-0 mt-0.5 md:mt-0">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Keuangan Anda
            </h2>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-medium">Kelola dan pantau seluruh transaksi kredit secara praktis.</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto bg-white p-2.5 sm:p-0 rounded-xl sm:bg-transparent border sm:border-0 border-slate-100 mt-2.5 sm:mt-0 shadow-sm sm:shadow-none">
            <div className="text-right sm:mr-2">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold">Status Bersih</p>
              <p className={cn(
                "text-xs sm:text-sm md:text-base font-semibold font-mono",
                stats.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance)}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-[11px] md:text-xs font-bold py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-3.5 md:px-4 rounded-lg sm:rounded-xl shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1 sm:gap-1.5"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              Catatan Baru
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 shrink-0">
          <div className="bg-white p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-slate-400">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Total Piutang</span>
                <span className="text-emerald-500 bg-emerald-50 p-1 md:p-1.5 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-medium leading-none">Uang di orang lain</p>
            </div>
            <p className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-slate-900 font-mono tracking-tight mt-2 sm:mt-2.5 truncate">{formatCurrency(stats.totalOwedToMe)}</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-slate-400">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Hutang Aktif</span>
                <span className="text-rose-500 bg-rose-50 p-1 md:p-1.5 rounded-lg">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-medium leading-none">Tagihan wajib bayar</p>
            </div>
            <p className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-slate-900 font-mono tracking-tight mt-2 sm:mt-2.5 truncate">{formatCurrency(stats.totalIOwe)}</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm col-span-2 relative overflow-hidden hover:border-slate-200 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-450">Analisis AI Insight</span>
                <div className="text-[10px] sm:text-[11.5px] md:text-xs text-slate-500 italic mt-0.5 sm:mt-1 leading-normal max-w-sm">
                  {isAiLoading ? (
                    <span className="flex items-center gap-1.5 text-indigo-600 font-semibold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Menganalisis data transaksi...
                    </span>
                  ) : (
                    aiSummary || 'Tekan tombol di sebelah kanan untuk menganalisis data keuangan Anda secara instan menggunakan AI.'
                  )}
                </div>
              </div>
              
              <button
                onClick={fetchAiSummary}
                disabled={isAiLoading || debts.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl p-1.5 sm:p-2 md:p-2.5 transition-all shrink-0 hover:scale-105 active:scale-95 disabled:opacity-40"
                title="Dapatkan Ringkasan Keuangan AI"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              </button>
            </div>
            
            <div className="mt-2 text-[8px] sm:text-[9px] text-indigo-500 font-bold bg-indigo-50/50 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 w-fit flex items-center gap-1">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>GEMINI AI CO-PILOT</span>
            </div>
          </div>
        </div>

        {/* Detailed Table/Card Section */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl md:rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[350px]">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Rincian Transaksi</h3>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredDebts.length}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs border border-slate-200 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 w-full sm:w-44 focus:outline-none bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex gap-1.5 flex-1 sm:flex-none">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none hover:border-slate-300 cursor-pointer"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="owe">Saya Berhutang</option>
                  <option value="owed">Saya Dipinjami</option>
                </select>
                
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none hover:border-slate-300 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Belum Lunas</option>
                  <option value="paid">Lunas</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-auto flex-1 p-4 sm:p-5 high-density-scrollbar bg-slate-50/10">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredDebts.length > 0 ? (
                <div id="transaction-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDebts.map((debt) => (
                    <motion.div
                      key={debt.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "bg-white border rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between relative overflow-hidden group min-h-[190px]",
                        debt.status === 'paid' ? "border-slate-100 opacity-75 md:opacity-85 bg-slate-50/30" : "border-slate-250 bg-white"
                      )}
                    >
                      {/* Top Row: Contact Name & Status Type Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar Initials with custom status color */}
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm",
                            debt.type === 'owe'
                              ? "bg-rose-550/10 text-rose-600 border border-rose-100 bg-rose-50"
                              : "bg-emerald-550/10 text-emerald-600 border border-emerald-100 bg-emerald-50"
                          )}>
                            {debt.contactName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate leading-snug tracking-tight">
                              {debt.contactName}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block mt-0.5">
                              #{debt.id.slice(-6)}
                            </span>
                          </div>
                        </div>

                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider shrink-0",
                          debt.type === 'owe'
                            ? "bg-rose-50 text-rose-600 border border-rose-100/55"
                            : "bg-emerald-550/10 text-emerald-600 border border-emerald-100/55 bg-emerald-50"
                        )}>
                          {debt.type === 'owe' ? <ArrowDownLeft className="w-2.5 h-2.5 shrink-0" /> : <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />}
                          {debt.type === 'owe' ? 'HUTANG' : 'PIUTANG'}
                        </span>
                      </div>

                      {/* Middle Row: Amount */}
                      <div className="mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Jumlah Transaksi</div>
                        <p className={cn(
                          "text-base sm:text-lg font-mono font-bold tracking-tight truncate",
                          debt.type === 'owe' ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {debt.type === 'owe' ? '-' : '+'}{formatCurrency(debt.amount)}
                        </p>
                      </div>

                      {/* Display Notes/Comments (if any) */}
                      <div className="flex-1 mb-4 flex flex-col justify-end">
                        {debt.notes ? (
                          <div className="text-[11px] text-slate-500 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-semibold line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                            {debt.notes}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-350 italic bg-slate-50/30 p-2 rounded-xl border border-dashed border-slate-100">
                            tidak ada keterangan tambahan
                          </div>
                        )}
                      </div>

                      {/* Action & Metadata Footer */}
                      <div className="border-t border-slate-100/80 pt-3 mt-auto flex items-center justify-between shrink-0">
                        {/* Transaction Date */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          <span>{new Date(debt.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>

                        {/* Interactive Buttons Container */}
                        <div className="flex items-center gap-2">
                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(debt)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase transition-all duration-150 active:scale-95 shadow-sm border cursor-pointer",
                              debt.status === 'paid'
                                ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            )}
                          >
                            {debt.status === 'paid' ? 'LUNAS' : 'PENDING'}
                          </button>

                          {/* Edit / Delete Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => {
                                setEditingDebt(debt);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all cursor-pointer"
                              title="Ubah Catatan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-slate-100/80 p-3 rounded-2xl mb-3">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight mb-1">Transaksi Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-400 max-w-xs font-medium">Ubah kata kunci pencarian atau bersihkan filter untuk menampilkan data lainnya.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-auto p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">
            <span>Menampilkan {filteredDebts.length} dari {debts.length} transaksi</span>
            <span className="text-[10px] text-slate-500 font-bold">DEBTS CLOUD SYSTEM</span>
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


