import React from 'react';
import { Employer, Shift } from '../types';
import {
  calculateShift,
  formatCurrency,
  formatDutchDate,
  formatDecimalHours,
} from '../utils/calculations';
import {
  Clock,
  Euro,
  MapPin,
  ShieldCheck,
  Edit2,
  Trash2,
  Copy,
  AlertTriangle,
  FileText,
  Building2,
} from 'lucide-react';

interface ShiftCardProps {
  shift: Shift;
  employer?: Employer;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onDuplicate: (shift: Shift) => void;
  onToggleLateCancelled: (shift: Shift) => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  employer,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleLateCancelled,
}) => {
  const calc = calculateShift(shift, employer);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-xs ${
        shift.isLateCancelled
          ? 'bg-rose-50/80 border-rose-100 hover:border-rose-200'
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      {/* Top row: Employer badge & Date */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: employer?.color || '#10B981' }}
          >
            <Building2 className="w-3 h-3" />
            {employer?.name || 'Onbekende werkgever'}
          </span>

          {shift.location && (
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-slate-400" />
              {shift.location}
            </span>
          )}
        </div>

        {/* Date string */}
        <span className="text-xs font-bold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-xl shrink-0 border border-slate-200/50">
          {formatDutchDate(shift.date)}
        </span>
      </div>

      {/* Special Late Cancelled Notice Badge (<24u) */}
      {shift.isLateCancelled && (
        <div className="my-2.5 bg-rose-100/70 border border-rose-200/80 rounded-xl p-2.5 flex items-start gap-2 text-xs text-rose-900">
          <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-900 block">
              Recht op loon (te laat geannuleerd)
            </span>
            <p className="text-[11px] text-rose-700 leading-tight">
              Dienst afgezegd &lt; 24u van tevoren. Volledig meegeteld in uren en loon!
            </p>
          </div>
        </div>
      )}

      {/* Time & Duration grid */}
      <div
        className={`grid grid-cols-2 gap-2 my-3 py-2.5 border-y text-xs ${
          shift.isLateCancelled ? 'border-rose-200/60' : 'border-slate-100'
        }`}
      >
        <div>
          <span className="text-slate-400 text-[11px] font-medium block">Werktijd & Pauze:</span>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {shift.startTime} - {shift.endTime}
            </span>
            {shift.breakMinutes > 0 && (
              <span className="text-slate-400 font-normal">({shift.breakMinutes}m pauze)</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-slate-400 text-[11px] font-medium block">Netto uren & Uurloon:</span>
          <div className="font-semibold text-slate-800 mt-0.5">
            <span className="text-slate-900 font-bold">{formatDecimalHours(calc.netHours)}</span>
            <span className="text-slate-500 font-normal ml-1">@ €{calc.hourlyWage.toFixed(2)}/u</span>
          </div>
        </div>
      </div>

      {/* Notes if present */}
      {shift.notes && (
        <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl mb-3 flex items-start gap-1.5 border border-slate-100">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="italic">{shift.notes}</span>
        </div>
      )}

      {/* Bottom row: Total earned & Action buttons */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Totaal loon dienst:</span>
          <span
            className={`text-base font-extrabold ${
              shift.isLateCancelled ? 'text-rose-700' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(calc.totalEarnings)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick toggle late cancellation */}
          <button
            onClick={() => onToggleLateCancelled(shift)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
              shift.isLateCancelled
                ? 'bg-rose-200/80 text-rose-800 hover:bg-rose-200 border border-rose-300/60'
                : 'bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-slate-200/80'
            }`}
            title="Schakel te laat geannuleerd in/uit"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Te laat geannuleerd</span>
          </button>

          {/* Duplicate shift button */}
          <button
            onClick={() => onDuplicate(shift)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Dienst dupliceren"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Edit shift button */}
          <button
            onClick={() => onEdit(shift)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Dienst bewerken"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete shift button */}
          <button
            onClick={() => {
              if (confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) {
                onDelete(shift.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
