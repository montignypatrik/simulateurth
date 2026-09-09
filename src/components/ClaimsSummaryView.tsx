import React, { useState } from 'react';
import { Shift, ClaimStatus, ClaimValidationAlert } from '../types';
import { 
  calculateShiftHours, 
  calculateClaimTotal, 
  formatDateToYYYYMMDD, 
  WORK_TYPE_CONFIGS, 
  validateShiftsForClaims,
  exportShiftsToCSV 
} from '../utils/dateUtils';
import { 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Edit3, 
  Building2, 
  Stethoscope, 
  ShieldCheck,
  Filter
} from 'lucide-react';

interface ClaimsSummaryViewProps {
  shifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onUpdateShiftStatus: (shiftId: string, newStatus: ClaimStatus) => void;
}

export const ClaimsSummaryView: React.FC<ClaimsSummaryViewProps> = ({
  shifts,
  onEditShift,
  onDeleteShift,
  onUpdateShiftStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);

  // Run claim validation
  const validationAlerts = validateShiftsForClaims(shifts);
  const alertsByShiftId: Record<string, ClaimValidationAlert[]> = {};
  validationAlerts.forEach(alert => {
    if (!alertsByShiftId[alert.shiftId]) alertsByShiftId[alert.shiftId] = [];
    alertsByShiftId[alert.shiftId].push(alert);
  });

  // Filtered shifts
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch =
      search === '' ||
      shift.title.toLowerCase().includes(search.toLowerCase()) ||
      shift.facility.toLowerCase().includes(search.toLowerCase()) ||
      shift.billingCode.toLowerCase().includes(search.toLowerCase()) ||
      shift.date.includes(search);

    const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Aggregated metrics
  const totalWorkedHours = filteredShifts.reduce(
    (sum, s) => sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes).rawHours,
    0
  );

  const totalBillableHours = filteredShifts.reduce(
    (sum, s) => sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes).billableHours,
    0
  );

  const totalEstimatedClaim = filteredShifts.reduce(
    (sum, s) => sum + calculateClaimTotal(s),
    0
  );

  const totalPatients = filteredShifts.reduce(
    (sum, s) => sum + (s.patientCount || 0),
    0
  );

  const toggleSelectAll = () => {
    if (selectedShiftIds.length === filteredShifts.length) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(filteredShifts.map(s => s.id));
    }
  };

  const toggleSelectShift = (id: string) => {
    setSelectedShiftIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = (newStatus: ClaimStatus) => {
    selectedShiftIds.forEach(id => onUpdateShiftStatus(id, newStatus));
    setSelectedShiftIds([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-4 md:p-6 select-none space-y-6">
      {/* Header with Title and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Medical Claim Hours Audit & Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review logged hours, verify billing codes and facility codes, and export claim-ready time records.
          </p>
        </div>

        <button
          onClick={() => exportShiftsToCSV(filteredShifts)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Claim Report (CSV)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Billable Claim Hours</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalBillableHours.toFixed(1)} <span className="text-sm font-normal text-slate-500 font-sans">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Total raw logged: {totalWorkedHours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Est. Claim Reimbursement</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            ${totalEstimatedClaim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Avg rate: ${(totalEstimatedClaim / (totalBillableHours || 1)).toFixed(0)}/hr
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Claim Shifts Logged</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {filteredShifts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {filteredShifts.filter(s => s.status === 'ready').length} marked ready for claim
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Patient Encounters</span>
            <Stethoscope className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalPatients}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Across {new Set(filteredShifts.map(s => s.facility)).size} facilities
          </div>
        </div>
      </div>

      {/* Claim Audit Warnings & Verification Banner */}
      <div className={`p-4 rounded-xl border shadow-xs ${
        validationAlerts.length > 0
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-start gap-3">
          {validationAlerts.length > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-sm font-bold">
              {validationAlerts.length > 0
                ? `${validationAlerts.length} Claim Pre-Submission Validation Warnings`
                : 'All Logged Shift Records are Pre-Validated!'}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              {validationAlerts.length > 0
                ? 'Check highlighted items below before submitting to prevent claim rejection due to schedule overlap or missing codes.'
                : 'No overlapping shift hours, missing CPT codes, or unverified facility billing IDs detected.'}
            </p>

            {validationAlerts.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                {validationAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-white/90 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 flex items-center justify-between"
                  >
                    <span>{alert.message}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {alert.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters, Search & Bulk Actions Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by facility, title, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft Only</option>
            <option value="ready">Ready to Bill</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {/* Batch Actions when items selected */}
        {selectedShiftIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
            <span className="font-semibold text-indigo-900">{selectedShiftIds.length} selected</span>
            <button
              onClick={() => handleBatchStatusUpdate('ready')}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors"
            >
              Mark Ready
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('submitted')}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold transition-colors"
            >
              Mark Submitted
            </button>
          </div>
        )}
      </div>

      {/* Claims Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedShiftIds.length > 0 && selectedShiftIds.length === filteredShifts.length}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">Shift Details & Work Type</th>
                <th className="p-3">Hours & Break</th>
                <th className="p-3">Facility & Code</th>
                <th className="p-3">Billing Code</th>
                <th className="p-3">Rate & Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-sm">
                    No worked hours found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredShifts.map(shift => {
                  const config = WORK_TYPE_CONFIGS[shift.workType] || WORK_TYPE_CONFIGS.clinic;
                  const { billableHours, rawHours } = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
                  const claimTotal = calculateClaimTotal(shift);
                  const alerts = alertsByShiftId[shift.id] || [];
                  const isSelected = selectedShiftIds.includes(shift.id);

                  return (
                    <tr
                      key={shift.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        alerts.some(a => a.type === 'error') ? 'bg-rose-50/20' : ''
                      } ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectShift(shift.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                      </td>

                      {/* Date */}
                      <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div>{shift.date}</div>
                        <div className="text-[10px] text-slate-400 font-normal font-mono">
                          {new Date(`${shift.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>

                      {/* Title & Work Type */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{shift.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-[11px] text-slate-500 font-medium">{config.label}</span>
                          {shift.isOvertimeOrHoliday && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              Premium 1.5x
                            </span>
                          )}
                        </div>
                        {alerts.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {alerts.map((al, i) => (
                              <div
                                key={i}
                                className={`text-[10px] font-medium flex items-center gap-1 ${
                                  al.type === 'error' ? 'text-rose-600 font-semibold' : 'text-amber-600'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{al.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Hours & Break */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-indigo-700">
                          {billableHours} hrs billable
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {shift.startTime} - {shift.endTime} ({rawHours}h elapsed)
                        </div>
                        {shift.breakMinutes > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            Break: {shift.breakMinutes} min
                          </div>
                        )}
                      </td>

                      {/* Facility */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{shift.facility}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {shift.facilityBillingCode}
                        </div>
                      </td>

                      {/* Billing Code */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold text-[11px] border border-slate-200">
                          {shift.billingCode || 'MISSING'}
                        </span>
                      </td>

                      {/* Rate & Amount */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono">${claimTotal.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ${shift.hourlyRate}/h {shift.isOvertimeOrHoliday ? '(x1.5)' : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={shift.status}
                          onChange={(e) => onUpdateShiftStatus(shift.id, e.target.value as ClaimStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none ${
                            shift.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : shift.status === 'submitted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : shift.status === 'approved'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="ready">Ready to Bill</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditShift(shift)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit shift details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteShift(shift.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete shift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
