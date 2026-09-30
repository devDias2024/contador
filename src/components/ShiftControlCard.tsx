import React from 'react';
import { Play, Pause, Square, Clock, RotateCcw, Zap, DollarSign } from 'lucide-react';
import { ShiftState } from '../types';
import { formatDuration, formatCurrency } from '../utils/formatters';

interface ShiftControlCardProps {
  shift: ShiftState;
  durationSeconds: number;
  grossTotal: number;
  netProfit: number;
  ridesCount: number;
  onStartShift: () => void;
  onPauseShift: () => void;
  onResumeShift: () => void;
  onFinishShift: () => void;
  onResetDay: () => void;
}

export const ShiftControlCard: React.FC<ShiftControlCardProps> = ({
  shift,
  durationSeconds,
  grossTotal,
  netProfit,
  ridesCount,
  onStartShift,
  onPauseShift,
  onResumeShift,
  onFinishShift,
  onResetDay,
}) => {
  const hoursFraction = durationSeconds > 0 ? durationSeconds / 3600 : 0;
  const grossPerHour = hoursFraction > 0 ? grossTotal / hoursFraction : 0;
  const netPerHour = hoursFraction > 0 ? netProfit / hoursFraction : 0;

  return (
    <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              shift.isActive && !shift.isPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : shift.isPaused
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight uppercase">
                {shift.isActive
                  ? shift.isPaused
                    ? 'TURNO PAUSADO'
                    : 'TURNO EM ANDAMENTO'
                  : 'TURNO DESATIVADO'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {shift.isActive
                ? shift.isPaused
                  ? 'Retome o turno para continuar computando o tempo'
                  : 'Tempo ativo de trabalho sendo contabilizado'
                : 'Inicie o turno ao sair de casa para medir seus ganhos por hora'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Timer & Productivity Box */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tempo de Trabalho:
          </span>
          <span className="text-lg font-black text-white font-mono tabular-nums">
            {formatDuration(durationSeconds)}
          </span>
        </div>

        {durationSeconds > 60 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 block">R$ Bruto / Hora:</span>
              <span className="text-xs font-bold text-amber-400 font-mono tabular-nums">
                {formatCurrency(grossPerHour)}/h
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Lucro Líquido / Hora:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                {formatCurrency(netPerHour)}/h
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Shift Action Buttons */}
      <div className="space-y-2 mb-3">
        {!shift.isActive ? (
          <button
            onClick={onStartShift}
            className="w-full h-12 rounded-2xl bg-[#10B981] hover:bg-[#059669] active:scale-[0.98] transition-all font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Play size={16} fill="white" />
            <span>INICIAR TURNO</span>
          </button>
        ) : shift.isPaused ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onResumeShift}
              className="h-12 rounded-2xl bg-[#10B981] hover:bg-[#059669] active:scale-[0.98] transition-all font-bold text-white text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <Play size={16} fill="white" />
              <span>RETOMAR TURNO</span>
            </button>
            <button
              onClick={onFinishShift}
              className="h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.98] text-slate-200 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Square size={14} />
              <span>FINALIZAR</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPauseShift}
              className="h-12 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 active:scale-[0.98] text-amber-300 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Pause size={16} />
              <span>PAUSAR TURNO</span>
            </button>
            <button
              onClick={onFinishShift}
              className="h-12 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 active:scale-[0.98] text-rose-300 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Square size={14} />
              <span>FINALIZAR</span>
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Day and KM (From User's Screenshot 3) */}
      <button
        onClick={onResetDay}
        className="w-full h-11 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 active:scale-[0.98] transition-all text-rose-400 font-bold text-xs flex items-center justify-center gap-2"
      >
        <RotateCcw size={14} />
        <span>ZERAR DIA E ZERAR KM</span>
      </button>
    </div>
  );
};
