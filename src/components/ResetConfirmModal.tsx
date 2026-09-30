import React from 'react';
import { AlertTriangle, RotateCcw, X, Archive } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (archiveBeforeReset: boolean) => void;
  grossTotal: number;
  ridesCount: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  grossTotal,
  ridesCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Zerar Dia e Zerar KM?</h3>
            <p className="text-xs text-slate-400">Esta ação irá reiniciar os contadores de hoje</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 my-4 space-y-1 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Faturamento atual:</span>
            <span className="font-bold text-amber-400 font-mono">{formatCurrency(grossTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Corridas registradas:</span>
            <span className="font-bold text-white font-mono">{ridesCount}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Você deseja arquivar o fechamento deste turno antes de zerar para não perder seu histórico?
        </p>

        <div className="space-y-2">
          <button
            onClick={() => onConfirmReset(true)}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow"
          >
            <Archive size={15} />
            <span>Salvar no Histórico & Zerar Dia</span>
          </button>

          <button
            onClick={() => onConfirmReset(false)}
            className="w-full h-10 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Zerar Diretamente Sem Salvar</span>
          </button>

          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
