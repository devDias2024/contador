import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Sliders, 
  TrendingUp, 
  Clock, 
  Fuel, 
  Zap, 
  Radio, 
  Play,
  RotateCcw
} from 'lucide-react';
import { EvaluatedOffer, CopilotSettings, VehicleConfig, RideCategory, Ride } from '../types';
import { formatCurrency, formatKm } from '../utils/formatters';
import { evaluateRideOffer } from '../utils/copilotEngine';
import { sounds } from '../utils/audio';

interface CopilotBalloonProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  config: VehicleConfig;
  settings: CopilotSettings;
  onUpdateSettings: (settings: CopilotSettings) => void;
  onAcceptRide: (ride: Omit<Ride, 'id' | 'timestamp' | 'timeStr'>) => void;
  onLogRefusal: (offer: EvaluatedOffer) => void;
  activeOffer: EvaluatedOffer | null;
  setActiveOffer: (offer: EvaluatedOffer | null) => void;
}

export const CopilotBalloon: React.FC<CopilotBalloonProps> = ({
  isOpen,
  onToggleOpen,
  config,
  settings,
  onUpdateSettings,
  onAcceptRide,
  onLogRefusal,
  activeOffer,
  setActiveOffer,
}) => {
  // Draggable position
  const [position, setPosition] = useState({ x: 16, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);

  // Quick inputs
  const [inputGross, setInputGross] = useState('');
  const [inputTripKm, setInputTripKm] = useState('');
  const [inputPickupKm, setInputPickupKm] = useState('');
  const [inputCategory, setInputCategory] = useState<RideCategory>('99pop');

  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 16, initialY: 85 });
  const balloonRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(8, Math.min(window.innerWidth - 330, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(50, Math.min(window.innerHeight - 120, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Perform evaluation
  const handleEvaluateCustom = (grossStr?: string, tripKmStr?: string, pickupKmStr?: string) => {
    const gross = parseFloat((grossStr || inputGross).replace(',', '.')) || 0;
    const trip = parseFloat((tripKmStr || inputTripKm).replace(',', '.')) || 0;
    const pickup = parseFloat((pickupKmStr || inputPickupKm).replace(',', '.')) || 0;

    if (gross <= 0 || trip <= 0) return;

    const evaluation = evaluateRideOffer({
      grossValue: gross,
      tripKm: trip,
      pickupKm: pickup,
      category: inputCategory,
      config,
      settings,
    });

    setActiveOffer(evaluation);
    setIsExpanded(true);
    setIsQuickInputOpen(false);

    // Audio and Voice feedback
    sounds.playVerdictChime(evaluation.verdict);
    if (settings.voiceAlerts) {
      const voiceText = evaluation.verdict === 'verde'
        ? `Corrida excelente! R$ ${evaluation.ratePerKm.toFixed(2)} por quilômetro. Lucro de R$ ${evaluation.netProfit.toFixed(2)}`
        : evaluation.verdict === 'amarelo'
        ? `Atenção: corrida de valor médio, lucro limpo de R$ ${evaluation.netProfit.toFixed(2)}`
        : `Recuse! Rendimento baixo de apenas R$ ${evaluation.ratePerKm.toFixed(2)} por quilômetro.`;
      sounds.speak(voiceText);
    }
  };

  // Preset quick calls for simulation
  const handleSimulatePreset = (type: 'ouro' | 'media' | 'prejuizo' | 'longe') => {
    let g = 24.50;
    let t = 6.2;
    let p = 1.0;
    let cat: RideCategory = '99pop';

    if (type === 'ouro') {
      g = 28.90;
      t = 6.4;
      p = 0.8;
      cat = '99plus';
    } else if (type === 'media') {
      g = 14.50;
      t = 6.8;
      p = 1.5;
      cat = '99pop';
    } else if (type === 'prejuizo') {
      g = 9.80;
      t = 7.5;
      p = 3.2; // long pickup
      cat = '99pop';
    } else if (type === 'longe') {
      g = 48.00;
      t = 28.0;
      p = 2.0;
      cat = '99pop';
    }

    setInputGross(g.toString());
    setInputTripKm(t.toString());
    setInputPickupKm(p.toString());
    setInputCategory(cat);

    const evaluation = evaluateRideOffer({
      grossValue: g,
      tripKm: t,
      pickupKm: p,
      category: cat,
      config,
      settings,
    });

    setActiveOffer(evaluation);
    setIsExpanded(true);

    sounds.playVerdictChime(evaluation.verdict);
    if (settings.voiceAlerts) {
      const voiceText = evaluation.verdict === 'verde'
        ? `Corrida muito lucrativa! R$ ${evaluation.ratePerKm.toFixed(2)} por km.`
        : evaluation.verdict === 'amarelo'
        ? `Atenção, margem intermediária.`
        : `Alerta vermelho! Deslocamento alto e prejuízo em combustível.`;
      sounds.speak(voiceText);
    }
  };

  // Accept Ride Action
  const handleAcceptCurrent = () => {
    if (!activeOffer) return;
    onAcceptRide({
      grossValue: activeOffer.grossValue,
      distanceKm: activeOffer.totalKm,
      category: activeOffer.category,
      paymentMethod: 'app',
      notes: `Copiloto RotaPro: ${activeOffer.verdictTitle} (${formatCurrency(activeOffer.ratePerKm)}/km)`,
    });
    sounds.playCashChime();
    if (settings.voiceAlerts) {
      sounds.speak('Corrida adicionada aos seus ganhos!');
    }
    setActiveOffer(null);
    setIsExpanded(false);
  };

  // Refuse Ride Action
  const handleRefuseCurrent = () => {
    if (!activeOffer) return;
    onLogRefusal({ ...activeOffer, actionTaken: 'recusou' });
    if (settings.voiceAlerts) {
      sounds.speak('Corrida recusada. Você economizou combustível!');
    }
    setActiveOffer(null);
    setIsExpanded(false);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={balloonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none',
      }}
      className={`select-none transition-shadow ${
        isDragging ? 'cursor-grabbing opacity-90 scale-105' : 'cursor-grab'
      }`}
    >
      {/* 1. COMPACT BALÃO PILL (When not expanded) */}
      {!isExpanded ? (
        <div className="flex items-center gap-2 p-1.5 pr-3 bg-[#111317]/95 backdrop-blur-xl border border-amber-400/40 hover:border-amber-400 rounded-full shadow-2xl shadow-black/80 transition-all">
          {/* Pulsing Copilot Icon Badge */}
          <div
            onClick={() => setIsExpanded(true)}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF9900] via-[#FFBF00] to-[#FFE082] text-black flex items-center justify-center font-black cursor-pointer shadow-md shrink-0 relative"
          >
            <Bot size={18} strokeWidth={2.5} />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full" />
          </div>

          {/* Label & Active Status */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex flex-col cursor-pointer min-w-0 pr-1"
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                COPILOTO 99
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/10 text-amber-300 font-bold">
                RotaPro
              </span>
            </div>
            <span className="text-xs font-bold text-white truncate">
              {activeOffer ? activeOffer.verdictTitle.split('!')[0] : 'Avaliar Chamada'}
            </span>
          </div>

          {/* Quick Evaluate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickInputOpen(!isQuickInputOpen);
              setIsExpanded(true);
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
            title="Digitar proposta"
          >
            <Zap size={13} className="text-amber-400" />
          </button>

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      ) : (
        /* 2. EXPANDED BALÃO CARD (Full RotaPro Traffic Light Overlay) */
        <div className="w-[315px] sm:w-[335px] bg-[#111317]/98 backdrop-blur-2xl border-2 border-amber-400/60 rounded-3xl p-4 shadow-2xl shadow-black/95 animate-fade-in text-white">
          {/* Balão Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FFBF00] text-black flex items-center justify-center font-black text-xs shadow">
                <Bot size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-tight text-white">
                    Copiloto de Corridas
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    SEMÁFORO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Análise financeira instantânea estilo RotaPro</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateSettings({ ...settings, voiceAlerts: !settings.voiceAlerts })}
                className={`p-1.5 rounded-lg text-xs ${
                  settings.voiceAlerts ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={settings.voiceAlerts ? 'Voz ativada' : 'Voz desativada'}
              >
                {settings.voiceAlerts ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                title="Minimizar balão"
              >
                <ChevronUp size={15} />
              </button>

              <button
                onClick={() => onToggleOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                title="Fechar copiloto"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ACTIVE OFFER EVALUATION (TRAFFIC LIGHT HUD) */}
          {activeOffer ? (
            <div className="space-y-3 mb-3">
              {/* Traffic Light Banner */}
              <div
                className={`p-3 rounded-2xl border text-center transition-all ${
                  activeOffer.verdict === 'verde'
                    ? 'bg-emerald-950/80 border-emerald-400/80 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : activeOffer.verdict === 'amarelo'
                    ? 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-lg shadow-amber-500/20'
                    : 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-500/20'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activeOffer.verdict === 'verde'
                        ? 'bg-emerald-400 animate-pulse'
                        : activeOffer.verdict === 'amarelo'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-sm font-black uppercase tracking-wider">
                    {activeOffer.verdictTitle}
                  </span>
                </div>
                <p className="text-[11px] leading-snug font-medium text-slate-200">
                  {activeOffer.verdictReason}
                </p>
              </div>

              {/* 4 Core Decision Numbers (Grid) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-black/50 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    R$ / KM Total
                  </span>
                  <span
                    className={`text-lg font-black font-mono tabular-nums ${
                      activeOffer.verdict === 'verde'
                        ? 'text-emerald-400'
                        : activeOffer.verdict === 'amarelo'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(activeOffer.ratePerKm)}/km
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {formatKm(activeOffer.totalKm)} total
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/50 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Projeção / Hora
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-[#38BDF8]">
                    {formatCurrency(activeOffer.ratePerHour)}/h
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ~{activeOffer.durationMinutes} minutos
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/50 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Lucro no Bolso
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-400">
                    {formatCurrency(activeOffer.netProfit)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {activeOffer.profitMarginPct}% de margem
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/50 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Custo Combustível
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-rose-400">
                    - {formatCurrency(activeOffer.costFuel)}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {formatCurrency(activeOffer.grossValue)} bruto
                  </span>
                </div>
              </div>

              {/* Action Buttons: Accept / Refuse */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleAcceptCurrent}
                  className="h-11 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                >
                  <Check size={16} strokeWidth={3} />
                  <span>ACEITAR (+ CONTADOR)</span>
                </button>

                <button
                  onClick={handleRefuseCurrent}
                  className="h-11 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <X size={16} strokeWidth={2.5} />
                  <span>RECUSAR OFERTA</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standby State (Waiting for 99 offer input or simulation) */
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles size={20} />
              </div>
              <p className="text-xs font-bold text-white">Copiloto Aguardando Chamada</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto">
                Digite a proposta da 99 abaixo ou teste com o simulador instantâneo.
              </p>
            </div>
          )}

          {/* QUICK INPUT OR SIMULATOR TABS */}
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            {/* Quick manual evaluation form */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Avaliar Chamada da 99:
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Meta mín: {formatCurrency(settings.minRatePerKm)}/km
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Valor R$"
                    value={inputGross}
                    onChange={(e) => setInputGross(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-amber-400 font-mono text-xs font-bold focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="KM Corrida"
                    value={inputTripKm}
                    onChange={(e) => setInputTripKm(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="KM Busca"
                    value={inputPickupKm}
                    onChange={(e) => setInputPickupKm(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono text-xs font-medium focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => handleEvaluateCustom()}
                className="w-full h-9 rounded-xl bg-[#FFBF00] hover:bg-[#FFC91A] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Zap size={14} fill="black" />
                <span>ANALISAR AGORA COM SEMÁFORO</span>
              </button>
            </div>

            {/* Quick Test Presets (Drivers love testing scenarios!) */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Simulações Rápidas (Estilo 99):
              </span>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => handleSimulatePreset('ouro')}
                  className="py-1 px-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold truncate hover:bg-emerald-500/25"
                >
                  🌟 R$ 29/6km
                </button>
                <button
                  onClick={() => handleSimulatePreset('media')}
                  className="py-1 px-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold truncate hover:bg-amber-500/25"
                >
                  ⚖️ R$ 15/7km
                </button>
                <button
                  onClick={() => handleSimulatePreset('prejuizo')}
                  className="py-1 px-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold truncate hover:bg-rose-500/25"
                >
                  🛑 R$ 10/11km
                </button>
                <button
                  onClick={() => handleSimulatePreset('longe')}
                  className="py-1 px-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold truncate hover:bg-blue-500/25"
                >
                  🛣️ R$ 48/30km
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
