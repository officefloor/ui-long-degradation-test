import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// flow = yield + charge.
//   yield (pivot + lift): Ada 33+48=81, Ben -4+0=-4, Dot 400+600=1000
// Sol is shared from sheet S9 as row 8, Ben's patron and followed by Ben on this sheet:
//   Sol's blend is momentum 10 + torque 10 = 20, so Ben's vector is 20.
//   charge = vector + yield: Ada 98+81=179, Ben 20-4=16, Dot -3+1000=997
//   flow: Ada 81+179=260, Ben -4+16=12, Dot 1000+997=1997
// Hela is on hold, so she counts towards nobody's patron figures. She is Ada's patron with
//   blend 1 + 9 = 10; counting her would give Ada vector (-3+200+10)/3 = 69, charge 150, flow 231.
// The numbers above are as of the anchor (2026-03-01). Ada's beta change dated 2026-04-01 does not
// count yet. Dot's beta was 10 until 2026-02-01, so as of 2026-01-15:
//   Dot momentum 50, torque 100, pivot 400, blend 150 (L3, lift 450) -> yield 850 ;
//   vector -3 -> charge 847 ; flow 850+847 = 1697


test.describe('flow', () => {
  test('flow is yield plus charge', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true }, // beta 20 from 2026-02-01
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 9,  zeta: 1,  kind: 'A', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 1, patronId: 9 },
    { personId: 2, patronId: 8 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
    { from: 2, to: 8 },
  ],
  // Dot's beta became 20 on 2026-02-01, before the anchor, so it counts now
  // Ada's beta change dated after the anchor does not count yet
  history: [
    { personId: 3, field: 'beta', value: 20, from: '2026-02-01' },
    { personId: 1, field: 'beta', value: 9,  from: '2026-04-01' },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('260');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1997');

    // as of 2026-01-15 Dot's beta was still 10
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1697');
  });
});
