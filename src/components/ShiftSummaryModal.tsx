import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, TrendingUp, Navigation, DollarSign, Clock } from 'lucide-react';
import { formatCurrency, formatKm, formatShortDuration, generateWhatsAppReport } from '../utils/formatters';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  grossTotal: number;
  netProfit: number;
  totalKm: number;
  fuelCostTotal: number;
  totalExpenses: number;
  ridesCount: number;
  ratePerKm: number;
  shiftDurationSec: number;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({
  isOpen,
  onClose,
  grossTotal,
  netProfit,
  totalKm,
  fuelCostTotal,
  totalExpenses,
  ridesCount,
  ratePerKm,
  shiftDurationSec,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date());
  const hoursFraction = shiftDurationSec > 0 ? shiftDurationSec / 3600 : 0;
  const avgPerHour = hoursFraction > 0 ? grossTotal / hoursFraction : 0;
  const shiftHoursStr = formatShortDuration(shiftDurationSec);

  const reportText = generateWhatsAppReport({
    dateStr: todayStr,
    grossTotal,
    netProfit,
    totalKm,
    fuelCostTotal,
    totalExpenses,
    ridesCount,
    avgPerKm: ratePerKm,
    avgPerHour,
    shiftHoursStr,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              📊
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Resumo de Fechamento</h2>
              <p className="text-[11px] text-slate-400">Balanço consolidado do seu turno na 99</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Big Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-300 block mb-1">
              Faturamento Bruto
            </span>
            <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
              {formatCurrency(grossTotal)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {ridesCount} corridas
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
              Lucro Líquido Real
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
              {formatCurrency(netProfit)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Livre no bolso
            </span>
          </div>
        </div>

        {/* Detailed stats */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 mb-4 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>KM Total Percorrido:</span>
            <span className="font-bold text-white font-mono">{formatKm(totalKm)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Custo de Combustível:</span>
            <span className="font-bold text-rose-400 font-mono">- {formatCurrency(fuelCostTotal)}</span>
          </div>
          {totalExpenses > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Outras Despesas:</span>
              <span className="font-bold text-rose-400 font-mono">- {formatCurrency(totalExpenses)}</span>
            </div>
          )}
          <div className="h-px bg-white/5 my-1" />
          <div className="flex justify-between text-slate-300">
            <span>Produtividade Média R$/KM:</span>
            <span className="font-bold text-[#38BDF8] font-mono">{formatCurrency(ratePerKm)}/km</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Média por Hora de Turno:</span>
            <span className="font-bold text-amber-400 font-mono">{formatCurrency(avgPerHour)}/h</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Duração do Turno:</span>
            <span className="font-bold text-slate-200 font-mono">{shiftHoursStr}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleShareWhatsApp}
            className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <MessageSquare size={18} fill="black" />
            <span>COMPARTILHAR NO WHATSAPP</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Relatório Copiado!' : 'Copiar Texto do Relatório'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
