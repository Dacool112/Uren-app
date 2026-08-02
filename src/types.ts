export interface SynologyConfig {
  apiUrl: string;
  apiKey?: string;
  autoSyncOnSave?: boolean;
  lastSyncedAt?: number;
}

export interface Employer {
  id: string;
  name: string;
  hourlyWage: number; // In Euros, e.g. 14.50
  color: string; // TailWind color key or hex code
  notes?: string;
  isDefault?: boolean;
}

export interface Shift {
  id: string;
  employerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number; // e.g. 30
  hourlyWageOverride?: number; // Optional override, if undefined uses employer.hourlyWage
  
  // Late cancellation feature (< 24 hours in advance)
  isLateCancelled: boolean; // "Dienst te laat geannuleerd (< 24 uur van tevoren)"
  
  // Standard non-payable cancellation if needed
  isRegularCancelled?: boolean;

  location?: string;
  notes?: string;
  createdAt: number;
}

export interface ShiftCalculations {
  grossMinutes: number; // total time between start & end
  netMinutes: number; // minus break
  netHours: number; // decimal hours, e.g. 7.5
  hourlyWage: number;
  totalEarnings: number;
}

export interface MonthSummary {
  yearMonth: string; // "YYYY-MM"
  label: string; // e.g. "Augustus 2026"
  totalShifts: number;
  lateCancelledShifts: number;
  totalNetHours: number; // in hours
  totalEarnings: number;
}

export type ActiveTab = 'overview' | 'stats' | 'employers' | 'export';
