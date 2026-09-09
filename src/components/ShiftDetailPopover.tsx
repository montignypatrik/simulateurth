import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Copy, 
  Clock, 
  Building2, 
  Tag, 
  DollarSign, 
  CheckCircle2, 
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { Shift } from '../types';
import { 
  calculateShiftHours, 
  calculateClaimTotal, 
  WORK_TYPE_CONFIGS, 
  formatTime12h 
} from '../utils/dateUtils';

interface ShiftDetailPopoverProps {
  shift: Shift;
  onClose: () => void;
  onEdit: (shift: Shift) => void;
  onDuplicate: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
}

export const ShiftDetailPopover: React.FC<ShiftDetailPopoverProps> = ({
  shift,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const config = WORK_TYPE_CONFIGS[shift.workType] || WORK_TYPE_CONFIGS.clinic;
  const { rawHours, billableHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
  const claimTotal = calculateClaimTotal(shift);

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Header with Quick Action Buttons */}
        <div 
          className="p-4 flex items-center justify-between text-white"
          style={{ backgroundColor: config.color }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              {config.label}
            </span>
            {shift.status === 'ready' && (
              <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3 h-3" />
                Ready to Bill
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicate(shift)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Duplicate shift to another day"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(shift)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Edit shift details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDelete(shift.id);
                onClose();
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Delete shift"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          {/* Shift Title */}
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {shift.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {new Date(`${shift.date}T00:00:00`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Time & Hours Calculation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  {shift.startTime} – {shift.endTime}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {rawHours}h elapsed {shift.breakMinutes > 0 ? `(-${shift.breakMinutes}m break)` : ''}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full block">
                {billableHours}h billable
              </span>
            </div>
          </div>

          {/* Medical Billing Information Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Facility & Clinic
              </span>
              <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="leading-tight font-semibold text-slate-800">{shift.facility}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {shift.facilityBillingCode}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billing Code & Tariff
              </span>
              <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 text-[11px] font-bold">
                    {shift.billingCode}
                  </span>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    ${shift.hourlyRate}/h {shift.isOvertimeOrHoliday ? '• 1.5x Premium' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Claim Compensation */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-900">
                Estimated Claim Payout
              </span>
            </div>
            <div className="text-base font-bold text-emerald-800 font-mono">
              ${claimTotal.toFixed(2)}
            </div>
          </div>

          {/* Patients Seen / Notes */}
          {(shift.patientCount || shift.notes) && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {shift.patientCount !== undefined && shift.patientCount > 0 && (
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>{shift.patientCount}</strong> patient encounters documented</span>
                </div>
              )}
              {shift.notes && (
                <div className="flex items-start gap-2 text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{shift.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={() => onDuplicate(shift)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => onEdit(shift)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow transition-all active:scale-[0.98]"
          >
            Edit Shift
          </button>
        </div>
      </div>
    </div>
  );
};
