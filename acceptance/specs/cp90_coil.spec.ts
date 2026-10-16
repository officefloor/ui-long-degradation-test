import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// coil = gust - momentum.
//   gust = reach + torque; reach uses this sheet's own multipliers N=4, S=5, else=2
//   gust: Ada 60+33=93, Ben -5-2=-7, Dot 200+100=300 ; momentum: Ada 15, Ben -1, Dot 100
//   coil: Ada 93-15=78, Ben -7-(-1)=-6, Dot 300-100=200

test.describe('coil', () => {
  test('coil is gust minus momentum', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
  // this sheet has its own region multipliers: N 4, S 5, any other region 2
  settings: { regionMultipliers: { N: 4, S: 5, other: 2 } },
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-coil')).toHaveText('78');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-coil')).toHaveText('-6');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-coil')).toHaveText('200');
  });
});
