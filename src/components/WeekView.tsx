import React, { useRef, useEffect } from 'react';
import { Shift } from '../types';
import { 
  getWeekDates, 
  calculateShiftHours, 
  calculateClaimTotal, 
  formatTime12h, 
  WORK_TYPE_CONFIGS,
  formatDateToYYYYMMDD
} from '../utils/dateUtils';
import { Clock, MapPin, Tag, CheckCircle2, DollarSign } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  shifts: Shift[];
  onSelectDate: (date: Date) => void;
  onOpenNewShiftModal: (preset?: Partial<Shift>) => void;
  onSelectShift: (shift: Shift, e: React.MouseEvent) => void;
}

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // 60px per hour => 1px per minute!

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  shifts,
  onSelectDate,
  onOpenNewShiftModal,
  onSelectShift,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDates = getWeekDates(currentDate);

  // Auto-scroll to 7:00 AM on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  // Index shifts by date
  const shiftsByDate: Record<string, Shift[]> = {};
  shifts.forEach(s => {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = [];
    shiftsByDate[s.date].push(s);
  });

  // Calculate coordinates for a shift
  const getShiftStyle = (shift: Shift) => {
    const [sH, sM] = shift.startTime.split(':').map(Number);
    const [eH, eM] = shift.endTime.split(':').map(Number);

    const startMinutes = sH * 60 + sM;
    let endMinutes = eH * 60 + eM;
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // overnight
    }

    const durationMinutes = Math.max(30, endMinutes - startMinutes);
    const top = startMinutes * (HOUR_HEIGHT / 60);
    const height = Math.max(38, durationMinutes * (HOUR_HEIGHT / 60));

    return { top: `${top}px`, height: `${height}px` };
  };

  // Current time marker calculation
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeTop = (currentHour * 60 + currentMinute) * (HOUR_HEIGHT / 60);
  const todayStr = formatDateToYYYYMMDD(now);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-3 sm:p-4 overflow-hidden select-none">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 h-full flex flex-col overflow-hidden">
        {/* Week Header Row */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          {/* Timezone / Gutter spacer */}
          <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 flex flex-col items-center justify-center py-2 text-[10px] text-slate-400 font-mono font-medium">
            <span>GMT-4</span>
            <span>EST</span>
          </div>

          {/* 7 Day Header Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200">
            {weekDates.map(dayItem => {
              const dayShifts = shiftsByDate[dayItem.dateStr] || [];
              const dayBillableHours = dayShifts.reduce(
                (sum, s) => sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes).billableHours,
                0
              );

              return (
                <div
                  key={dayItem.dateStr}
                  onClick={() => onSelectDate(dayItem.date)}
                  className={`py-2 px-1 text-center cursor-pointer transition-colors ${
                    dayItem.isToday ? 'bg-indigo-50/30' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {dayItem.dayName}
                  </div>
                  <div className="flex items-center justify-center my-0.5">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        dayItem.isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {dayItem.dayNumber}
                    </span>
                  </div>
                  {/* Total Billable Hours for this Day */}
                  <div className="h-4 flex items-center justify-center">
                    {dayBillableHours > 0 ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md">
                        {dayBillableHours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-mono">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Grid Scrollable Canvas */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto flex relative bg-white"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Left Time Gutter (00:00 - 23:00) */}
          <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/50 select-none">
            {HOURS_IN_DAY.map(hour => {
              const hourLabel =
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
                  className="relative text-right pr-2 sm:pr-3 text-[11px] text-slate-400 font-medium font-mono"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="-top-2.5 relative">{hourLabel}</span>
                </div>
              );
            })}
          </div>

          {/* 7 Columns for Days */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 relative min-w-[700px]">
            {/* Horizontal Hour Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS_IN_DAY.map(hour => (
                <div
                  key={hour}
                  className="border-b border-slate-100 w-full"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* Current Time Indicator Line */}
            {weekDates.some(d => d.dateStr === todayStr) && (
              <div
                className="absolute z-20 pointer-events-none flex items-center w-full"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 -ml-1.5 shadow-xs" />
                <div className="h-[2px] bg-rose-500 w-full" />
              </div>
            )}

            {/* Render each day's column */}
            {weekDates.map(dayItem => {
              const dayShifts = shiftsByDate[dayItem.dateStr] || [];

              return (
                <div
                  key={dayItem.dateStr}
                  className={`relative h-[1440px] hover:bg-slate-50/40 transition-colors cursor-pointer ${
                    dayItem.isToday ? 'bg-indigo-50/15' : ''
                  }`}
                  onClick={(e) => {
                    // Calculate clicked hour
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const clickedMinutes = Math.floor(clickY / (HOUR_HEIGHT / 60));
                    const hour = Math.min(22, Math.max(0, Math.floor(clickedMinutes / 60)));
                    const startHourStr = String(hour).padStart(2, '0') + ':00';
                    const endHourStr = String(Math.min(23, hour + 8)).padStart(2, '0') + ':00';

                    onOpenNewShiftModal({
                      date: dayItem.dateStr,
                      startTime: startHourStr,
                      endTime: endHourStr,
                    });
                  }}
                >
                  {/* Shifts rendered as floating blocks */}
                  {dayShifts.map(shift => {
                    const style = getShiftStyle(shift);
                    const config = WORK_TYPE_CONFIGS[shift.workType] || WORK_TYPE_CONFIGS.clinic;
                    const { billableHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
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
                          backgroundColor: `${config.color}14`,
                          borderColor: `${config.color}40`,
                        }}
                        className="absolute inset-x-1 rounded-lg p-2 border-l-4 border shadow-2xs hover:shadow-md transition-all z-10 overflow-hidden cursor-pointer flex flex-col justify-between group hover:z-20 bg-white"
                        title={`${shift.title} (${shift.startTime} - ${shift.endTime})`}
                      >
                        <div className="space-y-1">
                          {/* Title & Status */}
                          <div className="flex items-center justify-between gap-1">
                            <span 
                              className="font-bold text-xs truncate"
                              style={{ color: config.color }}
                            >
                              {shift.title}
                            </span>
                            {shift.status === 'ready' && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Ready
                              </span>
                            )}
                            {shift.status === 'draft' && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-1 py-0.2 rounded-md shrink-0">
                                Draft
                              </span>
                            )}
                            {shift.status === 'submitted' && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1 py-0.2 rounded-md shrink-0">
                                Sent
                              </span>
                            )}
                          </div>

                          {/* Time & Duration */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {shift.startTime} – {shift.endTime}
                            </span>
                            <span className="text-[10px] bg-slate-50 font-bold px-1 rounded text-slate-700 ml-auto border border-slate-200">
                              {billableHours}h
                            </span>
                          </div>

                          {/* Facility & Service Code */}
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{shift.facility}</span>
                          </div>
                        </div>

                        {/* Footer: Claim Code & Rate */}
                        <div className="pt-1 mt-auto border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                          <span className="font-mono bg-slate-50 px-1 rounded text-[9px] border border-slate-200 font-semibold">
                            {shift.billingCode}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            ${claimTotal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
