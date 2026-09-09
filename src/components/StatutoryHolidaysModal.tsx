import React from 'react';
import { X, Sparkles, Calendar as CalendarIcon, ArrowRight, Info } from 'lucide-react';
import { STATUTORY_HOLIDAYS, StatutoryHoliday } from '../data/statutoryHolidays';

interface StatutoryHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHolidayDate?: (dateStr: string) => void;
  lang?: 'fr' | 'en';
}

export const StatutoryHolidaysModal: React.FC<StatutoryHolidaysModalProps> = ({
  isOpen,
  onClose,
  onSelectHolidayDate,
  lang = 'fr',
}) => {
  if (!isOpen) return null;

  const isFr = lang === 'fr';

  // Format date to French long representation e.g. "18 mai 2026"
  const formatHolidayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(isFr ? 'fr-CA' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDayOfWeek = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(isFr ? 'fr-CA' : 'en-US', {
      weekday: 'long',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isFr ? 'Liste des Fêtes Légales (Jours Fériés)' : 'List of Statutory Holidays'}
              </h2>
              <p className="text-xs text-slate-500">
                {isFr
                  ? 'Dates de prise du congé dans l’établissement & règles de tarification'
                  : 'Dates observed in facility & billing sector rules'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label={isFr ? 'Fermer' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Callout */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">
              {isFr ? 'Règle de facturation RAMQ & Facnet :' : 'RAMQ & Facnet Billing Rule:'}
            </span>{' '}
            {isFr ? (
              <span>
                Pour ces journées fériées, le secteur attribué est automatiquement{' '}
                <strong className="font-mono bg-amber-200/70 px-1 py-0.2 rounded">31</strong> (plages AM, PM, SO de 8h à 24h) et{' '}
                <strong className="font-mono bg-amber-200/70 px-1 py-0.2 rounded">42</strong> (plage NU de 0h à 8h). En cabinet ou pour les codes 072101 et 53043, le secteur demeure 0.
              </span>
            ) : (
              <span>
                On these statutory holidays, sector is automatically set to{' '}
                <strong className="font-mono bg-amber-200/70 px-1 py-0.2 rounded">31</strong> (AM, PM, EV from 8h-24h) and{' '}
                <strong className="font-mono bg-amber-200/70 px-1 py-0.2 rounded">42</strong> (night NU from 0h-8h).
              </span>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700">
                  <th className="py-2.5 px-3.5 sm:px-4">
                    {isFr ? 'Liste des Fêtes Légales' : 'Statutory Holiday Name'}
                  </th>
                  <th className="py-2.5 px-3 sm:px-4">
                    {isFr ? 'Date de PRISE du congé' : 'Date Observed'}
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-center hidden sm:table-cell">
                    {isFr ? 'Jour' : 'Day'}
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    {isFr ? 'Action' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {STATUTORY_HOLIDAYS.map((holiday, idx) => {
                  return (
                    <tr
                      key={holiday.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 sm:px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{isFr ? holiday.name : holiday.nameEn}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatHolidayDate(holiday.date)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center text-slate-600 capitalize hidden sm:table-cell">
                        {getDayOfWeek(holiday.date)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {onSelectHolidayDate && (
                          <button
                            onClick={() => {
                              onSelectHolidayDate(holiday.date);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                            title={isFr ? `Consulter ${holiday.name}` : `View ${holiday.nameEn}`}
                          >
                            <span>{isFr ? 'Voir' : 'View'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {isFr ? '13 fêtes légales configurées' : '13 statutory holidays configured'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
