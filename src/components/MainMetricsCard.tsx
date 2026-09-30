import React from 'react';
import { formatCurrency, formatKm, getKmProfitabilityBadge } from '../utils/formatters';
import { PlusCircle, TrendingUp, Navigation, DollarSign, Sparkles } from 'lucide-react';

interface MainMetricsCardProps {
  grossTotal: number;
  netProfit: number;
  totalKm: number;
  ratePerKm: number;
  ridesCount: number;
  onAddRide: () => void;
  onOpenCalculator: () => void;
}

export const MainMetricsCard: React.FC<MainMetricsCardProps> = ({
  grossTotal,
  netProfit,
  totalKm,
  ratePerKm,
  ridesCount,
  onAddRide,
  onOpenCalculator,
}) => {
  const badge = getKmProfitabilityBadge(ratePerKm);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#14161B] border border-white/10 shadow-2xl p-5 md:p-6">
      {/* Subtle modern amber ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-[#FFB800]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Top row with Title and Rides count */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <DollarSign size={14} className="text-[#FFC000]" />
          Ganho Bruto do Dia
        </span>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          <span>{ridesCount} {ridesCount === 1 ? 'corrida' : 'corridas'}</span>
        </div>
      </div>

      {/* Hero Gross Value Display */}
      <div className="relative z-10 my-1">
        <div className="text-4xl md:text-5xl font-black tracking-tight text-[#FFC000] font-mono tabular-nums leading-none py-1 truncate">
          {formatCurrency(grossTotal)}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4 relative z-10" />

      {/* 3 Balanced Sub-metrics Grid (Fixes old app awkward vertical wrapping!) */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {/* Metric 1: Lucro Líquido */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-tight truncate mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">Lucro Líquido</span>
          </div>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono tabular-nums truncate whitespace-nowrap">
            {formatCurrency(netProfit)}
          </span>
          <span className="text-[10px] text-slate-500 truncate">
            {grossTotal > 0 ? `${Math.round((netProfit / grossTotal) * 100)}% margem` : 'Líquido real'}
          </span>
        </div>

        {/* Metric 2: KM Rodados */}
        <div className="flex flex-col min-w-0 border-x border-white/5 px-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-tight truncate mb-1">
            <Navigation size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">KM Rodados</span>
          </div>
          <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums truncate whitespace-nowrap">
            {formatKm(totalKm)}
          </span>
          <span className="text-[10px] text-slate-500 truncate">
            Total percorrido
          </span>
        </div>

        {/* Metric 3: R$ / KM */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-tight truncate mb-1">
            <TrendingUp size={11} className="text-[#38BDF8] shrink-0" />
            <span className="truncate">R$ / KM</span>
          </div>
          <span className="text-base sm:text-lg font-bold text-[#38BDF8] font-mono tabular-nums truncate whitespace-nowrap">
            {totalKm > 0 ? `${formatCurrency(ratePerKm)}` : 'R$ 0,00'}
          </span>
          <span className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
            {totalKm > 0 ? (
              <span className="truncate">{badge.icon} {badge.label}</span>
            ) : (
              'Eficiência'
            )}
          </span>
        </div>
      </div>

      {/* Prominent Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 relative z-10">
        <button
          onClick={onAddRide}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#FFBF00] to-[#FFA000] hover:from-[#FFC91A] hover:to-[#FFB300] active:scale-[0.98] transition-all font-bold text-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <PlusCircle size={18} className="text-black" />
          <span>+ ADICIONAR CORRIDA</span>
        </button>

        <button
          onClick={onOpenCalculator}
          className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/15 transition-all font-semibold text-white text-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={16} className="text-amber-400" />
          <span>Radar 99 · Avaliar Corrida</span>
        </button>
      </div>
    </div>
  );
};
