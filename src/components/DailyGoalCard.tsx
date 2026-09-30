import React, { useState } from 'react';
import { Target, CheckCircle2, TrendingUp, Sparkles, Edit3 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface DailyGoalCardProps {
  targetAmount: number;
  currentAmount: number;
  onUpdateTarget: (newTarget: number) => void;
  soundEnabled: boolean;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  targetAmount,
  currentAmount,
  onUpdateTarget,
  soundEnabled,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetAmount.toString());

  const progress = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const isGoalReached = currentAmount >= targetAmount && targetAmount > 0;

  const handleSaveTarget = () => {
    const val = parseFloat(tempTarget);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(val);
      setIsEditing(false);
    }
  };

  const presetGoals = [150, 200, 250, 300, 400];

  return (
    <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Target size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">
              META DIÁRIA
            </h3>
            <p className="text-xs text-slate-400">
              Meta: <span className="font-bold text-white font-mono">{formatCurrency(targetAmount)}</span>
            </p>
          </div>
        </div>

        {/* Percentage badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className={`text-sm font-extrabold font-mono tabular-nums ${isGoalReached ? 'text-emerald-400' : 'text-amber-400'}`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-3 rounded-full bg-white/5 border border-white/5 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                : 'bg-gradient-to-r from-[#FFBF00] to-[#FFA000]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-xs">
          <div>
            {isGoalReached ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} />
                Meta atingida! (+{formatCurrency(currentAmount - targetAmount)})
              </span>
            ) : (
              <span className="text-slate-400">
                Faltam <span className="font-bold text-white font-mono">{formatCurrency(remaining)}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setTempTarget(targetAmount.toString());
              setIsEditing(!isEditing);
            }}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Edit3 size={12} />
            <span>{isEditing ? 'Fechar' : 'Alterar meta'}</span>
          </button>
        </div>
      </div>

      {/* Inline editing drawer */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Escolha uma meta rápida ou digite:
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presetGoals.map((val) => (
              <button
                key={val}
                onClick={() => {
                  onUpdateTarget(val);
                  setIsEditing(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  targetAmount === val
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                R$ {val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                placeholder="Ex: 220"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
            </div>
            <button
              onClick={handleSaveTarget}
              className="h-10 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#FFC91A] text-black font-bold text-xs shadow"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
