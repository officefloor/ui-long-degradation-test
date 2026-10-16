import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grip = yield - coil.
//   coil = gust - momentum, gust = reach + 2*torque, reach uses this sheet's own multipliers
//   N=4, S=5, else=2:
//     Ada reach 15*4=60, gust 60+66=126, coil 126-15=111
//     Ben reach -1*5=-5, gust -5-4=-9, coil -9-(-1)=-8
//     Dot reach 100*2=200, gust 200+200=400, coil 400-100=300
//   yield: 114, -6, 1100 -> grip: 114-111=3, -6-(-8)=2, 1100-300=800

test.describe('grip', () => {
  test('grip is yield minus coil', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
  ],
  // this sheet has its own region multipliers: N 4, S 5, any other region 2
  settings: { regionMultipliers: { N: 4, S: 5, other: 2 } },
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-grip')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-grip')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-grip')).toHaveText('800');
  });
});
