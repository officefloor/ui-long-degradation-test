import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// If any of delta, epsilon, zeta is missing, then force, sway, torque, phase and blend all show n/a.
test.describe('axis nullability', () => {
  test('missing second-axis value makes dependents n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: 4, zeta: 10 }, // force 12, blend 48
        { id: 2, name: 'Nod', alpha: 2, beta: 3, gamma: 5, delta: null, epsilon: 4, zeta: 10 }, // all n/a
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-force')).toHaveText('12');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-blend')).toHaveText('48');

    for (const concept of ['force', 'sway', 'torque', 'phase', 'blend']) {
      await expect(page.getByTestId('person-row-2').getByTestId(`concept-${concept}`)).toHaveText('n/a');
    }
  });
});
