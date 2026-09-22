import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildDemandes } from '../src/utils/buildDemandes';
import { getDefaultActiviteForPratique, getDefaultProgrammeForPratique, getEstablishmentLabel } from '../src/data/billingCatalog';
import { Facnet2Template } from '../src/components/templates/Facnet2Template';
import { Facnet3Template } from '../src/components/templates/Facnet3Template';
import { RamqTemplate } from '../src/components/templates/RamqTemplate';

test('all three request templates render each new practice with its own establishment and activity', () => {
  for (const pratique of ['GMF-U', 'Courte durée', 'Réadaptation']) {
    const programme = getDefaultProgrammeForPratique(pratique);
    const activite = getDefaultActiviteForPratique(pratique, programme);
    const demandes = buildDemandes([{ id: 'test', date: '2026-09-14', startTime: '08:00', endTime: '10:00', pratique, programme, activite }]);
    for (const Template of [Facnet2Template, Facnet3Template, RamqTemplate]) {
      const html = renderToStaticMarkup(<Template demande={demandes[0]} demandeIndex={0} allDemandes={demandes} onSelectDemandeIndex={() => {}} isFr />);
      assert.ok(html.includes(getEstablishmentLabel(pratique)));
      assert.ok(html.includes(activite.split(' ')[0]));
      assert.ok(!html.includes('CHSLD'));
    }
  }
});
