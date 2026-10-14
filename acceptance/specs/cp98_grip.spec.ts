import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grip = yield - coil.
//   coil = gust - momentum, gust = reach + 2*torque:
//     Ada reach 30, gust 30+66=96, coil 96-15=81
//     Ben reach -3, gust -3-4=-7, coil -7-(-1)=-6
//     Dot reach 100, gust 100+200=300, coil 300-100=200
//   yield: 114, -6, 1100 -> grip: 33, 0, 900

test.describe('grip', () => {
  test('grip is yield minus coil', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-grip')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-grip')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-grip')).toHaveText('900');
  });
});
