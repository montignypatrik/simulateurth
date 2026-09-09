import React, { useRef, useEffect } from 'react';
import { Shift } from '../types';
import { 
  calculateShiftHours, 
  calculateClaimTotal, 
  formatDateToYYYYMMDD,
  WORK_TYPE_CONFIGS 
} from '../utils/dateUtils';
import { Clock, MapPin, Tag, Users, AlertCircle, Plus, FileText, CheckCircle2 } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  shifts: Shift[];
  onOpenNewShiftModal: (preset?: Partial<Shift>) => void;
  onSelectShift: (shift: Shift, e: React.MouseEvent) => void;
}

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 70; // 70px per hour for day view

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  shifts,
  onOpenNewShiftModal,
  onSelectShift,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateStr = formatDateToYYYYMMDD(currentDate);

  // Auto-scroll to 7 AM
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, [currentDate]);

  // Filter shifts for this day
  const dayShifts = shifts.filter(s => s.date === dateStr);

  // Totals for this single day
  const totals = dayShifts.reduce(
    (acc, s) => {
      const { billableHours, rawHours } = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
      acc.billable += billableHours;
      acc.raw += rawHours;
      acc.amount += calculateClaimTotal(s);
      acc.patients += s.patientCount || 0;
      return acc;
    },
    { billable: 0, raw: 0, amount: 0, patients: 0 }
  );

  const getShiftPosition = (shift: Shift) => {
    const [sH, sM] = shift.startTime.split(':').map(Number);
    const [eH, eM] = shift.endTime.split(':').map(Number);

    const startMinutes = sH * 60 + sM;
    let endMinutes = eH * 60 + eM;
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const durationMinutes = Math.max(30, endMinutes - startMinutes);
    const top = startMinutes * (HOUR_HEIGHT / 60);
    const height = Math.max(50, durationMinutes * (HOUR_HEIGHT / 60));

    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-3 sm:p-4 overflow-hidden select-none">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 h-full flex flex-col overflow-hidden">
        {/* Day Overview Banner */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span className="font-medium text-slate-700">{dayShifts.length} shifts scheduled</span>
              <span>•</span>
              <span className="font-bold text-indigo-700">{totals.billable.toFixed(1)} billable hours</span>
              <span>•</span>
              <span className="font-bold text-emerald-700">${totals.amount.toFixed(2)} claim est.</span>
              {totals.patients > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-slate-600">{totals.patients} patients</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => onOpenNewShiftModal({ date: dateStr })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Shift on This Day</span>
          </button>
        </div>

        {/* Hourly Timeline */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto flex relative bg-white"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Left Gutter */}
          <div className="w-20 shrink-0 border-r border-slate-200 bg-slate-50/50">
            {HOURS_IN_DAY.map(hour => {
              const label =
                hour === 0
                  ? '12 AM'
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? '12 PM'
                  : `${hour - 12} PM`;

              return (
                <div
                  key={hour}
                  className="relative text-right pr-3 text-xs text-slate-400 font-mono font-medium"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="-top-2.5 relative">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Day Column */}
          <div 
            className="flex-1 relative h-[1680px] hover:bg-slate-50/30 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickY = e.clientY - rect.top;
              const clickedMinutes = Math.floor(clickY / (HOUR_HEIGHT / 60));
              const hour = Math.min(22, Math.max(0, Math.floor(clickedMinutes / 60)));
              const startHourStr = String(hour).padStart(2, '0') + ':00';
              const endHourStr = String(Math.min(23, hour + 4)).padStart(2, '0') + ':00';

              onOpenNewShiftModal({
                date: dateStr,
                startTime: startHourStr,
                endTime: endHourStr,
              });
            }}
          >
            {/* Horizontal lines */}
            {HOURS_IN_DAY.map(hour => (
              <div
                key={hour}
                className="border-b border-slate-100 w-full"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Shifts rendered as detailed wide cards */}
            {dayShifts.map(shift => {
              const style = getShiftPosition(shift);
              const config = WORK_TYPE_CONFIGS[shift.workType] || WORK_TYPE_CONFIGS.clinic;
              const { billableHours, rawHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
              const claimTotal = calculateClaimTotal(shift);

              return (
                <div
                  key={shift.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectShift(shift, e);
                  }}
                  style={{
                    ...style,
                    backgroundColor: `${config.color}10`,
                    borderColor: config.color,
                  }}
                  className="absolute inset-x-4 rounded-xl p-3.5 border-l-4 border shadow-2xs hover:shadow-md transition-all z-10 cursor-pointer flex flex-col justify-between bg-white"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-bold text-sm text-slate-900"
                            style={{ color: config.color }}
                          >
                            {shift.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                            {config.label}
                          </span>
                          {shift.isOvertimeOrHoliday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              1.5x Premium Rate
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                          <span className="font-bold text-slate-800">
                            {shift.startTime} – {shift.endTime}
                          </span>
                          <span>•</span>
                          <span>{rawHours}h elapsed</span>
                          {shift.breakMinutes > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">-{shift.breakMinutes}m break</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                            {billableHours}h billable
                          </span>
                        </div>
                      </div>

                      {/* Status & Payout */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          ${claimTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          @ ${shift.hourlyRate}/hr
                        </div>
                        <div className="mt-1">
                          {shift.status === 'ready' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Ready for Claim
                            </span>
                          ) : shift.status === 'submitted' ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              Submitted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                              Draft Status
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical Billing Details Grid */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium" title={shift.facility}>
                          {shift.facility}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono bg-slate-50 px-1 rounded border border-slate-200 font-semibold text-slate-700">
                          {shift.billingCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({shift.facilityBillingCode})
                        </span>
                      </div>

                      {shift.patientCount !== undefined && shift.patientCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{shift.patientCount} patients seen</span>
                        </div>
                      )}

                      {shift.notes && (
                        <div className="flex items-center gap-1.5 truncate col-span-2 sm:col-span-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate italic text-slate-500">
                            {shift.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
