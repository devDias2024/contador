import React from 'react';
import { ShiftState } from '../types';
import { Volume2, VolumeX, Settings, Radio } from 'lucide-react';
import { formatShortDuration } from '../utils/formatters';

interface HeaderProps {
  shift: ShiftState;
  shiftDurationSec: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenShiftModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shift,
  shiftDurationSec,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenShiftModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9900] via-[#FFBF00] to-[#FFD54F] flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-extrabold text-base tracking-tighter select-none">
            99
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                199+ CONTADOR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Gestão de Lucro Real para Motoristas
            </p>
          </div>
        </div>

        {/* Action Controls & Turno Status */}
        <div className="flex items-center gap-2">
          {/* Turno Status Button */}
          <button
            onClick={onOpenShiftModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              shift.isActive && !shift.isPaused
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
                : shift.isPaused
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Clique para gerenciar o turno"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                shift.isActive && !shift.isPaused
                  ? 'bg-emerald-400 animate-pulse'
                  : shift.isPaused
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="tracking-wide">
              {shift.isActive && !shift.isPaused
                ? `TURNO ON · ${formatShortDuration(shiftDurationSec)}`
                : shift.isPaused
                ? 'PAUSADO'
                : 'TURNO OFF'}
            </span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Silenciar efeitos' : 'Ativar efeitos sonoros'}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Settings modal trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="Configurações do veículo e cálculo"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
