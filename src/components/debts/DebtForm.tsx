import React, { useState, useEffect } from 'react';
import { Debt, DebtType, DebtStatus } from '../../types';
import { X, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Debt>) => void;
  initialData?: Debt | null;
}

export function DebtForm({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<Partial<Debt>>({
    contactName: '',
    amount: 0,
    type: 'owe',
    status: 'pending',
    notes: '',
    dueDate: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        contactName: '',
        amount: 0,
        type: 'owe',
        status: 'pending',
        notes: '',
        dueDate: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-[3px] z-50"
          />
          
          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-sm bg-white shadow-2xl border-l border-slate-200/80 z-50 flex flex-col sm:rounded-l-2xl"
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/40">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                  {initialData ? 'Ubah Catatan' : 'Tambah Catatan Baru'}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sistem Pencatatan Debts Pro</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 high-density-scrollbar bg-white">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Nama Peminjam / Kontak</label>
                  <input
                    required
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tipe Transaksi</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as DebtType })}
                      className="w-full text-xs font-bold px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="owe">Saya Berhutang</option>
                      <option value="owed">Saya Dipinjami</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as DebtStatus })}
                      className="w-full text-xs font-bold px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="pending">Belum Lunas</option>
                      <option value="paid">Sudah Lunas</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jumlah (Nominal)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.amount === 0 ? '' : formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full text-base font-mono font-bold pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-indigo-700 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-350"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Catatan / Keterangan</label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all"
                    placeholder="Tulis detil atau memo transaksi di sini..."
                  />
                </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/40">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white text-[11px] font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {initialData ? 'SIMPAN PERUBAHAN' : 'PROSES PENCATATAN'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
