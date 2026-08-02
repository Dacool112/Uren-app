import React, { useMemo } from 'react';
import { Employer, Shift } from '../types';
import {
  calculateShift,
  calculateTotals,
  formatCurrency,
  formatDecimalHours,
  groupShiftsByMonth,
} from '../utils/calculations';
import {
  BarChart3,
  PieChart,
  Calendar,
  Building2,
  ShieldCheck,
  TrendingUp,
  Euro,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StatsOverviewProps {
  shifts: Shift[];
  employers: Employer[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ shifts, employers }) => {
  const employerMap = useMemo(() => new Map(employers.map((e) => [e.id, e])), [employers]);

  // Overall totals across all shifts
  const grandTotals = useMemo(() => calculateTotals(shifts, employers), [shifts, employers]);

  // Grouped by month
  const monthlySummaries = useMemo(() => groupShiftsByMonth(shifts, employers), [shifts, employers]);

  // Breakdown per employer
  const employerBreakdown = useMemo(() => {
    const map = new Map<string, { minutes: number; earnings: number; count: number; lateCount: number }>();

    employers.forEach((e) => {
      map.set(e.id, { minutes: 0, earnings: 0, count: 0, lateCount: 0 });
    });

    shifts.forEach((s) => {
      const emp = employerMap.get(s.employerId);
      const calc = calculateShift(s, emp);
      const current = map.get(s.employerId) || { minutes: 0, earnings: 0, count: 0, lateCount: 0 };

      current.minutes += calc.netMinutes;
      current.earnings += calc.totalEarnings;
      current.count += 1;
      if (s.isLateCancelled) current.lateCount += 1;

      map.set(s.employerId, current);
    });

    return employers.map((emp) => {
      const stats = map.get(emp.id) || { minutes: 0, earnings: 0, count: 0, lateCount: 0 };
      const hours = stats.minutes / 60;
      const percentage = grandTotals.totalEarnings > 0 ? (stats.earnings / grandTotals.totalEarnings) * 100 : 0;

      return {
        employer: emp,
        hours,
        earnings: stats.earnings,
        count: stats.count,
        lateCount: stats.lateCount,
        percentage,
      };
    });
  }, [shifts, employers, employerMap, grandTotals]);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Statistieken & Totalen</h2>
            <p className="text-xs text-slate-400 font-medium">Overzicht van gewerkte uren en inkomsten</p>
          </div>
        </div>

        {/* Big Grand Total Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Totaal verdiend</span>
            <span className="text-2xl font-black text-emerald-600 block mt-0.5">
              {formatCurrency(grandTotals.totalEarnings)}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Totaal uren</span>
            <span className="text-2xl font-black text-slate-800 block mt-0.5">
              {formatDecimalHours(grandTotals.totalNetHours)}
            </span>
          </div>
        </div>
      </div>

      {/* Special Late Cancellation Highlight Box */}
      {grandTotals.lateCancelledCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Te laat geannuleerde diensten (&lt; 24u)</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed font-medium">
            U heeft <strong className="font-bold text-rose-900">{grandTotals.lateCancelledCount} dienst(en)</strong> ingevoerd die korter dan 24 uur van tevoren zijn afgezegd.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200/60">
              <span className="text-rose-600/80 text-[10px] font-medium block">Doorberekende uren:</span>
              <strong className="text-rose-900 font-bold">{formatDecimalHours(grandTotals.lateCancelledHours)}</strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200/60">
              <span className="text-rose-600/80 text-[10px] font-medium block">Inbegrepen loon:</span>
              <strong className="text-rose-900 font-bold">{formatCurrency(grandTotals.lateCancelledEarnings)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown per Employer */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Verdeling per werkgever
        </h3>

        <div className="space-y-3 pt-1">
          {employerBreakdown.map(({ employer, hours, earnings, count, percentage }) => (
            <div key={employer.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: employer.color || '#10B981' }}
                  />
                  <span className="font-bold text-xs text-slate-800">{employer.name}</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">
                  {formatCurrency(earnings)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all rounded-full"
                  style={{
                    width: `${Math.max(percentage, 2)}%`,
                    backgroundColor: employer.color || '#10B981',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                <span>{count} diensten ({formatDecimalHours(hours)})</span>
                <span>{percentage.toFixed(1)}% van totaal</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly History Comparison */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Maandoverzicht geschiedenis
        </h3>

        {monthlySummaries.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Nog geen maandexporthistorie beschikbaar.</p>
        ) : (
          <div className="space-y-2.5">
            {monthlySummaries.map((ms) => (
              <div
                key={ms.yearMonth}
                className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">{ms.label}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {ms.totalShifts} diensten · {formatDecimalHours(ms.totalNetHours)}
                    {ms.lateCancelledShifts > 0 && (
                      <span className="text-rose-600 font-bold ml-1">
                        ({ms.lateCancelledShifts}x geannuleerd)
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">
                  {formatCurrency(ms.totalEarnings)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
