import { Employer, Shift, ShiftCalculations, MonthSummary } from '../types';

/**
 * Calculates net minutes, net hours, effective wage, and earnings for a shift.
 * A late cancelled shift counts FULL hours and FULL earnings as required by Dutch labor guidelines (<24u).
 */
export function calculateShift(shift: Shift, employer?: Employer): ShiftCalculations {
  const hourlyWage = shift.hourlyWageOverride !== undefined && shift.hourlyWageOverride > 0
    ? shift.hourlyWageOverride
    : (employer?.hourlyWage || 0);

  if (shift.isRegularCancelled) {
    return {
      grossMinutes: 0,
      netMinutes: 0,
      netHours: 0,
      hourlyWage,
      totalEarnings: 0,
    };
  }

  // Parse HH:MM start and end times
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);

  let startTotalM = startH * 60 + startM;
  let endTotalM = endH * 60 + endM;

  // Handle overnight shift (e.g. 22:00 to 06:00)
  if (endTotalM < startTotalM) {
    endTotalM += 24 * 60;
  }

  const grossMinutes = Math.max(0, endTotalM - startTotalM);
  const netMinutes = Math.max(0, grossMinutes - (shift.breakMinutes || 0));
  const netHours = netMinutes / 60;

  // For both normal shifts and LATE CANCELLED shifts, uren & loon count in full!
  const totalEarnings = netHours * hourlyWage;

  return {
    grossMinutes,
    netMinutes,
    netHours,
    hourlyWage,
    totalEarnings,
  };
}

/**
 * Formats a number as Dutch currency, e.g. € 1.250,50
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats minutes into human-readable Dutch duration e.g. "7u 30m"
 */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}u`;
  return `${hours}u ${minutes}m`;
}

/**
 * Formats decimal hours e.g. 7.5 to "7,5 u"
 */
export function formatDecimalHours(hours: number): string {
  return `${hours.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} u`;
}

/**
 * Formats YYYY-MM-DD into Dutch readable format e.g. "Ma 12 aug 2026"
 */
export function formatDutchDate(dateString: string, includeDayName = true): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeDayName ? { weekday: 'short' } : {}),
  };

  const formatted = date.toLocaleDateString('nl-NL', options);
  // Capitalize first letter e.g. "Ma 12 aug 2026"
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formats YYYY-MM to e.g. "Augustus 2026"
 */
export function getDutchMonthYearName(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (isNaN(date.getTime())) return yearMonth;

  const monthName = date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

/**
 * Extracts YYYY-MM from YYYY-MM-DD
 */
export function getYearMonth(dateString: string): string {
  if (!dateString || dateString.length < 7) return '';
  return dateString.slice(0, 7);
}

/**
 * Calculates aggregates for a given array of shifts
 */
export function calculateTotals(shifts: Shift[], employers: Employer[]) {
  const employerMap = new Map<string, Employer>(employers.map((e) => [e.id, e]));

  let totalNetMinutes = 0;
  let totalEarnings = 0;
  let totalShifts = 0;
  let lateCancelledCount = 0;
  let lateCancelledEarnings = 0;
  let lateCancelledMinutes = 0;

  shifts.forEach((shift) => {
    const employer = employerMap.get(shift.employerId);
    const calc = calculateShift(shift, employer);

    totalNetMinutes += calc.netMinutes;
    totalEarnings += calc.totalEarnings;
    totalShifts += 1;

    if (shift.isLateCancelled) {
      lateCancelledCount += 1;
      lateCancelledEarnings += calc.totalEarnings;
      lateCancelledMinutes += calc.netMinutes;
    }
  });

  return {
    totalNetMinutes,
    totalNetHours: totalNetMinutes / 60,
    totalEarnings,
    totalShifts,
    lateCancelledCount,
    lateCancelledEarnings,
    lateCancelledMinutes,
    lateCancelledHours: lateCancelledMinutes / 60,
  };
}

/**
 * Group shifts by YYYY-MM month string
 */
export function groupShiftsByMonth(shifts: Shift[], employers: Employer[]): MonthSummary[] {
  const map = new Map<string, Shift[]>();

  shifts.forEach((s) => {
    const ym = getYearMonth(s.date);
    if (!map.has(ym)) {
      map.set(ym, []);
    }
    map.get(ym)!.push(s);
  });

  const sortedKeys = Array.from(map.keys()).sort().reverse();
  const employerMap = new Map<string, Employer>(employers.map((e) => [e.id, e]));

  return sortedKeys.map((ym) => {
    const monthShifts = map.get(ym)!;
    let netMinutes = 0;
    let earnings = 0;
    let lateCount = 0;

    monthShifts.forEach((s) => {
      const emp = employerMap.get(s.employerId);
      const calc = calculateShift(s, emp);
      netMinutes += calc.netMinutes;
      earnings += calc.totalEarnings;
      if (s.isLateCancelled) lateCount += 1;
    });

    return {
      yearMonth: ym,
      label: getDutchMonthYearName(ym),
      totalShifts: monthShifts.length,
      lateCancelledShifts: lateCount,
      totalNetHours: netMinutes / 60,
      totalEarnings: earnings,
    };
  });
}

/**
 * Generates CSV string for export
 */
export function generateCSV(shifts: Shift[], employers: Employer[]): string {
  const employerMap = new Map<string, Employer>(employers.map((e) => [e.id, e]));

  const headers = [
    'Datum',
    'Werkgever',
    'Starttijd',
    'Eindtijd',
    'Pauze (min)',
    'Gewerkte uren',
    'Uurloon (€)',
    'Totaal (€)',
    'Status',
    'Locatie',
    'Notities',
  ];

  const rows = shifts.map((shift) => {
    const employer = employerMap.get(shift.employerId);
    const calc = calculateShift(shift, employer);

    let status = 'Normaal gewerkt';
    if (shift.isLateCancelled) {
      status = 'Te laat geannuleerd (<24u) - Recht op loon';
    } else if (shift.isRegularCancelled) {
      status = 'Geannuleerd in overleg (>24u)';
    }

    return [
      shift.date,
      `"${employer?.name || 'Onbekend'}"`,
      shift.startTime,
      shift.endTime,
      shift.breakMinutes,
      calc.netHours.toFixed(2).replace('.', ','),
      calc.hourlyWage.toFixed(2).replace('.', ','),
      calc.totalEarnings.toFixed(2).replace('.', ','),
      `"${status}"`,
      `"${shift.location || ''}"`,
      `"${(shift.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  // Include UTF-8 BOM so Microsoft Excel correctly renders Dutch special characters
  const bom = '\uFEFF';
  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  return bom + csvContent;
}
