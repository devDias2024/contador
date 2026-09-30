import React, { useState } from 'react';
import { X, Sparkles, Check, AlertCircle, TrendingUp, Fuel } from 'lucide-react';
import { VehicleConfig, RideCategory, Ride } from '../types';
import { calculateRealFuelCostPerKm, formatCurrency } from '../utils/formatters';

interface RideCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VehicleConfig;
  onAcceptAndAddRide: (ride: Omit<Ride, 'id' | 'timestamp' | 'timeStr'>) => void;
}

export const RideCalculatorModal: React.FC<RideCalculatorModalProps> = ({
  isOpen,
  onClose,
  config,
  onAcceptAndAddRide,
}) => {
  const [offerValue, setOfferValue] = useState('');
  const [offerKm, setOfferKm] = useState('');
  const [pickupKm, setPickupKm] = useState(''); // KM até o passageiro

  if (!isOpen) return null;

  const gross = parseFloat(offerValue.replace(',', '.')) || 0;
  const tripKm = parseFloat(offerKm.replace(',', '.')) || 0;
  const pickup = parseFloat(pickupKm.replace(',', '.')) || 0;
  const totalKm = tripKm + pickup;

  const costPerKm = calculateRealFuelCostPerKm(config);
  const estimatedFuelCost = totalKm * costPerKm;
  const netEstimatedProfit = gross - estimatedFuelCost;
  const ratePerTotalKm = totalKm > 0 ? gross / totalKm : 0;

  // Verdict logic
  let verdict = {
    title: 'Digite os dados da corrida acima',
    status: 'neutral' as 'good' | 'warning' | 'bad' | 'neutral',
    message: 'Preencha o valor proposto pela 99 e a distância',
  };

  if (gross > 0 && totalKm > 0) {
    if (ratePerTotalKm >= 2.6) {
      verdict = {
        title: 'Excelente Corrida! 🌟',
        status: 'good',
        message: `Rendimento de ${formatCurrency(ratePerTotalKm)}/km. Margem de lucro alta, vale muito a pena!`,
      };
    } else if (ratePerTotalKm >= 2.0) {
      verdict = {
        title: 'Boa Corrida 👍',
        status: 'good',
        message: `Rendimento de ${formatCurrency(ratePerTotalKm)}/km. Acima da média diária do combustível.`,
      };
    } else if (ratePerTotalKm >= 1.6) {
      verdict = {
        title: 'Corrida Regular ⚖️',
        status: 'warning',
        message: `Rendimento de ${formatCurrency(ratePerTotalKm)}/km. Cobre o combustível, mas o lucro é baixo. Vale se estiver voltando pra sua região.`,
      };
    } else {
      verdict = {
        title: 'Cuidado: Prejuízo ou Baixo Lucro 🛑',
        status: 'bad',
        message: `Rendimento de apenas ${formatCurrency(ratePerTotalKm)}/km. Após descontar o combustível (${formatCurrency(estimatedFuelCost)}), sobra quase nada.`,
      };
    }
  }

  const handleAccept = () => {
    if (gross <= 0 || tripKm <= 0) return;
    onAcceptAndAddRide({
      grossValue: gross,
      distanceKm: totalKm > 0 ? totalKm : tripKm,
      category: '99pop',
      paymentMethod: 'app',
      notes: pickup > 0 ? `Corrida ${tripKm}km + ${pickup}km deslocamento` : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#14161B] border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Radar 99 · Avaliar Corrida</h2>
              <p className="text-[11px] text-slate-400">Descubra se a corrida que tocou na 99 vale a pena</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Valor da Proposta (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="Ex: 22,50"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base font-bold focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                KM da Corrida
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 6,8"
                value={offerKm}
                onChange={(e) => setOfferKm(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base font-bold focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              KM de Deslocamento até o passageiro (opcional)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 1,5 km até o embarque"
              value={pickupKm}
              onChange={(e) => setPickupKm(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        {/* Real-time Calculation Result */}
        {gross > 0 && totalKm > 0 && (
          <div className="space-y-3 mb-4">
            {/* Verdict Box */}
            <div
              className={`p-4 rounded-2xl border ${
                verdict.status === 'good'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : verdict.status === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-sm font-black ${
                    verdict.status === 'good'
                      ? 'text-emerald-400'
                      : verdict.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {verdict.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {verdict.message}
              </p>
            </div>

            {/* Metrics breakdown */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
              <div>
                <span className="text-[10px] text-slate-400 block">R$ / KM Real:</span>
                <span className="text-sm font-extrabold text-[#38BDF8] font-mono tabular-nums">
                  {formatCurrency(ratePerTotalKm)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Combustível:</span>
                <span className="text-sm font-bold text-rose-400 font-mono tabular-nums">
                  - {formatCurrency(estimatedFuelCost)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Lucro Limpo:</span>
                <span className="text-sm font-black text-emerald-400 font-mono tabular-nums">
                  {formatCurrency(netEstimatedProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          {gross > 0 && totalKm > 0 && (
            <button
              onClick={handleAccept}
              className="w-full h-12 rounded-2xl bg-[#FFBF00] hover:bg-[#FFC91A] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              <Check size={18} strokeWidth={3} />
              <span>ACEITEI! SALVAR NO CONTADOR</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
          >
            Fechar Calculadora
          </button>
        </div>
      </div>
    </div>
  );
};
