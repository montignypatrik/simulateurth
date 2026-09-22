import { canonicalActivityCode, extractActivityCode, getDefaultActiviteForPratique, getProgramme } from '../data/billingCatalog';
import { isStatutoryHoliday } from '../data/statutoryHolidays';
import type { LoggedHours } from '../components/LogHoursModal';
import type { PlageId } from '../components/templates/types';

export const PLAGES = [
  { id: 'NU' as const, startMin: 0, endMin: 480 },
  { id: 'AM' as const, startMin: 480, endMin: 720 },
  { id: 'PM' as const, startMin: 720, endMin: 1200 },
  { id: 'SO' as const, startMin: 1200, endMin: 1440 },
];

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
export function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** A blank result means the supplied guides do not establish a sector for this interval. */
export function calculateSecteur(
  dateStr: string,
  plageId: PlageId,
  code?: string,
  pratique = 'CHSLD',
  startHourMin?: number,
  _endHourMin?: number,
  programme?: string,
): string {
  const definition = getProgramme(pratique, programme);
  if (!definition) return '';
  const activityCode = extractActivityCode(code || getDefaultActiviteForPratique(pratique, programme));
  // The Cabinet guide writes 72101; retain the existing app's zero-padded code as an alias.
  const canonicalCode = canonicalActivityCode(activityCode);
  const activity = definition.activities.find(a => a.code === canonicalCode);
  if (!activity) return '';

  const minute = startHourMin ?? PLAGES.find(p => p.id === plageId)!.startMin;
  const day = parseLocalDate(dateStr).getDay();
  const weekendOrHoliday = day === 0 || day === 6 || isStatutoryHoliday(dateStr);
  if (definition.profile === 'zero' || activity.sectorZero) return '0';

  if (definition.profile === 'clinic') {
    // GMF-U p. 4 explicitly specifies sector 0 from midnight to 08:00, every day.
    if (minute < 480) return pratique === 'GMF-U' ? '0' : '';
    if (weekendOrHoliday) return activity.networkWalkIn ? '28' : '27';
    if (minute < 1080) return activity.regularSectorZero ? '0' : definition.daySector;
    if (minute < 1200) return day === 5 ? '25' : '23';
    if (minute < 1320) return day === 5 ? '26' : '24';
    // Do not extend the guide's 20:00–22:00 majoration into 22:00–24:00.
    return '';
  }

  if (weekendOrHoliday) return minute < 480 ? '42' : '31';
  if (minute < 480) return ''; // Weekday nights are absent from the hospital tables supplied.
  if (minute < 1200) return activity.regularSectorZero ? '0' : definition.daySector;
  return day === 5 ? '30' : '29';
}

export interface BillingSegment {
  date: string;
  pratique: string;
  programme?: string;
  code: string;
  secteur: string;
  plage: PlageId;
  startMin: number;
  endMin: number;
  minutes: number;
}

/** Split before calculating sectors so the actual date decides holidays, weekends and week boundaries. */
export function splitLogIntoBillingSegments(log: LoggedHours): BillingSegment[] {
  const start = timeToMinutes(log.startTime);
  let end = timeToMinutes(log.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return [];
  if (end < start) end += 1440;
  const pratique = log.pratique || 'CHSLD';
  const code = extractActivityCode(log.activite || getDefaultActiviteForPratique(pratique, log.programme));
  const segments: BillingSegment[] = [];
  const boundaries = [0, 480, 720, 1080, 1200, 1320, 1440];

  for (let dayOffset = 0; dayOffset <= Math.floor(end / 1440); dayOffset++) {
    const current = parseLocalDate(log.date);
    current.setDate(current.getDate() + dayOffset);
    const date = toDateKey(current);
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startMin = Math.max(boundaries[i], start - dayOffset * 1440);
      const endMin = Math.min(boundaries[i + 1], end - dayOffset * 1440);
      if (endMin <= startMin) continue;
      const plage = PLAGES.find(p => startMin >= p.startMin && startMin < p.endMin)!.id;
      segments.push({
        date, pratique, programme: log.programme, code, plage, startMin, endMin,
        minutes: endMin - startMin,
        secteur: calculateSecteur(date, plage, code, pratique, startMin, endMin, log.programme),
      });
    }
  }
  return segments;
}
