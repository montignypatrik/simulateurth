export interface StatutoryHoliday {
  id: string;
  name: string; // Nom officiel en français
  nameEn: string; // English translation
  date: string; // YYYY-MM-DD
  observanceNote?: string;
}

// Liste officielle des fêtes légales et dates de prise du congé dans l'établissement
export const STATUTORY_HOLIDAYS: StatutoryHoliday[] = [
  {
    id: 'patriotes-2026',
    name: 'Journée nationale des Patriotes',
    nameEn: 'National Patriots\' Day',
    date: '2026-05-18',
  },
  {
    id: 'fete-nationale-2026',
    name: 'Fête nationale du Québec',
    nameEn: 'Quebec National Holiday (St-Jean-Baptiste)',
    date: '2026-06-24',
  },
  {
    id: 'canada-2026',
    name: 'Fête du Canada',
    nameEn: 'Canada Day',
    date: '2026-07-01',
  },
  {
    id: 'travail-2026',
    name: 'Fête du Travail',
    nameEn: 'Labour Day',
    date: '2026-09-07',
  },
  {
    id: 'action-de-graces-2026',
    name: 'Action de grâces',
    nameEn: 'Thanksgiving',
    date: '2026-10-12',
  },
  {
    id: 'veille-noel-2026',
    name: 'Veille de Noël',
    nameEn: 'Christmas Eve',
    date: '2026-12-24',
  },
  {
    id: 'noel-2026',
    name: 'Fête de Noël',
    nameEn: 'Christmas Day',
    date: '2026-12-25',
  },
  {
    id: 'lendemain-noel-2026',
    name: 'Lendemain de Noël',
    nameEn: 'Boxing Day',
    date: '2026-12-28',
  },
  {
    id: 'veille-an-2026',
    name: 'Veille du jour de l\'An',
    nameEn: 'New Year\'s Eve',
    date: '2026-12-31',
  },
  {
    id: 'jour-an-2027',
    name: 'Jour de l\'An',
    nameEn: 'New Year\'s Day',
    date: '2027-01-01',
  },
  {
    id: 'lendemain-jour-an-2027',
    name: 'Lendemain du jour de l\'An',
    nameEn: 'Day After New Year\'s Day',
    date: '2027-01-04',
  },
  {
    id: 'vendredi-saint-2027',
    name: 'Vendredi saint',
    nameEn: 'Good Friday',
    date: '2027-03-26',
  },
  {
    id: 'lundi-paques-2027',
    name: 'Lundi de Pâques',
    nameEn: 'Easter Monday',
    date: '2027-03-29',
  },
];

// Lookup Map by YYYY-MM-DD
const HOLIDAYS_BY_DATE = new Map<string, StatutoryHoliday>();
STATUTORY_HOLIDAYS.forEach((h) => {
  HOLIDAYS_BY_DATE.set(h.date, h);
});

// Helper to convert date to YYYY-MM-DD
function toDateKey(date: string | Date): string {
  if (typeof date === 'string') {
    // If it's already "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a given date is an official statutory holiday
 */
export function isStatutoryHoliday(date: string | Date): boolean {
  return HOLIDAYS_BY_DATE.has(toDateKey(date));
}

/**
 * Retrieve the statutory holiday object for a given date, if any
 */
export function getStatutoryHoliday(date: string | Date): StatutoryHoliday | undefined {
  return HOLIDAYS_BY_DATE.get(toDateKey(date));
}
