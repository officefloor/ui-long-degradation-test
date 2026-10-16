import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top flow is still Dot.
//   flow: Ada 81+179=260, Ben -4-4=-8, Dot 1000+997=1997
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela momentum 1, torque 7, blend 8 (L1, lift 8), pivot 7*2 = 14 -> yield 22 ; no patrons or
//   follows, so charge 22 and flow 22 + 22 = 44, counted at 44/2 = 22
// Sol is shared from sheet S9 as row 8: counted here like anyone.
//   Sol momentum 10, torque 10, pivot 10, blend 20 (L1, lift 20) -> yield 30 ; no patrons ->
//   charge 30, flow 60
//   grand 260+0+1997+22+60 = 2339 (Ben's -8 counts as zero in a sheet-wide total)
// The numbers above are as of the anchor (2026-03-01). Ada's beta change dated 2026-04-01 does not
// count yet. Dot's beta was 10 until 2026-02-01, so as of 2026-01-15:
//   Dot momentum 50, torque 100, pivot 400, blend 150 (L3, lift 450) -> yield 850 ;
//   vector -3 -> charge 847 ; flow 850+847 = 1697

test.describe('flow drops tide', () => {
  test('flow = yield + charge; grand follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true }, // beta 20 from 2026-02-01
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 7, zeta: 1, kind: 'B', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
  // Dot's beta became 20 on 2026-02-01, before the anchor, so it counts now
  // Ada's beta change dated after the anchor does not count yet
  history: [
    { personId: 3, field: 'beta', value: 20, from: '2026-02-01' },
    { personId: 1, field: 'beta', value: 9,  from: '2026-04-01' },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('260');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('-8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1997');

    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('2339');

    // as of 2026-01-15 Dot's beta was still 10
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1697');
  });
});
