import React, { useState, useMemo } from 'react';
import { Employer, Shift } from '../types';
import { ShiftCard } from './ShiftCard';
import {
  calculateTotals,
  formatCurrency,
  formatDecimalHours,
  getDutchMonthYearName,
  getYearMonth,
} from '../utils/calculations';
import {
  Calendar,
  Filter,
  Search,
  Plus,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Clock,
  Euro,
  Sparkles,
} from 'lucide-react';

interface ShiftListProps {
  shifts: Shift[];
  employers: Employer[];
  selectedEmployerId: string;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onDuplicateShift: (shift: Shift) => void;
  onToggleLateCancelled: (shift: Shift) => void;
  onOpenAddShift: () => void;
}

export const ShiftList: React.FC<ShiftListProps> = ({
  shifts,
  employers,
  selectedEmployerId,
  onEditShift,
  onDeleteShift,
  onDuplicateShift,
  onToggleLateCancelled,
  onOpenAddShift,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'late_cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract available unique YYYY-MM months from shifts
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => {
      const ym = getYearMonth(s.date);
      if (ym) set.add(ym);
    });
    return Array.from(set).sort().reverse();
  }, [shifts]);

  // Filter shifts based on active employer, month, status, search query
  const filteredShifts = useMemo(() => {
    return shifts
      .filter((s) => {
        // Employer filter
        if (selectedEmployerId !== 'all' && s.employerId !== selectedEmployerId) {
          return false;
        }
        // Month filter
        if (selectedMonth !== 'all' && getYearMonth(s.date) !== selectedMonth) {
          return false;
        }
        // Status filter
        if (statusFilter === 'late_cancelled' && !s.isLateCancelled) {
          return false;
        }
        if (statusFilter === 'normal' && s.isLateCancelled) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const emp = employers.find((e) => e.id === s.employerId);
          const empName = emp?.name.toLowerCase() || '';
          const loc = (s.location || '').toLowerCase();
          const notes = (s.notes || '').toLowerCase();
          if (!empName.includes(q) && !loc.includes(q) && !notes.includes(q) && !s.date.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shifts, selectedEmployerId, selectedMonth, statusFilter, searchQuery, employers]);

  // Totals for filtered view
  const totals = useMemo(() => {
    return calculateTotals(filteredShifts, employers);
  }, [filteredShifts, employers]);

  const employerMap = new Map<string, Employer>(employers.map((e) => [e.id, e]));

  return (
    <div className="space-y-4 pb-20">
      {/* Top Filter Controls Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-3 shadow-xs">
        {/* Row 1: Month Selector & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-500" />
              Maand selecteren:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Alle maanden ({shifts.length} diensten)</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {getDutchMonthYearName(ym)}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" />
              Zoeken op trefwoord:
            </label>
            <input
              type="text"
              placeholder="Zoek werkgever, locatie, notitie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Alle diensten ({shifts.length})
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              statusFilter === 'normal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Gewerkt
          </button>
          <button
            onClick={() => setStatusFilter('late_cancelled')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'late_cancelled'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 hover:text-rose-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Te laat geannuleerd (&lt;24u)
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards for Current Filtered Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Totaal uren
          </span>
          <div className="mt-1">
            <span className="text-2xl font-black text-slate-800">
              {formatDecimalHours(totals.totalNetHours)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              {filteredShifts.length} {filteredShifts.length === 1 ? 'dienst' : 'diensten'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Euro className="w-3.5 h-3.5" />
            Verwacht loon
          </span>
          <div className="mt-1">
            <span className="text-2xl font-black text-emerald-600">
              {formatCurrency(totals.totalEarnings)}
            </span>
            {totals.lateCancelledCount > 0 && (
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                incl. {totals.lateCancelledCount}x te laat geannuleerd ({formatCurrency(totals.lateCancelledEarnings)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Shifts List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-slate-700">
            Dienstenoverzicht ({filteredShifts.length})
          </span>
          <span className="text-[11px] font-medium text-slate-400">Nieuwste eerst</span>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Geen diensten gevonden</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Er zijn geen ingevoerde diensten die voldoen aan het geselecteerde filter.
              </p>
            </div>
            <button
              onClick={onOpenAddShift}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Nieuwe dienst invoeren
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                employer={employerMap.get(shift.employerId)}
                onEdit={onEditShift}
                onDelete={onDeleteShift}
                onDuplicate={onDuplicateShift}
                onToggleLateCancelled={onToggleLateCancelled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
