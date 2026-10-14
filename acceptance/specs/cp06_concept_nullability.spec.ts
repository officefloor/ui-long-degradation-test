import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Nullability: if ANY of alpha, beta, gamma is missing (null) for a person, then thrust, drift,
// momentum and tier all show the literal 'n/a' for that person. A missing raw value is seeded as null.
test.describe('concept nullability', () => {
  test('missing raw value makes the dependent concepts n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Full',    alpha: 3,    beta: 4,    gamma: 10 },  // thrust 12, drift 7, momentum 33, STEADY
        { id: 2, name: 'NoBeta',  alpha: 3,    beta: null, gamma: 10 },  // all four n/a
        { id: 3, name: 'NoGamma', alpha: 3,    beta: 4,    gamma: null },// all four n/a
        { id: 4, name: 'NoAlpha', alpha: null, beta: 4,    gamma: 10 },  // all four n/a
      ],
    });
    await page.goto('/');

    // the complete person computes
    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('12');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('33');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-tier')).toHaveText('STEADY');

    for (const id of [2, 3, 4]) {
      for (const concept of ['thrust', 'drift', 'momentum', 'tier']) {
        await expect(page.getByTestId(`person-row-${id}`).getByTestId(`concept-${concept}`)).toHaveText('n/a');
      }
    }
  });
});
