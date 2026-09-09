import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { TemplateViewProps } from './types';

export const RamqTemplate: React.FC<TemplateViewProps> = ({
  demande,
  isFr,
}) => {
  const isCabinet = demande.pratique === 'Cabinet';
  const isSoinsPalliatifs = demande.pratique === 'Soins palliatifs';

  const etablissementNom = isCabinet
    ? 'CLINIQUE MÉDICALE (XXXXX)'
    : isSoinsPalliatifs
    ? 'MAISON SOINS PALLIATIFS (XXXXX)'
    : 'CHSLD (XXXXX)';

  const etablissementNum = 'XXXXX';

  // Format Quantième as two digit day number (e.g. "01", "02", "19")
  const getQuantiemeNumber = (dateStr: string) => {
    return dateStr.split('-')[2] || dateStr;
  };

  // Build grid rows: at least 7 rows (like the official form)
  const totalDisplayRows = Math.max(7, demande.rows.length);
  const rowsToRender = [];

  for (let i = 0; i < totalDisplayRows; i++) {
    const dataRow = demande.rows[i] || null;
    const ref1 = 1 + i * 3;
    const ref2 = 2 + i * 3;
    const ref3 = 3 + i * 3;

    rowsToRender.push({
      rowIndex: i,
      dataRow,
      ref1,
      ref2,
      ref3,
    });
  }

  return (
    <div className="relative bg-white rounded-lg border border-slate-300 p-4 sm:p-6 font-sans text-slate-800 shadow-xs overflow-hidden">
      {/* Section: Professionnel */}
      <div className="mb-4">
        <div className="inline-block bg-[#005a9c] text-white text-[11px] font-bold px-2 py-0.5 rounded-t-xs">
          Professionnel
        </div>
        <div className="border border-[#005a9c] p-2.5 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              Prénom
            </label>
            <input
              type="text"
              readOnly
              value="XXXXX"
              className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              Nom
            </label>
            <input
              type="text"
              readOnly
              value="XXXXX"
              className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              N° du professionnel
            </label>
            <input
              type="text"
              readOnly
              value="XXXXXXX"
              className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              N° du groupe
            </label>
            <input
              type="text"
              readOnly
              value=""
              className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              C.S.
            </label>
            <select
              disabled
              className="w-full border border-slate-300 px-1 py-0.5 text-[11px]"
            >
              <option></option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
              Nbr. documents annexés
            </label>
            <input
              type="text"
              readOnly
              value=""
              className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Sections Side-by-Side: Période & Établissement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Période */}
        <div>
          <div className="inline-block bg-[#005a9c] text-white text-[11px] font-bold px-2 py-0.5 rounded-t-xs">
            Période
          </div>
          <div className="border border-[#005a9c] p-2.5 text-[11px]">
            <div className="text-slate-700 font-bold mb-1.5 text-[10px] uppercase">
              Cette demande s'applique à la semaine
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                  débutant le dimanche
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={demande.startDateStr}
                    className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px] pr-5"
                  />
                  <Calendar className="w-3 h-3 text-rose-500 absolute right-1 top-1.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                  se terminant le samedi
                </label>
                <input
                  type="text"
                  readOnly
                  value={demande.endDateStr}
                  className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Établissement */}
        <div>
          <div className="inline-block bg-[#005a9c] text-white text-[11px] font-bold px-2 py-0.5 rounded-t-xs">
            Établissement
          </div>
          <div className="border border-[#005a9c] p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                Nom
              </label>
              <select
                disabled
                className="w-full border border-slate-300 px-1 py-0.5 text-[11px]"
              >
                <option>{etablissementNom}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                Numéro
              </label>
              <input
                type="text"
                readOnly
                value={etablissementNum}
                className="w-full border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Activités */}
      <div>
        <div className="inline-block bg-[#005a9c] text-white text-[11px] font-bold px-2 py-0.5 rounded-t-xs">
          Activités
        </div>

        <div className="border border-[#005a9c] overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] border border-[#005a9c]">
            <thead>
              <tr className="bg-[#f0f4f8] text-slate-900 border-b border-[#005a9c] font-bold text-center">
                <th className="border-r border-[#005a9c] p-1 whitespace-nowrap">
                  Quantième
                </th>
                <th className="border-r border-[#005a9c] p-1 whitespace-nowrap">
                  Mode de rémunération
                </th>
                <th className="border-r border-[#005a9c] p-1 text-center" colSpan={4}>
                  Plage Horaire (cocher)
                </th>

                {/* Slot 1 */}
                <th className="border-r border-[#005a9c] p-1">Réf.</th>
                <th className="border-r border-[#005a9c] p-1">Code d'activités</th>
                <th className="border-r border-[#005a9c] p-1">Secteur Disp.</th>
                <th className="border-r border-[#005a9c] p-1">Heures travaillées</th>

                {/* Slot 2 */}
                <th className="border-r border-[#005a9c] p-1">Réf.</th>
                <th className="border-r border-[#005a9c] p-1">Code d'activités</th>
                <th className="border-r border-[#005a9c] p-1">Secteur Disp.</th>
                <th className="border-r border-[#005a9c] p-1">Heures travaillées</th>

                {/* Slot 3 */}
                <th className="border-r border-[#005a9c] p-1">Réf.</th>
                <th className="border-r border-[#005a9c] p-1">Code d'activités</th>
                <th className="border-r border-[#005a9c] p-1">Secteur Disp.</th>
                <th className="p-1">Heures travaillées</th>
              </tr>

              {/* Sub-header for Plage Horaire checkboxes */}
              <tr className="bg-[#f8fafc] text-slate-700 border-b border-[#005a9c] text-center text-[9px]">
                <th className="border-r border-[#005a9c]"></th>
                <th className="border-r border-[#005a9c]"></th>
                <th className="border-r border-[#005a9c] px-1 py-0.5">Nuit</th>
                <th className="border-r border-[#005a9c] px-1 py-0.5">AM</th>
                <th className="border-r border-[#005a9c] px-1 py-0.5">PM</th>
                <th className="border-r border-[#005a9c] px-1 py-0.5">Soir</th>
                <th colSpan={12}></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#005a9c]">
              {rowsToRender.map(({ rowIndex, dataRow, ref1, ref2, ref3 }) => {
                const isNU = dataRow?.selectedPlage === 'NU';
                const isAM = dataRow?.selectedPlage === 'AM';
                const isPM = dataRow?.selectedPlage === 'PM';
                const isSO = dataRow?.selectedPlage === 'SO';

                const s1 = dataRow?.slots[0];
                const s2 = dataRow?.slots[1];
                const s3 = dataRow?.slots[2];

                return (
                  <tr key={rowIndex} className="h-6 hover:bg-slate-50 transition-colors">
                    {/* Quantième */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center font-mono">
                      {dataRow ? (
                        <input
                          type="text"
                          readOnly
                          value={getQuantiemeNumber(dataRow.dateStr)}
                          className="w-7 text-center border border-slate-300 text-[10px]"
                        />
                      ) : (
                        <div className="w-7 h-4 mx-auto border border-slate-200" />
                      )}
                    </td>

                    {/* Mode */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center">
                      {dataRow ? (
                        <span className="font-mono text-[10px] font-bold">TH ▼</span>
                      ) : (
                        <div className="w-8 h-4 mx-auto border border-slate-200" />
                      )}
                    </td>

                    {/* Plage: Nuit */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={isNU}
                        readOnly
                        disabled
                        className="w-3 h-3 text-[#005a9c] rounded-none border-[#005a9c]"
                      />
                    </td>
                    {/* Plage: AM */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={isAM}
                        readOnly
                        disabled
                        className="w-3 h-3 text-[#005a9c] rounded-none border-[#005a9c]"
                      />
                    </td>
                    {/* Plage: PM */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={isPM}
                        readOnly
                        disabled
                        className="w-3 h-3 text-[#005a9c] rounded-none border-[#005a9c]"
                      />
                    </td>
                    {/* Plage: Soir */}
                    <td className="border-r border-[#005a9c] px-1 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSO}
                        readOnly
                        disabled
                        className="w-3 h-3 text-[#005a9c] rounded-none border-[#005a9c]"
                      />
                    </td>

                    {/* Group 1 */}
                    <td className="border-r border-[#005a9c] px-1 text-center font-bold text-slate-700">
                      {ref1}
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s1?.code || ''}
                        className="w-16 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s1?.secteur || ''}
                        className="w-9 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s1?.heures ? Number(s1.heures).toFixed(2) : ''}
                        className="w-12 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center font-bold"
                      />
                    </td>

                    {/* Group 2 */}
                    <td className="border-r border-[#005a9c] px-1 text-center font-bold text-slate-700">
                      {ref2}
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s2?.code || ''}
                        className="w-16 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s2?.secteur || ''}
                        className="w-9 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s2?.heures ? Number(s2.heures).toFixed(2) : ''}
                        className="w-12 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>

                    {/* Group 3 */}
                    <td className="border-r border-[#005a9c] px-1 text-center font-bold text-slate-700">
                      {ref3}
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s3?.code || ''}
                        className="w-16 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="border-r border-[#005a9c] px-1">
                      <input
                        type="text"
                        readOnly
                        value={s3?.secteur || ''}
                        className="w-9 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                    <td className="px-1">
                      <input
                        type="text"
                        readOnly
                        value={s3?.heures ? Number(s3.heures).toFixed(2) : ''}
                        className="w-12 border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-center"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer with + button and Total des heures travaillées */}
            <tfoot>
              <tr className="bg-[#f0f4f8] border-t-2 border-[#005a9c]">
                <td colSpan={6} className="p-1.5">
                  <button
                    type="button"
                    className="w-6 h-6 bg-[#005a9c] text-white flex items-center justify-center font-bold rounded-xs cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </td>
                <td colSpan={9} className="p-1.5 text-right font-extrabold text-[11px] text-slate-900 uppercase">
                  Total des heures travaillées
                </td>
                <td colSpan={3} className="p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={demande.totalDemandeHeures.toFixed(2)}
                    className="w-16 border-2 border-black bg-white px-2 py-0.5 font-mono font-bold text-[11px] text-center"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
