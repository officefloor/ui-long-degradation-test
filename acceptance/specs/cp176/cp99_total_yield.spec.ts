import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total yield rollup: sum of yields (skip n/a), a negative yield counting as zero.
//   Ada 81, Ben -4 -> 0, Dot 1000
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela momentum 1, torque 7, blend 8 (L1, lift 8), pivot 7*2 = 14 -> yield 22, counts 22/2 = 11
//   Nil has no delta, which counts as 0: torque 3, blend 4 (L1, lift 4), pivot 3 -> yield 7
//   Sol (shared): momentum 1, torque 5, blend 6 (L1, lift 6), pivot 5*1 = 5 -> yield 11
//   total 81 + 0 + 1000 + 7 + 11 + 11 = 1110
//   as of 2026-01-15 Dot's beta is 10: momentum 50, blend 150 (L3, lift 450), pivot 400 -> yield 850,
//   total 1110 - 1000 + 850 = 960

test.describe('total yield', () => {
  test('total yield sums the yields', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone
    // a change dated after the anchor does not count yet (Dot's beta 40 from 2026-04-01); Dot's beta was
    // 10 until it became 20 on 2026-02-01
    await resetAndSeed({
  anchor: '2026-03-01',
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 5, zeta: 1, kind: 'A', active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [
    { personId: 3, field: 'beta', value: 20, from: '2026-02-01' },
    { personId: 3, field: 'beta', value: 40, from: '2026-04-01' },
  ],
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
    // Nil's delta is missing, so it counts as 0 -> yield 7.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, kind: 'A', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 7, zeta: 1, kind: 'B', region: 'E9', active: true, hold: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'E9' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-yield')).toHaveText('7');
    await expect(page.getByTestId('rollup-total-yield')).toHaveText('1110');

    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-total-yield')).toHaveText('960');
  });
});
