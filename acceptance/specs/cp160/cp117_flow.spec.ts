import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// flow = yield + charge.
//   yield (pivot + lift): Ada 33+48=81, Ben -4+0=-4, Dot 400+600=1000
//   charge = vector + yield: Ada 99+81=180 (vector (-3+200)/2 = 98.5 -> 99), Ben 20-4=16,
//     Dot -3+1000=997
//   flow: Ada 81+180=261, Ben -4+16=12, Dot 1000+997=1997
// Sol is shared from sheet S9 as row 8, Ben's patron and followed by Ben on this sheet:
//   Sol's blend is momentum 10 + torque 10 = 20, so Ben's vector is 20.


// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
// Hela is on hold, so she counts towards nobody's patron figures. She is Ada's patron with blend
// 1 + 9 = 10; counting her would give Ada vector (-3+200+10)/3 = 69, charge 150, flow 231.
test.describe('flow', () => {
  test('flow is yield plus charge', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
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
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
    { from: 2, to: 8 },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('261');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1997');

    // as of 2026-04-01 Dot's change counts: Dot blend 105 + 100 = 205, Ada vector (-3+205)/2 = 101,
    // charge 101 + 81 = 182, flow 81 + 182 = 263
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('263');
  });
});
