import React from 'react';
import { Employer } from '../types';
import { Building2, Plus, Sparkles, ChevronDown, HardDrive, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  employers: Employer[];
  selectedEmployerId: string; // 'all' or employer id
  onSelectEmployer: (id: string) => void;
  onOpenAddShift: () => void;
  onOpenEmployerManager: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  employers,
  selectedEmployerId,
  onSelectEmployer,
  onOpenAddShift,
  onOpenEmployerManager,
  onOpenExport,
}) => {
  const currentEmployer = employers.find((e) => e.id === selectedEmployerId);

  return (
    <header className="bg-white text-slate-900 sticky top-0 z-30 shadow-xs border-b border-slate-100">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900">
                Uren Tracker
              </h1>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Offline First
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Uren & Loon opgeslagen in LocalStorage
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Quick Employer Switcher Dropdown */}
          <div className="relative">
            <select
              value={selectedEmployerId}
              onChange={(e) => onSelectEmployer(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors max-w-[120px] truncate"
            >
              <option value="all">Alle werkgevers</option>
              {employers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (€{emp.hourlyWage.toFixed(2)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Add Shift Button */}
          <button
            onClick={onOpenAddShift}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white p-2 rounded-xl font-medium text-xs flex items-center gap-1 shadow-sm transition-all"
            title="Nieuwe dienst invoeren"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar showing active filter context and direct Synology export menu button */}
      <div className="bg-slate-50/90 px-4 py-1.5 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-400">Actief:</span>
          {selectedEmployerId === 'all' ? (
            <span className="font-semibold text-emerald-700">
              Alle werkgevers ({employers.length})
            </span>
          ) : (
            <span className="font-semibold flex items-center gap-1.5 text-slate-800 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                style={{ backgroundColor: currentEmployer?.color || '#10B981' }}
              />
              {currentEmployer?.name} (€{currentEmployer?.hourlyWage.toFixed(2)}/u)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenEmployerManager}
            className="text-[11px] text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Building2 className="w-3 h-3 text-slate-400" />
            Beheer
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={onOpenExport}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-100/80 hover:bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all border border-emerald-200/60 shadow-2xs"
            title="Exporteer alle uren naar Synology NAS of download als JSON"
          >
            <HardDrive className="w-3 h-3 text-emerald-600" />
            Exporteer naar Synology / JSON
          </button>
        </div>
      </div>
    </header>
  );
};
