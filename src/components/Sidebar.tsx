import React, { useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  FileText,
  User,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Shift, ShiftWorkType, ClaimStatus, QuickTemplate } from '../types';
import { WORK_TYPE_CONFIGS, formatDateToYYYYMMDD, getMonthDays, validateShiftsForClaims } from '../utils/dateUtils';
import { QUICK_TEMPLATES, DEFAULT_PROVIDER } from '../data/initialShifts';

interface SidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onOpenNewShiftModal: (preset?: Partial<Shift>) => void;
  shifts: Shift[];
  selectedWorkTypes: ShiftWorkType[];
  onToggleWorkType: (type: ShiftWorkType) => void;
  selectedFacilities: string[];
  onToggleFacility: (facility: string) => void;
  selectedStatuses: ClaimStatus[];
  onToggleStatus: (status: ClaimStatus) => void;
  onSwitchToClaimsAudit: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDate,
  onSelectDate,
  onOpenNewShiftModal,
  shifts,
  selectedWorkTypes,
  onToggleWorkType,
  selectedFacilities,
  onToggleFacility,
  selectedStatuses,
  onToggleStatus,
  onSwitchToClaimsAudit,
}) => {
  // Mini calendar state: can navigate independently or follow currentDate
  const [miniDate, setMiniDate] = useState<Date>(new Date(currentDate));

  const handleMiniPrev = () => {
    setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
  };

  const handleMiniNext = () => {
    setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));
  };

  const miniDays = getMonthDays(miniDate);
  const selectedDateStr = formatDateToYYYYMMDD(currentDate);

  // Collect set of dates that have shifts
  const shiftDates = new Set(shifts.map(s => s.date));

  // Extract unique facilities from all shifts
  const facilities = Array.from(new Set(shifts.map(s => s.facility))).sort();

  // Run validation checks for alerts
  const claimAlerts = validateShiftsForClaims(shifts);
  const errorCount = claimAlerts.filter(a => a.type === 'error').length;
  const warningCount = claimAlerts.filter(a => a.type === 'warning').length;

  return (
    <aside className="w-64 md:w-72 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      <div className="p-4 space-y-4">
        {/* Primary Action Button: Log Worked Hours */}
        <button
          id="sidebar-create-shift-btn"
          onClick={() => onOpenNewShiftModal()}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Log Worked Hours</span>
        </button>

        {/* Mini Calendar (Professional Polish style) */}
        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              {miniDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMiniPrev}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMiniNext}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mini Calendar Weekday Headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx} className="text-[10px] font-bold text-slate-400">
                {day}
              </span>
            ))}
          </div>

          {/* Mini Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {miniDays.slice(0, 35).map((item, idx) => {
              const isSelected = item.dateStr === selectedDateStr;
              const hasShift = shiftDates.has(item.dateStr);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectDate(item.date);
                    setMiniDate(new Date(item.date));
                  }}
                  className={`relative w-7 h-7 mx-auto rounded-lg flex flex-col items-center justify-center text-[11px] transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : item.isToday
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                      : item.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-200'
                      : 'text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.date.getDate()}</span>
                  {hasShift && (
                    <span
                      className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-indigo-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Shift Templates (1-click logger) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Shift Presets
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1-click fill</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {QUICK_TEMPLATES.slice(0, 4).map(tpl => (
              <button
                key={tpl.id}
                onClick={() => {
                  onOpenNewShiftModal({
                    title: tpl.label,
                    workType: tpl.workType,
                    startTime: tpl.defaultStartTime,
                    endTime: tpl.defaultEndTime,
                    breakMinutes: tpl.breakMinutes,
                    facility: tpl.facility,
                    facilityBillingCode: tpl.facilityBillingCode,
                    billingCode: tpl.billingCode,
                    hourlyRate: tpl.hourlyRate,
                    date: selectedDateStr,
                    color: tpl.color,
                  });
                }}
                className="text-left px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between group bg-white"
              >
                <div className="truncate">
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-700 truncate">
                    {tpl.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {tpl.defaultStartTime} - {tpl.defaultEndTime} • ${tpl.hourlyRate}/h
                  </div>
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 ml-1.5"
                  style={{ backgroundColor: tpl.color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Filter: Medical Work / Shift Types */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              Service / Shift Types
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {selectedWorkTypes.length}/{Object.keys(WORK_TYPE_CONFIGS).length}
            </span>
          </div>

          <div className="space-y-0.5">
            {(Object.keys(WORK_TYPE_CONFIGS) as ShiftWorkType[]).map(typeKey => {
              const config = WORK_TYPE_CONFIGS[typeKey];
              const isChecked = selectedWorkTypes.includes(typeKey);
              const count = shifts.filter(s => s.workType === typeKey).length;

              return (
                <label
                  key={typeKey}
                  className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer text-xs group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleWorkType(typeKey)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
                    />
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 font-medium truncate">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter: Medical Facilities */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Facilities & Clinics
            </span>
          </div>

          <div className="space-y-0.5">
            {facilities.map(fac => {
              const isChecked = selectedFacilities.includes(fac);
              const count = shifts.filter(s => s.facility === fac).length;

              return (
                <label
                  key={fac}
                  className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer text-xs group transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleFacility(fac)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 cursor-pointer shrink-0"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 font-medium truncate" title={fac}>
                      {fac}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter: Claim Status */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Claim Status
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {(['draft', 'ready', 'submitted', 'approved'] as ClaimStatus[]).map(status => {
              const isChecked = selectedStatuses.includes(status);
              const count = shifts.filter(s => s.status === status).length;

              return (
                <button
                  key={status}
                  onClick={() => onToggleStatus(status)}
                  className={`px-2 py-1 rounded-md border text-left flex items-center justify-between transition-colors ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="capitalize text-[11px]">{status}</span>
                  <span className="text-[10px] opacity-75 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Claim Audit Validation Box */}
        <div 
          onClick={onSwitchToClaimsAudit}
          className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              {errorCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              Claim Audit Check
            </span>
            <span className="text-[10px] text-indigo-600 underline font-semibold">Review</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            {errorCount > 0
              ? `${errorCount} claim errors & ${warningCount} warnings require attention.`
              : 'All shift records pass overlap & billing code validation.'}
          </p>
        </div>
      </div>

      {/* Professional Polish: Monthly Limit Widget & Provider Profile */}
      <div className="mt-auto p-4 border-t border-slate-200 space-y-3 bg-white">
        {/* Monthly Limit Card from Design HTML */}
        <div className="bg-slate-900 rounded-xl p-3.5 text-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monthly Target</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">September</span>
          </div>
          <p className="text-sm font-bold mb-2 text-white">
            {shifts.length} / 45 Shifts Logged
          </p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((shifts.length / 45) * 100))}%` }}
            />
          </div>
        </div>

        {/* Provider Profile */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            MD
          </div>
          <div className="truncate flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {DEFAULT_PROVIDER.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Licence: {DEFAULT_PROVIDER.billingId}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
