import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { FacnetLogo } from './FacnetLogo';

interface FacnetHeaderProps {
  lang: 'fr' | 'en';
  onToggleLang: (newLang: 'fr' | 'en') => void;
  view: 'month' | 'week' | 'day';
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  headerTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onLogHours: () => void;
  onResetCalendar: () => void;
  onOpenHolidays?: () => void;
  holidayCount?: number;
  onOpenModeleDemande: () => void;
}

export const FacnetHeader: React.FC<FacnetHeaderProps> = ({
  lang,
  onToggleLang,
  view,
  onViewChange,
  headerTitle,
  onPrev,
  onNext,
  onToday,
  onLogHours,
  onResetCalendar,
  onOpenModeleDemande,
}) => {
  const isFr = lang === 'fr';

  return (
    <header className="w-full bg-[#1b293c] text-white border-b border-[#25374e] shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ROW 1: Branding, Centered View Selector, Top-Right Language Switcher */}
        <div className="py-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-[#25374e]/80">
          {/* Top Left: Facnet Logo & Title */}
          <div className="flex items-center gap-3 justify-start min-w-0">
            <div className="flex items-center" title="Facnet">
              <FacnetLogo className="h-5 sm:h-5.5 w-auto text-white fill-white shrink-0" />
            </div>

            <div className="h-4.5 w-px bg-slate-700 hidden sm:block shrink-0" />

            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-100 tracking-tight whitespace-nowrap truncate">
              {isFr ? 'Simulateur tarif Horaire' : 'Hourly Rate Simulator'}
            </h1>
          </div>

          {/* Top Center: Centered View Switcher (Jour / Semaine / Mois) */}
          <div className="flex justify-center">
            <div className="flex items-center bg-[#131f2f] p-0.8 sm:p-1 rounded-xl border border-[#2b3e56] shadow-inner">
              <button
                id="view-day-btn"
                onClick={() => onViewChange('day')}
                className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  view === 'day'
                    ? 'bg-[#0077c8] text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isFr ? 'Jour' : 'Day'}
              </button>
              <button
                id="view-week-btn"
                onClick={() => onViewChange('week')}
                className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  view === 'week'
                    ? 'bg-[#0077c8] text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isFr ? 'Semaine' : 'Week'}
              </button>
              <button
                id="view-month-btn"
                onClick={() => onViewChange('month')}
                className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  view === 'month'
                    ? 'bg-[#0077c8] text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isFr ? 'Mois' : 'Month'}
              </button>
            </div>
          </div>

          {/* Top Right: Language Selector (en haut à droite) */}
          <div className="flex items-center justify-end">
            <div className="flex items-center bg-[#131f2f] p-0.5 rounded-lg border border-[#2b3e56] shadow-2xs">
              <button
                onClick={() => onToggleLang('fr')}
                title="Passer en français"
                className={`px-2.5 py-0.8 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  isFr
                    ? 'bg-[#0077c8] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => onToggleLang('en')}
                title="Switch to English"
                className={`px-2.5 py-0.8 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  !isFr
                    ? 'bg-[#0077c8] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Date Navigation on Left & Actions on Right (Never overlapping!) */}
        <div className="py-2 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Date Navigation with Previous (◄), Date Label, Next (►), and Today */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Today Button */}
            <button
              id="today-btn"
              onClick={onToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#243449] hover:bg-[#2d415b] border border-[#354c69] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              {isFr ? "Aujourd'hui" : 'Today'}
            </button>

            {/* Prev / Date Label / Next Cluster */}
            <div className="flex items-center bg-[#243449] border border-[#354c69] rounded-lg shadow-2xs overflow-hidden">
              <button
                id="prev-btn"
                onClick={onPrev}
                aria-label={isFr ? 'Précédent' : 'Previous'}
                title={
                  isFr
                    ? view === 'month'
                      ? 'Mois précédent'
                      : view === 'week'
                      ? 'Semaine précédente'
                      : 'Jour précédent'
                    : view === 'month'
                    ? 'Previous month'
                    : view === 'week'
                    ? 'Previous week'
                    : 'Previous day'
                }
                className="p-1.5 sm:px-2 text-slate-300 hover:text-white hover:bg-[#2e435e] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 sm:px-4 text-xs font-bold text-slate-100 select-none min-w-[130px] sm:min-w-[170px] text-center truncate">
                {headerTitle}
              </span>
              <button
                id="next-btn"
                onClick={onNext}
                aria-label={isFr ? 'Suivant' : 'Next'}
                title={
                  isFr
                    ? view === 'month'
                      ? 'Mois suivant'
                      : view === 'week'
                      ? 'Semaine suivante'
                      : 'Jour suivant'
                    : view === 'month'
                    ? 'Next month'
                    : view === 'week'
                    ? 'Next week'
                    : 'Next day'
                }
                className="p-1.5 sm:px-2 text-slate-300 hover:text-white hover:bg-[#2e435e] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Actions - Reset, Consigner (left of Demande), and Demande (right of Consigner) */}
          <div className="flex items-center gap-2">
            {/* Reset Calendar Button */}
            <button
              id="reset-calendar-btn"
              onClick={onResetCalendar}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-300 bg-[#243449] hover:bg-rose-950/40 border border-[#354c69] hover:border-rose-700/50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title={isFr ? 'Réinitialiser le calendrier' : 'Reset calendar'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
              <span className="hidden sm:inline text-xs">{isFr ? 'Réinitialiser' : 'Reset'}</span>
            </button>

            {/* Consigner button (to the left of Demande) */}
            <button
              id="log-hours-btn"
              onClick={onLogHours}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0077c8] hover:bg-[#0064a8] rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={isFr ? 'Consigner des heures' : 'Log hours'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFr ? 'Consigner' : 'Log'}</span>
            </button>

            {/* Demande button (to the right of Consigner) */}
            <button
              id="btn-visionner-modele-demande"
              onClick={onOpenModeleDemande}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/80 rounded-lg transition-colors shadow-2xs group cursor-pointer"
              title={isFr ? 'Visionner le modèle de demande' : 'View request model'}
            >
              <span>{isFr ? 'Demande' : 'Request'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
