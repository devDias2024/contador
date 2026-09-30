import { Ride, Expense, VehicleConfig, RideCategory } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(value) ? 0 : value);
}

export function formatKm(value: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(isNaN(value) ? 0 : value);
  return `${formatted} km`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(isNaN(value) ? 0 : value);
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatShortDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs === 0) return `${mins}min`;
  return `${hrs}h ${mins}m`;
}

export const CATEGORY_LABELS: Record<RideCategory, { name: string; badge: string; color: string }> = {
  '99pop': { name: '99Pop', badge: 'Pop', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  '99plus': { name: '99Plus', badge: 'Plus', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  '99moto': { name: '99Moto', badge: 'Moto', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  '99entrega': { name: '99Entrega', badge: 'Entrega', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  '99compartilhado': { name: '99Compartilhado', badge: 'Compartilhado', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  'particular': { name: 'Particular / Por Fora', badge: 'Particular', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export function getKmProfitabilityBadge(ratePerKm: number) {
  if (ratePerKm >= 3.0) {
    return { label: 'Excelente', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: '🔥' };
  } else if (ratePerKm >= 2.2) {
    return { label: 'Muito Bom', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: '👍' };
  } else if (ratePerKm >= 1.8) {
    return { label: 'Aceitável', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: '⚖️' };
  } else {
    return { label: 'Baixo Lucro', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: '⚠️' };
  }
}

export function calculateRealFuelCostPerKm(config: VehicleConfig): number {
  if (config.useDirectCost) {
    return config.directCostPerKm;
  }
  if (!config.fuelEfficiencyKmPerL || config.fuelEfficiencyKmPerL <= 0) return 0.55;
  const fuelCost = config.fuelPrice / config.fuelEfficiencyKmPerL;
  const maintenance = config.includeMaintenance ? config.maintenanceCostPerKm : 0;
  return Number((fuelCost + maintenance).toFixed(2));
}

export function generateWhatsAppReport({
  dateStr,
  grossTotal,
  netProfit,
  totalKm,
  fuelCostTotal,
  totalExpenses,
  ridesCount,
  avgPerKm,
  avgPerHour,
  shiftHoursStr,
}: {
  dateStr: string;
  grossTotal: number;
  netProfit: number;
  totalKm: number;
  fuelCostTotal: number;
  totalExpenses: number;
  ridesCount: number;
  avgPerKm: number;
  avgPerHour: number;
  shiftHoursStr: string;
}): string {
  return `📊 *FECHAMENTO 99 - ${dateStr}*
━━━━━━━━━━━━━━━━━━
💰 *Faturamento Bruto:* ${formatCurrency(grossTotal)}
🟢 *Lucro Líquido Real:* ${formatCurrency(netProfit)}

🚗 *Total de Corridas:* ${ridesCount}
🛣️ *KM Rodados:* ${formatKm(totalKm)}
⛽ *Custo Combustível:* ${formatCurrency(fuelCostTotal)}
${totalExpenses > 0 ? `🧾 *Outros Gastos:* ${formatCurrency(totalExpenses)}\n` : ''}
⚡ *Médias de Produtividade:*
• *R$ / KM:* ${formatCurrency(avgPerKm)}/km
• *R$ / Hora:* ${formatCurrency(avgPerHour)}/h
⏱️ *Tempo de Turno:* ${shiftHoursStr}
━━━━━━━━━━━━━━━━━━
🚀 _Calculado com 99 Contador Pro_`;
}
