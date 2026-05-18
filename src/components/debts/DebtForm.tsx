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
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50"
          />
          
          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-sm bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col sm:rounded-l-[20px]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {initialData ? 'Ubah Catatan' : 'Tambah Catatan Baru'}
              </h2>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 high-density-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Peminjam / Kontak</label>
                  <input
                    required
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Masukkan nama..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Transaksi</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as DebtType })}
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:bg-white outline-none"
                    >
                      <option value="owe">Saya Berhutang</option>
                      <option value="owed">Saya Dipinjami</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as DebtStatus })}
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:bg-white outline-none"
                    >
                      <option value="pending">Belum Lunas</option>
                      <option value="paid">Sudah Lunas</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah (Nominal)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.amount === 0 ? '' : formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full text-lg font-mono font-bold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-indigo-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan / Keterangan</label>
                  <textarea
                    rows={6}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all"
                    placeholder="Masukkan alasan peminjaman, jaminan, atau info penting lainnya..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white text-xs font-bold py-3.5 rounded hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {initialData ? 'Simpan Perubahan' : 'Proses Pencatatan'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
