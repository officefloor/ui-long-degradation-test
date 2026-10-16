import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total blend: everyone's blend added together, leaving out anyone whose blend cannot be worked out.
// blend = momentum + torque.
//   Ada momentum 15, torque 33  -> blend 48
//   Ben momentum -1, torque -2  -> blend -3
//   Dot momentum 100, torque 100 -> blend 200
//   Gap has no delta -> blend n/a, left out
//   Hela momentum 1, torque 4+3*(6-4) = 10 -> blend 11
// Hela is on hold: in a sheet-wide total a person on hold counts at half, rounded to the nearest
// (a half rounds up), so her 11 counts as 5.5 -> 6. In a sheet-wide total a negative value counts
// as zero, so Ben's -3 counts as 0.
//   total blend = 48 + 0 + 200 + 15 (Sol) + 6 = 269

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol's blend is momentum 10 + torque 5 = 15.
// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('total blend', () => {
  test('total blend sums blend, skipping n/a and honouring the hold', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada',  alpha: 2, beta: 3,  gamma: 5, delta: 3,    epsilon: 4,  zeta: 10, active: true },
        { id: 2, name: 'Ben',  alpha: 4, beta: 2,  gamma: 1, delta: 5,    epsilon: 2,  zeta: 1,  active: true },
        { id: 3, name: 'Dot',  alpha: 5, beta: 20, gamma: 5, delta: 5,    epsilon: 20, zeta: 5,  active: true },
        { id: 4, name: 'Gap',  alpha: 3, beta: 3,  gamma: 3, delta: null, epsilon: 2,  zeta: 2,  active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 4,    epsilon: 1,  zeta: 6,  active: true, hold: true },
      ],
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 5, zeta: 1, active: true }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-blend')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-blend')).toHaveText('11');
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('269');
  });
});
