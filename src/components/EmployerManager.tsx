import React, { useState } from 'react';
import { Employer } from '../types';
import { Building2, Plus, Edit2, Trash2, X, Check, Euro, Palette } from 'lucide-react';

interface EmployerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employers: Employer[];
  onSaveEmployer: (employer: Employer) => void;
  onDeleteEmployer: (id: string) => void;
  onSetDefaultEmployer: (id: string) => void;
}

const PRESET_COLORS = [
  '#00A0E2', // AH Blue
  '#D97706', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export const EmployerManager: React.FC<EmployerManagerProps> = ({
  isOpen,
  onClose,
  employers,
  onSaveEmployer,
  onDeleteEmployer,
  onSetDefaultEmployer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [hourlyWage, setHourlyWage] = useState('15.00');
  const [color, setColor] = useState('#3B82F6');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setHourlyWage('15.00');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNotes('');
    setFormError('');
    setEditingId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (emp: Employer) => {
    setName(emp.name);
    setHourlyWage(emp.hourlyWage.toString());
    setColor(emp.color || '#3B82F6');
    setNotes(emp.notes || '');
    setFormError('');
    setIsCreating(false);
    setEditingId(emp.id);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vul a.u.b. een naam in voor de werkgever.');
      return;
    }

    const wage = parseFloat(hourlyWage.replace(',', '.'));
    if (isNaN(wage) || wage < 0) {
      setFormError('Vul een geldig uurloon in.');
      return;
    }

    const newEmployer: Employer = {
      id: isCreating ? `emp-${Date.now()}` : editingId!,
      name: name.trim(),
      hourlyWage: wage,
      color,
      notes: notes.trim(),
      isDefault: isCreating && employers.length === 0,
    };

    onSaveEmployer(newEmployer);
    handleCancelForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
      <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Werkgevers beheren</h2>
              <p className="text-xs text-slate-400 font-medium">Stel werkgevers en uurlonen in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Add or Edit Form */}
          {(isCreating || editingId) && (
            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-emerald-500/30 p-4 rounded-2xl space-y-3 shadow-xs animate-in fade-in"
            >
              <h3 className="font-bold text-sm text-emerald-700 flex items-center gap-1.5">
                {isCreating ? 'Nieuwe werkgever toevoegen' : 'Werkgever bewerken'}
              </h3>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Naam werkgever *
                </label>
                <input
                  type="text"
                  placeholder="bv. Albert Heijn, Horeca, Callcenter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standaard uurloon (€)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      €
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kleur label
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-emerald-500 shadow-xs' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opmerking / Functie (optioneel)
                </label>
                <input
                  type="text"
                  placeholder="bv. Filiaal Centrum, Afdeling verkoop"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Opslaan
                </button>
              </div>
            </form>
          )}

          {/* Employer list */}
          <div className="space-y-2.5">
            {employers.map((emp) => (
              <div
                key={emp.id}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: emp.color || '#10B981' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">
                        {emp.name}
                      </span>
                      {emp.isDefault && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          Standaard
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Euro className="w-3 h-3 text-slate-400" />
                      Uurloon: <strong className="text-emerald-600 font-bold">€{emp.hourlyWage.toFixed(2)}</strong>
                      {emp.notes && <span className="text-slate-400 ml-1">· {emp.notes}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!emp.isDefault && (
                    <button
                      onClick={() => onSetDefaultEmployer(emp.id)}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 font-semibold p-1.5 rounded-lg hover:bg-slate-200/60"
                      title="Instellen als standaard"
                    >
                      Maak std
                    </button>
                  )}
                  <button
                    onClick={() => handleStartEdit(emp)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                    title="Bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {employers.length > 1 && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Weet je zeker dat je werkgever "${emp.name}" wilt verwijderen?`
                          )
                        ) {
                          onDeleteEmployer(emp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isCreating && !editingId && (
            <button
              onClick={handleStartCreate}
              className="w-full bg-slate-50 hover:bg-slate-100 text-emerald-700 border border-dashed border-slate-200 hover:border-emerald-300 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe werkgever toevoegen
            </button>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
