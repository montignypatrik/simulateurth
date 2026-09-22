import React, { useState } from 'react';
import { ChevronLeft, FileText, Clock, Layers, Sparkles } from 'lucide-react';
import type { LoggedHours } from './LogHoursModal';
import { buildDemandes } from '../utils/buildDemandes';
export { calculateSecteur } from '../utils/billingRules';
import { Facnet2Template } from './templates/Facnet2Template';
import { Facnet3Template } from './templates/Facnet3Template';
import { RamqTemplate } from './templates/RamqTemplate';
import { TemplateId, DemandeWeek } from './templates/types';
import { isStatutoryHoliday } from '../data/statutoryHolidays';
import { FacnetLogo } from './FacnetLogo';

interface ModeleDemandeViewProps {
  loggedHours: LoggedHours[];
  onBack: () => void;
  lang?: 'fr' | 'en';
  onToggleLang?: (newLang: 'fr' | 'en') => void;
}

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

  const demandes: DemandeWeek[] = React.useMemo(
    () => buildDemandes(loggedHours, isFr), [loggedHours, isFr]
  );

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
                <div className="flex flex-wrap p-1 bg-neutral-200/90 rounded-xl border border-neutral-300 shadow-2xs gap-1">
                  {demandes.map((d, idx) => {
                    const isActive = idx === activeDemandeIdx;
                    const isCabinet = d.pratique === 'Cabinet';
                    const isSoinsPalliatifs = d.pratique === 'Soins palliatifs';
                    const isCLSC = d.pratique === 'CLSC';
                    const hasHoliday = d.rows.some((r) => isStatutoryHoliday(r.dateStr));
                    return (
                      <button
                        key={d.id}
                        id={`demande-tab-${idx}`}
                        onClick={() => setSelectedDemandeIndex(idx)}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
                              : isCLSC
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
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
            {currentDemande.sectorIssues.length > 0 && (
              <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">{isFr ? 'Secteurs à valider' : 'Sectors to validate'}</p>
                <p>{isFr
                  ? 'Les guides ne précisent pas le secteur pour les périodes ci-dessous. Les heures sont conservées et les secteurs concernés restent vides.'
                  : 'The guides do not specify a sector for the periods below. Hours are retained and the affected sectors are left blank.'}</p>
                <ul className="mt-2 list-disc pl-5">
                  {currentDemande.sectorIssues.map((issue, index) => (
                    <li key={index}>{issue.date} · {issue.startTime}–{issue.endTime} · {issue.programme || currentDemande.pratique} · {issue.code}</li>
                  ))}
                </ul>
              </div>
            )}
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
