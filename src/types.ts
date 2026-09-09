export type ShiftWorkType = 
  | 'clinic'
  | 'emergency'
  | 'rounds'
  | 'surgery'
  | 'oncall'
  | 'telehealth'
  | 'admin';

export type ClaimStatus = 'draft' | 'ready' | 'submitted' | 'approved';

export interface Shift {
  id: string;
  providerName: string;
  providerBillingId: string;
  title: string;
  workType: ShiftWorkType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  breakMinutes: number; // unpaid break deducted from billable hours
  facility: string;
  facilityBillingCode: string;
  department: string;
  billingCode: string; // e.g. CPT / Service code (99214, 99285, ON-CALL-01)
  hourlyRate: number; // default hourly rate for this shift
  isOvertimeOrHoliday: boolean; // 1.5x multiplier or holiday billing premium
  patientCount?: number;
  status: ClaimStatus;
  notes: string;
  color?: string;
}

export type ViewMode = 'month' | 'week' | 'day' | 'claims';

export interface QuickTemplate {
  id: string;
  label: string;
  workType: ShiftWorkType;
  defaultStartTime: string;
  defaultEndTime: string;
  breakMinutes: number;
  facility: string;
  facilityBillingCode: string;
  billingCode: string;
  hourlyRate: number;
  color: string;
}

export interface WorkTypeConfig {
  label: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  iconName: string;
}

export interface ClaimValidationAlert {
  shiftId: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}
