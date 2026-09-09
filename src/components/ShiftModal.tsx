import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Building2, 
  Tag, 
  DollarSign, 
  Calendar, 
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { Shift, ShiftWorkType, ClaimStatus } from '../types';
import { 
  calculateShiftHours, 
  WORK_TYPE_CONFIGS, 
  COMMON_FACILITIES,
  formatDateToYYYYMMDD 
} from '../utils/dateUtils';
import { DEFAULT_PROVIDER } from '../data/initialShifts';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
  initialShift?: Partial<Shift> | null;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialShift,
}) => {
  const isEditing = Boolean(initialShift && initialShift.id);

  // Form states
  const [title, setTitle] = useState('');
  const [workType, setWorkType] = useState<ShiftWorkType>('clinic');
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('16:30');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [facility, setFacility] = useState(COMMON_FACILITIES[0].name);
  const [facilityBillingCode, setFacilityBillingCode] = useState(COMMON_FACILITIES[0].code);
  const [department, setDepartment] = useState(COMMON_FACILITIES[0].defaultDept);
  const [billingCode, setBillingCode] = useState('99214-E&M');
  const [hourlyRate, setHourlyRate] = useState(165);
  const [isOvertimeOrHoliday, setIsOvertimeOrHoliday] = useState(false);
  const [patientCount, setPatientCount] = useState<number | ''>('');
  const [status, setStatus] = useState<ClaimStatus>('ready');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate form on initialShift change
  useEffect(() => {
    if (initialShift) {
      setTitle(initialShift.title || '');
      setWorkType(initialShift.workType || 'clinic');
      setDate(initialShift.date || formatDateToYYYYMMDD(new Date()));
      setStartTime(initialShift.startTime || '08:30');
      setEndTime(initialShift.endTime || '16:30');
      setBreakMinutes(initialShift.breakMinutes !== undefined ? initialShift.breakMinutes : 30);
      setFacility(initialShift.facility || COMMON_FACILITIES[0].name);
      setFacilityBillingCode(initialShift.facilityBillingCode || COMMON_FACILITIES[0].code);
      setDepartment(initialShift.department || COMMON_FACILITIES[0].defaultDept);
      setBillingCode(initialShift.billingCode || '99214-E&M');
      setHourlyRate(initialShift.hourlyRate || 165);
      setIsOvertimeOrHoliday(Boolean(initialShift.isOvertimeOrHoliday));
      setPatientCount(initialShift.patientCount !== undefined ? initialShift.patientCount : '');
      setStatus(initialShift.status || 'ready');
      setNotes(initialShift.notes || '');
      setError(null);
    } else {
      // Default reset
      setTitle('Outpatient Medicine Consultation');
      setWorkType('clinic');
      setDate(formatDateToYYYYMMDD(new Date()));
      setStartTime('08:30');
      setEndTime('16:30');
      setBreakMinutes(30);
      setFacility(COMMON_FACILITIES[0].name);
      setFacilityBillingCode(COMMON_FACILITIES[0].code);
      setDepartment(COMMON_FACILITIES[0].defaultDept);
      setBillingCode('99214-E&M');
      setHourlyRate(165);
      setIsOvertimeOrHoliday(false);
      setPatientCount('');
      setStatus('ready');
      setNotes('');
      setError(null);
    }
  }, [initialShift, isOpen]);

  // Live calculation of hours
  const { rawHours, billableHours } = calculateShiftHours(startTime, endTime, breakMinutes);
  const multiplier = isOvertimeOrHoliday ? 1.5 : 1.0;
  const estimatedAmount = Number((billableHours * hourlyRate * multiplier).toFixed(2));

  if (!isOpen) return null;

  const handleFacilityChange = (facName: string) => {
    setFacility(facName);
    const found = COMMON_FACILITIES.find(f => f.name === facName);
    if (found) {
      setFacilityBillingCode(found.code);
      setDepartment(found.defaultDept);
    }
  };

  const handleWorkTypeChange = (newType: ShiftWorkType) => {
    setWorkType(newType);
    // Update default code & title suggestion if empty or default
    if (newType === 'emergency') {
      setBillingCode('99285-ED-HIGH');
      setHourlyRate(210);
      if (!title || title.includes('Medicine Consultation')) setTitle('Emergency Department Shift');
    } else if (newType === 'rounds') {
      setBillingCode('RND-HOSP-02');
      setHourlyRate(180);
      if (!title || title.includes('Medicine Consultation')) setTitle('Inpatient Ward Rounds');
    } else if (newType === 'surgery') {
      setBillingCode('SURG-ASST-MOD');
      setHourlyRate(225);
      if (!title || title.includes('Medicine Consultation')) setTitle('Surgical Assist Block');
    } else if (newType === 'oncall') {
      setBillingCode('ONCALL-LEVEL2');
      setHourlyRate(155);
      setIsOvertimeOrHoliday(true);
      if (!title || title.includes('Medicine Consultation')) setTitle('Hospital On-Call Standby');
    } else if (newType === 'telehealth') {
      setBillingCode('99442-VIRTUAL');
      setHourlyRate(150);
      if (!title || title.includes('Medicine Consultation')) setTitle('Telemedicine Consultations');
    } else if (newType === 'clinic') {
      setBillingCode('99214-E&M');
      setHourlyRate(165);
      if (!title || title.includes('Emergency') || title.includes('Rounds')) setTitle('Outpatient Clinic Consultations');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a title or description for this shift.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Start time and end time are required.');
      return;
    }

    const shiftData: Shift = {
      id: initialShift?.id || `shift-${Date.now()}`,
      providerName: DEFAULT_PROVIDER.name,
      providerBillingId: DEFAULT_PROVIDER.billingId,
      title: title.trim(),
      workType,
      date,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 0,
      facility,
      facilityBillingCode: facilityBillingCode.trim() || 'FAC-DEFAULT',
      department,
      billingCode: billingCode.trim() || '99214',
      hourlyRate: Number(hourlyRate) || 0,
      isOvertimeOrHoliday,
      patientCount: patientCount !== '' ? Number(patientCount) : undefined,
      status,
      notes: notes.trim(),
      color: WORK_TYPE_CONFIGS[workType]?.color,
    };

    onSave(shiftData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Worked Shift Log' : 'Log Hours for Medical Claim'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {DEFAULT_PROVIDER.name} • Billing ID: {DEFAULT_PROVIDER.billingId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shift Title */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Shift Title / Description *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambulatory Internal Medicine Clinic"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Work / Service Category Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Service / Shift Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(WORK_TYPE_CONFIGS) as ShiftWorkType[]).map(typeKey => {
                const config = WORK_TYPE_CONFIGS[typeKey];
                const isSelected = workType === typeKey;

                return (
                  <button
                    type="button"
                    key={typeKey}
                    onClick={() => handleWorkTypeChange(typeKey)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="truncate text-[11px]">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date of Service
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Start Time (24h)
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                End Time (24h)
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Unpaid Break Minutes & Overtime Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Unpaid Break (Minutes deducted from claim)
              </label>
              <div className="flex items-center gap-1.5">
                {[0, 15, 30, 45, 60].map(mins => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setBreakMinutes(mins)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
                      breakMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 0 ? 'None' : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isOvertimeOrHoliday}
                  onChange={(e) => setIsOvertimeOrHoliday(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">
                    Weekend / Holiday / Night Premium
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Applies 1.5x claim rate multiplier
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Live Hours & Claim Calculation Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                Claim Calculation Breakdown
              </span>
              <div className="text-xs text-slate-700 mt-0.5 font-medium">
                <span>{rawHours}h elapsed</span>
                {breakMinutes > 0 && <span className="text-slate-500"> - {breakMinutes}m break</span>}
                <span className="font-bold text-slate-900"> = {billableHours}h billable</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-bold text-slate-900 font-mono">
                ${estimatedAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ${hourlyRate}/h {isOvertimeOrHoliday ? '(with 1.5x)' : ''}
              </div>
            </div>
          </div>

          {/* Medical Facility & Billing Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Facility / Clinic Name
              </label>
              <select
                value={facility}
                onChange={(e) => handleFacilityChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
              >
                {COMMON_FACILITIES.map(fac => (
                  <option key={fac.name} value={fac.name}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Facility Provider ID / Code
              </label>
              <input
                type="text"
                value={facilityBillingCode}
                onChange={(e) => setFacilityBillingCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                placeholder="e.g. FAC-0101"
              />
            </div>
          </div>

          {/* Billing CPT / Service Code & Hourly Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Billing / Procedure Code
              </label>
              <input
                type="text"
                value={billingCode}
                onChange={(e) => setBillingCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                placeholder="e.g. 99214-E&M"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Hourly Billing Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Patients Seen (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={patientCount}
                onChange={(e) => setPatientCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                placeholder="e.g. 16"
              />
            </div>
          </div>

          {/* Claim Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Claim Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready to Bill</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Notes & Billing Audit Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Chart documentation verified, on-call paging log attached"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (initialShift?.id) {
                    onDelete(initialShift.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Delete Shift Log
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow transition-all active:scale-[0.98]"
            >
              {isEditing ? 'Update Shift' : 'Save Worked Hours'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
