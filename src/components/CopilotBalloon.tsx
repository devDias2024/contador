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
  Pause,
  RotateCcw,
  ExternalLink,
  Mic,
  MicOff,
  Timer
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

  // 15s Countdown for 99 offers
  const [countdown, setCountdown] = useState<number>(15);
  const countdownIntervalRef = useRef<number | null>(null);

  // Picture in Picture for True Native Overlay over 99 App
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Sound detection (Microphone listening to 99 notification ring)
  const [isMicListening, setIsMicListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnimationRef = useRef<number | null>(null);

  // Quick inputs
  const [inputGross, setInputGross] = useState('');
  const [inputTripKm, setInputTripKm] = useState('');
  const [inputPickupKm, setInputPickupKm] = useState('');
  const [inputCategory, setInputCategory] = useState<RideCategory>('99pop');

  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 16, initialY: 85 });
  const balloonRef = useRef<HTMLDivElement>(null);

  // DRAG HANDLERS
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

  // AUTOMATIC POP-UP & COUNTDOWN WHEN AN OFFER ARRIVES
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (activeOffer) {
      // 1. Automatically expand the balloon over the screen!
      setIsExpanded(true);

      // 2. Play urgent 99 incoming ringtone
      sounds.playIncoming99Alert();

      // 3. Start 15s countdown
      const initialSeconds = settings.offerTimeoutSeconds || 15;
      setCountdown(initialSeconds);

      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Offer expired!
            clearInterval(countdownIntervalRef.current!);
            countdownIntervalRef.current = null;
            handleOfferExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [activeOffer]);

  // Handle Offer Expiration (Timeout after 15s)
  const handleOfferExpired = () => {
    if (!activeOffer) return;

    if (settings.autoAcceptGreen && activeOffer.verdict === 'verde') {
      // Auto accept green offer if driver enabled this setting!
      handleAcceptCurrent();
    } else {
      // Auto refuse & record fuel saved
      onLogRefusal({ ...activeOffer, actionTaken: 'recusou' });
      if (settings.voiceAlerts) {
        sounds.speak('Chamada da 99 expirada. Combustível poupado!');
      }
      setActiveOffer(null);
      setIsExpanded(false);
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

    sounds.playVerdictChime(evaluation.verdict);
    if (settings.voiceAlerts) {
      const voiceText = evaluation.verdict === 'verde'
        ? `Corrida excelente! R$ ${evaluation.ratePerKm.toFixed(2)} por km. Lucro limpo de R$ ${evaluation.netProfit.toFixed(2)}`
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
      p = 3.2;
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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    onAcceptRide({
      grossValue: activeOffer.grossValue,
      distanceKm: activeOffer.totalKm,
      category: activeOffer.category,
      paymentMethod: 'app',
      notes: `Copiloto RotaPro: ${activeOffer.verdictTitle} (${formatCurrency(activeOffer.ratePerKm)}/km)`,
    });
    sounds.playCashChime();
    if (settings.voiceAlerts) {
      sounds.speak('Corrida aceita e somada ao seu contador!');
    }
    setActiveOffer(null);
    setIsExpanded(false);
  };

  // Refuse Ride Action
  const handleRefuseCurrent = () => {
    if (!activeOffer) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    onLogRefusal({ ...activeOffer, actionTaken: 'recusou' });
    if (settings.voiceAlerts) {
      sounds.speak('Corrida recusada. Você economizou combustível!');
    }
    setActiveOffer(null);
    setIsExpanded(false);
  };

  // AUTOMATIC SOUND/MICROPHONE LISTENER (Detects 99 call ringtone or voice trigger)
  const toggleSoundDetection = async () => {
    if (isMicListening) {
      // Turn off
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
        micAnimationRef.current = null;
      }
      setIsMicListening(false);
      onUpdateSettings({ ...settings, autoSoundDetection: false });
    } else {
      // Turn on
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastTriggerTime = 0;

        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          // Calculate average volume peak
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // Sound spike threshold (99 notification ring or voice call)
          if (average > 65 && Date.now() - lastTriggerTime > 6000) {
            lastTriggerTime = Date.now();
            // Automatically trigger simulated incoming offer!
            handleSimulatePreset('ouro');
          }
          micAnimationRef.current = requestAnimationFrame(checkAudio);
        };

        micAnimationRef.current = requestAnimationFrame(checkAudio);
        setIsMicListening(true);
        onUpdateSettings({ ...settings, autoSoundDetection: true });
      } catch (err) {
        console.warn('Microphone permission denied', err);
      }
    }
  };

  // RENDER PICTURE-IN-PICTURE CANVAS (TRUE OVERLAY OVER 99 ANDROID APP)
  const renderPiPCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeOffer) {
      // VERDICT BACKGROUND
      const isGreen = activeOffer.verdict === 'verde';
      const isYellow = activeOffer.verdict === 'amarelo';
      ctx.fillStyle = isGreen ? '#064E3B' : isYellow ? '#78350F' : '#7F1D1D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // BORDER
      ctx.strokeStyle = isGreen ? '#10B981' : isYellow ? '#F59E0B' : '#EF4444';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

      // HEADER: VERDICT & TIME
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      const verdictText = isGreen ? '🟢 ACEITAR CORRIDA!' : isYellow ? '🟡 AVALIAR CAUTELA' : '🔴 RECUSAR CORRIDA!';
      ctx.fillText(verdictText, 16, 36);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`⏱️ Expira em ${countdown}s`, canvas.width - 165, 36);

      // VALUE & DISTANCE
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(formatCurrency(activeOffer.grossValue), 16, 82);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${formatKm(activeOffer.totalKm)} total`, 220, 80);

      // RATE PER KM & NET PROFIT
      ctx.fillStyle = isGreen ? '#34D399' : isYellow ? '#FCD34D' : '#FCA5A5';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`${formatCurrency(activeOffer.ratePerKm)}/km`, 16, 126);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`Lucro: ${formatCurrency(activeOffer.netProfit)}`, 220, 126);
    } else {
      // STANDBY CANVAS (RADAR MONITORANDO 99)
      ctx.fillStyle = '#0F1115';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#FFBF00';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // 99 Badge
      ctx.fillStyle = '#FFBF00';
      ctx.beginPath();
      ctx.roundRect(16, 16, 44, 44, 10);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'black 24px sans-serif';
      ctx.fillText('99', 24, 48);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('COPILOTO ROTAPRO', 72, 36);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('● RADAR ATIVO · MONITORANDO 99', 72, 54);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Quando tocar a corrida, o semáforo aparecerá aqui!', 16, 100);
      ctx.fillText('Toque no botão Aceitar no app para somar aos ganhos.', 16, 124);
    }
  };

  useEffect(() => {
    if (isPiPActive) {
      renderPiPCanvas();
    }
  }, [isPiPActive, activeOffer, countdown]);

  // Request Picture-in-Picture window overlay
  const handleTogglePiP = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
        return;
      }

      renderPiPCanvas();
      const stream = canvas.captureStream(15);
      video.srcObject = stream;
      await video.play();
      await video.requestPictureInPicture();
      setIsPiPActive(true);

      video.addEventListener('leavepictureinpicture', () => {
        setIsPiPActive(false);
      }, { once: true });
    } catch (err) {
      console.warn('PiP window not supported or cancelled', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden elements for True PiP Overlay */}
      <canvas ref={canvasRef} width={420} height={150} className="hidden" />
      <video ref={videoRef} muted playsInline className="hidden" />

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
          <div className="flex items-center gap-2 p-1.5 pr-3 bg-[#111317]/95 backdrop-blur-xl border-2 border-amber-400/60 hover:border-amber-400 rounded-full shadow-2xl shadow-black/90 transition-all">
            {/* Pulsing Copilot Icon Badge */}
            <div
              onClick={() => setIsExpanded(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF9900] via-[#FFBF00] to-[#FFE082] text-black flex items-center justify-center font-black cursor-pointer shadow-lg shrink-0 relative"
            >
              <Bot size={20} strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-black rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-black rounded-full" />
            </div>

            {/* Label & Active Status */}
            <div
              onClick={() => setIsExpanded(true)}
              className="flex flex-col cursor-pointer min-w-0 pr-1"
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  COPILOTO 99
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                  AUTOMÁTICO
                </span>
              </div>
              <span className="text-xs font-extrabold text-white truncate">
                {activeOffer ? activeOffer.verdictTitle.split('!')[0] : 'Radar de Chamadas'}
              </span>
            </div>

            {/* Quick Trigger Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSimulatePreset('ouro');
              }}
              className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center font-bold text-xs shadow"
              title="Testar chamada automática"
            >
              <Zap size={13} fill="black" />
            </button>

            {/* Expand toggle */}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        ) : (
          /* 2. EXPANDED BALÃO CARD (Full RotaPro Traffic Light Overlay) */
          <div className="w-[325px] sm:w-[350px] bg-[#111317]/98 backdrop-blur-2xl border-2 border-amber-400 rounded-3xl p-4 shadow-2xl shadow-black/95 animate-fade-in text-white">
            {/* Balão Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFBF00] text-black flex items-center justify-center font-black text-sm shadow">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-tight text-white">
                      Copiloto Automático
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      99 PRO
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Sobreposição de tela & Análise RotaPro</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice toggle */}
                <button
                  onClick={() => onUpdateSettings({ ...settings, voiceAlerts: !settings.voiceAlerts })}
                  className={`p-1.5 rounded-lg text-xs ${
                    settings.voiceAlerts ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={settings.voiceAlerts ? 'Voz ativada' : 'Voz silenciada'}
                >
                  {settings.voiceAlerts ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                {/* PiP Overlay trigger button */}
                <button
                  onClick={handleTogglePiP}
                  className={`p-1.5 rounded-lg text-xs ${
                    isPiPActive ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sobrepor o app oficial da 99 no celular via Janela Flutuante (PiP)"
                >
                  <ExternalLink size={15} />
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

            {/* ACTIVE INCOMING 99 OFFER (TRAFFIC LIGHT & COUNTDOWN) */}
            {activeOffer ? (
              <div className="space-y-3 mb-3">
                {/* 15s Countdown bar (Just like 99 dispatch countdown) */}
                <div className="p-2 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Timer size={13} className="animate-spin" />
                      Chamada Tocando na 99
                    </span>
                    <span className={`font-mono ${countdown <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                      Expira em {countdown}s
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${
                        countdown > 8
                          ? 'bg-emerald-400'
                          : countdown > 4
                          ? 'bg-amber-400'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                      style={{ width: `${Math.max(0, (countdown / (settings.offerTimeoutSeconds || 15)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Traffic Light Banner */}
                <div
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    activeOffer.verdict === 'verde'
                      ? 'bg-emerald-950/85 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : activeOffer.verdict === 'amarelo'
                      ? 'bg-amber-950/85 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20'
                      : 'bg-rose-950/85 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
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

                {/* 4 Core Decision Numbers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-black/60 border border-white/5">
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
                      {formatKm(activeOffer.totalKm)} total ({formatKm(activeOffer.tripKm)} + {formatKm(activeOffer.pickupKm)} busca)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/60 border border-white/5">
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

                  <div className="p-2.5 rounded-2xl bg-black/60 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Lucro Limpo
                    </span>
                    <span className="text-lg font-black font-mono tabular-nums text-emerald-400">
                      {formatCurrency(activeOffer.netProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {activeOffer.profitMarginPct}% de margem
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/60 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Custo Combustível
                    </span>
                    <span className="text-lg font-black font-mono tabular-nums text-rose-400">
                      - {formatCurrency(activeOffer.costFuel)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Valor bruto: {formatCurrency(activeOffer.grossValue)}
                    </span>
                  </div>
                </div>

                {/* Big Action Buttons: Accept / Refuse */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleAcceptCurrent}
                    className="h-12 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                  >
                    <Check size={18} strokeWidth={3} />
                    <span>ACEITAR (+ CONTADOR)</span>
                  </button>

                  <button
                    onClick={handleRefuseCurrent}
                    className="h-12 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <X size={18} strokeWidth={2.5} />
                    <span>RECUSAR OFERTA</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standby / Active Radar State */
              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 text-center mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-400/20">
                  <Bot size={20} className="animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-white uppercase tracking-tight">
                    Radar Automático Pronto
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto">
                  Assim que tocar uma corrida na 99, o balão abre automaticamente e anuncia o veredito por voz!
                </p>

                {/* Picture in picture overlay hint */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-300">Sobrepor à 99 no celular:</span>
                  <button
                    onClick={handleTogglePiP}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      isPiPActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/10 border-white/15 text-amber-300 hover:bg-white/15'
                    }`}
                  >
                    <ExternalLink size={12} />
                    <span>{isPiPActive ? 'Janela Ativa' : 'Janela Flutuante'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* AUTOMATIC CONTROLS & MANUAL EVALUATION TABS */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              {/* Auto Tools Bar (Microphone & Radar) */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/5">
                <button
                  onClick={toggleSoundDetection}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    isMicListening
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                  title="Detecta o toque sonoro da 99 para abrir o balão sozinho"
                >
                  {isMicListening ? <Mic size={13} className="text-emerald-400 animate-pulse" /> : <MicOff size={13} />}
                  <span>{isMicListening ? 'Escuta Ativa' : 'Sensor de Toque'}</span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, autoAcceptGreen: !settings.autoAcceptGreen })}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all ${
                    settings.autoAcceptGreen
                      ? 'bg-amber-400 text-black border-amber-400 shadow'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                  title="Aceita corridas excelentes sem precisar tocar na tela"
                >
                  <Sparkles size={13} />
                  <span>{settings.autoAcceptGreen ? 'Auto-Aceite ON' : 'Auto-Aceite'}</span>
                </button>
              </div>

              {/* Fast Manual Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Digitar Chamada:
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Mínimo: {formatCurrency(settings.minRatePerKm)}/km
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Valor R$"
                    value={inputGross}
                    onChange={(e) => setInputGross(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-amber-400 font-mono text-xs font-bold focus:border-amber-400 outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="KM Corrida"
                    value={inputTripKm}
                    onChange={(e) => setInputTripKm(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="KM Busca"
                    value={inputPickupKm}
                    onChange={(e) => setInputPickupKm(e.target.value)}
                    className="w-full h-9 px-2 text-center rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono text-xs font-medium focus:border-amber-400 outline-none"
                  />
                </div>

                <button
                  onClick={() => handleEvaluateCustom()}
                  className="w-full h-9 rounded-xl bg-[#FFBF00] hover:bg-[#FFC91A] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Zap size={14} fill="black" />
                  <span>AVALIAR CHAMADA AGORA</span>
                </button>
              </div>

              {/* Automatic Simulation Presets */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Disparo de Teste (Simular Toque da 99):
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
    </>
  );
};
