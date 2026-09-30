import { VehicleConfig, CopilotSettings, EvaluatedOffer, RideCategory, VerdictColor } from '../types';
import { calculateRealFuelCostPerKm, formatCurrency } from './formatters';

export function evaluateRideOffer({
  grossValue,
  tripKm,
  pickupKm = 0,
  durationMinutes = 0,
  category = '99pop',
  config,
  settings,
}: {
  grossValue: number;
  tripKm: number;
  pickupKm?: number;
  durationMinutes?: number;
  category?: RideCategory;
  config: VehicleConfig;
  settings: CopilotSettings;
}): EvaluatedOffer {
  const totalKm = Number((tripKm + pickupKm).toFixed(1));
  const costPerKm = calculateRealFuelCostPerKm(config);
  const costFuel = Number((totalKm * costPerKm).toFixed(2));
  const netProfit = Number((grossValue - costFuel).toFixed(2));
  const profitMarginPct = grossValue > 0 ? Math.round((netProfit / grossValue) * 100) : 0;
  const ratePerKm = totalKm > 0 ? Number((grossValue / totalKm).toFixed(2)) : 0;

  // Estimated duration if not provided: ~2.5 min per km in city + 3 min pickup
  const computedDuration = durationMinutes > 0 ? durationMinutes : Math.max(8, Math.round(totalKm * 2.6 + 3));
  const hoursFraction = computedDuration / 60;
  const ratePerHour = Number((grossValue / hoursFraction).toFixed(2));

  // Threshold adjustments based on sensitivity
  let minKmThreshold = settings.minRatePerKm;
  let minHourThreshold = settings.minRatePerHour;
  let maxPickup = settings.maxPickupKm;

  if (settings.sensitivity === 'conservador') {
    minKmThreshold += 0.25;
    minHourThreshold += 5;
    maxPickup -= 0.5;
  } else if (settings.sensitivity === 'arrojado') {
    minKmThreshold -= 0.20;
    minHourThreshold -= 5;
    maxPickup += 1.0;
  }

  let verdict: VerdictColor = 'vermelho';
  let verdictTitle = 'RECUSAR! Prejuízo ou Baixo Lucro 🔴';
  let verdictReason = '';

  if (pickupKm > maxPickup && grossValue < 25) {
    verdict = 'vermelho';
    verdictTitle = 'RECUSAR! Deslocamento Excessivo 🛑';
    verdictReason = `Deslocamento de ${pickupKm} km é muito alto para uma corrida de ${formatCurrency(grossValue)}. Você vai queimar combustível antes de embarcar.`;
  } else if (ratePerKm >= minKmThreshold && ratePerHour >= minHourThreshold && netProfit >= 6) {
    verdict = 'verde';
    verdictTitle = 'ACEITAR! Corrida Muito Lucrativa 🟢';
    verdictReason = `Excelente! Rende ${formatCurrency(ratePerKm)}/km e projeção de ${formatCurrency(ratePerHour)}/h. Sobram ${formatCurrency(netProfit)} limpos (${profitMarginPct}% de margem).`;
  } else if (ratePerKm >= minKmThreshold * 0.85 && netProfit >= 3) {
    verdict = 'amarelo';
    verdictTitle = 'AVALIAR! Margem Média 🟡';
    verdictReason = `Rendimento de ${formatCurrency(ratePerKm)}/km. Cobre o combustível (${formatCurrency(costFuel)}), mas a margem é justa. Aceite se for em direção a uma área movimentada.`;
  } else {
    verdict = 'vermelho';
    verdictTitle = 'RECUSAR! Não Vale a Pena 🔴';
    verdictReason = `Rendimento de apenas ${formatCurrency(ratePerKm)}/km. Após descontar ${formatCurrency(costFuel)} de combustível e desgaste, sobram apenas ${formatCurrency(netProfit)}.`;
  }

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    timeStr,
    grossValue,
    tripKm,
    pickupKm,
    totalKm,
    durationMinutes: computedDuration,
    costFuel,
    netProfit,
    profitMarginPct,
    ratePerKm,
    ratePerHour,
    verdict,
    verdictTitle,
    verdictReason,
    category,
    actionTaken: 'analisando',
  };
}
