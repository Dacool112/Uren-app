import React, { useState, useEffect } from 'react';
import { Employer, Shift, ActiveTab } from './types';
import {
  loadEmployers,
  saveEmployers,
  loadShifts,
  saveShifts,
  resetAllData,
} from './utils/storage';
import { Header } from './components/Header';
import { ShiftList } from './components/ShiftList';
import { ShiftFormModal } from './components/ShiftFormModal';
import { EmployerManager } from './components/EmployerManager';
import { StatsOverview } from './components/StatsOverview';
import { ExportImportModal } from './components/ExportImportModal';
import { BottomNav } from './components/BottomNav';
import { Check, Info, ShieldCheck } from 'lucide-react';

export default function App() {
  const [employers, setEmployers] = useState<Employer[]>(() => loadEmployers());
  const [shifts, setShifts] = useState<Shift[]>(() => loadShifts());
  const [selectedEmployerId, setSelectedEmployerId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals state
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isEmployerManagerOpen, setIsEmployerManagerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    saveEmployers(employers);
  }, [employers]);

  useEffect(() => {
    saveShifts(shifts);
  }, [shifts]);

  // Handle Tab Switch from BottomNav
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'employers') {
      setIsEmployerManagerOpen(true);
    } else if (tab === 'export') {
      setIsExportModalOpen(true);
    }
  };

  // Save or update shift
  const handleSaveShift = (shiftToSave: Shift) => {
    setShifts((prev) => {
      const exists = prev.some((s) => s.id === shiftToSave.id);
      if (exists) {
        return prev.map((s) => (s.id === shiftToSave.id ? shiftToSave : s));
      }
      return [shiftToSave, ...prev];
    });

    if (shiftToSave.isLateCancelled) {
      showToast('Dienst opgeslagen (Te laat geannuleerd - Recht op loon)');
    } else {
      showToast('Dienst succesvol opgeslagen!');
    }
    setEditingShift(null);
  };

  // Delete shift
  const handleDeleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    showToast('Dienst verwijderd.');
  };

  // Duplicate shift to next day
  const handleDuplicateShift = (shiftToDup: Shift) => {
    const origDate = new Date(shiftToDup.date + 'T00:00:00');
    origDate.setDate(origDate.getDate() + 1);
    const nextDateStr = origDate.toISOString().split('T')[0];

    const duplicatedShift: Shift = {
      ...shiftToDup,
      id: `shift-${Date.now()}`,
      date: nextDateStr,
      createdAt: Date.now(),
    };

    setShifts((prev) => [duplicatedShift, ...prev]);
    showToast(`Dienst gedupliceerd naar ${nextDateStr}!`);
  };

  // Toggle late cancellation status (<24u)
  const handleToggleLateCancelled = (shiftToToggle: Shift) => {
    const updated: Shift = {
      ...shiftToToggle,
      isLateCancelled: !shiftToToggle.isLateCancelled,
    };

    setShifts((prev) => prev.map((s) => (s.id === shiftToToggle.id ? updated : s)));

    if (updated.isLateCancelled) {
      showToast('Markering: Recht op loon (te laat geannuleerd <24u) ingeschakeld');
    } else {
      showToast('Markering "te laat geannuleerd" uitgeschakeld.');
    }
  };

  // Employer management
  const handleSaveEmployer = (employerToSave: Employer) => {
    setEmployers((prev) => {
      const exists = prev.some((e) => e.id === employerToSave.id);
      if (exists) {
        return prev.map((e) => (e.id === employerToSave.id ? employerToSave : e));
      }
      return [...prev, employerToSave];
    });
    showToast(`Werkgever "${employerToSave.name}" opgeslagen!`);
  };

  const handleDeleteEmployer = (id: string) => {
    setEmployers((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmployerId === id) {
      setSelectedEmployerId('all');
    }
    showToast('Werkgever verwijderd.');
  };

  const handleSetDefaultEmployer = (id: string) => {
    setEmployers((prev) =>
      prev.map((e) => ({
        ...e,
        isDefault: e.id === id,
      }))
    );
    showToast('Standaard werkgever bijgewerkt.');
  };

  // Data import & reset
  const handleImportData = (data: { employers: Employer[]; shifts: Shift[] }) => {
    setEmployers(data.employers);
    setShifts(data.shifts);
    showToast('Gegevens succesvol geïmporteerd!');
  };

  const handleResetData = () => {
    const res = resetAllData();
    setEmployers(res.employers);
    setShifts(res.shifts);
    showToast('Voorbeelddata hersteld.');
  };

  // Open add shift modal
  const handleOpenAddShift = () => {
    setEditingShift(null);
    setIsAddShiftOpen(true);
  };

  // Open edit shift modal
  const handleOpenEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsAddShiftOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-24">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <Header
        employers={employers}
        selectedEmployerId={selectedEmployerId}
        onSelectEmployer={setSelectedEmployerId}
        onOpenAddShift={handleOpenAddShift}
        onOpenEmployerManager={() => setIsEmployerManagerOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Container - Mobile Centered Canvas */}
      <main className="max-w-md mx-auto px-4 py-4">
        {activeTab === 'overview' && (
          <ShiftList
            shifts={shifts}
            employers={employers}
            selectedEmployerId={selectedEmployerId}
            onEditShift={handleOpenEditShift}
            onDeleteShift={handleDeleteShift}
            onDuplicateShift={handleDuplicateShift}
            onToggleLateCancelled={handleToggleLateCancelled}
            onOpenAddShift={handleOpenAddShift}
          />
        )}

        {activeTab === 'stats' && (
          <StatsOverview shifts={shifts} employers={employers} />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddShift={handleOpenAddShift}
      />

      {/* Modals */}
      <ShiftFormModal
        isOpen={isAddShiftOpen}
        onClose={() => setIsAddShiftOpen(false)}
        onSaveShift={handleSaveShift}
        employers={employers}
        editingShift={editingShift}
        defaultEmployerId={selectedEmployerId}
      />

      <EmployerManager
        isOpen={isEmployerManagerOpen}
        onClose={() => {
          setIsEmployerManagerOpen(false);
          if (activeTab === 'employers') setActiveTab('overview');
        }}
        employers={employers}
        onSaveEmployer={handleSaveEmployer}
        onDeleteEmployer={handleDeleteEmployer}
        onSetDefaultEmployer={handleSetDefaultEmployer}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          if (activeTab === 'export') setActiveTab('overview');
        }}
        employers={employers}
        shifts={shifts}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    </div>
  );
}
