import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BILLING_PRACTICES, extractActivityCode, getActivitiesForPratique, getDefaultActiviteForPratique } from '../src/data/billingCatalog';
import { calculateSecteur, splitLogIntoBillingSegments } from '../src/utils/billingRules';
import { buildDemandes } from '../src/utils/buildDemandes';
import type { LoggedHours } from '../src/components/LogHoursModal';

const monday = '2026-09-14';
const friday = '2026-09-18';
const saturday = '2026-09-19';
const holiday = '2026-09-07';
const sector = (pratique: string, programme: string, code: string, date: string, minute: number) =>
  calculateSecteur(date, minute < 480 ? 'NU' : minute < 720 ? 'AM' : minute < 1200 ? 'PM' : 'SO', code, pratique, minute, undefined, programme);
const log = (overrides: Partial<LoggedHours> = {}): LoggedHours => ({
  id: 'test', date: monday, startTime: '08:00', endTime: '16:00', pratique: 'CLSC',
  programme: 'Toxicomanie (263)', activite: '263030 Services cliniques', ...overrides,
});
const populatedSlots = (logs: LoggedHours[]) => buildDemandes(logs).flatMap(d => d.rows.flatMap(r => r.slots.filter(s => s.code)));

test('catalog retains the four existing practices and adds the three documented establishment types', () => {
  assert.deepEqual(BILLING_PRACTICES.map(p => p.label), ['CHSLD', 'CLSC', 'Cabinet', 'Soins palliatifs', 'GMF-U', 'Courte durée', 'Réadaptation']);
  for (const practice of BILLING_PRACTICES) {
    for (const programme of practice.programmes) {
      const list = getActivitiesForPratique(practice.label, programme.label);
      assert.ok(list.includes(getDefaultActiviteForPratique(practice.label, programme.label)));
      assert.equal(new Set(list.map(extractActivityCode)).size, list.length);
      assert.ok(programme.source);
    }
  }
  assert.deepEqual(getActivitiesForPratique('Courte durée', 'Toxicomanie (263)'), []);
  assert.deepEqual(getActivitiesForPratique('Unknown'), []);
});

test('CLSC programme codes and special programmes match the supplied guide', () => {
  for (const [programme, code] of [
    ['CLSC général (002)', '002030'], ['Toxicomanie (263)', '263030'],
    ['Itinérance (264)', '264030'], ['Santé mentale (276)', '276030'],
    ['Soutien à domicile (002404)', '002404'], ['Centre de détention (88)', '88030'],
    ['Centre antipoison (89)', '89030'],
  ]) assert.equal(extractActivityCode(getDefaultActiviteForPratique('CLSC', programme)), code);
  assert.equal(getActivitiesForPratique('CLSC', 'Centre antipoison (89)').length, 2);
  assert.equal(getActivitiesForPratique('CLSC', 'Soutien à domicile (002404)').length, 1);
  assert.ok(!getActivitiesForPratique('Courte durée', 'Toxicomanie (31)').some(a => a.startsWith('31132')), 'HF-only code is excluded from TH');
});

test('CLSC and GMF-U use the exact 18:00, 20:00 and 22:00 boundaries', () => {
  for (const [pratique, programme, code] of [['CLSC', 'Itinérance (264)', '264030'], ['GMF-U', 'Médecin enseignant (EP 42)', '51030']]) {
    for (const [date, expected] of [[monday, ['1', '23', '23', '24', '24', '']], [friday, ['1', '25', '25', '26', '26', '']]] as const) {
      const minutes = [1079, 1080, 1199, 1200, 1319, 1320];
      assert.deepEqual(minutes.map(m => sector(pratique, programme, code, date, m)), expected);
    }
    for (const date of [saturday, holiday]) {
      assert.equal(sector(pratique, programme, code, date, 480), '27');
      assert.equal(sector(pratique, programme, code, date, 1439), '27');
    }
  }
  assert.equal(sector('GMF-U', 'Médecin enseignant (EP 42)', '51030', holiday, 479), '0');
  assert.equal(sector('CLSC', 'Itinérance (264)', '264030', holiday, 479), '');
});

test('network sector 28 applies to walk-in activity, not office activity', () => {
  for (const pratique of ['CLSC', 'GMF-U']) {
    assert.equal(sector(pratique, 'GMF-R (EP 54)', '269110', holiday, 600), '28');
    assert.equal(sector(pratique, 'GMF-R (EP 54)', '269111', holiday, 600), '27');
    assert.equal(sector(pratique, 'GMF-R (EP 54)', '269110', friday, 1140), '25');
  }
  assert.equal(sector('GMF-U', 'Clinique-réseau (EP 39)', '76110', saturday, 600), '28');
});

test('same activity prefix can have different sectors by establishment and programme', () => {
  const cases = [
    ['CHSLD', '', '101030', '4'],
    ['Courte durée', 'Gériatrie (101)', '101030', '2'],
    ['Courte durée', 'URFI (102)', '102030', '2'],
    ['Réadaptation', 'Adaptation-réadaptation (102)', '102030', '3'],
    ['Réadaptation', 'Déficience physique (100)', '100030', '3'],
    ['Courte durée', 'Toxicomanie (31)', '31030', '3'],
    ['Courte durée', 'Psychiatrie (27)', '27030', '8'],
    ['Courte durée', 'Soins palliatifs (53)', '53030', '0'],
    ['Courte durée', 'Oncologie (54)', '54030', '3'],
    ['Soins palliatifs', '', '53030', '0'],
  ];
  for (const [pratique, programme, code, expected] of cases) {
    assert.equal(sector(pratique, programme, code, monday, 1199), expected);
    assert.equal(sector(pratique, programme, code, monday, 1200), '29');
    assert.equal(sector(pratique, programme, code, friday, 1200), '30');
    assert.equal(sector(pratique, programme, code, holiday, 479), '42');
    assert.equal(sector(pratique, programme, code, holiday, 480), '31');
  }
});

test('GMF operating activities always use sector zero, while 043 uses the existing daytime-only exception', () => {
  for (const code of ['072101', '72101']) for (const date of [monday, friday, holiday]) for (const minute of [0, 600, 1200, 1380]) {
    assert.equal(sector('Cabinet', '', code, date, minute), '0');
  }
  for (const [pratique, programme, code, evening, weekend] of [
    ['CHSLD', '', '101043', '29', '31'],
    ['CLSC', 'Santé mentale (276)', '276043', '24', '27'],
    ['GMF-U', 'Médecin enseignant (EP 42)', '51043', '24', '27'],
    ['Soins palliatifs', '', '53043', '29', '31'],
    ['Courte durée', 'URFI (102)', '102043', '29', '31'],
    ['Courte durée', 'Toxicomanie (31)', '31043', '29', '31'],
    ['Réadaptation', 'Déficience physique (100)', '100043', '29', '31'],
  ]) {
    assert.equal(sector(pratique, programme, code, monday, 600), '0');
    assert.equal(sector(pratique, programme, code, monday, 1200), evening);
    assert.equal(sector(pratique, programme, code, holiday, 600), weekend);
  }
  assert.deepEqual(populatedSlots([log({ activite: '263043', startTime: '17:45', endTime: '18:15' })]).map(s => [s.secteur, s.heures]), [['0', 0.25], ['23', 0.25]]);
});

test('a single period splits at 18:00 and 20:00 without dropping minutes', () => {
  const slots = populatedSlots([log({ startTime: '17:45', endTime: '20:15' })]);
  assert.deepEqual(slots.map(s => [s.secteur, s.heures]), [['1', 0.25], ['23', 2], ['24', 0.25]]);
  assert.equal(buildDemandes([log({ startTime: '17:45', endTime: '20:15' })])[0].totalDemandeHeures, 2.5);
});

test('same code and sector aggregate; different programme sectors stay separate', () => {
  const slots = populatedSlots([
    log({ pratique: 'Courte durée', programme: 'Gériatrie (101)', activite: '101030', startTime: '08:00', endTime: '09:00' }),
    log({ pratique: 'Courte durée', programme: 'Gériatrie (101)', activite: '101030', startTime: '09:00', endTime: '10:00' }),
    log({ pratique: 'Courte durée', programme: 'Psychiatrie (27)', activite: '27030', startTime: '10:00', endTime: '11:00' }),
  ]);
  assert.deepEqual(slots.map(s => [s.code, s.secteur, s.heures]), [['101030', '2', 2], ['27030', '8', 1]]);
});

test('overnight Saturday hours move to Sunday and a new request week', () => {
  const demands = buildDemandes([log({ date: saturday, pratique: 'Courte durée', programme: 'URFI (102)', activite: '102030', startTime: '23:00', endTime: '02:00' })]);
  assert.equal(demands.length, 2);
  assert.deepEqual(demands.map(d => [d.startDateStr, d.totalDemandeHeures]), [['2026-09-13', 1], ['2026-09-20', 2]]);
  assert.deepEqual(demands.map(d => [d.rows[0].dateStr, d.rows[0].slots[0].secteur]), [[saturday, '31'], ['2026-09-20', '42']]);
});

test('crossing midnight uses the new day for the holiday sector', () => {
  const segments = splitLogIntoBillingSegments(log({ date: '2026-06-23', pratique: 'Réadaptation', programme: 'Déficience physique (100)', activite: '100030', startTime: '23:45', endTime: '08:15' }));
  assert.deepEqual(segments.map(s => [s.date, s.secteur, s.minutes]), [['2026-06-23', '29', 15], ['2026-06-24', '42', 480], ['2026-06-24', '31', 15]]);
  assert.equal(buildDemandes([log({ startTime: '08:00', endTime: '24:00' })])[0].totalDemandeHeures, 16);
  assert.deepEqual(splitLogIntoBillingSegments(log({ startTime: '08:00', endTime: '08:00' })), []);
});

test('undocumented periods retain their hours and report the exact missing sector interval', () => {
  const demande = buildDemandes([log({ startTime: '21:30', endTime: '23:15' })])[0];
  assert.equal(demande.totalDemandeHeures, 1.75);
  assert.deepEqual(demande.sectorIssues, [{ date: monday, startTime: '22:00', endTime: '23:15', code: '263030', programme: 'Toxicomanie (263)' }]);
  assert.deepEqual(populatedSlots([log({ startTime: '21:30', endTime: '23:15' })]).map(s => [s.secteur, s.heures]), [['24', 0.5], ['', 1.25]]);
  assert.equal(sector('CLSC', 'Itinérance (264)', '263030', monday, 600), '', 'invalid programme/activity pairing cannot get a plausible sector');
});

test('more than three activities in one plage create numbered continuation rows', () => {
  const codes = ['263030', '263031', '263032', '263055'];
  const demande = buildDemandes(codes.map((activite, i) => log({ activite, startTime: `${8 + i}:00`, endTime: `${9 + i}:00` })))[0];
  assert.equal(demande.rows.length, 2);
  assert.deepEqual(demande.rows.flatMap(r => r.slots.map(s => s.slotNum)), [1, 2, 3, 4, 5, 6]);
  assert.equal(demande.totalDemandeHeures, 4);
});
