import React, { useState } from 'react';
import { Car, Gauge, Fuel, HelpCircle, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { formatCurrency, formatKm, calculateRealFuelCostPerKm } from '../utils/formatters';
import { VehicleConfig, OdometerState } from '../types';

interface VehicleOdometerCardProps {
  odometer: OdometerState;
  onUpdateOdometer: (odometer: OdometerState) => void;
  config: VehicleConfig;
  totalKmFromRides: number;
  grossTotal: number;
  otherExpensesTotal: number;
  onOpenConfig: () => void;
}

export const VehicleOdometerCard: React.FC<VehicleOdometerCardProps> = ({
  odometer,
  onUpdateOdometer,
  config,
  totalKmFromRides,
  grossTotal,
  otherExpensesTotal,
  onOpenConfig,
}) => {
  // If driver entered initial and final odometer, use odometer diff. Otherwise use sum of rides km!
  const hasOdometerDiff = 
    odometer.initialKm !== null && 
    odometer.currentKm !== null && 
    odometer.currentKm >= odometer.initialKm;

  const drivenKm = hasOdometerDiff
    ? Number((odometer.currentKm! - odometer.initialKm!).toFixed(1))
    : totalKmFromRides;

  const costPerKm = calculateRealFuelCostPerKm(config);
  const totalFuelCost = Number((drivenKm * costPerKm).toFixed(2));
  const realNetProfit = Number((grossTotal - totalFuelCost - otherExpensesTotal).toFixed(2));

  // Sync odometer with rides
  const handleSyncFromRides = () => {
    if (odometer.initialKm !== null) {
      onUpdateOdometer({
        initialKm: odometer.initialKm,
        currentKm: Number((odometer.initialKm + totalKmFromRides).toFixed(1)),
      });
    } else {
      onUpdateOdometer({
        initialKm: 0,
        currentKm: totalKmFromRides,
      });
    }
  };

  return (
    <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Car size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">
              QUILOMETRAGEM DO VEÍCULO
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calcule o KM rodado e o custo real de combustível
            </p>
          </div>
        </div>

        {/* Quick config button */}
        <button
          onClick={onOpenConfig}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Configurar consumo e combustível"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Odometer Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            KM Inicial
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 85200"
              value={odometer.initialKm !== null ? odometer.initialKm : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                onUpdateOdometer({ ...odometer, initialKm: val });
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono tabular-nums text-sm focus:border-amber-400 focus:bg-white/10 outline-none transition-colors"
            />
            <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-500 uppercase pointer-events-none">
              KM
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            KM Final
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 85320"
              value={odometer.currentKm !== null ? odometer.currentKm : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                onUpdateOdometer({ ...odometer, currentKm: val });
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono tabular-nums text-sm focus:border-amber-400 focus:bg-white/10 outline-none transition-colors"
            />
            <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-500 uppercase pointer-events-none">
              KM
            </span>
          </div>
        </div>
      </div>

      {/* Stats Breakdown Box */}
      <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2.5">
        {/* Row 1: Distância percorrida */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Gauge size={14} className="text-slate-500" />
            Distância percorrida:
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono tabular-nums whitespace-nowrap text-sm">
              {formatKm(drivenKm)}
            </span>
            {totalKmFromRides > 0 && !hasOdometerDiff && (
              <button
                onClick={handleSyncFromRides}
                title="Sincronizar com a soma das corridas"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <RefreshCw size={10} />
                <span>corridas</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Gasto de combustível */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 truncate pr-2">
            <Fuel size={14} className="text-amber-500/80 shrink-0" />
            <span className="truncate">Gasto estimado ({formatCurrency(costPerKm)}/km):</span>
          </span>
          <span className="font-bold text-rose-400 font-mono tabular-nums whitespace-nowrap text-sm shrink-0">
            - {formatCurrency(totalFuelCost)}
          </span>
        </div>

        {/* Row 3: Outros gastos se houver */}
        {otherExpensesTotal > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Outros gastos (lanche/pedágio):</span>
            <span className="font-bold text-rose-400 font-mono tabular-nums whitespace-nowrap text-sm">
              - {formatCurrency(otherExpensesTotal)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 my-1" />

        {/* Lucro Líquido Real */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs uppercase tracking-wider font-extrabold text-white">
            Lucro Líquido Real:
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums whitespace-nowrap">
            {formatCurrency(realNetProfit)}
          </span>
        </div>
      </div>
    </div>
  );
};
