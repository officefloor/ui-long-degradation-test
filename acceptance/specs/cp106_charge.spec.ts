import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// charge = vector + yield (yield = pivot + lift, patron-independent).
//   yield: Ada 33+48 = 81, Ben -4+0 = -4, Dot 400+600 = 1000 ; vector: Ada 197, Ben 0, Dot -3
//   charge: Ada 197+81 = 278, Ben 20+(-4) = 16, Dot -3+1000 = 997
// Hela is on hold, so she counts towards nobody's patron figures. She is Ada's patron with blend
//   1 + 9 = 10 (momentum 1, torque 9); counting her would give Ada vector 207 and charge 288.
// Sol is shared from sheet S9 as row 8 and is Ben's patron on this sheet: momentum 10 + torque 10
//   = blend 20, so Ben's vector is 20 and his charge 20 + (-4) = 16.

test.describe('charge', () => {
  test('charge is vector plus yield', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 9,  zeta: 1,  kind: 'A', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 1, patronId: 9 },
    { personId: 2, patronId: 8 },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'E9' },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-charge')).toHaveText('278');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-charge')).toHaveText('16');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-charge')).toHaveText('997');
  });
});
