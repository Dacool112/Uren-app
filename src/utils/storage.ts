import { Employer, Shift, SynologyConfig } from '../types';

const STORAGE_EMPLOYERS_KEY = 'uren_tracker_employers_v1';
const STORAGE_SHIFTS_KEY = 'uren_tracker_shifts_v1';
const STORAGE_SYNOLOGY_KEY = 'uren_tracker_synology_config_v1';

export const DEFAULT_SYNOLOGY_CONFIG: SynologyConfig = {
  apiUrl: '',
  apiKey: '',
  autoSyncOnSave: false,
};

export const DEFAULT_EMPLOYERS: Employer[] = [
  {
    id: 'emp-1',
    name: 'Albert Heijn',
    hourlyWage: 15.20,
    color: '#00A0E2', // AH Blue
    notes: 'Vulploeg & Kassa',
    isDefault: true,
  },
  {
    id: 'emp-2',
    name: 'Café De Markt',
    hourlyWage: 14.50,
    color: '#D97706', // Amber/Orange
    notes: 'Horeca & Bediening',
    isDefault: false,
  },
  {
    id: 'emp-3',
    name: 'FlexWork Events',
    hourlyWage: 16.80,
    color: '#10B981', // Emerald
    notes: 'Evenementenopbouw',
    isDefault: false,
  },
];

export const SAMPLE_SHIFTS: Shift[] = [
  {
    id: 'shift-1',
    employerId: 'emp-1',
    date: '2026-08-01',
    startTime: '08:00',
    endTime: '16:30',
    breakMinutes: 30,
    isLateCancelled: false,
    location: 'Filiaal Centrum',
    notes: 'Ochtenddienst vakkenvullen',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'shift-2',
    employerId: 'emp-2',
    date: '2026-08-02',
    startTime: '17:00',
    endTime: '23:30',
    breakMinutes: 30,
    isLateCancelled: false,
    location: 'Grote Markt 12',
    notes: 'Avondsluiting horeca',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'shift-3',
    employerId: 'emp-1',
    date: '2026-08-03',
    startTime: '12:00',
    endTime: '20:00',
    breakMinutes: 45,
    // CRITICAL: Demonstration shift for late cancellation requirement (<24 uur van tevoren)
    isLateCancelled: true,
    location: 'Filiaal Centrum',
    notes: 'Dienst 3 uur van tevoren afgezegd door manager wegens overbezetting.',
    createdAt: Date.now(),
  },
  {
    id: 'shift-4',
    employerId: 'emp-3',
    date: '2026-07-28',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    isLateCancelled: false,
    location: 'Ziggo Dome',
    notes: 'Festivalopbouw',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'shift-5',
    employerId: 'emp-2',
    date: '2026-07-25',
    startTime: '16:00',
    endTime: '00:00',
    breakMinutes: 30,
    isLateCancelled: false,
    notes: 'Weekenddienst terras',
    createdAt: Date.now() - 86400000 * 8,
  },
];

export function loadEmployers(): Employer[] {
  try {
    const data = localStorage.getItem(STORAGE_EMPLOYERS_KEY);
    if (!data) {
      saveEmployers(DEFAULT_EMPLOYERS);
      return DEFAULT_EMPLOYERS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EMPLOYERS;
  } catch (error) {
    console.error('Error loading employers:', error);
    return DEFAULT_EMPLOYERS;
  }
}

export function saveEmployers(employers: Employer[]): void {
  try {
    localStorage.setItem(STORAGE_EMPLOYERS_KEY, JSON.stringify(employers));
  } catch (error) {
    console.error('Error saving employers:', error);
  }
}

export function loadShifts(): Shift[] {
  try {
    const data = localStorage.getItem(STORAGE_SHIFTS_KEY);
    if (!data) {
      saveShifts(SAMPLE_SHIFTS);
      return SAMPLE_SHIFTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : SAMPLE_SHIFTS;
  } catch (error) {
    console.error('Error loading shifts:', error);
    return SAMPLE_SHIFTS;
  }
}

export function saveShifts(shifts: Shift[]): void {
  try {
    localStorage.setItem(STORAGE_SHIFTS_KEY, JSON.stringify(shifts));
  } catch (error) {
    console.error('Error saving shifts:', error);
  }
}

export function exportBackupJSON(employers: Employer[], shifts: Shift[]): string {
  const backupData = {
    app: 'UrenTracker',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    employers,
    shifts,
  };
  return JSON.stringify(backupData, null, 2);
}

export function resetAllData(): { employers: Employer[]; shifts: Shift[] } {
  saveEmployers(DEFAULT_EMPLOYERS);
  saveShifts(SAMPLE_SHIFTS);
  return { employers: DEFAULT_EMPLOYERS, shifts: SAMPLE_SHIFTS };
}

export function loadSynologyConfig(): SynologyConfig {
  try {
    const data = localStorage.getItem(STORAGE_SYNOLOGY_KEY);
    if (!data) return DEFAULT_SYNOLOGY_CONFIG;
    return { ...DEFAULT_SYNOLOGY_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading Synology config:', error);
    return DEFAULT_SYNOLOGY_CONFIG;
  }
}

export function saveSynologyConfig(config: SynologyConfig): void {
  try {
    localStorage.setItem(STORAGE_SYNOLOGY_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving Synology config:', error);
  }
}

export async function sendToSynologyNAS(
  config: SynologyConfig,
  employers: Employer[],
  shifts: Shift[]
): Promise<{ success: boolean; message: string }> {
  if (!config.apiUrl || !config.apiUrl.trim()) {
    return {
      success: false,
      message: 'Geen Synology API-url ingevuld. Voer a.u.b. de URL van je Synology NAS in.',
    };
  }

  const payload = {
    app: 'UrenTracker',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalEmployers: employers.length,
    totalShifts: shifts.length,
    employers,
    shifts,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
      headers['X-API-Key'] = config.apiKey.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

    const response = await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      saveSynologyConfig({ ...config, lastSyncedAt: Date.now() });
      return {
        success: true,
        message: `Succesvol verzonden naar Synology NAS (${response.status} ${response.statusText})!`,
      };
    } else {
      return {
        success: false,
        message: `Synology NAS gaf statuscode ${response.status} (${response.statusText}). Controleer de API-endpoint.`,
      };
    }
  } catch (error: any) {
    console.error('Synology export error:', error);
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Verbinding met Synology NAS is verlopen (timeout). Controleer of je NAS aan staat en bereikbaar is.',
      };
    }
    return {
      success: false,
      message: `Kon geen verbinding maken met Synology NAS (${error.message || 'Netwerkfout'}). Controleer of de NAS ingeschakeld is.`,
    };
  }
}
