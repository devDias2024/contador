import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MainMetricsCard } from './components/MainMetricsCard';
import { FloatingBubbleWidget } from './components/FloatingBubbleWidget';
import { VehicleOdometerCard } from './components/VehicleOdometerCard';
import { DailyGoalCard } from './components/DailyGoalCard';
import { ShiftControlCard } from './components/ShiftControlCard';
import { RideHistorySection } from './components/RideHistorySection';
import { CopilotBalloon } from './components/CopilotBalloon';
import { CopilotDashboardSection } from './components/CopilotDashboardSection';
import { AddRideModal } from './components/AddRideModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { RideCalculatorModal } from './components/RideCalculatorModal';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ShiftSummaryModal } from './components/ShiftSummaryModal';
import { 
  Ride, 
  Expense, 
  ShiftState, 
  VehicleConfig, 
  OdometerState, 
  DailyGoal, 
  AppSettings,
  CopilotSettings,
  EvaluatedOffer
} from './types';
import { calculateRealFuelCostPerKm, formatCurrency, formatKm } from './utils/formatters';
import { evaluateRideOffer } from './utils/copilotEngine';
import { sounds } from './utils/audio';
import { LayoutDashboard, Bot, History } from 'lucide-react';

// Storage keys
const STORAGE_KEYS = {
  RIDES: '99_contador_rides_v2',
  EXPENSES: '99_contador_expenses_v2',
  SHIFT: '99_contador_shift_v2',
  VEHICLE: '99_contador_vehicle_v2',
  ODOMETER: '99_contador_odometer_v2',
  GOAL: '99_contador_goal_v2',
  SETTINGS: '99_contador_settings_v2',
  COPILOT_SETTINGS: '99_copilot_settings_v2',
  EVALUATED_OFFERS: '99_evaluated_offers_v2',
  HISTORY_ARCHIVE: '99_contador_archive_v2',
};

const DEFAULT_VEHICLE: VehicleConfig = {
  fuelPrice: 5.89,
  fuelEfficiencyKmPerL: 10.5,
  directCostPerKm: 0.56,
  useDirectCost: false,
  includeMaintenance: true,
  maintenanceCostPerKm: 0.15,
  vehicleType: 'carro_flex',
};

const DEFAULT_COPILOT_SETTINGS: CopilotSettings = {
  minRatePerKm: 2.00,
  minRatePerHour: 40.00,
  maxPickupKm: 3.5,
  voiceAlerts: true,
  autoOpenBalloonOnOffer: true,
  sensitivity: 'equilibrado',
};

export default function App() {
  // Navigation tabs (Zero-pill functional segmented buttons)
  const [activeTab, setActiveTab] = useState<'painel' | 'copiloto' | 'historico'>('painel');

  // LocalStorage Initializers
  const [rides, setRides] = useState<Ride[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RIDES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shift, setShift] = useState<ShiftState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isActive: false,
      isPaused: false,
      startTime: null,
      lastResumeTime: null,
      accumulatedActiveMs: 0,
      date: new Date().toISOString().split('T')[0],
    };
  });

  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VEHICLE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_VEHICLE;
  });

  const [odometer, setOdometer] = useState<OdometerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ODOMETER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { initialKm: null, currentKm: null };
  });

  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOAL);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { targetAmount: 150 };
  });

  const [copilotSettings, setCopilotSettings] = useState<CopilotSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COPILOT_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COPILOT_SETTINGS;
  });

  const [evaluatedOffers, setEvaluatedOffers] = useState<EvaluatedOffer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVALUATED_OFFERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      soundEnabled: true,
      hapticEnabled: true,
      floatingBubbleEnabled: false,
      copilotBalloonEnabled: true, // Enabled by default as requested!
      theme: 'dark',
    };
  });

  // Active offer in the floating Copilot balloon
  const [activeOffer, setActiveOffer] = useState<EvaluatedOffer | null>(null);

  // Modal visibility states
  const [isAddRideOpen, setIsAddRideOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Live timer for shift
  const [currentShiftSec, setCurrentShiftSec] = useState(0);

  // Compute live shift duration
  useEffect(() => {
    const updateTimer = () => {
      if (!shift.isActive) {
        setCurrentShiftSec(0);
        return;
      }
      let totalMs = shift.accumulatedActiveMs || 0;
      if (!shift.isPaused && shift.lastResumeTime) {
        totalMs += Date.now() - shift.lastResumeTime;
      }
      setCurrentShiftSec(Math.floor(totalMs / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [shift]);

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RIDES, JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(shift));
  }, [shift]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(vehicleConfig));
  }, [vehicleConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ODOMETER, JSON.stringify(odometer));
  }, [odometer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COPILOT_SETTINGS, JSON.stringify(copilotSettings));
  }, [copilotSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVALUATED_OFFERS, JSON.stringify(evaluatedOffers));
  }, [evaluatedOffers]);

  // Calculations
  const grossTotal = rides.reduce((sum, r) => sum + r.grossValue + (r.tip || 0), 0);
  const totalKmFromRides = rides.reduce((sum, r) => sum + r.distanceKm, 0);

  // Driven KM based on Odometer vs Rides
  const hasOdometerDiff =
    odometer.initialKm !== null &&
    odometer.currentKm !== null &&
    odometer.currentKm >= odometer.initialKm;

  const totalKm = hasOdometerDiff
    ? Number((odometer.currentKm! - odometer.initialKm!).toFixed(1))
    : totalKmFromRides;

  const costPerKm = calculateRealFuelCostPerKm(vehicleConfig);
  const fuelCostTotal = Number((totalKm * costPerKm).toFixed(2));
  const otherExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = Number((grossTotal - fuelCostTotal - otherExpensesTotal).toFixed(2));
  const ratePerKm = totalKm > 0 ? grossTotal / totalKm : 0;

  // Handlers for Rides
  const handleSaveRide = (newRideData: Omit<Ride, 'id' | 'timestamp' | 'timeStr'>) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const newRide: Ride = {
      ...newRideData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      timeStr: `${hours}:${minutes}`,
    };

    setRides((prev) => [newRide, ...prev]);

    // If an active offer was accepted, log it in history as accepted
    if (activeOffer) {
      setEvaluatedOffers((prev) => [
        { ...activeOffer, actionTaken: 'aceitou' },
        ...prev,
      ]);
    }

    // Automatically auto-start shift if not started yet
    if (!shift.isActive) {
      handleStartShift();
    }
  };

  const handleDeleteRide = (id: string) => {
    setRides((prev) => prev.filter((r) => r.id !== id));
  };

  // Handlers for Expenses
  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'timestamp' | 'timeStr'>) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      timeStr: `${hours}:${minutes}`,
    };

    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Handler for logged refusal from Copilot
  const handleLogRefusal = (offer: EvaluatedOffer) => {
    setEvaluatedOffers((prev) => [offer, ...prev]);
  };

  // Shift Management Handlers
  const handleStartShift = () => {
    const now = Date.now();
    setShift({
      isActive: true,
      isPaused: false,
      startTime: now,
      lastResumeTime: now,
      accumulatedActiveMs: 0,
      date: new Date().toISOString().split('T')[0],
    });
    if (settings.soundEnabled) sounds.playTurnStart();
  };

  const handlePauseShift = () => {
    if (!shift.isActive || shift.isPaused) return;
    const now = Date.now();
    const currentSegment = shift.lastResumeTime ? now - shift.lastResumeTime : 0;
    setShift((prev) => ({
      ...prev,
      isPaused: true,
      lastResumeTime: null,
      accumulatedActiveMs: prev.accumulatedActiveMs + currentSegment,
    }));
    if (settings.soundEnabled) sounds.playPause();
  };

  const handleResumeShift = () => {
    if (!shift.isActive || !shift.isPaused) return;
    setShift((prev) => ({
      ...prev,
      isPaused: false,
      lastResumeTime: Date.now(),
    }));
    if (settings.soundEnabled) sounds.playTurnStart();
  };

  const handleFinishShift = () => {
    if (shift.isActive && !shift.isPaused && shift.lastResumeTime) {
      const segment = Date.now() - shift.lastResumeTime;
      setShift((prev) => ({
        ...prev,
        isPaused: true,
        accumulatedActiveMs: prev.accumulatedActiveMs + segment,
        lastResumeTime: null,
      }));
    }
    setIsSummaryOpen(true);
  };

  // Reset Day and KM
  const handleConfirmReset = (archive: boolean) => {
    if (archive && (rides.length > 0 || grossTotal > 0)) {
      try {
        const existingArchive = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY_ARCHIVE) || '[]');
        existingArchive.push({
          date: new Date().toISOString(),
          grossTotal,
          netProfit,
          totalKm,
          ridesCount: rides.length,
          shiftDurationSec: currentShiftSec,
        });
        localStorage.setItem(STORAGE_KEYS.HISTORY_ARCHIVE, JSON.stringify(existingArchive));
      } catch {}
    }

    setRides([]);
    setExpenses([]);
    setEvaluatedOffers([]);
    setOdometer({ initialKm: null, currentKm: null });
    setShift({
      isActive: false,
      isPaused: false,
      startTime: null,
      lastResumeTime: null,
      accumulatedActiveMs: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setIsResetConfirmOpen(false);
  };

  // Quick Simulation handler from anywhere
  const handleQuickSimulate = (type: 'ouro' | 'media' | 'prejuizo' | 'longe') => {
    let g = 28.90;
    let t = 6.4;
    let p = 0.8;
    if (type === 'media') {
      g = 14.50;
      t = 6.8;
      p = 1.5;
    } else if (type === 'prejuizo') {
      g = 9.80;
      t = 7.5;
      p = 3.2;
    } else if (type === 'longe') {
      g = 48.00;
      t = 28.0;
      p = 2.0;
    }

    const evaluation = evaluateRideOffer({
      grossValue: g,
      tripKm: t,
      pickupKm: p,
      config: vehicleConfig,
      settings: copilotSettings,
    });

    setActiveOffer(evaluation);
    setSettings((s) => ({ ...s, copilotBalloonEnabled: true }));
    sounds.playVerdictChime(evaluation.verdict);
    if (copilotSettings.voiceAlerts) {
      const text = evaluation.verdict === 'verde'
        ? `Corrida muito lucrativa! R$ ${evaluation.ratePerKm.toFixed(2)} por km.`
        : evaluation.verdict === 'amarelo'
        ? `Atenção, margem intermediária.`
        : `Alerta vermelho! Deslocamento alto e prejuízo em combustível.`;
      sounds.speak(text);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <Header
        shift={shift}
        shiftDurationSec={currentShiftSec}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShiftModal={() => {
          if (shift.isActive) {
            setIsSummaryOpen(true);
          } else {
            handleStartShift();
          }
        }}
      />

      {/* Main Navigation Segmented Tabs (Clean buttons with functional handlers) */}
      <div className="sticky top-[58px] z-30 bg-[#0D0F12]/95 backdrop-blur-md border-b border-white/5 px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('painel')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'painel'
                ? 'bg-[#FFBF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Painel 99</span>
          </button>

          <button
            onClick={() => setActiveTab('copiloto')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'copiloto'
                ? 'bg-[#FFBF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot size={14} />
            <span>Copiloto RotaPro</span>
            {settings.copilotBalloonEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'historico'
                ? 'bg-[#FFBF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={14} />
            <span>Histórico ({rides.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
        {/* TAB 1: PAINEL PRINCIPAL DO MOTORISTA */}
        {activeTab === 'painel' && (
          <>
            {/* 1. Main Hero Metrics Card */}
            <MainMetricsCard
              grossTotal={grossTotal}
              netProfit={netProfit}
              totalKm={totalKm}
              ratePerKm={ratePerKm}
              ridesCount={rides.length}
              onAddRide={() => setIsAddRideOpen(true)}
              onOpenCalculator={() => {
                setActiveTab('copiloto');
                setSettings((s) => ({ ...s, copilotBalloonEnabled: true }));
              }}
            />

            {/* Quick Balão Copiloto Banner Shortcut */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FFBF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow">
                  <Bot size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white">Balão do Copiloto RotaPro</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                      {settings.copilotBalloonEnabled ? 'Ativo na tela' : 'Desativado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Semáforo de decisões para aceitar ou recusar chamadas
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSettings((s) => ({ ...s, copilotBalloonEnabled: !s.copilotBalloonEnabled }))}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 border border-white/10"
              >
                {settings.copilotBalloonEnabled ? 'Ocultar' : 'Exibir Balão'}
              </button>
            </div>

            {/* 2. Floating Bubble Control Card (Original user request) */}
            <FloatingBubbleWidget
              isEnabled={settings.floatingBubbleEnabled}
              onToggle={(enabled) => setSettings((s) => ({ ...s, floatingBubbleEnabled: enabled }))}
              grossTotal={grossTotal}
              netProfit={netProfit}
              ridesCount={rides.length}
              ratePerKm={ratePerKm}
              onQuickAddRide={() => setIsAddRideOpen(true)}
            />

            {/* 3. Vehicle Odometer & Real Fuel Cost Card */}
            <VehicleOdometerCard
              odometer={odometer}
              onUpdateOdometer={setOdometer}
              config={vehicleConfig}
              totalKmFromRides={totalKmFromRides}
              grossTotal={grossTotal}
              otherExpensesTotal={otherExpensesTotal}
              onOpenConfig={() => setIsSettingsOpen(true)}
            />

            {/* 4. Daily Goal & Progress */}
            <DailyGoalCard
              targetAmount={dailyGoal.targetAmount}
              currentAmount={grossTotal}
              onUpdateTarget={(newTarget) => setDailyGoal({ targetAmount: newTarget })}
              soundEnabled={settings.soundEnabled}
            />

            {/* 5. Shift & Turn Tracker Card */}
            <ShiftControlCard
              shift={shift}
              durationSeconds={currentShiftSec}
              grossTotal={grossTotal}
              netProfit={netProfit}
              ridesCount={rides.length}
              onStartShift={handleStartShift}
              onPauseShift={handlePauseShift}
              onResumeShift={handleResumeShift}
              onFinishShift={handleFinishShift}
              onResetDay={() => setIsResetConfirmOpen(true)}
            />
          </>
        )}

        {/* TAB 2: COPILOTO ROTAPRO (AVALIAÇÃO DE CORRIDAS COM SEMÁFORO) */}
        {activeTab === 'copiloto' && (
          <div className="space-y-4">
            <CopilotDashboardSection
              settings={copilotSettings}
              onUpdateSettings={setCopilotSettings}
              isBalloonEnabled={settings.copilotBalloonEnabled}
              onToggleBalloon={(enabled) => setSettings((s) => ({ ...s, copilotBalloonEnabled: enabled }))}
              evaluatedOffers={evaluatedOffers}
              config={vehicleConfig}
              onQuickSimulate={handleQuickSimulate}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* History of Offers Evaluated by the Copilot */}
            <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                  Registro de Chamadas Avaliadas ({evaluatedOffers.length})
                </span>
                <span className="text-[11px] text-slate-500">Hoje</span>
              </div>

              {evaluatedOffers.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
                  <p className="text-xs text-slate-400">
                    Nenhuma chamada avaliada ainda hoje.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Use o Balão do Copiloto ou os botões de simulação acima para testar corridas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {evaluatedOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              offer.verdict === 'verde'
                                ? 'bg-emerald-400'
                                : offer.verdict === 'amarelo'
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-bold text-white font-mono">
                            {formatCurrency(offer.grossValue)}
                          </span>
                          <span className="text-slate-400">
                            ({formatKm(offer.totalKm)})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {offer.timeStr}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {offer.verdictTitle}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold block ${
                            offer.verdict === 'verde'
                              ? 'text-emerald-400'
                              : offer.verdict === 'amarelo'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(offer.ratePerKm)}/km
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            offer.actionTaken === 'aceitou' ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {offer.actionTaken === 'aceitou' ? 'Aceita' : 'Recusada'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HISTÓRICO & FECHAMENTO */}
        {activeTab === 'historico' && (
          <RideHistorySection
            rides={rides}
            expenses={expenses}
            onDeleteRide={handleDeleteRide}
            onDeleteExpense={handleDeleteExpense}
            onAddRide={() => setIsAddRideOpen(true)}
            onAddExpense={() => setIsAddExpenseOpen(true)}
            onShareReport={() => setIsSummaryOpen(true)}
          />
        )}
      </main>

      {/* Floating Copilot Balloon (RotaPro Style Overlay - Draggable on top of whole screen) */}
      <CopilotBalloon
        isOpen={settings.copilotBalloonEnabled}
        onToggleOpen={(open) => setSettings((s) => ({ ...s, copilotBalloonEnabled: open }))}
        config={vehicleConfig}
        settings={copilotSettings}
        onUpdateSettings={setCopilotSettings}
        onAcceptRide={handleSaveRide}
        onLogRefusal={handleLogRefusal}
        activeOffer={activeOffer}
        setActiveOffer={setActiveOffer}
      />

      {/* Modals and Overlays */}
      <AddRideModal
        isOpen={isAddRideOpen}
        onClose={() => setIsAddRideOpen(false)}
        onSaveRide={handleSaveRide}
        soundEnabled={settings.soundEnabled}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSaveExpense={handleSaveExpense}
      />

      <RideCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        config={vehicleConfig}
        onAcceptAndAddRide={handleSaveRide}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={vehicleConfig}
        onSaveConfig={setVehicleConfig}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={handleConfirmReset}
        grossTotal={grossTotal}
        ridesCount={rides.length}
      />

      <ShiftSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        grossTotal={grossTotal}
        netProfit={netProfit}
        totalKm={totalKm}
        fuelCostTotal={fuelCostTotal}
        totalExpenses={otherExpensesTotal}
        ridesCount={rides.length}
        ratePerKm={ratePerKm}
        shiftDurationSec={currentShiftSec}
      />
    </div>
  );
}
