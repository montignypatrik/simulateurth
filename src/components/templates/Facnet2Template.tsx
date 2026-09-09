import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { TemplateViewProps, PlageId } from './types';

const PLAGES: { id: PlageId; label: string }[] = [
  { id: 'NU', label: 'NU' },
  { id: 'AM', label: 'AM' },
  { id: 'PM', label: 'PM' },
  { id: 'SO', label: 'SO' },
];

export const Facnet2Template: React.FC<TemplateViewProps> = ({
  demande,
  isFr,
}) => {
  // Determine realistic physician and establishment based on practice
  const isCabinet = demande.pratique === 'Cabinet';
  const isSoinsPalliatifs = demande.pratique === 'Soins palliatifs';

  const defaultEtablissement = isCabinet
    ? 'TH (XXXXX) - CLINIQUE MÉDICALE'
    : isSoinsPalliatifs
    ? 'TH (XXXXX) - MAISON SOINS PALLIATIFS'
    : 'TH (XXXXX) - CHSLD';

  return (
    <div className="bg-[#f2f5f5] rounded-xl border border-[#c7d5d5] p-4 sm:p-6 shadow-xs font-sans text-slate-800">
      {/* Page Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-[#1a2f2b] tracking-tight mb-5">
        Formulaire tarif horaire
      </h2>

      {/* Metadata Form */}
      <div className="space-y-3.5 mb-6">
        {/* Row 1: Description */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Description
          </label>
          <input
            type="text"
            readOnly
            value={`${demande.pratique} - Semaine du ${demande.startDateStr}`}
            className="w-full sm:w-80 bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
          />
        </div>

        {/* Row 2: Médecin & Établissement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Médecin
            </label>
            <input
              type="text"
              readOnly
              value="XXXXXXX-00000 | Agence | XXXXX, XXXXX - Omnipraticien"
              className="w-full bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Établissement
            </label>
            <div className="relative">
              <select
                disabled
                value={defaultEtablissement}
                className="w-full appearance-none bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2.5 py-1.5 text-xs text-slate-800 pr-6 focus:outline-none"
              >
                <option>{defaultEtablissement}</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-rose-600 text-[10px]">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Dates, Service, CS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Date de début
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={demande.startDateStr}
                className="w-full bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2 py-1 text-xs text-slate-800 pr-7 focus:outline-none font-mono"
              />
              <Calendar className="w-3.5 h-3.5 text-rose-500 absolute right-2 top-2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Date de fin
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={demande.endDateStr}
                className="w-full bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2 py-1 text-xs text-slate-800 pr-7 focus:outline-none font-mono"
              />
              <Calendar className="w-3.5 h-3.5 text-rose-500 absolute right-2 top-2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Service
            </label>
            <input
              type="text"
              readOnly
              value=""
              className="w-full bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              CS
            </label>
            <input
              type="text"
              readOnly
              value=""
              className="w-full bg-[#d8e3e3] border border-[#b8c7c7] rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section Header: Lignes */}
      <div className="bg-[#004d47] text-white px-3 py-1.5 rounded-xs font-bold text-xs mb-3 flex items-center justify-between">
        <span>Lignes</span>
        <span className="text-[11px] font-mono text-emerald-200">
          Total : {demande.totalDemandeHeures} h
        </span>
      </div>

      {/* Button: + Ajouter une ligne */}
      <div className="mb-3">
        <button
          type="button"
          className="px-4 py-1 text-xs font-semibold text-[#00554e] bg-transparent border border-[#00554e] rounded-full hover:bg-[#00554e]/10 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter une ligne
        </button>
      </div>

      {/* Facnet 2.0 Lines Table */}
      <div className="overflow-x-auto bg-white rounded-md border border-[#c7d5d5]">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-[#c7d5d5] bg-[#fafcfc] text-slate-800 font-bold text-[11px]">
              <th className="py-2.5 px-2 whitespace-nowrap">Quantième</th>
              <th className="py-2.5 px-1 whitespace-nowrap">Mode</th>
              <th className="py-2.5 px-2 whitespace-nowrap">Plage horaire</th>

              {/* Group 1 */}
              <th className="py-2.5 px-1 text-center font-bold">#</th>
              <th className="py-2.5 px-1 font-bold">Code</th>
              <th className="py-2.5 px-1 text-center font-bold">Secteur</th>
              <th className="py-2.5 px-1 text-center font-bold">Heures</th>

              {/* Group 2 */}
              <th className="py-2.5 px-1 text-center font-bold">#</th>
              <th className="py-2.5 px-1 font-bold">Code</th>
              <th className="py-2.5 px-1 text-center font-bold">Secteur</th>
              <th className="py-2.5 px-1 text-center font-bold">Heures</th>

              {/* Group 3 */}
              <th className="py-2.5 px-1 text-center font-bold">#</th>
              <th className="py-2.5 px-1 font-bold">Code</th>
              <th className="py-2.5 px-1 text-center font-bold">Secteur</th>
              <th className="py-2.5 px-1 text-center font-bold">Heures</th>

              <th className="py-2.5 px-2 text-right font-bold whitespace-nowrap">
                Total heures
              </th>
              <th className="py-2.5 px-2 text-center font-bold whitespace-nowrap">
                Supprimer
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e3ecec]">
            {demande.rows.map((row) => (
              <tr key={row.rowId} className="hover:bg-[#f6f9f9] transition-colors">
                {/* Quantième */}
                <td className="py-2 px-2">
                  <div className="relative inline-block w-24">
                    <select
                      value={row.dateStr}
                      disabled
                      className="w-full appearance-none bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1.5 py-1 text-[11px] text-slate-800 pr-4 focus:outline-none"
                    >
                      <option value={row.dateStr}>{row.quantiemeDisplay}</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-rose-500 text-[9px]">
                      ▼
                    </span>
                  </div>
                </td>

                {/* Mode */}
                <td className="py-2 px-1">
                  <div className="relative inline-block w-14">
                    <select
                      value="TH"
                      disabled
                      className="w-full appearance-none bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1.5 py-1 text-[11px] text-slate-800 pr-3 focus:outline-none"
                    >
                      <option value="TH">TH</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-rose-500 text-[9px]">
                      ▼
                    </span>
                  </div>
                </td>

                {/* Plage horaire checkboxes */}
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {PLAGES.map((plage) => {
                      const isChecked = row.selectedPlage === plage.id;
                      return (
                        <label
                          key={plage.id}
                          className="flex items-center gap-1 cursor-default select-none"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border transition-all ${
                              isChecked
                                ? 'bg-[#739290] border-[#537270] text-white'
                                : 'bg-[#d8e3e3] border-[#b8c7c7]'
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5 fill-current"
                                viewBox="0 0 20 20"
                              >
                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                              </svg>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-700">
                            {plage.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </td>

                {/* Group 1 */}
                <td className="py-2 px-1 text-center text-slate-600 font-semibold">
                  {row.slots[0].slotNum}
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[0].code}
                    className="w-16 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1.5 py-1 text-[11px] text-slate-800 text-left focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[0].secteur}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[0].heures}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none font-bold"
                  />
                </td>

                {/* Group 2 */}
                <td className="py-2 px-1 text-center text-slate-600 font-semibold">
                  {row.slots[1].slotNum}
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[1].code}
                    className="w-16 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1.5 py-1 text-[11px] text-slate-800 text-left focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[1].secteur}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[1].heures}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none"
                  />
                </td>

                {/* Group 3 */}
                <td className="py-2 px-1 text-center text-slate-600 font-semibold">
                  {row.slots[2].slotNum}
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[2].code}
                    className="w-16 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1.5 py-1 text-[11px] text-slate-800 text-left focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[2].secteur}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none"
                  />
                </td>
                <td className="py-2 px-1">
                  <input
                    type="text"
                    readOnly
                    value={row.slots[2].heures}
                    className="w-10 bg-[#d8e3e3] border border-[#b8c7c7] rounded px-1 py-1 text-[11px] text-slate-800 text-center focus:outline-none"
                  />
                </td>

                {/* Total heures */}
                <td className="py-2 px-2 text-right font-bold text-slate-900 text-xs">
                  {row.totalHeures}
                </td>

                {/* Supprimer */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded-xs border-[#b8c7c7] text-[#00554e]"
                  />
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer with total */}
          <tfoot>
            <tr className="border-t border-[#c7d5d5] bg-[#f2f5f5]">
              <td colSpan={15} className="py-2 px-4 text-right">
                <span className="text-xs text-slate-700 font-semibold mr-2">
                  Total heures:
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {demande.totalDemandeHeures}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
