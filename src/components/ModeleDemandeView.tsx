import React, { useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, FileText, Clock, ChevronDown, Layers, Sparkles } from 'lucide-react';
import { LoggedHours, calculateDurationHours } from './LogHoursModal';
import { Facnet2Template } from './templates/Facnet2Template';
import { Facnet3Template } from './templates/Facnet3Template';
import { RamqTemplate } from './templates/RamqTemplate';
import { TemplateId, DemandeRowSlot, DemandeRow, DemandeWeek, PlageId } from './templates/types';
import { isStatutoryHoliday } from '../data/statutoryHolidays';
import { FacnetLogo } from './FacnetLogo';

interface ModeleDemandeViewProps {
  loggedHours: LoggedHours[];
  onBack: () => void;
  lang?: 'fr' | 'en';
  onToggleLang?: (newLang: 'fr' | 'en') => void;
}

interface PlageDef {
  id: PlageId;
  label: string;
  startMin: number; // minutes from 00:00
  endMin: number;   // minutes from 00:00
}

const PLAGES: PlageDef[] = [
  { id: 'NU', label: 'NU', startMin: 0, endMin: 8 * 60 },       // 00h - 08h
  { id: 'AM', label: 'AM', startMin: 8 * 60, endMin: 12 * 60 },  // 08h - 12h
  { id: 'PM', label: 'PM', startMin: 12 * 60, endMin: 20 * 60 }, // 12h - 20h
  { id: 'SO', label: 'SO', startMin: 20 * 60, endMin: 24 * 60 }, // 20h - 24h
];

const TEMPLATE_STORAGE_KEY = 'demande_active_template';
const TEMPLATE_PROMPT_ANSWERED_KEY = 'demande_platform_prompt_answered';

const TEMPLATE_OPTIONS: {
  id: TemplateId;
  label: string;
  frDescription: string;
  enDescription: string;
  activeClass: string;
  dotClass: string;
}[] = [
  {
    id: 'facnet2',
    label: 'Facnet 2.0',
    frDescription: 'Tableau compact avec cases a cocher.',
    enDescription: 'Compact table with checkboxes.',
    activeClass: 'bg-[#004d47] text-white border-[#003f3a]',
    dotClass: 'bg-emerald-300',
  },
  {
    id: 'facnet3',
    label: 'Facnet 3.0',
    frDescription: 'Fiches modernes avec blocs de creneaux.',
    enDescription: 'Modern cards with time-slot blocks.',
    activeClass: 'bg-[#18392b] text-white border-[#132e23]',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'ramq',
    label: 'RAMQ',
    frDescription: 'Format portail RAMQ avec grille numerotee.',
    enDescription: 'RAMQ portal format with numbered grid.',
    activeClass: 'bg-[#005a9c] text-white border-[#004a82]',
    dotClass: 'bg-sky-300',
  },
];

const JOUR_ABBR_FR: { [key: number]: string } = {
  0: 'dim.',
  1: 'lun.',
  2: 'mar.',
  3: 'mer.',
  4: 'jeu.',
  5: 'ven.',
  6: 'sam.',
};

const JOUR_ABBR_EN: { [key: number]: string } = {
  0: 'Sun.',
  1: 'Mon.',
  2: 'Tue.',
  3: 'Wed.',
  4: 'Thu.',
  5: 'Fri.',
  6: 'Sat.',
};

// Helper: parse YYYY-MM-DD
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper: format YYYY-MM-DD
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Format Quantième display e.g. "mar. 09-01"
function formatQuantieme(dateStr: string, isFr: boolean): string {
  const d = parseLocalDate(dateStr);
  const dayOfWeek = d.getDay();
  const abbr = isFr ? JOUR_ABBR_FR[dayOfWeek] : JOUR_ABBR_EN[dayOfWeek];
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${abbr} ${m}-${day}`;
}

// Extract 6-digit code or primary code from activite string
function extractCode(activite?: string, defaultCode = ''): string {
  if (!activite) return defaultCode;
  const match = activite.match(/^(\d{5,6})/);
  if (match) return match[1];
  return activite.split(' ')[0] || defaultCode;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Calculate overlap in hours between a shift [start, end] and a plage [plageStart, plageEnd]
function calculateOverlapHours(shiftStart: string, shiftEnd: string, plageStartMin: number, plageEndMin: number): number {
  let sMin = timeToMinutes(shiftStart);
  let eMin = timeToMinutes(shiftEnd);

  // If ends at 00:00 or smaller than start, wrap to 24h (1440 min)
  if (eMin <= sMin) {
    eMin += 24 * 60;
  }

  // Calculate overlap
  const oStart = Math.max(sMin, plageStartMin);
  const oEnd = Math.min(eMin, plageEndMin);

  if (oEnd > oStart) {
    return Math.round(((oEnd - oStart) / 60) * 100) / 100;
  }
  return 0;
}

// Logic for secteur based on day, plage, code, and pratique:
// - For code 072101 (Activités de fonctionnement en GMF) or practice Cabinet: secteur is ALWAYS 0
// - For code 53043 (Tâches médico-administratives et hospitalières) in Soins palliatifs: secteur is ALWAYS 0
// - For Soins palliatifs:
//     - En semaine de 8h à 20h (plages AM, PM) = 0
//     - Lundi, mardi, mercredi et jeudi de 20h à 24h (plage SO) = 29
//     - Vendredi de 20h à 24h (plage SO) = 30
//     - Samedi, dimanche et jours fériés de 8h à 24h (plages AM, PM, SO) = 31
//     - Samedi, dimanche et jours fériés de 0h à 8h (plage NU) = 42
// - For CHSLD:
//     - En semaine de 8h à 20h (plages AM, PM) = 4
//     - Lundi, mardi, mercredi et jeudi de 20h à 24h (plage SO) = 29
//     - Vendredi de 20h à 24h (plage SO) = 30
//     - Samedi, dimanche et jours fériés de 8h à 24h (plages AM, PM, SO) = 31
//     - Samedi, dimanche et jours fériés de 0h à 8h (plage NU) = 42
export function calculateSecteur(
  dateStr: string,
  plageId: PlageId,
  code?: string,
  pratique?: string
): string {
  // Sector rule: code 072101 or Cabinet practice is ALWAYS 0
  if (code === '072101' || code?.startsWith('072101') || pratique === 'Cabinet') {
    return '0';
  }

  // Sector rule: 53043 (Tâches médico-administratives et hospitalières) is ALWAYS 0
  if (code === '53043' || code?.startsWith('53043')) {
    return '0';
  }

  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  const isHoliday = isStatutoryHoliday(dateStr);

  if (isWeekend || isHoliday) {
    if (plageId === 'NU') {
      // Samedi, dimanche et jours fériés de 0h à 8h = 42
      return '42';
    }
    // Samedi, dimanche et jours fériés de 8h à 24h (AM, PM, SO) = 31
    return '31';
  }

  // Weekdays (Monday to Friday)
  if (plageId === 'AM' || plageId === 'PM') {
    // Soins palliatifs: En semaine de 8h à 20h = 0
    if (pratique === 'Soins palliatifs') {
      return '0';
    }
    // CHSLD: En semaine de 8h à 20h = 4
    return '4';
  }

  if (plageId === 'SO') {
    if (day >= 1 && day <= 4) {
      // Lundi, mardi, mercredi et jeudi de 20h à 24h = 29
      return '29';
    }
    if (day === 5) {
      // Vendredi de 20h à 24h = 30
      return '30';
    }
  }

  return '';
}


export const ModeleDemandeView: React.FC<ModeleDemandeViewProps> = ({
  loggedHours,
  onBack,
  lang = 'fr',
  onToggleLang,
}) => {
  const isFr = lang === 'fr';
  const [selectedDemandeIndex, setSelectedDemandeIndex] = useState(0);
  const [isTemplatePromptOpen, setIsTemplatePromptOpen] = useState(() => {
    try {
      return localStorage.getItem(TEMPLATE_PROMPT_ANSWERED_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved === 'facnet2' || saved === 'facnet3' || saved === 'ramq') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'facnet3';
  });

  const handleSelectTemplate = (template: TemplateId) => {
    setSelectedTemplate(template);
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
    } catch {
      // ignore
    }
  };

  const handleInitialTemplateChoice = (template: TemplateId) => {
    handleSelectTemplate(template);
    try {
      localStorage.setItem(TEMPLATE_PROMPT_ANSWERED_KEY, 'true');
    } catch {
      // ignore
    }
    setIsTemplatePromptOpen(false);
  };

  // Build the Demandes:
  // RULE: A demande is strictly linked to a single pratique. Different pratique = different demande!
  // Demande is identified by (Sunday to Saturday week + pratique).
  const demandes: DemandeWeek[] = React.useMemo(() => {
    const demandMap = new Map<
      string,
      { sundayDate: Date; sundayKey: string; pratique: string; logs: LoggedHours[] }
    >();

    loggedHours.forEach((log) => {
      const logPratique = log.pratique || 'CHSLD';
      const logDate = parseLocalDate(log.date);
      const dayOfWeek = logDate.getDay(); // 0 = Sun, 6 = Sat

      // Find Sunday
      const sunday = new Date(
        logDate.getFullYear(),
        logDate.getMonth(),
        logDate.getDate() - dayOfWeek
      );
      const sundayKey = toDateKey(sunday);
      const groupKey = `${sundayKey}__${logPratique}`;

      if (!demandMap.has(groupKey)) {
        demandMap.set(groupKey, {
          sundayDate: sunday,
          sundayKey,
          pratique: logPratique,
          logs: [],
        });
      }
      demandMap.get(groupKey)!.logs.push(log);
    });

    // Sort: primary chronological by sundayKey, secondary by pratique (CHSLD before Cabinet)
    const sortedEntries = Array.from(demandMap.values()).sort((a, b) => {
      if (a.sundayKey !== b.sundayKey) {
        return a.sundayKey.localeCompare(b.sundayKey);
      }
      return a.pratique.localeCompare(b.pratique);
    });

    const result: DemandeWeek[] = [];

    sortedEntries.forEach((entry) => {
      const sunday = entry.sundayDate;
      const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
      const demandPratique = entry.pratique;

      // Prepare 7 days of the week options for the Quantième dropdown
      const daysOptions: { dateStr: string; display: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + d);
        const curStr = toDateKey(cur);
        daysOptions.push({
          dateStr: curStr,
          display: formatQuantieme(curStr, isFr),
        });
      }

      // Generate rows based on the plage horaire logic:
      // NU (00h-08h), AM (08h-12h), PM (12h-20h), SO (20h-24h)
      const rows: DemandeRow[] = [];
      let itemCounter = 1; // Sequential item numbers: 1,2,3 for row 1; 4,5,6 for row 2; etc.

      // Group this demande's logs by date
      const logsByDate = new Map<string, LoggedHours[]>();
      entry.logs.forEach((log) => {
        if (!logsByDate.has(log.date)) {
          logsByDate.set(log.date, []);
        }
        logsByDate.get(log.date)!.push(log);
      });

      // Sort dates chronologically
      const sortedDates = Array.from(logsByDate.keys()).sort();

      sortedDates.forEach((dateStr) => {
        const dateLogs = logsByDate.get(dateStr)!;

        // For each of the 4 plages in order (NU, AM, PM, SO)
        PLAGES.forEach((plage) => {
          // Find logs that have overlap with this plage
          const matchingLogs: { log: LoggedHours; hoursInPlage: number }[] = [];

          dateLogs.forEach((log) => {
            const overlap = calculateOverlapHours(
              log.startTime,
              log.endTime,
              plage.startMin,
              plage.endMin
            );
            if (overlap > 0) {
              matchingLogs.push({ log, hoursInPlage: overlap });
            }
          });

          // If there is activity in this plage, create a row!
          if (matchingLogs.length > 0) {
            // Build the 3 slots (# Code Secteur Heures)
            const slot1Num = itemCounter++;
            const slot2Num = itemCounter++;
            const slot3Num = itemCounter++;

            const match1 = matchingLogs[0];
            const match2 = matchingLogs[1];
            const match3 = matchingLogs[2];

            const defCode =
              demandPratique === 'Cabinet'
                ? '072101'
                : demandPratique === 'Soins palliatifs'
                ? '53030'
                : '101030';

            const code1 = match1 ? extractCode(match1.log.activite, defCode) : '';
            const code2 = match2 ? extractCode(match2.log.activite, defCode) : '';
            const code3 = match3 ? extractCode(match3.log.activite, defCode) : '';

            const slot1: DemandeRowSlot = {
              slotNum: slot1Num,
              code: code1,
              secteur: match1
                ? calculateSecteur(dateStr, plage.id, code1, demandPratique)
                : '',
              heures: match1 ? match1.hoursInPlage : '',
            };

            const slot2: DemandeRowSlot = {
              slotNum: slot2Num,
              code: code2,
              secteur: match2
                ? calculateSecteur(dateStr, plage.id, code2, demandPratique)
                : '',
              heures: match2 ? match2.hoursInPlage : '',
            };

            const slot3: DemandeRowSlot = {
              slotNum: slot3Num,
              code: code3,
              secteur: match3
                ? calculateSecteur(dateStr, plage.id, code3, demandPratique)
                : '',
              heures: match3 ? match3.hoursInPlage : '',
            };

            const rowTotal = matchingLogs.reduce((sum, m) => sum + m.hoursInPlage, 0);

            rows.push({
              rowId: `${dateStr}_${plage.id}`,
              dateStr,
              quantiemeDisplay: formatQuantieme(dateStr, isFr),
              mode: 'TH',
              selectedPlage: plage.id,
              slots: [slot1, slot2, slot3],
              totalHeures: Math.round(rowTotal * 100) / 100,
            });
          }
        });
      });

      const totalDemandeHeures = rows.reduce((sum, r) => sum + r.totalHeures, 0);

      if (totalDemandeHeures > 0) {
        result.push({
          id: `${entry.sundayKey}__${demandPratique}`,
          pratique: demandPratique,
          startDate: sunday,
          endDate: saturday,
          startDateStr: entry.sundayKey,
          endDateStr: toDateKey(saturday),
          daysOptions,
          rows,
          totalDemandeHeures: Math.round(totalDemandeHeures * 100) / 100,
        });
      }
    });

    return result;
  }, [loggedHours, isFr]);

  const activeDemandeIdx = Math.min(
    selectedDemandeIndex,
    Math.max(0, demandes.length - 1)
  );
  const currentDemande = demandes[activeDemandeIdx];

  return (
    <div className="flex-1 bg-neutral-100/70 text-slate-800 flex flex-col font-sans">
      {isTemplatePromptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0077c8] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {isFr
                      ? 'Quelle plateforme prevoyez-vous utiliser ?'
                      : 'Which platform do you plan to use?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    {isFr
                      ? 'Votre choix sera applique automatiquement au modele de demande. Vous pourrez toujours le changer avec le selecteur en haut de la page.'
                      : 'Your choice will be applied automatically to the request model. You can still change it with the selector at the top of the page.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 grid gap-3">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={`template-prompt-${option.id}`}
                  type="button"
                  onClick={() => handleInitialTemplateChoice(option.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    selectedTemplate === option.id
                      ? option.activeClass
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${option.dotClass}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{option.label}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            selectedTemplate === option.id ? 'text-white/80' : 'text-slate-500'
                          }`}
                        >
                          {isFr ? option.frDescription : option.enDescription}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                        selectedTemplate === option.id
                          ? 'bg-white/15 border-white/25 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isFr ? 'Choisir' : 'Choose'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar with Facnet Branding */}
      <header className="bg-[#1b293c] text-white border-b border-[#25374e] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <FacnetLogo className="h-5 sm:h-5.5 w-auto text-white fill-white shrink-0" />
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <button
            onClick={onBack}
            id="back-to-calendar-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#243449] hover:bg-[#2e435e] border border-[#354c69] rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            {isFr ? 'Retour au calendrier' : 'Back to calendar'}
          </button>
          <div className="hidden md:block">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight">
              {isFr ? 'Modèle de demande' : 'Request Model'}
            </h1>
          </div>
        </div>

        {/* Legend for plages & language toggle */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-300 bg-[#131f2f] px-2.5 py-1 rounded-lg border border-[#2b3e56]">
            <span className="font-bold text-slate-200 mr-1">{isFr ? 'Plages :' : 'Ranges:'}</span>
            <span className="font-mono bg-[#243449] text-sky-200 px-1.5 py-0.5 rounded border border-[#354c69]">NU 00h-08h</span>
            <span className="font-mono bg-[#243449] text-sky-200 px-1.5 py-0.5 rounded border border-[#354c69]">AM 08h-12h</span>
            <span className="font-mono bg-[#243449] text-sky-200 px-1.5 py-0.5 rounded border border-[#354c69]">PM 12h-20h</span>
            <span className="font-mono bg-[#243449] text-sky-200 px-1.5 py-0.5 rounded border border-[#354c69]">SO 20h-24h</span>
          </div>

          {onToggleLang && (
            <div className="flex items-center bg-[#131f2f] p-0.5 rounded-lg border border-[#2b3e56] shadow-2xs">
              <button
                onClick={() => onToggleLang('fr')}
                title="Passer en français"
                className={`px-2 py-0.8 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  isFr ? 'bg-[#0077c8] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => onToggleLang('en')}
                title="Switch to English"
                className={`px-2 py-0.8 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  !isFr ? 'bg-[#0077c8] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Platform Template Switcher Bar */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {isFr ? 'Modèle de plateforme :' : 'Platform template:'}
            </span>

            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 shadow-inner">
              <button
                type="button"
                id="template-btn-facnet2"
                onClick={() => handleSelectTemplate('facnet2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTemplate === 'facnet2'
                    ? 'bg-[#004d47] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Facnet 2.0</span>
              </button>

              <button
                type="button"
                id="template-btn-facnet3"
                onClick={() => handleSelectTemplate('facnet3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTemplate === 'facnet3'
                    ? 'bg-[#18392b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Facnet 3.0</span>
              </button>

              <button
                type="button"
                id="template-btn-ramq"
                onClick={() => handleSelectTemplate('ramq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTemplate === 'ramq'
                    ? 'bg-[#005a9c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-300" />
                <span>RAMQ</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium hidden md:flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {selectedTemplate === 'facnet2' &&
              (isFr
                ? 'Format Facnet 2.0 (Tableau compact avec cases à cocher)'
                : 'Facnet 2.0 layout (Compact table with checkboxes)')}
            {selectedTemplate === 'facnet3' &&
              (isFr
                ? 'Format Facnet 3.0 (Fiches modernes et blocs de créneaux)'
                : 'Facnet 3.0 layout (Modern cards and slot blocks)')}
            {selectedTemplate === 'ramq' &&
              (isFr
                ? 'Format officiel portail RAMQ (Demande 1215 - Grille numérotée)'
                : 'Official RAMQ portal format (Claim 1215 - Numbered grid)')}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl w-full mx-auto space-y-6">
        {demandes.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-300 p-8 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1">
              {isFr ? 'Aucune heure trouvée' : 'No logged hours found'}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {isFr
                ? 'Veuillez consigner des heures dans le calendrier pour générer le modèle de demande de facturation.'
                : 'Please log hours in the calendar to generate the billing request model.'}
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0077c8] hover:bg-[#0064a8] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isFr ? 'Aller au calendrier' : 'Go to calendar'}
            </button>
          </div>
        ) : (
          <>
            {/* Top Toolbar: Tab toggle Demande #1 / Demande #2 */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-300 pb-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Tab toggle at the top: Demande #1 / Demande #2 */}
                <div className="inline-flex p-1 bg-neutral-200/90 rounded-xl border border-neutral-300 shadow-2xs gap-1">
                  {demandes.map((d, idx) => {
                    const isActive = idx === activeDemandeIdx;
                    const isCabinet = d.pratique === 'Cabinet';
                    const isSoinsPalliatifs = d.pratique === 'Soins palliatifs';
                    const hasHoliday = d.rows.some((r) => isStatutoryHoliday(r.dateStr));
                    return (
                      <button
                        key={d.id}
                        id={`demande-tab-${idx}`}
                        onClick={() => setSelectedDemandeIndex(idx)}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                          isActive
                            ? 'bg-white text-slate-900 shadow-xs border border-neutral-300/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isFr ? `Demande #${idx + 1}` : `Request #${idx + 1}`}</span>
                          {hasHoliday && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-100 border border-amber-300 rounded text-[9px] font-bold text-amber-900"
                              title={isFr ? 'Comprend une fête légale / jour férié' : 'Includes statutory holiday'}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              <span className="hidden sm:inline">{isFr ? 'Férié' : 'Holiday'}</span>
                            </span>
                          )}
                        </div>
                        {/* Practice tag on each tab */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            isCabinet
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isSoinsPalliatifs
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          {d.pratique}
                        </span>
                        <span
                          className={`text-[11px] font-normal font-mono px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-neutral-100 text-slate-700'
                              : 'text-slate-500 bg-neutral-200/50'
                          }`}
                        >
                          {d.startDateStr.slice(5)} → {d.endDateStr.slice(5)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Currently selected Demande Rendered According to Template */}
            <div key={`${currentDemande.id}_${selectedTemplate}`}>
              {selectedTemplate === 'facnet2' && (
                <Facnet2Template
                  demande={currentDemande}
                  demandeIndex={activeDemandeIdx}
                  allDemandes={demandes}
                  onSelectDemandeIndex={setSelectedDemandeIndex}
                  isFr={isFr}
                />
              )}

              {selectedTemplate === 'facnet3' && (
                <Facnet3Template
                  demande={currentDemande}
                  demandeIndex={activeDemandeIdx}
                  allDemandes={demandes}
                  onSelectDemandeIndex={setSelectedDemandeIndex}
                  isFr={isFr}
                />
              )}

              {selectedTemplate === 'ramq' && (
                <RamqTemplate
                  demande={currentDemande}
                  demandeIndex={activeDemandeIdx}
                  allDemandes={demandes}
                  onSelectDemandeIndex={setSelectedDemandeIndex}
                  isFr={isFr}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
