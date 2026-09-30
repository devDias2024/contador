import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MainMetricsCard } from './components/MainMetricsCard';
import { FloatingBubbleWidget } from './components/FloatingBubbleWidget';
import { VehicleOdometerCard } from './components/VehicleOdometerCard';
import { DailyGoalCard } from './components/DailyGoalCard';
import { ShiftControlCard } from './components/ShiftControlCard';
import { RideHistorySection } from './components/RideHistorySection';
import { AddRideModal } from './components/AddRideModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { RideCalculatorModal } from './components/RideCalculatorModal';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ShiftSummaryModal } from './components/ShiftSummaryModal';
import { Ride, Expense, ShiftState, VehicleConfig, OdometerState, DailyGoal, AppSettings } from './types';
import { calculateRealFuelCostPerKm } from './utils/formatters';
import { sounds } from './utils/audio';

// Storage keys
const STORAGE_KEYS = {
  RIDES: '99_contador_rides_v2',
  EXPENSES: '99_contador_expenses_v2',
  SHIFT: '99_contador_shift_v2',
  VEHICLE: '99_contador_vehicle_v2',
  ODOMETER: '99_contador_odometer_v2',
  GOAL: '99_contador_goal_v2',
  SETTINGS: '99_contador_settings_v2',
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

export default function App() {
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

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      soundEnabled: true,
      hapticEnabled: true,
      floatingBubbleEnabled: false,
      theme: 'dark',
    };
  });

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

  // Quick Demo Populator for testing
  const handleLoadDemo = () => {
    const mockRides: Ride[] = [
      {
        id: '1',
        timestamp: Date.now() - 3600000 * 3,
        timeStr: '08:15',
        grossValue: 24.50,
        distanceKm: 5.8,
        category: '99pop',
        paymentMethod: 'app',
        tip: 2.00,
      },
      {
        id: '2',
        timestamp: Date.now() - 3600000 * 2,
        timeStr: '09:40',
        grossValue: 38.90,
        distanceKm: 11.2,
        category: '99plus',
        paymentMethod: 'app',
      },
      {
        id: '3',
        timestamp: Date.now() - 3600000 * 1,
        timeStr: '10:55',
        grossValue: 19.80,
        distanceKm: 4.1,
        category: '99pop',
        paymentMethod: 'dinheiro',
      },
      {
        id: '4',
        timestamp: Date.now() - 1800000,
        timeStr: '11:30',
        grossValue: 15.20,
        distanceKm: 3.5,
        category: '99moto',
        paymentMethod: 'pix',
      },
    ];

    setRides(mockRides);
    setOdometer({ initialKm: 45200, currentKm: 45232 });
    setShift({
      isActive: true,
      isPaused: false,
      startTime: Date.now() - 14400000,
      lastResumeTime: Date.now() - 14400000,
      accumulatedActiveMs: 14400000,
      date: new Date().toISOString().split('T')[0],
    });
    if (settings.soundEnabled) sounds.playCashChime();
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

      {/* Main Content Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
        {/* 1. Main Hero Metrics Card */}
        <MainMetricsCard
          grossTotal={grossTotal}
          netProfit={netProfit}
          totalKm={totalKm}
          ratePerKm={ratePerKm}
          ridesCount={rides.length}
          onAddRide={() => setIsAddRideOpen(true)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
        />

        {/* 2. Floating Bubble Control Card & Interactive Widget */}
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

        {/* 6. Ride History & Expenses Section */}
        <RideHistorySection
          rides={rides}
          expenses={expenses}
          onDeleteRide={handleDeleteRide}
          onDeleteExpense={handleDeleteExpense}
          onAddRide={() => setIsAddRideOpen(true)}
          onAddExpense={() => setIsAddExpenseOpen(true)}
          onShareReport={() => setIsSummaryOpen(true)}
        />

        {/* Helper footer bar with demo loader */}
        {rides.length === 0 && (
          <div className="pt-2 text-center">
            <button
              onClick={handleLoadDemo}
              className="text-xs text-slate-500 hover:text-amber-400 underline transition-colors"
            >
              Preencher com corridas de exemplo para testar
            </button>
          </div>
        )}
      </main>

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
