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
  Filter,
  Radio,
  Play,
  Pause,
  ExternalLink,
  Smartphone,
  Info
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
                COPILOTO AUTOMÁTICO ROTAPRO
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Sobreposição Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quando tocar a corrida, o balão aparece sozinho sobre o app da 99 com o resultado
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

      {/* Automatic Radar Dispatch Card */}
      <div className="p-4 rounded-2xl bg-black/50 border border-amber-400/40 mb-4 relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className={settings.autoRadarEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
            <div>
              <span className="text-xs font-black text-white uppercase tracking-tight block">
                Radar Automático de Corridas 99
              </span>
              <span className="text-[11px] text-slate-400">
                {settings.autoRadarEnabled
                  ? `Ativo · Disparando e avaliando chamadas a cada ${settings.autoRadarIntervalSec || 20}s`
                  : 'Desligado · Ative para receber chamadas automaticamente com o balão'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onUpdateSettings({ ...settings, autoRadarEnabled: !settings.autoRadarEnabled })}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md ${
              settings.autoRadarEnabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-[#FFBF00] hover:bg-[#FFC91A] text-black'
            }`}
          >
            {settings.autoRadarEnabled ? 'LIGADO' : 'ATIVAR'}
          </button>
        </div>

        {settings.autoRadarEnabled && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Intervalo das chamadas:</span>
            <div className="flex items-center gap-1.5">
              {[15, 25, 45].map((sec) => (
                <button
                  key={sec}
                  onClick={() => onUpdateSettings({ ...settings, autoRadarIntervalSec: sec })}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                    (settings.autoRadarIntervalSec || 20) === sec
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        )}
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
          <span>{isBalloonEnabled ? '🟢 BALÃO FLUTUANTE ATIVO NA TELA' : '▶ ATIVAR BALÃO FLUTUANTE'}</span>
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

      {/* Copilot Performance Stats */}
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

      {/* HOW TO OVERLAY OFFICIAL 99 APP EXPLANATION (Driver Guide) */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 relative z-10 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Info size={14} />
          <span>Como funciona a sobreposição no aplicativo oficial da 99:</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          1. Ative a <strong>Janela Flutuante (PiP)</strong> ou mantenha o balão ativo na tela do navegador.<br />
          2. Abra o app de motorista da 99 normalmente no celular.<br />
          3. O balão fica visível flutuando por cima do mapa da 99.<br />
          4. Quando tocar a corrida, o alarme toca, a contagem de <strong>15 segundos</strong> começa e o veredito aparece em destaque!
        </p>
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
          Disparar Chamada Manual de Teste:
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
