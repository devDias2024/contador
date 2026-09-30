import React, { useState } from 'react';
import { X, Check, Sliders, Fuel, Wrench, ShieldCheck } from 'lucide-react';
import { VehicleConfig } from '../types';
import { calculateRealFuelCostPerKm, formatCurrency } from '../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VehicleConfig;
  onSaveConfig: (newConfig: VehicleConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formConfig, setFormConfig] = useState<VehicleConfig>({ ...config });

  if (!isOpen) return null;

  const currentCostPerKm = calculateRealFuelCostPerKm(formConfig);

  const applyPreset = (type: 'carro_flex' | 'carro_gnv' | 'moto' | 'eletrico') => {
    if (type === 'carro_flex') {
      setFormConfig({
        ...formConfig,
        vehicleType: 'carro_flex',
        fuelPrice: 5.89,
        fuelEfficiencyKmPerL: 10.5,
        useDirectCost: false,
        maintenanceCostPerKm: 0.15,
      });
    } else if (type === 'carro_gnv') {
      setFormConfig({
        ...formConfig,
        vehicleType: 'carro_gnv',
        fuelPrice: 4.69,
        fuelEfficiencyKmPerL: 14.0,
        useDirectCost: false,
        maintenanceCostPerKm: 0.12,
      });
    } else if (type === 'moto') {
      setFormConfig({
        ...formConfig,
        vehicleType: 'moto',
        fuelPrice: 5.89,
        fuelEfficiencyKmPerL: 32.0,
        useDirectCost: false,
        maintenanceCostPerKm: 0.08,
      });
    } else if (type === 'eletrico') {
      setFormConfig({
        ...formConfig,
        vehicleType: 'eletrico',
        directCostPerKm: 0.18,
        useDirectCost: true,
        maintenanceCostPerKm: 0.05,
      });
    }
  };

  const handleSave = () => {
    onSaveConfig(formConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Configurações do Veículo</h2>
              <p className="text-[11px] text-slate-400">Ajuste o cálculo de custo de combustível e manutenção</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Vehicle Presets */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Tipo de Veículo
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'carro_flex', label: 'Flex / Gasolina' },
              { id: 'carro_gnv', label: 'Carro GNV' },
              { id: 'moto', label: '99 Moto' },
              { id: 'eletrico', label: '100% Elétrico' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id as any)}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                  formConfig.vehicleType === p.id
                    ? 'bg-amber-400 text-black border-amber-400'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real Cost Preview */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 font-medium">Custo Real por KM Rodado:</span>
            <p className="text-[10px] text-slate-400">Usado para abater o lucro líquido das corridas</p>
          </div>
          <span className="text-lg font-black text-amber-400 font-mono">
            {formatCurrency(currentCostPerKm)}/km
          </span>
        </div>

        {/* Custom fields */}
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Preço Combustível (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formConfig.fuelPrice}
                onChange={(e) => setFormConfig({ ...formConfig, fuelPrice: parseFloat(e.target.value) || 0 })}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Consumo (KM / Litro)
              </label>
              <input
                type="number"
                step="0.1"
                value={formConfig.fuelEfficiencyKmPerL}
                onChange={(e) => setFormConfig({ ...formConfig, fuelEfficiencyKmPerL: parseFloat(e.target.value) || 1 })}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formConfig.includeMaintenance}
                onChange={(e) => setFormConfig({ ...formConfig, includeMaintenance: e.target.checked })}
                className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 bg-white/10 border-white/20"
              />
              <span className="font-semibold">Incluir desgaste do veículo (pneu, óleo, pastilhas)</span>
            </label>
            {formConfig.includeMaintenance && (
              <div className="mt-2 pl-6">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.15"
                  value={formConfig.maintenanceCostPerKm}
                  onChange={(e) => setFormConfig({ ...formConfig, maintenanceCostPerKm: parseFloat(e.target.value) || 0 })}
                  className="w-36 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
                />
                <span className="text-[11px] text-slate-400 ml-2">R$ por KM</span>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full h-12 rounded-2xl bg-[#FFBF00] hover:bg-[#FFC91A] font-extrabold text-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Check size={18} strokeWidth={3} />
          <span>SALVAR CONFIGURAÇÕES</span>
        </button>
      </div>
    </div>
  );
};
