import React from 'react';
import { ActiveTab } from '../types';
import { Clock, BarChart3, Building2, HardDrive, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddShift: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddShift,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around relative">
        {/* Tab 1: Diensten / Overzicht */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Diensten</span>
          {activeTab === 'overview' && (
            <span className="w-1 h-1 rounded-full bg-emerald-500 -mt-0.5" />
          )}
        </button>

        {/* Tab 2: Statistieken */}
        <button
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            activeTab === 'stats'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Totalen</span>
          {activeTab === 'stats' && (
            <span className="w-1 h-1 rounded-full bg-emerald-500 -mt-0.5" />
          )}
        </button>

        {/* Center Floating Action Button (+) */}
        <div className="-mt-6 flex flex-col items-center">
          <button
            onClick={onOpenAddShift}
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-all border-4 border-white"
            title="Dienst invoeren"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Invoeren</span>
        </div>

        {/* Tab 3: Werkgevers */}
        <button
          onClick={() => onTabChange('employers')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            activeTab === 'employers'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Werkgevers</span>
          {activeTab === 'employers' && (
            <span className="w-1 h-1 rounded-full bg-emerald-500 -mt-0.5" />
          )}
        </button>

        {/* Tab 4: Synology / JSON Export */}
        <button
          onClick={() => onTabChange('export')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
            activeTab === 'export'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HardDrive className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-medium">Synology / JSON</span>
          {activeTab === 'export' && (
            <span className="w-1 h-1 rounded-full bg-emerald-500 -mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
