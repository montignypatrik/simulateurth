export type PlageId = 'NU' | 'AM' | 'PM' | 'SO';

export type TemplateId = 'facnet2' | 'facnet3' | 'ramq';

export interface DemandeRowSlot {
  slotNum: number;
  code: string;
  secteur: string;
  heures: number | string;
}

export interface DemandeRow {
  rowId: string;
  dateStr: string;
  quantiemeDisplay: string;
  mode: string;
  selectedPlage: PlageId;
  slots: [DemandeRowSlot, DemandeRowSlot, DemandeRowSlot];
  totalHeures: number;
}

export interface DemandeWeek {
  id: string; // Sunday date + pratique: YYYY-MM-DD__Pratique
  pratique: string;
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  daysOptions: { dateStr: string; display: string }[];
  rows: DemandeRow[];
  totalDemandeHeures: number;
  sectorIssues: { date: string; startTime: string; endTime: string; code: string; programme?: string }[];
}

export interface TemplateViewProps {
  demande: DemandeWeek;
  demandeIndex: number;
  allDemandes: DemandeWeek[];
  onSelectDemandeIndex: (index: number) => void;
  isFr: boolean;
}
