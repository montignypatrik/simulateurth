// Source pages and unresolved periods: docs/billing-guide-mapping.md.
export interface ActivityDefinition {
  code: string;
  label: string;
  sectorZero?: boolean;
  regularSectorZero?: boolean;
  networkWalkIn?: boolean;
}

export interface ProgrammeDefinition {
  label: string;
  activities: ActivityDefinition[];
  profile: 'hospital' | 'clinic' | 'zero';
  daySector: string;
  source: string;
}

export interface PracticeDefinition {
  label: string;
  establishment: string;
  programmes: ProgrammeDefinition[];
  defaultProgramme?: string;
}

const labels: Record<string, string> = {
  '015': 'Examens relatifs à l’hépatite C',
  '027': 'Développement d’instruments cliniques ou pédagogiques',
  '028': 'Gestion administrative spécifique du GMF-U',
  '030': 'Services cliniques',
  '031': 'Étude de dossiers',
  '032': 'Rencontres multidisciplinaires',
  '037': 'Planification – Programmation – Évaluation',
  '043': 'Tâches médico-administratives et hospitalières',
  '055': 'Communications (proches, tiers, intervenants du réseau et de la justice)',
  '063': 'Garde sur place',
  '068': 'Encadrement clinique et pédagogique',
  '069': 'Activité de supervision',
  '071': 'Garde sur place à même les 35 premières heures d’activités professionnelles hebdomadaires',
  '097': 'Plan d’intervention pour le patient',
  '098': 'Services de santé durant le délai de carence',
  '132': 'Garde sur place effectuée à même la période régulière d’activités professionnelles',
  '414': 'Assemblée du CMDP',
  '415': 'Réunion de département',
  '416': 'Réunion de service',
  '417': 'Comité exécutif du CMDP',
  '418': 'Comité du CMDP (excluant le comité exécutif du CMDP)',
};

const activities = (prefix: string, suffixes: string[]): ActivityDefinition[] =>
  suffixes.map(suffix => ({
    code: prefix + suffix,
    label: labels[suffix],
    regularSectorZero: suffix === '043',
  }));
const cmdp = ['414', '415', '416', '417', '418'];
const clscSuffixes = ['015', '030', '031', '032', '037', '043', '055', '063', '071', '098', ...cmdp];
const hospitalSuffixes = ['030', '032', '043', '055', '063', '071'];
const palliativeActivities = activities('53', ['030', '032', '037', '043', '055', '063', '071']);
const gmfActivities: ActivityDefinition[] = [
  { code: '072101', label: 'Activités de fonctionnement en GMF', sectorZero: true },
  { code: '72103', label: 'Services cliniques en GMF' },
];
const networkProgrammes: ProgrammeDefinition[] = [
  {
    label: 'Clinique-réseau (EP 39)', profile: 'clinic', daySector: '1', source: 'GMF-U p. 25',
    activities: [
      { code: '76110', label: 'Services cliniques sans rendez-vous', networkWalkIn: true },
      { code: '76111', label: 'Services cliniques ailleurs qu’au sans rendez-vous' },
    ],
  },
  {
    label: 'GMF-R (EP 54)', profile: 'clinic', daySector: '1', source: 'GMF-U p. 26 ; CLSC p. 29',
    activities: [
      { code: '269110', label: 'Services cliniques sans rendez-vous', networkWalkIn: true },
      { code: '269111', label: 'Services cliniques au bureau' },
    ],
  },
];

export const BILLING_PRACTICES: PracticeDefinition[] = [
  {
    label: 'CHSLD', establishment: 'CHSLD',
    programmes: [{
      label: '', profile: 'hospital', daySector: '4', source: 'Catalogue préexistant ; aucun guide CHSLD fourni',
      activities: activities('101', ['015', '030', '032', '043', '055', '063', '097', '098', '132', ...cmdp]),
    }],
  },
  {
    label: 'CLSC', establishment: 'CLSC', defaultProgramme: 'Toxicomanie (263)',
    programmes: [
      ...[['CLSC général (002)', '002'], ['Toxicomanie (263)', '263'], ['Itinérance (264)', '264'], ['Santé mentale (276)', '276']].map(([label, prefix]): ProgrammeDefinition => ({
        label, profile: 'clinic', daySector: '1', source: 'CLSC p. 4, 6, 12',
        activities: activities(prefix, clscSuffixes).map(activity => activity.code.endsWith('071')
          ? { ...activity, label: `${activity.label}. Pour les médecins se prévalant du paragraphe 5.10 de l’annexe XIV, aucune limitation d’heures (TH seulement).` }
          : activity),
      })),
      {
        label: 'Soutien à domicile (002404)', profile: 'clinic', daySector: '1', source: 'CLSC p. 4, 6',
        activities: [{ code: '002404', label: 'Services dans le programme de soutien à domicile' }],
      },
      {
        label: 'Centre de détention (88)', profile: 'clinic', daySector: '1', source: 'CLSC p. 4, 6',
        activities: [{ code: '88030', label: 'Services dispensés dans un centre de détention à partir de la nomination en CLSC' }],
      },
      {
        label: 'Centre antipoison (89)', profile: 'clinic', daySector: '1', source: 'CLSC p. 5–6',
        activities: [...activities('89', ['030']), { code: '89067', label: 'Expertise-conseil, information et coordination' }],
      },
      { label: 'GMF (EP 33)', profile: 'clinic', daySector: '1', source: 'CLSC p. 26–28', activities: gmfActivities },
      networkProgrammes[1],
    ],
  },
  {
    label: 'Cabinet', establishment: 'CLINIQUE MÉDICALE',
    programmes: [{ label: '', profile: 'zero', daySector: '0', source: 'Cabinet p. 31–32', activities: [gmfActivities[0]] }],
  },
  {
    // Keep existing logs and the existing shortcut compatible.
    label: 'Soins palliatifs', establishment: 'MAISON DE SOINS PALLIATIFS',
    programmes: [{ label: '', profile: 'hospital', daySector: '0', source: 'Courte durée p. 8–9', activities: palliativeActivities }],
  },
  {
    label: 'GMF-U', establishment: 'GMF-U',
    programmes: [
      {
        label: 'Médecin enseignant (EP 42)', profile: 'clinic', daySector: '1', source: 'GMF-U p. 4',
        activities: [...activities('51', ['015', '027', '028', '030', '031', '032', '043', '416', '068', '069']), { code: '63030', label: 'Services cliniques — malade admis' }],
      },
      { label: 'GMF (EP 33)', profile: 'clinic', daySector: '1', source: 'GMF-U p. 23–24', activities: gmfActivities },
      ...networkProgrammes,
    ],
  },
  {
    label: 'Courte durée', establishment: 'CENTRE HOSPITALIER — COURTE DURÉE',
    programmes: [
      { label: 'URFI (102)', profile: 'hospital', daySector: '2', source: 'Courte durée p. 4', activities: activities('102', hospitalSuffixes) },
      { label: 'Toxicomanie (31)', profile: 'hospital', daySector: '3', source: 'Courte durée p. 5', activities: activities('31', hospitalSuffixes) },
      { label: 'Gériatrie (101)', profile: 'hospital', daySector: '2', source: 'Courte durée p. 6', activities: activities('101', hospitalSuffixes) },
      { label: 'Psychiatrie (27)', profile: 'hospital', daySector: '8', source: 'Courte durée p. 6–8', activities: activities('27', ['030', '032', '037', '043', '055', '063', '071', ...cmdp]) },
      { label: 'Soins palliatifs (53)', profile: 'hospital', daySector: '0', source: 'Courte durée p. 8–9', activities: palliativeActivities },
      ...['Clinique de la douleur', 'Aide aux victimes d’agression à caractère sexuel', 'Oncologie', 'Maladie du sein', 'Traitement des dépendances'].map((label): ProgrammeDefinition => ({
        label: `${label} (54)`, profile: 'hospital', daySector: '3', source: 'Courte durée p. 9 — EP 49', activities: activities('54', ['030', '032', '043', '055']),
      })),
    ],
  },
  {
    label: 'Réadaptation', establishment: 'CENTRE DE RÉADAPTATION',
    programmes: [
      { label: 'Adaptation-réadaptation (102)', profile: 'hospital', daySector: '3', source: 'Réadaptation p. 4–6', activities: activities('102', hospitalSuffixes) },
      { label: 'Déficience physique (100)', profile: 'hospital', daySector: '3', source: 'Réadaptation p. 4–6', activities: activities('100', ['015', '030', '032', '043', '055', '098']) },
    ],
  },
];

export const PRATIQUE_OPTIONS = BILLING_PRACTICES.map(p => p.label);
export const getPractice = (pratique = 'CHSLD') => BILLING_PRACTICES.find(p => p.label === pratique);
export const getProgrammesForPratique = (pratique?: string): string[] => getPractice(pratique)?.programmes.map(p => p.label).filter(Boolean) ?? [];
export const getDefaultProgrammeForPratique = (pratique?: string): string => {
  const practice = getPractice(pratique);
  return practice?.defaultProgramme ?? practice?.programmes[0]?.label ?? '';
};
export function getProgramme(pratique?: string, programme?: string): ProgrammeDefinition | undefined {
  return getPractice(pratique)?.programmes.find(p => p.label === (programme || getDefaultProgrammeForPratique(pratique)));
}
export const activityText = (activity: ActivityDefinition) => `${activity.code} ${activity.label}`;
export const extractActivityCode = (text = '') => text.match(/^\d{5,6}/)?.[0] ?? '';
export const canonicalActivityCode = (text = '') => {
  const code = extractActivityCode(text);
  return code === '72101' ? '072101' : code;
};
export const getActivitiesForPratique = (pratique?: string, programme?: string): string[] =>
  getProgramme(pratique, programme)?.activities.map(activityText) ?? [];
export function getDefaultActiviteForPratique(pratique?: string, programme?: string): string {
  const list = getProgramme(pratique, programme)?.activities ?? [];
  const activity = list.find(a => a.code.endsWith('030')) ?? list[0];
  return activity ? activityText(activity) : '';
}
export const getEstablishmentLabel = (pratique: string) => getPractice(pratique)?.establishment ?? pratique;
