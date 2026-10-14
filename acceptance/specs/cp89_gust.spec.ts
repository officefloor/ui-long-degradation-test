import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// gust fuses with the Act I reach: gust = reach + torque. reach = sum over the person's regions of
// momentum * region multiplier (N=2, S=3, else=1).
//   Ada mom15 region N1 -> reach 30; torque 33 -> gust 63
//   Ben mom-1 region S2 -> reach -3; torque -2 -> gust -5
//   Dot mom100 region E5 -> reach 100; torque 100 -> gust 200

test.describe('gust', () => {
  test('gust is reach plus torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-gust')).toHaveText('63');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gust')).toHaveText('-5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-gust')).toHaveText('200');
  });
});
