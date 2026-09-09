import { Shift, ShiftWorkType, WorkTypeConfig, ClaimValidationAlert } from '../types';

export const WORK_TYPE_CONFIGS: Record<ShiftWorkType, WorkTypeConfig> = {
  clinic: {
    label: 'Outpatient Clinic',
    color: '#4f46e5', // indigo-600
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-700',
    iconName: 'Stethoscope',
  },
  emergency: {
    label: 'Emergency (ED/ER)',
    color: '#e11d48', // rose-600
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-700',
    iconName: 'Activity',
  },
  rounds: {
    label: 'Inpatient Rounds',
    color: '#059669', // emerald-600
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    iconName: 'ClipboardList',
  },
  surgery: {
    label: 'Surgical / OR',
    color: '#7c3aed', // violet-600
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-700',
    iconName: 'Scissors',
  },
  oncall: {
    label: 'On-Call / Standby',
    color: '#d97706', // amber-600
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-700',
    iconName: 'PhoneCall',
  },
  telehealth: {
    label: 'Virtual Care / Telehealth',
    color: '#0284c7', // sky-600
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-700',
    iconName: 'Video',
  },
  admin: {
    label: 'Admin & Charting',
    color: '#475569', // slate-600
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderColor: 'border-slate-500',
    textColor: 'text-slate-700',
    iconName: 'FileText',
  },
};

export const COMMON_FACILITIES = [
  { name: 'City Central Hospital', code: 'FAC-0101', defaultDept: 'Emergency & Acute Care' },
  { name: 'St. Mary Regional Medical Center', code: 'FAC-0205', defaultDept: 'Inpatient Medicine' },
  { name: 'Metro Health Ambulatory Pavilion', code: 'FAC-0312', defaultDept: 'Outpatient Specialty Clinic' },
  { name: 'Northside Family Health Clinic', code: 'FAC-0440', defaultDept: 'Primary Care' },
  { name: 'Valley Telehealth Network', code: 'FAC-TELE-01', defaultDept: 'Virtual Care Division' },
];

export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYYYYMMDD(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

/**
 * Calculates raw duration and net billable hours (subtracting break)
 */
export function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number = 0): {
  rawHours: number;
  billableHours: number;
} {
  if (!startTime || !endTime) return { rawHours: 0, billableHours: 0 };

  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);

  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;

  // Handle overnight shift (e.g. 20:00 to 08:00)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const rawTotalMinutes = endMinutes - startMinutes;
  const netMinutes = Math.max(0, rawTotalMinutes - (breakMinutes || 0));

  return {
    rawHours: Number((rawTotalMinutes / 60).toFixed(2)),
    billableHours: Number((netMinutes / 60).toFixed(2)),
  };
}

export function calculateClaimTotal(shift: Shift): number {
  const { billableHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
  const multiplier = shift.isOvertimeOrHoliday ? 1.5 : 1.0;
  return Number((billableHours * (shift.hourlyRate || 0) * multiplier).toFixed(2));
}

/**
 * Generates array of weeks for Month view
 */
export function getMonthDays(currentDate: Date): {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const todayStr = formatDateToYYYYMMDD(new Date());

  // We want to start on Sunday
  const days: {
    date: Date;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  const startDate = new Date(year, month, 1 - startingDayOfWeek);

  // 6 rows x 7 days = 42 cells (Google Calendar standard)
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const dateStr = formatDateToYYYYMMDD(d);
    days.push({
      date: d,
      dateStr,
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Generates 7 days for the Week view
 */
export function getWeekDates(currentDate: Date): {
  date: Date;
  dateStr: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}[] {
  const curr = new Date(currentDate);
  const day = curr.getDay(); // 0 is Sunday
  const sunday = new Date(curr);
  sunday.setDate(curr.getDate() - day);

  const todayStr = formatDateToYYYYMMDD(new Date());

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(d);
    week.push({
      date: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return week;
}

/**
 * Check overlapping shifts for claim audit
 */
export function validateShiftsForClaims(shifts: Shift[]): ClaimValidationAlert[] {
  const alerts: ClaimValidationAlert[] = [];
  const shiftsByDate: Record<string, Shift[]> = {};

  shifts.forEach(s => {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = [];
    shiftsByDate[s.date].push(s);

    const { rawHours } = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);

    // Rule: Warning if over 8 hours with no break
    if (rawHours >= 8 && s.breakMinutes === 0) {
      alerts.push({
        shiftId: s.id,
        type: 'warning',
        message: `${s.title}: Working over 8 hrs without logged break may trigger billing audit.`,
      });
    }

    // Rule: Missing billing code
    if (!s.billingCode || s.billingCode.trim() === '') {
      alerts.push({
        shiftId: s.id,
        type: 'error',
        message: `${s.title}: Missing medical billing code / procedure identifier.`,
      });
    }

    // Rule: Missing facility billing code
    if (!s.facilityBillingCode || s.facilityBillingCode.trim() === '') {
      alerts.push({
        shiftId: s.id,
        type: 'warning',
        message: `${s.title}: Missing facility provider code (${s.facility}).`,
      });
    }
  });

  // Check overlap on same day
  Object.values(shiftsByDate).forEach(dayShifts => {
    if (dayShifts.length < 2) return;

    for (let i = 0; i < dayShifts.length; i++) {
      for (let j = i + 1; j < dayShifts.length; j++) {
        const a = dayShifts[i];
        const b = dayShifts[j];

        const [aSh, aSm] = a.startTime.split(':').map(Number);
        const [aEh, aEm] = a.endTime.split(':').map(Number);
        const [bSh, bSm] = b.startTime.split(':').map(Number);
        const [bEh, bEm] = b.endTime.split(':').map(Number);

        const aStart = aSh * 60 + aSm;
        let aEnd = aEh * 60 + aEm;
        if (aEnd <= aStart) aEnd += 1440;

        const bStart = bSh * 60 + bSm;
        let bEnd = bEh * 60 + bEm;
        if (bEnd <= bStart) bEnd += 1440;

        // Check intersection
        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          alerts.push({
            shiftId: a.id,
            type: 'error',
            message: `Conflict: Overlaps with '${b.title}' (${b.startTime}-${b.endTime}). Insurers reject overlapping claim hours.`,
          });
          alerts.push({
            shiftId: b.id,
            type: 'error',
            message: `Conflict: Overlaps with '${a.title}' (${a.startTime}-${a.endTime}). Insurers reject overlapping claim hours.`,
          });
        }
      }
    }
  });

  return alerts;
}

/**
 * Export claims to CSV for medical billing filing
 */
export function exportShiftsToCSV(shifts: Shift[]): void {
  const headers = [
    'Claim ID',
    'Provider Name',
    'Provider Billing ID',
    'Date of Service',
    'Shift / Work Type',
    'Start Time',
    'End Time',
    'Break (Minutes)',
    'Total Elapsed Hours',
    'Billable Claim Hours',
    'Facility Name',
    'Facility Billing Code',
    'Department',
    'Billing Service Code',
    'Hourly Rate ($)',
    'Overtime/Holiday Premium',
    'Estimated Claim Amount ($)',
    'Patients Seen',
    'Claim Status',
    'Notes / Remarks',
  ];

  const rows = shifts.map(s => {
    const { rawHours, billableHours } = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
    const amount = calculateClaimTotal(s);

    return [
      `"${s.id}"`,
      `"${s.providerName}"`,
      `"${s.providerBillingId}"`,
      `"${s.date}"`,
      `"${s.workType}"`,
      `"${s.startTime}"`,
      `"${s.endTime}"`,
      s.breakMinutes,
      rawHours,
      billableHours,
      `"${s.facility}"`,
      `"${s.facilityBillingCode}"`,
      `"${s.department}"`,
      `"${s.billingCode}"`,
      s.hourlyRate,
      s.isOvertimeOrHoliday ? 'YES (1.5x)' : 'NO',
      amount,
      s.patientCount ?? 0,
      `"${s.status.toUpperCase()}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `medical_billing_hours_export_${formatDateToYYYYMMDD(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
