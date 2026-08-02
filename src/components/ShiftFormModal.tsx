import React, { useState, useEffect } from 'react';
import { Employer, Shift } from '../types';
import { calculateShift, formatCurrency, formatDecimalHours } from '../utils/calculations';
import {
  Calendar,
  Clock,
  Euro,
  Building2,
  AlertTriangle,
  X,
  Check,
  MapPin,
  FileText,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShift: (shift: Shift) => void;
  employers: Employer[];
  editingShift?: Shift | null;
  defaultEmployerId?: string;
}

const PAUSE_PRESETS = [0, 15, 30, 45, 60];

const SHIFT_PRESETS = [
  { label: 'Ochtend', start: '08:00', end: '16:30', breakM: 30 },
  { label: 'Dag', start: '09:00', end: '17:00', breakM: 30 },
  { label: 'Middag', start: '12:00', end: '20:00', breakM: 30 },
  { label: 'Avond', start: '17:00', end: '23:30', breakM: 30 },
  { label: 'Nacht', start: '22:00', end: '06:00', breakM: 30 },
];

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  isOpen,
  onClose,
  onSaveShift,
  employers,
  editingShift,
  defaultEmployerId,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [employerId, setEmployerId] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);

  // Wage override state
  const [hasCustomWage, setHasCustomWage] = useState(false);
  const [customWage, setCustomWage] = useState('');

  // Special late cancellation flag
  const [isLateCancelled, setIsLateCancelled] = useState(false);

  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Populate form on open or change
  useEffect(() => {
    if (editingShift) {
      setEmployerId(editingShift.employerId);
      setDate(editingShift.date);
      setStartTime(editingShift.startTime);
      setEndTime(editingShift.endTime);
      setBreakMinutes(editingShift.breakMinutes);
      setIsLateCancelled(editingShift.isLateCancelled || false);
      setLocation(editingShift.location || '');
      setNotes(editingShift.notes || '');

      if (editingShift.hourlyWageOverride !== undefined && editingShift.hourlyWageOverride > 0) {
        setHasCustomWage(true);
        setCustomWage(editingShift.hourlyWageOverride.toString());
      } else {
        setHasCustomWage(false);
        setCustomWage('');
      }
    } else {
      // Default initial values
      const initialEmpId =
        defaultEmployerId && defaultEmployerId !== 'all'
          ? defaultEmployerId
          : employers[0]?.id || '';

      setEmployerId(initialEmpId);
      setDate(getTodayString());
      setStartTime('09:00');
      setEndTime('17:00');
      setBreakMinutes(30);
      setIsLateCancelled(false);
      setHasCustomWage(false);
      setCustomWage('');
      setLocation('');
      setNotes('');
    }
    setFormError('');
  }, [editingShift, isOpen, defaultEmployerId, employers]);

  if (!isOpen) return null;

  const currentEmployer = employers.find((e) => e.id === employerId);

  // Calculate live preview
  const parseCustomWage = hasCustomWage && customWage !== '' ? parseFloat(customWage.replace(',', '.')) : undefined;
  const tempShift: Shift = {
    id: editingShift?.id || 'temp',
    employerId,
    date,
    startTime,
    endTime,
    breakMinutes: Number(breakMinutes) || 0,
    hourlyWageOverride: parseCustomWage,
    isLateCancelled,
    createdAt: Date.now(),
  };

  const preview = calculateShift(tempShift, currentEmployer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerId) {
      setFormError('Selecteer een werkgever.');
      return;
    }
    if (!date) {
      setFormError('Selecteer een datum.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Vul start- en eindtijd in.');
      return;
    }

    const wageOverrideNum =
      hasCustomWage && customWage.trim() !== ''
        ? parseFloat(customWage.replace(',', '.'))
        : undefined;

    const savedShift: Shift = {
      id: editingShift ? editingShift.id : `shift-${Date.now()}`,
      employerId,
      date,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 0,
      hourlyWageOverride: wageOverrideNum,
      isLateCancelled,
      location: location.trim(),
      notes: notes.trim(),
      createdAt: editingShift ? editingShift.createdAt : Date.now(),
    };

    onSaveShift(savedShift);
    onClose();
  };

  const applyPreset = (preset: (typeof SHIFT_PRESETS)[0]) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    setBreakMinutes(preset.breakM);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 my-auto">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {editingShift ? 'Dienst bewerken' : 'Nieuwe dienst invoeren'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Vul datum, tijden en pauze in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Werkgever Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Werkgever *
            </label>
            <select
              value={employerId}
              onChange={(e) => setEmployerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {employers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (Standaard uurloon: €{emp.hourlyWage.toFixed(2)}/u)
                </option>
              ))}
            </select>
          </div>

          {/* Datum */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Datum *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Snelkeuze bekende diensten:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SHIFT_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
                >
                  {preset.label} ({preset.start}-{preset.end})
                </button>
              ))}
            </div>
          </div>

          {/* Starttijd & Eindtijd */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starttijd *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-center"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Eindtijd *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-center"
              />
            </div>
          </div>

          {/* Pauze (in minuten) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Pauze (in minuten)</label>
              <span className="text-xs text-emerald-600 font-semibold">{breakMinutes} min. pauze</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="5"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {PAUSE_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setBreakMinutes(p)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      breakMinutes === p
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {p === 0 ? 'Geen' : `${p}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Uurloon Override Option */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCustomWage}
                  onChange={(e) => setHasCustomWage(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                />
                <span className="font-semibold text-slate-700">
                  Afwijkend uurloon voor deze dienst
                </span>
              </label>
              {!hasCustomWage && currentEmployer && (
                <span className="text-xs text-slate-400 font-medium">
                  Standaard: €{currentEmployer.hourlyWage.toFixed(2)}/u
                </span>
              )}
            </div>

            {hasCustomWage && (
              <div className="pt-1 flex items-center gap-2 animate-in fade-in">
                <span className="text-slate-400 font-semibold">€</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  placeholder={currentEmployer?.hourlyWage.toString() || '15.00'}
                  value={customWage}
                  onChange={(e) => setCustomWage(e.target.value)}
                  className="w-36 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 font-medium">per uur</span>
              </div>
            )}
          </div>

          {/* SPECIALE OPTIE VOOR GEANNULEERDE DIENSTEN (< 24 uur van tevoren) */}
          <div
            className={`rounded-2xl border p-3.5 transition-all ${
              isLateCancelled
                ? 'bg-rose-50 border-rose-200/80'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="lateCancelledToggle"
                checked={isLateCancelled}
                onChange={(e) => setIsLateCancelled(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded text-rose-600 focus:ring-rose-500 bg-white border-slate-300 cursor-pointer shrink-0"
              />
              <label htmlFor="lateCancelledToggle" className="cursor-pointer space-y-1 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    Dienst te laat geannuleerd (&lt; 24 uur van tevoren)
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Schakel dit in als de werkgever de dienst binnen 24 uur voor aanvang heeft afgezegd.
                </p>
              </label>
            </div>

            {isLateCancelled && (
              <div className="mt-3 pt-3 border-t border-rose-200/60 space-y-2 animate-in fade-in">
                <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-rose-200">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Recht op loon (te laat geannuleerd)
                </div>
                <p className="text-[11px] text-rose-800 leading-normal flex items-start gap-1.5 font-medium">
                  <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Volgens de Nederlandse Arbeidswet (art. 7:628 BW) heeft u bij annulering korter dan 24 uur van tevoren recht op doorbetaling. Deze uren en het verwachte loon worden <strong>volledig meegeteld</strong> in uw totaal.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Optioneel: Locatie & Notities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Locatie / Afdeling (optioneel)
              </label>
              <input
                type="text"
                placeholder="bv. Filiaal Centrum, Balie"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Opmerking (optioneel)
              </label>
              <input
                type="text"
                placeholder="bv. Koopavond, Overwerk"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200/80 font-medium">
              <span>Berekende uren:</span>
              <span className="font-bold text-slate-800">
                {formatDecimalHours(preview.netHours)} ({preview.netMinutes} min.)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Uurloon toegepast:</span>
              <span className="font-bold text-slate-800">€{preview.hourlyWage.toFixed(2)}/u</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm font-bold">
              <span className="text-slate-800">Totaal te ontvangen:</span>
              <span className="text-emerald-600 text-base font-black">{formatCurrency(preview.totalEarnings)}</span>
            </div>

            {isLateCancelled && (
              <div className="text-[11px] text-rose-700 text-right font-bold italic">
                ✓ Inclusief 100% doorbetaling i.v.m. te late annulering
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            {editingShift ? 'Wijzigingen opslaan' : 'Dienst opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};
