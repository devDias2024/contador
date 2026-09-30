import React, { useState } from 'react';
import { X, Check, Receipt } from 'lucide-react';
import { ExpenseCategory, Expense } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'timestamp' | 'timeStr'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    onSaveExpense({
      amount: numAmount,
      category,
      description: description.trim(),
    });

    setAmount('');
    setDescription('');
    onClose();
  };

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'alimentacao', label: 'Almoço / Lanche' },
    { id: 'combustivel', label: 'Abastecimento Avulso' },
    { id: 'pedagio', label: 'Pedágio' },
    { id: 'lavagem', label: 'Lavagem Carro' },
    { id: 'manutencao', label: 'Manutenção / Pneu' },
    { id: 'outro', label: 'Outro Gasto' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <h2 className="font-extrabold text-base text-white">Registrar Gasto do Turno</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor do Gasto (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-rose-400 font-mono">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-xl font-bold focus:border-rose-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Tipo de Despesa
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`h-9 px-2 rounded-xl text-xs font-semibold border transition-all text-left truncate ${
                    category === c.id
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pastel e suco no posto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-rose-400 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={numAmount <= 0}
              className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
            >
              <Check size={18} strokeWidth={2.5} />
              <span>SALVAR GASTO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
