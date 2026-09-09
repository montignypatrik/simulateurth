import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { TemplateViewProps } from './types';

export const Facnet3Template: React.FC<TemplateViewProps> = ({
  demande,
}) => {
  const [isProfOpen, setIsProfOpen] = useState(true);
  const [isLieuOpen, setIsLieuOpen] = useState(true);

  const isCabinet = demande.pratique === 'Cabinet';
  const isSoinsPalliatifs = demande.pratique === 'Soins palliatifs';

  const lieuNom = isCabinet
    ? 'XXXXX - CLINIQUE MÉDICALE'
    : isSoinsPalliatifs
    ? 'XXXXX - MAISON DE SOINS PALLIATIFS'
    : 'XXXXX - CHSLD';

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Collapsible Cards: Professionnel de la santé & Lieu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Professionnel de la santé */}
        <div className="bg-[#f8fafd] rounded-xl border border-slate-300/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsProfOpen(!isProfOpen)}
            className="w-full px-4 py-3 bg-[#f0f4f8] border-b border-slate-200 flex items-center justify-between text-left cursor-pointer hover:bg-[#e9eff5] transition-colors"
          >
            <span className="text-sm font-bold text-slate-800">
              Professionnel de la santé
            </span>
            {isProfOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-800 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-800 stroke-[2.5]" />
            )}
          </button>

          {isProfOpen && (
            <div className="p-4 space-y-3.5 bg-white text-xs">
              {/* Field 1: Professionnel de la santé */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Professionnel de la santé
                </label>
                <div className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 flex items-center justify-between shadow-2xs">
                  <span className="font-medium">XXXXX XXXXX, XXXXXXX</span>
                  <ChevronDown className="w-4 h-4 text-slate-700" />
                </div>
              </div>

              {/* Field 2: Compte administratif */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Compte administratif
                </label>
                <div className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 flex items-center justify-between shadow-2xs">
                  <span className="font-medium font-mono">XXXXX</span>
                  <ChevronDown className="w-4 h-4 text-slate-700" />
                </div>
              </div>

              {/* Field 3: Spécialité */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Spécialité
                </label>
                <div className="w-full bg-[#e8ecf1] border border-slate-300/80 rounded-lg px-3 py-2 text-xs text-slate-500 font-medium">
                  Omnipraticien
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Lieu */}
        <div className="bg-[#f8fafd] rounded-xl border border-slate-300/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLieuOpen(!isLieuOpen)}
            className="w-full px-4 py-3 bg-[#f0f4f8] border-b border-slate-200 flex items-center justify-between text-left cursor-pointer hover:bg-[#e9eff5] transition-colors"
          >
            <span className="text-sm font-bold text-slate-800">Lieu</span>
            {isLieuOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-800 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-800 stroke-[2.5]" />
            )}
          </button>

          {isLieuOpen && (
            <div className="p-4 space-y-3.5 bg-white text-xs">
              {/* Field 1: Lieu */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Lieu
                </label>
                <div className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 flex items-center justify-between shadow-2xs">
                  <span className="font-medium truncate">{lieuNom}</span>
                  <ChevronDown className="w-4 h-4 text-slate-700 shrink-0 ml-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section: Lignes */}
      <div className="bg-[#f8fafd] rounded-xl border border-slate-300/80 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">Lignes</h3>
            <span className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-700 shadow-2xs">
              {demande.startDateStr} → {demande.endDateStr}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* TOTAL HEURES badge */}
            <div className="flex items-center gap-2 bg-[#edf7e7] border border-[#d2e8c4] px-2.5 py-1 rounded-md text-xs">
              <span className="bg-[#528a38] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                TOTAL HEURES
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {demande.totalDemandeHeures}h
              </span>
            </div>

            {/* + Ajouter button */}
            <button
              type="button"
              className="px-3 py-1.5 bg-[#c8d8fc] hover:bg-[#b8ccfc] text-[#4264d0] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Rows List */}
        <div className="space-y-3.5">
          {demande.rows.map((row) => (
            <div
              key={row.rowId}
              className="border border-slate-300 rounded-xl p-3.5 bg-white shadow-2xs space-y-3"
            >
              {/* Row Top Header: DATE, MODE, PLAGE HORAIRE & Trash icon */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1 border-b border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* DATE */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 bg-[#e8ecf1] px-2 py-0.5 rounded tracking-wide uppercase">
                      DATE
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {row.dateStr}
                    </span>
                  </div>

                  {/* MODE */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 bg-[#e8ecf1] px-2 py-0.5 rounded tracking-wide uppercase">
                      MODE
                    </span>
                    <div className="flex items-center gap-1 text-slate-800 font-semibold cursor-default">
                      <span>TH</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  </div>

                  {/* PLAGE HORAIRE */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 bg-[#e8ecf1] px-2 py-0.5 rounded tracking-wide uppercase">
                      PLAGE HORAIRE
                    </span>
                    <div className="flex items-center gap-1 text-slate-800 font-semibold cursor-default">
                      <span>{row.selectedPlage}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  </div>
                </div>

                {/* Trash delete icon */}
                <button
                  type="button"
                  aria-label="Supprimer la ligne"
                  className="text-red-500 hover:text-red-600 p-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Slots Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {row.slots.map((slot) => {
                  return (
                    <div
                      key={slot.slotNum}
                      className="flex rounded-xl border border-[#4d7c38] bg-[#f4faee] overflow-hidden shadow-2xs"
                    >
                      {/* Left solid green tab with slot number */}
                      <div className="w-8 bg-[#3b7322] text-white flex items-center justify-center font-bold text-sm shrink-0 select-none">
                        {slot.slotNum}
                      </div>

                      {/* Content columns (CODE, SECTEUR, NBRE H) */}
                      <div className="flex-1 grid grid-cols-3 divide-x divide-[#4d7c38]/25 py-2 px-1 text-center">
                        {/* Sub-col 1: CODE */}
                        <div className="px-1 flex flex-col items-center">
                          <span className="inline-block bg-[#3b7322] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase mb-1">
                            CODE
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 min-h-[20px] flex items-center justify-center">
                            {slot.code || ''}
                          </span>
                        </div>

                        {/* Sub-col 2: SECTEUR */}
                        <div className="px-1 flex flex-col items-center">
                          <span className="inline-block bg-[#3b7322] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase mb-1">
                            SECTEUR
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700 min-h-[20px] flex items-center justify-center">
                            {slot.secteur !== '' ? slot.secteur : ''}
                          </span>
                        </div>

                        {/* Sub-col 3: NBRE H */}
                        <div className="px-1 flex flex-col items-center">
                          <span className="inline-block bg-[#3b7322] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase mb-1">
                            NBRE H
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 min-h-[20px] flex items-center justify-center">
                            {slot.heures ? `${slot.heures}h` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

