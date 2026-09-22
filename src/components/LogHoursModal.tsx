import React, { useState, useEffect } from 'react';
import {
  PRATIQUE_OPTIONS, getProgrammesForPratique, getDefaultProgrammeForPratique,
  getActivitiesForPratique, getDefaultActiviteForPratique, canonicalActivityCode,
} from '../data/billingCatalog';
export { PRATIQUE_OPTIONS, getProgrammesForPratique, getDefaultProgrammeForPratique, getActivitiesForPratique, getDefaultActiviteForPratique } from '../data/billingCatalog';

import { X, Clock, Calendar as CalendarIcon, Check, Stethoscope, Briefcase, Layers } from 'lucide-react';

export interface LoggedHours {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h format, e.g. "08:00")
  endTime: string; // HH:mm (24h format, e.g. "16:30")
  pratique: string; // Establishment type; definitions in billingCatalog.ts
  programme?: string; // e.g. "CHSLD (101)" | "Toxicomanie (263)"
  activite?: string; // code and label
  title?: string;
  notes?: string;
}

interface LogHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: LoggedHours) => void;
  initialDate?: string; // YYYY-MM-DD
  initialStartTime?: string;
  initialEndTime?: string;
  initialPratique?: string;
  initialProgramme?: string;
  initialActivite?: string;
  initialLog?: LoggedHours | null;
  onDelete?: (id: string) => void;
  lang?: 'fr' | 'en';
}

// Generate hour options from 00:00 to 23:45 in 15-minute steps
export const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:15`);
  TIME_OPTIONS.push(`${hh}:30`);
  TIME_OPTIONS.push(`${hh}:45`);
}
TIME_OPTIONS.push('24:00');

// Convert "HH:mm" to 12h display string e.g. "8:00 AM", "4:30 PM"
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

// Calculate hours between start and end time
export function calculateDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shift if end is before start
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

export const LogHoursModal: React.FC<LogHoursModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialStartTime = '08:00',
  initialEndTime = '16:00',
  initialPratique = 'CHSLD',
  initialProgramme,
  initialActivite,
  initialLog = null,
  onDelete,
  lang = 'fr',
}) => {
  const isFr = lang === 'fr';

  const [date, setDate] = useState<string>(
    initialDate ||
      (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
      })()
  );
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [pratique, setPratique] = useState<string>(initialPratique);
  const [programme, setProgramme] = useState<string>(() => {
    if (initialLog?.programme) return initialLog.programme;
    if (initialLog?.activite?.startsWith('263')) return 'Toxicomanie (263)';
    return initialProgramme || getDefaultProgrammeForPratique(initialPratique);
  });
  const [activite, setActivite] = useState<string>(() => {
    if (initialLog?.activite) return initialLog.activite;
    if (initialActivite) return initialActivite;
    const prog = initialProgramme || getDefaultProgrammeForPratique(initialPratique);
    return getDefaultActiviteForPratique(initialPratique, prog);
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialLog) {
      setDate(initialLog.date);
      setStartTime(initialLog.startTime);
      setEndTime(initialLog.endTime);
      const pr = initialLog.pratique || 'CHSLD';
      setPratique(pr);
      const prog = initialLog.programme || (initialLog.activite?.startsWith('263') ? 'Toxicomanie (263)' : getDefaultProgrammeForPratique(pr));
      setProgramme(prog);
      setActivite(initialLog.activite || getDefaultActiviteForPratique(pr, prog));
    } else {
      if (initialDate) setDate(initialDate);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      const pr = initialPratique || 'CHSLD';
      setPratique(pr);
      const prog = initialProgramme || getDefaultProgrammeForPratique(pr);
      setProgramme(prog);
      setActivite(initialActivite || getDefaultActiviteForPratique(pr, prog));
    }
    setError('');
  }, [isOpen, initialLog, initialDate, initialStartTime, initialEndTime, initialPratique, initialProgramme, initialActivite]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setError(isFr ? 'Veuillez sélectionner une date' : 'Please select a date');
      return;
    }

    if (!startTime || !endTime) {
      setError(
        isFr
          ? 'Veuillez sélectionner les heures de début et de fin'
          : 'Please select both beginning and end hours'
      );
      return;
    }

    if (startTime === endTime || startTime === '24:00') {
      setError(
        isFr
          ? "Les heures doivent être différentes et le début doit précéder 24:00"
          : 'Times must differ and the start must be before 24:00'
      );
      return;
    }

    const currentPratique = pratique || 'CHSLD';
    const currentProgramme =
      getProgrammesForPratique(currentPratique).length > 0
        ? programme || getDefaultProgrammeForPratique(currentPratique)
        : undefined;
    const defaultAct = getDefaultActiviteForPratique(currentPratique, currentProgramme);

    const availableActivities = getActivitiesForPratique(currentPratique, currentProgramme);
    const selectedActivity = availableActivities.find(a => canonicalActivityCode(a) === canonicalActivityCode(activite || defaultAct));
    if (!selectedActivity) {
      setError(isFr ? 'Sélectionnez une activité du programme choisi.' : 'Select an activity from the chosen program.');
      return;
    }

    const logToSave: LoggedHours = {
      ...initialLog,
      id: initialLog ? initialLog.id : `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      startTime,
      endTime,
      pratique: currentPratique,
      programme: currentProgramme,
      activite: selectedActivity,
    };

    onSave(logToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialLog
                  ? isFr
                    ? 'Modifier les heures'
                    : 'Edit Logged Hours'
                  : isFr
                  ? 'Consigner des heures'
                  : 'Log Hours'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isFr
                  ? "Enregistrer l'heure de début et de fin"
                  : 'Record beginning and end hours'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isFr ? 'Fermer la fenêtre' : 'Close modal'}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              {isFr ? 'Date' : 'Date'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
            />
          </div>

          {/* Beginning and End Hours Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Beginning Hour */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {isFr ? 'Heure de début' : 'Beginning Hour'}
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {time} {isFr ? `(${time.replace(':', 'h')})` : `(${formatTime12h(time)})`}
                  </option>
                ))}
              </select>
            </div>

            {/* End Hour */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {isFr ? 'Heure de fin' : 'End Hour'}
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {time} {isFr ? `(${time.replace(':', 'h')})` : `(${formatTime12h(time)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pratique Dropdown */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              {isFr ? 'Pratique' : 'Pratique (Practice)'}
            </label>
            <select
              id="modal-pratique-select"
              value={pratique}
              onChange={(e) => {
                const val = e.target.value;
                setPratique(val);
                const newProg = getDefaultProgrammeForPratique(val);
                setProgramme(newProg);
                setActivite(getDefaultActiviteForPratique(val, newProg));
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer"
            >
              {PRATIQUE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Programme Dropdown */}
          {getProgrammesForPratique(pratique).length > 0 && (
            <div className="pt-1 animate-in fade-in duration-150">
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                {isFr ? 'Programme' : 'Programme (Program)'}
              </label>
              <select
                id="modal-programme-select"
                value={programme}
                onChange={(e) => {
                  const val = e.target.value;
                  setProgramme(val);
                  setActivite(getDefaultActiviteForPratique(pratique, val));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer"
              >
                {getProgrammesForPratique(pratique).map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activité Section */}
          <div className="pt-1 animate-in fade-in duration-200">
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              {isFr ? 'Activité' : 'Activité (Activity)'}
            </label>
            <select
              id="modal-activite-select"
              value={getActivitiesForPratique(pratique, programme).find(a => canonicalActivityCode(a) === canonicalActivityCode(activite)) || activite}
              onChange={(e) => setActivite(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer"
            >
              {getActivitiesForPratique(pratique, programme).map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            {initialLog && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialLog.id);
                  onClose();
                }}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                {isFr ? 'Supprimer' : 'Delete'}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {initialLog
                  ? isFr
                    ? 'Modifier'
                    : 'Update Hours'
                  : isFr
                  ? 'Enregistrer'
                  : 'Save Hours'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
