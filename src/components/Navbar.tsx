import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Menu, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  Clock, 
  DollarSign, 
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { ViewMode, Shift } from '../types';
import { calculateShiftHours, calculateClaimTotal, formatMonthYear, formatDateToYYYYMMDD, getWeekDates } from '../utils/dateUtils';

interface NavbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigateDate: (direction: 'prev' | 'next' | 'today') => void;
  onOpenNewShiftModal: () => void;
  onToggleSidebar: () => void;
  onExportCSV: () => void;
  shifts: Shift[];
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigateDate,
  onOpenNewShiftModal,
  onToggleSidebar,
  onExportCSV,
  shifts,
  isSidebarOpen,
}) => {
  // Compute totals for current filtered shifts
  const stats = shifts.reduce(
    (acc, shift) => {
      const { billableHours, rawHours } = calculateShiftHours(
        shift.startTime,
        shift.endTime,
        shift.breakMinutes
      );
      acc.totalRawHours += rawHours;
      acc.totalBillableHours += billableHours;
      acc.totalClaimAmount += calculateClaimTotal(shift);
      acc.patientCount += shift.patientCount || 0;
      return acc;
    },
    { totalRawHours: 0, totalBillableHours: 0, totalClaimAmount: 0, patientCount: 0 }
  );

  // Header display string based on view mode
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return formatMonthYear(currentDate);
    }
    if (viewMode === 'week') {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0].date;
      const end = weekDates[6].date;
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} – ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return `Claims Hours Audit – ${formatMonthYear(currentDate)}`;
  };

  return (
    <header className="h-15 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
      {/* Left side: Hamburger, Logo, Today, Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand & App Title */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs">
            M
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-800">MediBill</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-1.5 py-0.5 rounded border border-indigo-100 hidden sm:inline">
                Provider Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden md:block">
              Hours & Claims Engine
            </p>
          </div>
        </div>

        {/* Date Navigator - Segmented Control */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200/80">
            <button
              id="nav-prev-btn"
              onClick={() => onNavigateDate('prev')}
              className="p-1 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs rounded-md transition-all"
              title="Previous"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="nav-today-btn"
              onClick={() => onNavigateDate('today')}
              className="px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-xs rounded-md transition-all"
            >
              Today
            </button>
            <button
              id="nav-next-btn"
              onClick={() => onNavigateDate('next')}
              className="p-1 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs rounded-md transition-all"
              title="Next"
              aria-label="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-lg font-bold text-slate-800 whitespace-nowrap">
            {getHeaderTitle()}
          </h2>
        </div>
      </div>

      {/* Middle/Right: Hours tally pills & View Mode Toggles */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Billable Hours Summary Pill */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-700" title="Total Billable Hours">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-slate-900">{stats.totalBillableHours.toFixed(1)}h</span>
            <span className="text-slate-500 text-[11px]">billable</span>
          </div>
          <div className="w-px h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5 text-slate-700" title="Estimated Claim Compensation">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-slate-900">${stats.totalClaimAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-slate-500 text-[11px]">claim est.</span>
          </div>
          <div className="w-px h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5 text-slate-700" title="Total Shifts Logged">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-bold text-slate-900">{shifts.length}</span>
            <span className="text-slate-500 text-[11px]">shifts</span>
          </div>
        </div>

        {/* View Switcher: Month / Week / Day / Claims */}
        <div className="inline-flex bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            id="view-mode-month-btn"
            onClick={() => onViewModeChange('month')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              viewMode === 'month'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Month
          </button>
          <button
            id="view-mode-week-btn"
            onClick={() => onViewModeChange('week')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              viewMode === 'week'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Week
          </button>
          <button
            id="view-mode-day-btn"
            onClick={() => onViewModeChange('day')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              viewMode === 'day'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Day
          </button>
          <button
            id="view-mode-claims-btn"
            onClick={() => onViewModeChange('claims')}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'claims'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Claims Audit</span>
          </button>
        </div>

        {/* Export CSV */}
        <button
          id="export-claims-csv-btn"
          onClick={onExportCSV}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          title="Export shift work logs to CSV for medical claims"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>

        {/* Primary Action Button: + Log Hours */}
        <button
          id="nav-quick-add-btn"
          onClick={onOpenNewShiftModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Hours</span>
        </button>
      </div>
    </header>
  );
};
