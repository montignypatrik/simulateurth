import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Globe,
  ArrowRight,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  LogHoursModal,
  LoggedHours,
  formatTime12h,
  calculateDurationHours,
  getDefaultActiviteForPratique,
} from './components/LogHoursModal';
import { ModeleDemandeView } from './components/ModeleDemandeView';
import { StatutoryHolidaysModal } from './components/StatutoryHolidaysModal';
import { FacnetHeader } from './components/FacnetHeader';
import {
  STATUTORY_HOLIDAYS,
  getStatutoryHoliday,
  isStatutoryHoliday,
} from './data/statutoryHolidays';

type CalendarView = 'day' | 'week' | 'month';
type Language = 'fr' | 'en';
type ActivePage = 'calendar' | 'modele_demande';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56; // pixels per hour row

const WEEK_DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEMANDE_PLATFORM_PROMPT_ANSWERED_KEY = 'demande_platform_prompt_answered';

// Default sample shifts for restoring the calendar
const DEFAULT_LOGGED_HOURS: LoggedHours[] = [
  {
    id: 'default-log-1',
    date: '2026-09-01',
    startTime: '08:00',
    endTime: '16:00',
    pratique: 'CHSLD',
    activite: '101030 Services cliniques',
  },
  {
    id: 'default-log-2',
    date: '2026-09-02',
    startTime: '08:00',
    endTime: '12:00',
    pratique: 'Cabinet',
    activite: '072101 Activités de fonctionnement en GMF',
  },
  {
    id: 'default-log-3',
    date: '2026-09-03',
    startTime: '13:00',
    endTime: '17:00',
    pratique: 'Soins palliatifs',
    activite: '53030 Services cliniques',
  },
];

// Format a Date object to YYYY-MM-DD
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Capitalize first letter helper
function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function App() {
  // Reference today date: September 3, 2026
  const today = new Date(2026, 8, 3);

  // App language state: French by default with English toggle
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch {
      // ignore
    }
    return 'fr'; // Default French
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // ignore
    }
    // Update document title and lang
    document.documentElement.lang = lang;
    document.title =
      lang === 'fr'
        ? 'Simulateur tarif Horaire - Calendrier'
        : 'Hourly Rate Simulator - Calendar';
  }, [lang]);

  const isFr = lang === 'fr';

  // Active viewing date & selected date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 3));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 8, 3));

  // Active view: 'day' | 'week' | 'month' (default: weekly display)
  const [view, setView] = useState<CalendarView>('week');

  // Active page: 'calendar' or 'modele_demande'
  const [activePage, setActivePage] = useState<ActivePage>('calendar');

  // Logged hours are session-only; each page load starts with an empty calendar.
  const [loggedHours, setLoggedHours] = useState<LoggedHours[]>([]);

  useEffect(() => {
    try {
      localStorage.removeItem('calendar_logged_hours');
    } catch {
      // ignore
    }
  }, []);

  // Reset modal state & toast feedback
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNavigateToHoliday = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    setCurrentDate(targetDate);
    setSelectedDate(targetDate);
    setView('day');
  };

  const handleResetCalendar = (mode: 'empty' | 'restore') => {
    try {
      localStorage.removeItem(DEMANDE_PLATFORM_PROMPT_ANSWERED_KEY);
    } catch {
      // ignore
    }

    if (mode === 'empty') {
      setLoggedHours([]);
      try {
        localStorage.removeItem('calendar_logged_hours');
      } catch {
        // ignore
      }
      setToastMessage(isFr ? 'Calendrier vidé avec succès' : 'Calendar cleared successfully');
    } else {
      setLoggedHours(DEFAULT_LOGGED_HOURS);
      setToastMessage(isFr ? 'Données d’exemple rétablies' : 'Sample shifts restored');
    }
    setCurrentDate(new Date(2026, 8, 3));
    setSelectedDate(new Date(2026, 8, 3));
    setIsResetModalOpen(false);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('2026-09-03');
  const [modalStartTime, setModalStartTime] = useState<string>('08:00');
  const [modalEndTime, setModalEndTime] = useState<string>('16:00');
  const [modalPratique, setModalPratique] = useState<string>('CHSLD');
  const [modalActivite, setModalActivite] = useState<string>('101030 Services cliniques');
  const [editingLog, setEditingLog] = useState<LoggedHours | null>(null);

  // Hourly timeline scroll container ref for auto-scrolling to morning (7 AM)
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (view === 'day' || view === 'week') {
      if (timelineScrollRef.current) {
        timelineScrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
      }
    }
  }, [view]);

  // Date comparison helper
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Google Calendar style click & drag to add hours state
  interface DragState {
    date: Date;
    dateStr: string;
    startMinutes: number;
    currentMinutes: number;
    initialClientY: number;
    columnElement: HTMLDivElement;
    hasMoved: boolean;
  }

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // Mouse move and mouse up listeners for smooth click & drag
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag) return;

      const diffY = Math.abs(e.clientY - currentDrag.initialClientY);
      const hasMoved = currentDrag.hasMoved || diffY > 4;

      // Auto-scroll timeline container if dragging near top or bottom
      if (timelineScrollRef.current) {
        const containerRect = timelineScrollRef.current.getBoundingClientRect();
        if (e.clientY < containerRect.top + 45) {
          timelineScrollRef.current.scrollTop -= 14;
        } else if (e.clientY > containerRect.bottom - 45) {
          timelineScrollRef.current.scrollTop += 14;
        }
      }

      const rect = currentDrag.columnElement.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const rawMinutes = (offsetY / HOUR_HEIGHT) * 60;
      // Snap to 15-minute intervals between 0 and 1440 (24h)
      const snapped = Math.max(0, Math.min(1440, Math.round(rawMinutes / 15) * 15));

      const updated: DragState = {
        ...currentDrag,
        currentMinutes: snapped,
        hasMoved,
      };
      dragStateRef.current = updated;
      setDragState(updated);
    };

    const handleWindowMouseUp = () => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag) return;

      dragStateRef.current = null;
      setDragState(null);

      let sMin: number;
      let eMin: number;

      if (!currentDrag.hasMoved) {
        // Single click without movement: default 1-hour slot starting at clicked time
        sMin = currentDrag.startMinutes;
        eMin = Math.min(1440, sMin + 60);
      } else {
        sMin = Math.min(currentDrag.startMinutes, currentDrag.currentMinutes);
        eMin = Math.max(currentDrag.startMinutes, currentDrag.currentMinutes);
        // Ensure at least 15 minutes minimum duration
        if (eMin - sMin < 15) {
          eMin = Math.min(1440, sMin + 30);
        }
      }

      const startH = Math.floor(sMin / 60).toString().padStart(2, '0');
      const startM = (sMin % 60).toString().padStart(2, '0');
      const endH = Math.floor(eMin / 60).toString().padStart(2, '0');
      const endM = (eMin % 60).toString().padStart(2, '0');

      let endStr = `${endH}:${endM}`;
      if (endStr === '24:00') {
        endStr = '23:45';
      }

      setSelectedDate(currentDrag.date);
      handleOpenLogModal(currentDrag.date, undefined, `${startH}:${startM}`, endStr);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  // Prevent text selection during drag
  useEffect(() => {
    if (dragState) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [Boolean(dragState)]);

  const handleColumnMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    day: Date
  ) => {
    if (e.button !== 0) return;

    const columnElement = e.currentTarget;
    const rect = columnElement.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60;
    // Snap starting position to 15-minute intervals
    const snappedStart = Math.max(0, Math.min(1425, Math.floor(rawMinutes / 15) * 15));

    const dateStr = toDateKey(day);
    const newDrag: DragState = {
      date: day,
      dateStr,
      startMinutes: snappedStart,
      currentMinutes: snappedStart + 30,
      initialClientY: e.clientY,
      columnElement,
      hasMoved: false,
    };

    dragStateRef.current = newDrag;
    setDragState(newDrag);
  };

  // Open modal for new log
  const handleOpenLogModal = (
    targetDate?: Date,
    startHour?: number,
    customStartTime?: string,
    customEndTime?: string
  ) => {
    const d = targetDate || selectedDate || currentDate;
    const dateStr = toDateKey(d);
    setModalDate(dateStr);

    if (customStartTime && customEndTime) {
      setModalStartTime(customStartTime);
      setModalEndTime(customEndTime);
    } else if (typeof startHour === 'number') {
      const startH = startHour.toString().padStart(2, '0');
      const endH = Math.min(23, startHour + 1).toString().padStart(2, '0');
      setModalStartTime(`${startH}:00`);
      setModalEndTime(`${endH}:00`);
    } else {
      setModalStartTime('08:00');
      setModalEndTime('16:00');
    }

    const initialPrat = modalPratique || 'CHSLD';
    setModalPratique(initialPrat);
    setModalActivite(getDefaultActiviteForPratique(initialPrat));
    setEditingLog(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing log
  const handleEditLog = (log: LoggedHours, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pr = log.pratique || 'CHSLD';
    setEditingLog(log);
    setModalDate(log.date);
    setModalStartTime(log.startTime);
    setModalEndTime(log.endTime);
    setModalPratique(pr);
    setModalActivite(log.activite || getDefaultActiviteForPratique(pr));
    setIsModalOpen(true);
  };

  // Save log (create or update)
  const handleSaveLog = (log: LoggedHours) => {
    setLoggedHours((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === log.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = log;
        return next;
      }
      return [...prev, log];
    });
  };

  // Delete log
  const handleDeleteLog = (id: string) => {
    setLoggedHours((prev) => prev.filter((item) => item.id !== id));
  };

  // Navigation handlers
  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 7);
      setCurrentDate(newD);
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 1);
      setCurrentDate(newD);
      setSelectedDate(newD);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 7);
      setCurrentDate(newD);
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 1);
      setCurrentDate(newD);
      setSelectedDate(newD);
    }
  };

  const handleToday = () => {
    const todayDate = new Date(2026, 8, 3);
    setCurrentDate(todayDate);
    setSelectedDate(todayDate);
  };

  // Header title formatting based on language
  const getHeaderTitle = () => {
    const locale = isFr ? 'fr-CA' : 'en-US';

    if (view === 'month') {
      const formatted = currentDate.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      return capitalize(formatted);
    }

    if (view === 'week') {
      const curr = new Date(currentDate);
      const dayOfWeek = curr.getDay();
      const startOfWeek = new Date(curr);
      startOfWeek.setDate(curr.getDate() - dayOfWeek);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        const monthStr = capitalize(startOfWeek.toLocaleDateString(locale, { month: 'short' }));
        return `${monthStr} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        const startStr = capitalize(
          startOfWeek.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
        );
        const endStr = capitalize(
          endOfWeek.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
        );
        return `${startStr} – ${endStr}, ${startOfWeek.getFullYear()}`;
      } else {
        const startStr = capitalize(
          startOfWeek.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        );
        const endStr = capitalize(
          endOfWeek.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        );
        return `${startStr} – ${endStr}`;
      }
    }

    const dayTitle = currentDate.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return capitalize(dayTitle);
  };

  // Month view data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthCells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    prevMonthCells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  const currentMonthCells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthCells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  const totalCellsSoFar = prevMonthCells.length + currentMonthCells.length;
  const totalCells = totalCellsSoFar <= 35 ? 35 : 42;
  const nextMonthCells = [];
  for (let d = 1; d <= totalCells - totalCellsSoFar; d++) {
    nextMonthCells.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const monthGridDays = [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];

  // Week view data
  const getWeekDays = (referenceDate: Date) => {
    const d = new Date(referenceDate);
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  const formatHourLabel = (hour: number) => {
    if (isFr) {
      return `${hour}h00`;
    }
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  // Calculate layout coordinates for a log in an hourly grid
  const getHourBlockStyle = (log: LoggedHours) => {
    const [startH, startM] = log.startTime.split(':').map(Number);
    const [endH, endM] = log.endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const durationMinutes = Math.max(30, endMinutes - startMinutes);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Helper to filter logs for a specific day
  const getLogsForDate = (dateObj: Date) => {
    const key = toDateKey(dateObj);
    return loggedHours.filter((l) => l.date === key);
  };

  const weekDaysLabels = isFr ? WEEK_DAYS_FR : WEEK_DAYS_EN;

  const handleSelectPeriodDate = (startDateStr: string) => {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    setCurrentDate(targetDate);
    setSelectedDate(targetDate);
  };

  if (activePage === 'modele_demande') {
    return (
      <ModeleDemandeView
        loggedHours={loggedHours}
        onBack={() => setActivePage('calendar')}
        lang={lang}
        onToggleLang={setLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Unified Facnet Branded Header with active, functional controls */}
      <FacnetHeader
        lang={lang}
        onToggleLang={setLang}
        view={view}
        onViewChange={setView}
        headerTitle={getHeaderTitle()}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onLogHours={() => handleOpenLogModal()}
        onResetCalendar={() => setIsResetModalOpen(true)}
        onOpenModeleDemande={() => setActivePage('modele_demande')}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 max-w-6xl w-full mx-auto flex flex-col min-h-0">
        {/* ============================================================ */}
        {/* MONTH VIEW                                                  */}
        {/* ============================================================ */}
        {view === 'month' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-semibold text-slate-600">
              {weekDaysLabels.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-2.5 ${idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-700'}`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Month Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100">
              {monthGridDays.map((cell, index) => {
                const isTodayCell = isSameDay(cell.date, today);
                const isSelectedCell = isSameDay(cell.date, selectedDate);
                const dayLogs = getLogsForDate(cell.date);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setCurrentDate(cell.date);
                    }}
                    onDoubleClick={() => {
                      setSelectedDate(cell.date);
                      setCurrentDate(cell.date);
                      handleOpenLogModal(cell.date);
                    }}
                    className={`min-h-[90px] sm:min-h-[115px] p-2 sm:p-2.5 flex flex-col items-start justify-start text-left transition-colors relative cursor-pointer group ${
                      cell.isCurrentMonth
                        ? 'bg-white hover:bg-slate-50/80'
                        : 'bg-slate-50/50 hover:bg-slate-50 text-slate-400'
                    } ${isSelectedCell ? 'ring-2 ring-[#0077c8] ring-inset bg-sky-50/30' : ''}`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                          isTodayCell
                            ? 'bg-[#0077c8] text-white shadow-2xs font-bold'
                            : isSelectedCell && !isTodayCell
                            ? 'bg-slate-200 text-slate-900 font-bold'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {/* Quick Add button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.date);
                          handleOpenLogModal(cell.date);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#0077c8] hover:bg-sky-50 rounded transition-opacity"
                        title={isFr ? 'Consigner des heures' : 'Log hours'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Statutory Holiday Badge */}
                    {(() => {
                      const holiday = getStatutoryHoliday(cell.date);
                      if (!holiday) return null;
                      return (
                        <div
                          className="w-full mt-0.5 px-1.5 py-0.5 bg-amber-100/90 border border-amber-300/80 rounded text-[10px] font-bold text-amber-900 flex items-center gap-1 shadow-2xs truncate"
                          title={`${isFr ? 'Fête légale :' : 'Statutory Holiday:'} ${isFr ? holiday.name : holiday.nameEn}`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span className="truncate">{isFr ? holiday.name : holiday.nameEn}</span>
                        </div>
                      );
                    })()}

                    {/* Logged Hours Pills */}
                    <div className="w-full flex-1 mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                      {dayLogs.map((log) => {
                        const duration = calculateDurationHours(log.startTime, log.endTime);
                        const isCabinet = (log.pratique || '').toLowerCase() === 'cabinet';
                        const isSoinsPalliatifs = (log.pratique || '') === 'Soins palliatifs';
                        return (
                          <div
                            key={log.id}
                            onClick={(e) => handleEditLog(log, e)}
                            className={`border rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors flex items-center justify-between gap-1 shadow-2xs cursor-pointer ${
                              isCabinet
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200/80 text-emerald-900'
                                : isSoinsPalliatifs
                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200/80 text-amber-900'
                                : 'bg-sky-50 hover:bg-sky-100 border-sky-200/80 text-sky-950'
                            }`}
                            title={`${log.pratique || 'CHSLD'}${log.activite ? ` • ${log.activite}` : ''}: ${log.startTime} - ${log.endTime} (${duration}h)`}
                          >
                            <span className={`truncate font-semibold ${
                              isCabinet
                                ? 'text-emerald-900'
                                : isSoinsPalliatifs
                                ? 'text-amber-900'
                                : 'text-sky-950'
                            }`}>
                              {log.activite || log.pratique || 'CHSLD'}
                            </span>
                            <span className={`text-[10px] font-bold font-mono shrink-0 ${
                              isCabinet
                                ? 'text-emerald-700'
                                : isSoinsPalliatifs
                                ? 'text-amber-800'
                                : 'text-sky-700'
                            }`}>
                              {duration}h
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* WEEK VIEW                                                   */}
        {/* ============================================================ */}
        {view === 'week' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden max-h-[calc(100vh-140px)]">
            {/* Top Fixed Header with 7 Days */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/90 shrink-0 select-none">
              <div className="py-3 px-2 border-r border-slate-200 flex items-center justify-center text-slate-400">
                <Clock className="w-4 h-4" />
              </div>

              {weekDays.map((day) => {
                const isTodayCell = isSameDay(day, today);
                const isSelectedCell = isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentDate(day);
                    }}
                    className={`py-2.5 px-1 sm:px-2 text-center border-r border-slate-200 last:border-r-0 transition-colors cursor-pointer flex flex-col items-center justify-center ${
                      isSelectedCell ? 'bg-sky-50/50' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      {weekDaysLabels[day.getDay()]}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-bold inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full ${
                        isTodayCell
                          ? 'bg-[#0077c8] text-white shadow-2xs'
                          : isSelectedCell
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    {/* Statutory Holiday Tag in Week View Header */}
                    {(() => {
                      const holiday = getStatutoryHoliday(day);
                      if (!holiday) return null;
                      return (
                        <span
                          className="mt-0.5 px-1.5 py-0.2 bg-amber-100/90 border border-amber-300 text-amber-900 rounded text-[9.5px] font-bold truncate max-w-[95%] shadow-2xs inline-flex items-center gap-0.5"
                          title={`${isFr ? 'Fête légale :' : 'Statutory Holiday:'} ${isFr ? holiday.name : holiday.nameEn}`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span className="truncate">{isFr ? holiday.name : holiday.nameEn}</span>
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Hourly Grid */}
            <div
              ref={timelineScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Background hour grid lines */}
              <div className="relative divide-y divide-slate-100">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[64px_repeat(7,1fr)] relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="border-r border-slate-200 pr-2 text-right text-[11px] text-slate-400 font-mono font-medium -translate-y-2 select-none">
                      {formatHourLabel(hour)}
                    </div>

                    {weekDays.map((day) => {
                      const isSelected = isSameDay(day, selectedDate);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r border-slate-100 last:border-r-0 ${
                            isSelected ? 'bg-indigo-50/10' : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}

                {/* Overlaid Logged Hour blocks for each column */}
                <div className="absolute inset-0 grid grid-cols-[64px_repeat(7,1fr)] pointer-events-none">
                  <div /> {/* Left gutter spacer */}
                  {weekDays.map((day) => {
                    const dayLogs = getLogsForDate(day);
                    const dayDateStr = toDateKey(day);
                    const isDraggingThisColumn = dragState && dragState.dateStr === dayDateStr;

                    let dragPreviewStyle: React.CSSProperties | null = null;
                    let dragDuration = 0;
                    let dragStartFormatted = '';
                    let dragEndFormatted = '';

                    if (isDraggingThisColumn) {
                      const sMin = Math.min(dragState.startMinutes, dragState.currentMinutes);
                      let eMin = Math.max(dragState.startMinutes, dragState.currentMinutes);
                      if (!dragState.hasMoved) {
                        eMin = Math.min(1440, sMin + 60);
                      } else if (eMin - sMin < 15) {
                        eMin = Math.min(1440, sMin + 30);
                      }
                      dragDuration = Math.round(((eMin - sMin) / 60) * 100) / 100;
                      const top = (sMin / 60) * HOUR_HEIGHT;
                      const height = Math.max(22, ((eMin - sMin) / 60) * HOUR_HEIGHT);
                      dragPreviewStyle = {
                        top: `${top}px`,
                        height: `${height}px`,
                      };
                      const sH = Math.floor(sMin / 60).toString().padStart(2, '0');
                      const sM = (sMin % 60).toString().padStart(2, '0');
                      const eH = Math.floor(eMin / 60).toString().padStart(2, '0');
                      const eM = (eMin % 60).toString().padStart(2, '0');
                      dragStartFormatted = `${sH}:${sM}`;
                      dragEndFormatted = `${eH}:${eM}`;
                    }

                    return (
                      <div
                        key={`logs-${day.toISOString()}`}
                        onMouseDown={(e) => handleColumnMouseDown(e, day)}
                        className="relative h-full pointer-events-auto cursor-default group/col select-none"
                      >
                        {/* Drag preview block */}
                        {isDraggingThisColumn && dragPreviewStyle && (
                          <div
                            style={dragPreviewStyle}
                            className="absolute left-1 right-1 z-30 bg-[#0077c8]/95 border-2 border-sky-300 text-white rounded-lg p-1.5 shadow-lg pointer-events-none flex flex-col justify-start overflow-hidden select-none animate-in fade-in duration-75"
                          >
                            <div className="flex items-center gap-1 font-bold text-[11px] leading-tight text-white truncate">
                              <Clock className="w-3 h-3 shrink-0 text-sky-200" />
                              <span>{isFr ? 'Nouvelles heures' : 'New time entry'}</span>
                            </div>
                            <div className="text-[10px] font-medium text-sky-100 mt-0.5 truncate">
                              {dragStartFormatted} – {dragEndFormatted} ({dragDuration}h)
                            </div>
                          </div>
                        )}

                        {dayLogs.map((log) => {
                          const style = getHourBlockStyle(log);
                          const duration = calculateDurationHours(log.startTime, log.endTime);
                          const isCabinet = (log.pratique || '').toLowerCase() === 'cabinet';
                          const isSoinsPalliatifs = (log.pratique || '') === 'Soins palliatifs';
                          return (
                            <div
                              key={log.id}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => handleEditLog(log, e)}
                              style={style}
                              className={`absolute left-1 right-1 text-white rounded-lg p-1.5 text-xs shadow-xs transition-all cursor-pointer overflow-hidden z-10 flex flex-col justify-start ${
                                isCabinet
                                  ? 'bg-emerald-600/95 hover:bg-emerald-700 border border-emerald-700'
                                  : isSoinsPalliatifs
                                  ? 'bg-amber-600/95 hover:bg-amber-700 border border-amber-700'
                                  : 'bg-[#0077c8]/95 hover:bg-[#0062a3] border border-[#005a96]'
                              }`}
                              title={`${log.pratique || 'CHSLD'}${log.activite ? ` • ${log.activite}` : ''}: ${log.startTime} – ${log.endTime}`}
                            >
                              <div className="font-bold truncate text-[11px] leading-tight">
                                {log.activite || log.pratique || 'CHSLD'}
                              </div>
                              <div className={`text-[10px] font-medium ${
                                isCabinet
                                  ? 'text-emerald-100'
                                  : isSoinsPalliatifs
                                  ? 'text-amber-100'
                                  : 'text-sky-100'
                              }`}>
                                {log.startTime} – {log.endTime} ({duration}h)
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
        )}

        {/* ============================================================ */}
        {/* DAY VIEW                                                    */}
        {/* ============================================================ */}
        {view === 'day' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden max-h-[calc(100vh-140px)]">
            {/* Day Header Banner */}
            <div className="p-3 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                <span
                  className={`text-base sm:text-lg font-bold inline-flex items-center justify-center w-8 h-8 rounded-full ${
                    isSameDay(currentDate, today)
                      ? 'bg-[#0077c8] text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-900'
                  }`}
                >
                  {currentDate.getDate()}
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {capitalize(
                      currentDate.toLocaleDateString(isFr ? 'fr-CA' : 'en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    )}
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {isFr
                      ? 'Cliquez et glissez pour ajouter des heures'
                      : 'Click and drag to add hours'}
                  </span>
                  {(() => {
                    const dayHoliday = getStatutoryHoliday(currentDate);
                    if (!dayHoliday) return null;
                    return (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100/90 border border-amber-300 rounded-md text-amber-900 text-xs font-bold shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          {isFr ? dayHoliday.name : dayHoliday.nameEn} ({isFr ? 'Fête légale' : 'Statutory Holiday'})
                        </span>
                        <span className="text-amber-800 text-[11px] font-medium hidden sm:inline">
                          • {isFr ? 'Secteur férié 31 / 42 applicable' : 'Holiday sector 31 / 42 applies'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <button
                onClick={() => handleOpenLogModal(currentDate)}
                className="px-3 py-1.5 text-xs font-bold text-[#0077c8] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isFr ? 'Consigner pour ce jour' : 'Log for this day'}
              </button>
            </div>

            {/* Scrollable Hourly Day Grid */}
            <div
              ref={timelineScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="relative divide-y divide-slate-100">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[72px_1fr] relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="border-r border-slate-200 pr-3 text-right text-xs text-slate-400 font-mono font-medium -translate-y-2.5 select-none bg-slate-50/50">
                      {formatHourLabel(hour)}
                    </div>
                    <div className="p-2 relative" />
                  </div>
                ))}

                {/* Overlaid Logged Hour blocks for Day */}
                <div className="absolute inset-0 grid grid-cols-[72px_1fr] pointer-events-none">
                  <div /> {/* Left gutter spacer */}
                  {(() => {
                    const dayDateStr = toDateKey(currentDate);
                    const isDraggingThisDay = dragState && dragState.dateStr === dayDateStr;

                    let dragPreviewStyle: React.CSSProperties | null = null;
                    let dragDuration = 0;
                    let dragStartFormatted = '';
                    let dragEndFormatted = '';

                    if (isDraggingThisDay) {
                      const sMin = Math.min(dragState.startMinutes, dragState.currentMinutes);
                      let eMin = Math.max(dragState.startMinutes, dragState.currentMinutes);
                      if (!dragState.hasMoved) {
                        eMin = Math.min(1440, sMin + 60);
                      } else if (eMin - sMin < 15) {
                        eMin = Math.min(1440, sMin + 30);
                      }
                      dragDuration = Math.round(((eMin - sMin) / 60) * 100) / 100;
                      const top = (sMin / 60) * HOUR_HEIGHT;
                      const height = Math.max(28, ((eMin - sMin) / 60) * HOUR_HEIGHT);
                      dragPreviewStyle = {
                        top: `${top}px`,
                        height: `${height}px`,
                      };
                      const sH = Math.floor(sMin / 60).toString().padStart(2, '0');
                      const sM = (sMin % 60).toString().padStart(2, '0');
                      const eH = Math.floor(eMin / 60).toString().padStart(2, '0');
                      const eM = (eMin % 60).toString().padStart(2, '0');
                      dragStartFormatted = `${sH}:${sM}`;
                      dragEndFormatted = `${eH}:${eM}`;
                    }

                    return (
                      <div
                        onMouseDown={(e) => handleColumnMouseDown(e, currentDate)}
                        className="relative h-full pointer-events-auto pr-4 cursor-default select-none"
                      >
                        {/* Drag preview block */}
                        {isDraggingThisDay && dragPreviewStyle && (
                          <div
                            style={dragPreviewStyle}
                            className="absolute left-2 right-4 z-30 bg-[#0077c8]/95 border-2 border-sky-300 text-white rounded-xl p-3 shadow-xl pointer-events-none flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-75"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-white">
                                <Clock className="w-4 h-4 text-sky-200" />
                                <span>{isFr ? 'Nouvelles heures' : 'New time entry'}</span>
                              </div>
                              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                                {dragDuration} {dragDuration <= 1 ? (isFr ? 'heure' : 'hour') : isFr ? 'heures' : 'hours'}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-sky-100 mt-1">
                              {dragStartFormatted} – {dragEndFormatted}
                            </div>
                          </div>
                        )}

                        {getLogsForDate(currentDate).map((log) => {
                          const style = getHourBlockStyle(log);
                          const duration = calculateDurationHours(log.startTime, log.endTime);
                          const isCabinet = (log.pratique || '').toLowerCase() === 'cabinet';
                          const isSoinsPalliatifs = (log.pratique || '') === 'Soins palliatifs';
                          return (
                            <div
                              key={log.id}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => handleEditLog(log, e)}
                              style={style}
                              className={`absolute left-2 right-4 text-white rounded-xl p-3 shadow-md transition-all cursor-pointer overflow-hidden z-10 flex flex-col justify-between ${
                                isCabinet
                                  ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-700'
                                  : isSoinsPalliatifs
                                  ? 'bg-amber-600 hover:bg-amber-700 border border-amber-700'
                                  : 'bg-[#0077c8] hover:bg-[#0062a3] border border-[#005a96]'
                              }`}
                            >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm tracking-tight">
                                {log.pratique || 'CHSLD'}
                              </span>
                              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                                {duration} {duration === 1 ? (isFr ? 'heure' : 'hour') : isFr ? 'heures' : 'hours'}
                              </span>
                            </div>
                            {log.activite && (
                              <div className={`text-xs font-medium mt-1 ${
                                isCabinet
                                  ? 'text-emerald-100'
                                  : isSoinsPalliatifs
                                  ? 'text-amber-100'
                                  : 'text-sky-100'
                              }`}>
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono mr-1.5 ${
                                  isCabinet
                                    ? 'bg-emerald-700/80'
                                    : isSoinsPalliatifs
                                    ? 'bg-amber-700/80'
                                    : 'bg-[#005a96]'
                                }`}>
                                  {log.activite.split(' ')[0]}
                                </span>
                                <span>{log.activite.split(' ').slice(1).join(' ')}</span>
                              </div>
                            )}
                            <div className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${
                              isCabinet
                                ? 'text-emerald-100'
                                : isSoinsPalliatifs
                                ? 'text-amber-100'
                                : 'text-sky-100'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {log.startTime} – {log.endTime}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] mt-1 ${
                            isCabinet
                              ? 'text-emerald-200'
                              : isSoinsPalliatifs
                              ? 'text-amber-200'
                              : 'text-sky-200'
                          }`}>
                            {isFr ? 'Cliquer pour modifier ou supprimer' : 'Click to edit or delete'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Date & Total Logged Hours Footer Bar */}
        <footer className="mt-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">
                {isFr ? 'Date sélectionnée :' : 'Selected Date:'}
              </span>
              <span className="text-slate-700 font-medium">
                {capitalize(
                  selectedDate.toLocaleDateString(isFr ? 'fr-CA' : 'en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                )}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">
                {isFr ? "Heures consignées aujourd'hui :" : 'Hours Logged Today:'}
              </span>
              <span className="text-[#0077c8] font-bold font-mono">
                {getLogsForDate(selectedDate).reduce(
                  (sum, log) => sum + calculateDurationHours(log.startTime, log.endTime),
                  0
                )}{' '}
                {isFr ? 'h' : 'hrs'}
              </span>
            </div>
          </div>

          <span className="text-slate-400 text-[11px] italic hidden sm:inline">
            {isFr
              ? 'Cliquez sur une plage horaire ou sur « Consigner des heures »'
              : "Click any day/hour slot or '+ Log Hours'"}
          </span>
        </footer>
      </main>

      {/* Right side tab: arrow pointing right saying visionner le modèle de demande */}
      <button
        id="floating-model-demande-btn"
        onClick={() => setActivePage('modele_demande')}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0077c8] border-l border-y border-slate-300 hover:border-sky-300 shadow-md py-3.5 px-2 rounded-l-xl flex flex-col items-center gap-2 transition-all cursor-pointer group"
        title={isFr ? 'Visionner le modèle de demande' : 'View request model'}
      >
        <span className="text-xs font-semibold [writing-mode:vertical-rl] rotate-180 tracking-wide select-none py-1">
          {isFr ? 'Visionner le modèle de demande' : 'View request model'}
        </span>
        <ArrowRight className="w-4 h-4 text-[#0077c8] group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Log Hours Modal */}
      <LogHoursModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLog}
        initialDate={modalDate}
        initialStartTime={modalStartTime}
        initialEndTime={modalEndTime}
        initialPratique={modalPratique}
        initialActivite={modalActivite}
        initialLog={editingLog}
        onDelete={handleDeleteLog}
        lang={lang}
      />

      {/* Reset Calendar Confirmation Modal */}
      {isResetModalOpen && (
        <div
          id="reset-modal-backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            id="reset-modal-dialog"
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {isFr ? 'Réinitialiser le calendrier' : 'Reset Calendar'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isFr
                    ? `Que souhaitez-vous faire ? Vous avez actuellement ${loggedHours.length} quart(s) d'heures consigné(s).`
                    : `What would you like to do? You currently have ${loggedHours.length} logged shift(s).`}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {/* Option 1: Vider complètement */}
              <button
                id="reset-empty-btn"
                onClick={() => handleResetCalendar('empty')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-rose-900 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFr ? 'Vider toutes les heures (0 quart)' : 'Clear all shifts (0 shifts)'}</span>
                  </div>
                  <div className="text-[11px] text-rose-600/80 mt-0.5">
                    {isFr
                      ? 'Efface complètement tous les quarts du calendrier et du modèle'
                      : 'Wipes all logged shifts from the calendar and billing model'}
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>

              {/* Option 2: Rétablir les exemples de base */}
              <button
                id="reset-restore-btn"
                onClick={() => handleResetCalendar('restore')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50/60 hover:border-sky-200 text-slate-800 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800 group-hover:text-[#0077c8]">
                    <RotateCcw className="w-3.5 h-3.5 text-[#0077c8]" />
                    <span>
                      {isFr ? 'Rétablir les exemples par défaut' : 'Restore default sample shifts'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isFr
                      ? 'Recharge les 3 quarts types (CHSLD, Cabinet, Soins palliatifs)'
                      : 'Reloads the 3 baseline shifts (CHSLD, Cabinet, Palliative care)'}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0077c8] opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                id="reset-cancel-btn"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Holidays Modal */}
      <StatutoryHolidaysModal
        isOpen={isHolidaysModalOpen}
        onClose={() => setIsHolidaysModalOpen(false)}
        onSelectHolidayDate={handleNavigateToHoliday}
        lang={lang}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
