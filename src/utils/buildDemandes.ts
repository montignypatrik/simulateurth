import type { LoggedHours } from '../components/LogHoursModal';
import type { DemandeWeek, DemandeRow, DemandeRowSlot } from '../components/templates/types';
import { BillingSegment, formatMinutes, parseLocalDate, PLAGES, splitLogIntoBillingSegments, toDateKey } from './billingRules';

const dayNames = {
  fr: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  en: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
};
const hours = (minutes: number) => Math.round(minutes / 60 * 100) / 100;

export function buildDemandes(logs: LoggedHours[], isFr = true): DemandeWeek[] {
  const formatDate = (date: string) => `${dayNames[isFr ? 'fr' : 'en'][parseLocalDate(date).getDay()]} ${date.slice(5)}`;
  const groups = new Map<string, { sunday: Date; pratique: string; segments: BillingSegment[] }>();
  for (const log of logs) {
    for (const segment of splitLogIntoBillingSegments(log)) {
      const sunday = parseLocalDate(segment.date);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const key = `${toDateKey(sunday)}__${segment.pratique}`;
      if (!groups.has(key)) groups.set(key, { sunday, pratique: segment.pratique, segments: [] });
      groups.get(key)!.segments.push(segment);
    }
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, group]) => {
    const { sunday, pratique, segments } = group;
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    const daysOptions = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(sunday);
      date.setDate(date.getDate() + offset);
      const dateStr = toDateKey(date);
      return { dateStr, display: formatDate(dateStr) };
    });
    const rows: DemandeRow[] = [];
    let slotNum = 1;
    for (const { dateStr } of daysOptions) {
      for (const plage of PLAGES) {
        const slots = new Map<string, { code: string; secteur: string; minutes: number }>();
        for (const segment of segments.filter(s => s.date === dateStr && s.plage === plage.id)) {
          const key = `${segment.code}__${segment.secteur}`;
          if (!slots.has(key)) slots.set(key, { code: segment.code, secteur: segment.secteur, minutes: 0 });
          slots.get(key)!.minutes += segment.minutes;
        }
        const entries = [...slots.values()];
        for (let offset = 0; offset < entries.length; offset += 3) {
          const chunk = entries.slice(offset, offset + 3);
          const rowSlots = Array.from({ length: 3 }, (_, i): DemandeRowSlot => ({
            slotNum: slotNum++, code: chunk[i]?.code ?? '', secteur: chunk[i]?.secteur ?? '',
            heures: chunk[i] ? hours(chunk[i].minutes) : '',
          })) as DemandeRow['slots'];
          rows.push({
            rowId: `${dateStr}_${plage.id}_${offset}`, dateStr, quantiemeDisplay: formatDate(dateStr),
            mode: 'TH', selectedPlage: plage.id, slots: rowSlots,
            totalHeures: hours(chunk.reduce((total, slot) => total + slot.minutes, 0)),
          });
        }
      }
    }
    return {
      id, pratique, startDate: sunday, endDate: saturday,
      startDateStr: toDateKey(sunday), endDateStr: toDateKey(saturday), daysOptions, rows,
      totalDemandeHeures: hours(segments.reduce((total, s) => total + s.minutes, 0)),
      sectorIssues: segments.filter(s => !s.secteur).map(s => ({
        date: s.date, startTime: formatMinutes(s.startMin), endTime: formatMinutes(s.endMin),
        code: s.code, programme: s.programme,
      })),
    };
  });
}
