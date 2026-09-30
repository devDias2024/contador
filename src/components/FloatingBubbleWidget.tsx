import React, { useState, useEffect, useRef } from 'react';
import { Layers, Play, X, ExternalLink, Move, Plus, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface FloatingBubbleWidgetProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  grossTotal: number;
  netProfit: number;
  ridesCount: number;
  ratePerKm: number;
  onQuickAddRide: () => void;
}

export const FloatingBubbleWidget: React.FC<FloatingBubbleWidgetProps> = ({
  isEnabled,
  onToggle,
  grossTotal,
  netProfit,
  ridesCount,
  ratePerKm,
  onQuickAddRide,
}) => {
  // Bubble drag position state
  const [position, setPosition] = useState({ x: 20, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 20,
    initialY: 160,
  });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Hidden canvas and video for True Picture-in-Picture overlay
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const pipAnimationRef = useRef<number | null>(null);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or handle, avoid triggering when clicking action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

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
    
    // Bounds clamping
    const newX = Math.max(10, Math.min(window.innerWidth - 180, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(60, Math.min(window.innerHeight - 100, dragStartRef.current.initialY + deltaY));

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

  // Picture in Picture Canvas Stream Renderer
  const renderPiPCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#111317';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#FFBF00';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // 99 Badge Icon
    ctx.fillStyle = '#FFBF00';
    ctx.beginPath();
    ctx.roundRect(14, 14, 40, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('99', 20, 42);

    // Label: 199+ CONTADOR
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('199+ CONTADOR', 62, 32);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${ridesCount} corridas`, 62, 48);

    // Gross total
    ctx.fillStyle = '#FFC000';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(formatCurrency(grossTotal), 16, 92);

    // Sub metrics bar
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Lucro: ${formatCurrency(netProfit)}`, 16, 122);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`R$/KM: ${ratePerKm > 0 ? formatCurrency(ratePerKm) : 'R$ 0,00'}`, 160, 122);
  };

  useEffect(() => {
    if (isPiPActive) {
      renderPiPCanvas();
    }
  }, [isPiPActive, grossTotal, netProfit, ridesCount, ratePerKm]);

  // Request Picture in Picture
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
      const stream = canvas.captureStream(10);
      video.srcObject = stream;
      await video.play();
      await video.requestPictureInPicture();
      setIsPiPActive(true);

      video.addEventListener('leavepictureinpicture', () => {
        setIsPiPActive(false);
      }, { once: true });
    } catch (err) {
      console.warn('PiP not supported or cancelled', err);
    }
  };

  return (
    <>
      {/* Control Card (Matches the user's UI layout) */}
      <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Layers size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight">
                BOLHA FLUTUANTE DE CORRIDAS
              </h3>
              {isEnabled && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mantenha o contador sobreposto à tela para registrar corridas sem sair do app da 99
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          {!isEnabled ? (
            <button
              onClick={() => onToggle(true)}
              className="w-full h-12 rounded-2xl bg-[#FFBF00] hover:bg-[#FFC91A] active:scale-[0.98] transition-all font-black text-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
            >
              <Play size={16} fill="black" />
              <span>ATIVAR BOLHA FLUTUANTE</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onToggle(false)}
                className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all font-semibold text-slate-300 text-xs flex items-center justify-center gap-1.5"
              >
                <X size={15} />
                <span>DESATIVAR BOLHA</span>
              </button>
            </div>
          )}

          {/* Picture in picture option for system overlay */}
          <button
            onClick={handleTogglePiP}
            className="w-full h-10 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-white transition-all text-xs font-medium flex items-center justify-center gap-2"
            title="Abre uma janela suspensa que fica sobre outros aplicativos no celular ou computador"
          >
            <ExternalLink size={14} className="text-amber-400" />
            <span>{isPiPActive ? 'Fechar Janela Suspensa' : 'Modo Janela Suspensa (Sobrepor Outros Apps)'}</span>
          </button>
        </div>
      </div>

      {/* Hidden elements for PiP */}
      <canvas ref={canvasRef} width={320} height={150} className="hidden" />
      <video ref={videoRef} muted playsInline className="hidden" />

      {/* Actual Draggable Floating Bubble UI when enabled */}
      {isEnabled && (
        <div
          ref={bubbleRef}
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
          {!isExpanded ? (
            /* Collapsed Compact Bubble Pill */
            <div className="flex items-center gap-2 p-1.5 pr-2.5 bg-[#14161B]/95 backdrop-blur-xl border border-amber-400/40 rounded-full shadow-2xl shadow-black/80 hover:border-amber-400">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF9900] to-[#FFBF00] flex items-center justify-center text-black font-black text-xs shrink-0 shadow-md">
                99
              </div>

              <div
                onClick={() => setIsExpanded(true)}
                className="flex flex-col cursor-pointer pr-1"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                  Hoje ({ridesCount})
                </span>
                <span className="text-xs font-black text-[#FFC000] font-mono tabular-nums leading-tight">
                  {formatCurrency(grossTotal)}
                </span>
              </div>

              {/* Quick Add Button on Bubble */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddRide();
                }}
                className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center font-bold active:scale-90 transition-transform shadow"
                title="Adicionar corrida rápida"
              >
                <Plus size={14} strokeWidth={3} />
              </button>

              {/* Expand Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          ) : (
            /* Expanded Quick View Bubble Card */
            <div className="w-64 bg-[#14161B]/95 backdrop-blur-xl border border-amber-400/50 rounded-2xl p-3 shadow-2xl shadow-black/90">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#FFBF00] flex items-center justify-center text-black font-extrabold text-[10px]">
                    99
                  </div>
                  <span className="text-xs font-bold text-white">Contador Rápido</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onToggle(false)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                    title="Fechar bolha"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-400">Ganho Bruto:</span>
                  <span className="text-sm font-bold text-[#FFC000] font-mono tabular-nums">
                    {formatCurrency(grossTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-400">Lucro Líquido:</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                    {formatCurrency(netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-400">Média R$/KM:</span>
                  <span className="text-xs font-bold text-[#38BDF8] font-mono tabular-nums">
                    {ratePerKm > 0 ? `${formatCurrency(ratePerKm)}/km` : 'R$ 0,00'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onQuickAddRide();
                  setIsExpanded(false);
                }}
                className="w-full h-9 rounded-xl bg-[#FFBF00] hover:bg-[#FFC91A] font-bold text-black text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>+ Registrar Corrida</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
