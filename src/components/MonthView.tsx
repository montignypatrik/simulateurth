import React from 'react';
import { Shift, ShiftWorkType } from '../types';
import { 
  getMonthDays, 
  formatDateToYYYYMMDD, 
  formatTime12h, 
  calculateShiftHours, 
  WORK_TYPE_CONFIGS 
} from '../utils/dateUtils';
import { Clock, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  shifts: Shift[];
  onSelectDate: (date: Date) => void;
  onOpenNewShiftModal: (preset?: Partial<Shift>) => void;
  onSelectShift: (shift: Shift, e: React.MouseEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  shifts,
  onSelectDate,
  onOpenNewShiftModal,
  onSelectShift,
}) => {
  const monthDays = getMonthDays(currentDate);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Index shifts by date string
  const shiftsByDate: Record<string, Shift[]> = {};
  shifts.forEach(s => {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = [];
    shiftsByDate[s.date].push(s);
  });

  // Sort shifts on each day by startTime
  Object.keys(shiftsByDate).forEach(date => {
    shiftsByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-3 sm:p-4 overflow-hidden select-none">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 h-full flex flex-col overflow-hidden">
        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 sm:py-3 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
          {weekDays.map((day, idx) => (
            <div key={day} className={`tracking-wider ${idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-600'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Month Days Grid (6 rows x 7 cols) */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 overflow-y-auto">
          {monthDays.map((item, index) => {
            const dayShifts = shiftsByDate[item.dateStr] || [];

            // Calculate daily total worked & billable hours
            const dailyTotals = dayShifts.reduce(
              (acc, s) => {
                const { billableHours, rawHours } = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
                acc.billable += billableHours;
                acc.raw += rawHours;
                return acc;
              },
              { billable: 0, raw: 0 }
            );

            return (
              <div
                key={index}
                onClick={() => {
                  onSelectDate(item.date);
                  onOpenNewShiftModal({ date: item.dateStr });
                }}
                className={`min-h-[95px] sm:min-h-[105px] p-1.5 flex flex-col group relative transition-colors cursor-pointer ${
                  !item.isCurrentMonth
                    ? 'opacity-40 bg-slate-50 text-slate-400'
                    : item.isToday
                    ? 'bg-indigo-50/25 hover:bg-indigo-50/40 text-slate-800'
                    : 'bg-white hover:bg-slate-50/80 text-slate-800'
                }`}
              >
                {/* Day Header: Hours summary on left, Day number on right */}
                <div className="flex items-center justify-between mb-1 px-0.5 shrink-0">
                  {dailyTotals.billable > 0 ? (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                      title={`${dailyTotals.billable.toFixed(1)} billable hours (${dailyTotals.raw.toFixed(1)} elapsed)`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {dailyTotals.billable.toFixed(1)}h
                    </span>
                  ) : (
                    <span className="w-2" />
                  )}

                  {/* Day Number */}
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-lg font-bold transition-all ${
                      item.isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : !item.isCurrentMonth
                        ? 'text-slate-400 font-medium'
                        : 'text-slate-800 group-hover:text-indigo-600'
                    }`}
                  >
                    {item.date.getDate()}
                  </span>
                </div>

                {/* Shifts List for this day */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayShifts.slice(0, 3).map(shift => {
                    const config = WORK_TYPE_CONFIGS[shift.workType] || WORK_TYPE_CONFIGS.clinic;
                    const { billableHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);

                    // Badge theme from Design HTML
                    let statusBadge = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                    let statusLabel = 'Logged';
                    if (shift.status === 'draft') {
                      statusBadge = 'bg-amber-50 border-amber-100 text-amber-700';
                      statusLabel = 'Draft';
                    } else if (shift.status === 'submitted') {
                      statusBadge = 'bg-blue-50 border-blue-100 text-blue-700';
                      statusLabel = 'Submitted';
                    } else if (shift.status === 'ready') {
                      statusBadge = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                      statusLabel = 'Ready';
                    }

                    return (
                      <div
                        key={shift.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectShift(shift, e);
                        }}
                        className={`text-left px-1.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 truncate border cursor-pointer ${statusBadge}`}
                        title={`${shift.title} (${shift.startTime} - ${shift.endTime}, ${billableHours}h billable at ${shift.facility})`}
                      >
                        {/* Dot indicator for medical service category */}
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: config.color }}
                        />

                        {/* Start Time */}
                        <span className="font-semibold opacity-90 shrink-0">
                          {shift.startTime}
                        </span>

                        {/* Title */}
                        <span className="truncate font-medium text-slate-800">
                          {shift.title}
                        </span>

                        {/* Hours tag */}
                        <span className="ml-auto font-bold shrink-0 opacity-85">
                          {billableHours}h
                        </span>
                      </div>
                    );
                  })}

                  {/* More shifts indicator */}
                  {dayShifts.length > 3 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(item.date);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 px-1 hover:underline"
                    >
                      +{dayShifts.length - 3} more shifts
                    </div>
                  )}
                </div>

                {/* Hover Quick Add hint */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
