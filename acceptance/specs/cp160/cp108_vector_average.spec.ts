import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// charge = vector + yield follows. top charge is still Dot.
//   vector (to the nearest, a half rounding up): Ada (−3+200)/2 = 98.5 -> 99, Ben 0, Dot (-3+16)/2 = 6.5 -> 7
//   yield (pivot + lift): Ada 81, Ben -4, Dot 1000
//   charge: Ada 99+81=180, Ben -4, Dot 7+1000=1007
// Hela is on hold, so she does not count towards anyone else's figures: she is Ada's patron
// but is left out of Ada's vector (Hela's blend is 1 + 9 = 10).
//   so Ada averages over two patrons, not three.

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol (blend 10 + 6 = 16) is also Dot's patron.
// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('vector as average', () => {
  test('vector averages patrons blend; charge follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 9,  zeta: 1,  kind: 'A', region: 'E9', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 }, { personId: 3, patronId: 8 },
    { personId: 1, patronId: 9 },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'E9' },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 6, zeta: 1, kind: 'B', active: true }], regions: [{ personId: 1, region: 'E7' }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-vector')).toHaveText('99');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-vector')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-vector')).toHaveText('7');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-charge')).toHaveText('180');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-charge')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-charge')).toHaveText('1007');
  });
});
