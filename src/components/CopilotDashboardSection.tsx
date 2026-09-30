import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Fuel, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { CopilotSettings, EvaluatedOffer, VehicleConfig, RideCategory } from '../types';
import { formatCurrency, formatKm } from '../utils/formatters';

interface CopilotDashboardSectionProps {
  settings: CopilotSettings;
  onUpdateSettings: (settings: CopilotSettings) => void;
  isBalloonEnabled: boolean;
  onToggleBalloon: (enabled: boolean) => void;
  evaluatedOffers: EvaluatedOffer[];
  config: VehicleConfig;
  onQuickSimulate: (type: 'ouro' | 'media' | 'prejuizo' | 'longe') => void;
  onOpenSettings: () => void;
}

export const CopilotDashboardSection: React.FC<CopilotDashboardSectionProps> = ({
  settings,
  onUpdateSettings,
  isBalloonEnabled,
  onToggleBalloon,
  evaluatedOffers,
  config,
  onQuickSimulate,
  onOpenSettings,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Statistics from offers
  const acceptedOffers = evaluatedOffers.filter((o) => o.actionTaken === 'aceitou');
  const refusedOffers = evaluatedOffers.filter((o) => o.actionTaken === 'recusou');
  
  // Fuel saved by refusing bad offers!
  const fuelSaved = refusedOffers.reduce((sum, o) => sum + o.costFuel, 0);
  const totalOffersCount = evaluatedOffers.length;
  const acceptanceRate = totalOffersCount > 0 ? Math.round((acceptedOffers.length / totalOffersCount) * 100) : 0;

  return (
    <div className="rounded-3xl bg-[#14161B] border border-amber-400/30 p-5 shadow-2xl relative overflow-hidden">
      {/* Amber glow accent */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Section Header */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF9900] to-[#FFBF00] text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight uppercase">
                COPILOTO ROTAPRO
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Semáforo Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Avaliação financeira instantânea antes de você aceitar a corrida na 99
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
            showSettingsDrawer
              ? 'bg-amber-400 text-black border-amber-400'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title="Configurar metas do semáforo"
        >
          <Sliders size={16} />
        </button>
      </div>

      {/* Balão Toggle & Voice Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 relative z-10">
        <button
          onClick={() => onToggleBalloon(!isBalloonEnabled)}
          className={`h-12 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isBalloonEnabled
              ? 'bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300'
              : 'bg-[#FFBF00] hover:bg-[#FFC91A] text-black font-extrabold'
          }`}
        >
          <Bot size={16} />
          <span>{isBalloonEnabled ? '🟢 BALÃO DO COPILOTO ATIVO' : '▶ ATIVAR BALÃO DO COPILOTO'}</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ ...settings, voiceAlerts: !settings.voiceAlerts })}
          className={`h-12 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            settings.voiceAlerts
              ? 'bg-white/10 border-white/20 text-amber-300'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          {settings.voiceAlerts ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
          <span>{settings.voiceAlerts ? 'Voz do Copiloto: Ligada' : 'Voz do Copiloto: Mudo'}</span>
        </button>
      </div>

      {/* Copilot Performance Stats (Drivers love this!) */}
      <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-black/40 border border-white/5 mb-4 relative z-10">
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Avaliadas
          </span>
          <span className="text-base font-black text-white font-mono tabular-nums">
            {totalOffersCount}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {acceptedOffers.length} aceitas
          </span>
        </div>

        <div className="text-center border-x border-white/10 px-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Seletividade
          </span>
          <span className="text-base font-black text-[#38BDF8] font-mono tabular-nums">
            {acceptanceRate}%
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            {refusedOffers.length} recusadas
          </span>
        </div>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
            Economia
          </span>
          <span className="text-base font-black text-emerald-400 font-mono tabular-nums truncate">
            {formatCurrency(fuelSaved)}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            em combustível
          </span>
        </div>
      </div>

      {/* Inline Settings Drawer */}
      {showSettingsDrawer && (
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-amber-400/30 mb-4 space-y-3 animate-fade-in relative z-10">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Metas do Semáforo RotaPro
            </span>
            <span className="text-[11px] text-amber-400">Personalize seus limites</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                R$/KM Mínimo
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.minRatePerKm}
                onChange={(e) => onUpdateSettings({ ...settings, minRatePerKm: parseFloat(e.target.value) || 1.8 })}
                className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                R$/Hora Mínimo
              </label>
              <input
                type="number"
                step="1"
                value={settings.minRatePerHour}
                onChange={(e) => onUpdateSettings({ ...settings, minRatePerHour: parseFloat(e.target.value) || 35 })}
                className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Busca Máx (KM)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.maxPickupKm}
                onChange={(e) => onUpdateSettings({ ...settings, maxPickupKm: parseFloat(e.target.value) || 3 })}
                className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Perfil de Exigência
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['conservador', 'equilibrado', 'arrojado'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateSettings({ ...settings, sensitivity: s })}
                  className={`py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                    settings.sensitivity === s
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simulator Quick Action Buttons */}
      <div className="space-y-1.5 relative z-10">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Testar Avaliações com 1 Clique:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onQuickSimulate('ouro')}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-left transition-all"
          >
            <span className="text-[10px] block opacity-80">Pop Ouro</span>
            <span>R$ 29 / 6,4 km</span>
          </button>

          <button
            onClick={() => onQuickSimulate('media')}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold text-left transition-all"
          >
            <span className="text-[10px] block opacity-80">Média Cautela</span>
            <span>R$ 15 / 6,8 km</span>
          </button>

          <button
            onClick={() => onQuickSimulate('prejuizo')}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold text-left transition-all"
          >
            <span className="text-[10px] block opacity-80">Prejuízo</span>
            <span>R$ 10 / 11 km</span>
          </button>

          <button
            onClick={() => onQuickSimulate('longe')}
            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold text-left transition-all"
          >
            <span className="text-[10px] block opacity-80">Viagem Longa</span>
            <span>R$ 48 / 30 km</span>
          </button>
        </div>
      </div>
    </div>
  );
};
