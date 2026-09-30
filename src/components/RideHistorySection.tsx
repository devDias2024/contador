import React, { useState } from 'react';
import { History, Trash2, ArrowUpRight, Share2, Receipt, Plus, Tag } from 'lucide-react';
import { Ride, Expense } from '../types';
import { formatCurrency, formatKm, CATEGORY_LABELS, getKmProfitabilityBadge } from '../utils/formatters';

interface RideHistorySectionProps {
  rides: Ride[];
  expenses: Expense[];
  onDeleteRide: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onAddRide: () => void;
  onAddExpense: () => void;
  onShareReport: () => void;
}

export const RideHistorySection: React.FC<RideHistorySectionProps> = ({
  rides,
  expenses,
  onDeleteRide,
  onDeleteExpense,
  onAddRide,
  onAddExpense,
  onShareReport,
}) => {
  const [activeTab, setActiveTab] = useState<'rides' | 'expenses'>('rides');

  return (
    <div className="rounded-3xl bg-[#14161B] border border-white/10 p-5 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-amber-400" />
          <h3 className="font-extrabold text-base text-white tracking-tight uppercase">
            HISTÓRICO DO DIA
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {activeTab === 'rides' ? `${rides.length} corridas` : `${expenses.length} gastos`}
          </span>
        </div>

        {/* Share WhatsApp Report button */}
        {rides.length > 0 && (
          <button
            onClick={onShareReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all"
            title="Compartilhar fechamento do dia no WhatsApp"
          >
            <Share2 size={13} />
            <span>Resumo</span>
          </button>
        )}
      </div>

      {/* Segmented Tab Controls (Zero pill violation: functional button controls) */}
      <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/5 mb-4">
        <button
          onClick={() => setActiveTab('rides')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rides'
              ? 'bg-[#FFBF00] text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Corridas Realizadas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
            {rides.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-[#FFBF00] text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt size={13} />
          <span>Despesas Extras</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
            {expenses.length}
          </span>
        </button>
      </div>

      {/* Rides List Tab */}
      {activeTab === 'rides' && (
        <div>
          {rides.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <History size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Nenhuma corrida registrada hoje.
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Clique no botão abaixo para adicionar sua primeira corrida da 99 e acompanhar seus lucros.
              </p>
              <button
                onClick={onAddRide}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold inline-flex items-center gap-1.5 shadow"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Registrar Primeira Corrida</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {rides.map((ride, idx) => {
                const categoryInfo = CATEGORY_LABELS[ride.category] || CATEGORY_LABELS['99pop'];
                const ratePerKm = ride.distanceKm > 0 ? ride.grossValue / ride.distanceKm : 0;
                const badge = getKmProfitabilityBadge(ratePerKm);

                return (
                  <div
                    key={ride.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 transition-colors group"
                  >
                    {/* Left: Index & Time & Category */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {rides.length - idx}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${categoryInfo.color}`}>
                            {categoryInfo.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {ride.timeStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>{formatKm(ride.distanceKm)}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`text-[11px] font-bold ${badge.color.split(' ')[0]}`}>
                            {formatCurrency(ratePerKm)}/km
                          </span>
                          {ride.tip && ride.tip > 0 ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400 text-[10px] font-bold">
                                +{formatCurrency(ride.tip)} gorjeta
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Value & Delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-[#FFC000] font-mono tabular-nums">
                          {formatCurrency(ride.grossValue)}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {ride.paymentMethod === 'app' ? 'Cartão 99' : ride.paymentMethod}
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteRide(ride.id)}
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors opacity-70 group-hover:opacity-100"
                        title="Remover corrida"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expenses List Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400">
              Gastos avulsos do turno (almoço, pedágio, abastecimento)
            </span>
            <button
              onClick={onAddExpense}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Adicionar Gasto</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
              <p className="text-xs text-slate-400">
                Nenhum gasto avulso registrado hoje.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white capitalize">
                        {expense.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {expense.timeStr}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {expense.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-rose-400 font-mono tabular-nums">
                      - {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-slate-600 hover:text-rose-400 p-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
