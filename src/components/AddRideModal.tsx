import React, { useState } from 'react';
import { X, Check, DollarSign, Navigation, Sparkles, Plus } from 'lucide-react';
import { RideCategory, PaymentMethod, Ride } from '../types';
import { CATEGORY_LABELS, formatCurrency, getKmProfitabilityBadge } from '../utils/formatters';
import { sounds } from '../utils/audio';

interface AddRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRide: (ride: Omit<Ride, 'id' | 'timestamp' | 'timeStr'>) => void;
  soundEnabled: boolean;
}

export const AddRideModal: React.FC<AddRideModalProps> = ({
  isOpen,
  onClose,
  onSaveRide,
  soundEnabled,
}) => {
  const [grossValue, setGrossValue] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [category, setCategory] = useState<RideCategory>('99pop');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('app');
  const [tip, setTip] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const numGross = parseFloat(grossValue.replace(',', '.')) || 0;
  const numKm = parseFloat(distanceKm.replace(',', '.')) || 0;
  const numTip = parseFloat(tip.replace(',', '.')) || 0;

  const currentRatePerKm = numKm > 0 ? numGross / numKm : 0;
  const badge = getKmProfitabilityBadge(currentRatePerKm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numGross <= 0) return;

    onSaveRide({
      grossValue: numGross,
      distanceKm: numKm,
      category,
      paymentMethod,
      tip: numTip > 0 ? numTip : undefined,
      notes: notes.trim() || undefined,
    });

    if (soundEnabled) {
      sounds.playCashChime();
    }

    // Reset form
    setGrossValue('');
    setDistanceKm('');
    setTip('');
    setNotes('');
    onClose();
  };

  const categories: RideCategory[] = ['99pop', '99plus', '99moto', '99entrega', '99compartilhado', 'particular'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFBF00] flex items-center justify-center text-black font-extrabold text-sm">
              99
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Nova Corrida</h2>
              <p className="text-[11px] text-slate-400">Registre o valor e km da corrida da 99</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Gross Value Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor da Corrida (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-lg font-bold text-amber-400 font-mono">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder="0,00"
                value={grossValue}
                onChange={(e) => setGrossValue(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-2xl font-black focus:border-amber-400 focus:bg-white/10 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Distance Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Distância Percorrida (KM) *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="Ex: 5,4"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-base font-bold focus:border-amber-400 focus:bg-white/10 outline-none transition-colors"
              />
              <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-500 font-mono">
                KM
              </span>
            </div>
          </div>

          {/* Real-time Rate / Km Indicator */}
          {numGross > 0 && numKm > 0 && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Rentabilidade:</span>
                <span className="text-sm font-extrabold font-mono text-white">
                  {formatCurrency(currentRatePerKm)}/km
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${badge.color}`}>
                {badge.icon} {badge.label}
              </span>
            </div>
          )}

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Categoria 99
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                const info = CATEGORY_LABELS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`h-9 px-2 rounded-xl text-xs font-bold border transition-all truncate ${
                      isSelected
                        ? 'bg-[#FFBF00] text-black border-amber-400 shadow-md font-extrabold'
                        : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {info.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Forma de Recebimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'app', label: 'Cartão no App 99' },
                { id: 'dinheiro', label: 'Dinheiro em Mão' },
                { id: 'pix', label: 'Pix Direto' },
                { id: 'cartao_maquininha', label: 'Maquininha Própria' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`h-9 px-2 rounded-xl text-xs font-semibold border transition-all text-left truncate ${
                    paymentMethod === m.id
                      ? 'bg-white/15 text-white border-white/30'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Tip */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Gorjeta Adicional (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={numGross <= 0}
              className="w-full h-12 rounded-2xl bg-[#FFBF00] hover:bg-[#FFC91A] disabled:opacity-50 disabled:cursor-not-allowed font-black text-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              <Check size={18} strokeWidth={3} />
              <span>SALVAR CORRIDA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
