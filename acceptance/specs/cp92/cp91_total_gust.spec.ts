import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total gust rollup: sum of gusts (skip n/a), a negative gust counting as zero.
// gust = reach + torque, reach uses this sheet's own multipliers N=4, S=5, else=2.
//   gust: Ada 60+33=93, Ben -5-2=-7, Dot 200+100=300
//   Hela (on hold): momentum 9+3=12, torque 10+3*1=13, region S1 -> reach 60, gust 73, counted as floor(73/2)=36
//   total: 93 + 0 (Ben's -7) + 300 + 36 = 429

test.describe('total gust', () => {
  test('total gust sums the gusts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing -> torque n/a -> gust n/a, so Nil is skipped.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    // Hela is on hold: left out of sheet-wide figures, so the total counts her gust at half, rounded down.
    { id: 9, name: 'Hela', alpha: 3, beta: 3, gamma: 4, delta: 2, epsilon: 5, zeta: 3, active: true, hold: true },
  ],
  // this sheet has its own region multipliers: N 4, S 5, any other region 2
  settings: { regionMultipliers: { N: 4, S: 5, other: 2 } },
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'S1' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-gust')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('429');
  });
});
