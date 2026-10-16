import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Nullability: a concept shows the literal 'n/a' when a number it needs is missing (null). thrust needs
// alpha and beta; drift needs gamma and alpha; momentum needs thrust and drift; tier needs momentum.
// A missing raw value is seeded as null.
test.describe('concept nullability', () => {
  test('missing raw value makes the concepts that need it n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Full',    alpha: 3,    beta: 4,    gamma: 10 },  // thrust 12, drift 7, momentum 33, STEADY
        { id: 2, name: 'NoBeta',  alpha: 3,    beta: null, gamma: 10 },  // thrust n/a, drift 7, momentum/tier n/a
        { id: 3, name: 'NoGamma', alpha: 3,    beta: 4,    gamma: null },// thrust 12, drift/momentum/tier n/a
        { id: 4, name: 'NoAlpha', alpha: null, beta: 4,    gamma: 10 },  // all four n/a
      ],
    });
    await page.goto('/');

    const expected: Record<number, Record<string, string>> = {
      1: { thrust: '12',  drift: '7',   momentum: '33',  tier: 'STEADY' },
      2: { thrust: 'n/a', drift: '7',   momentum: 'n/a', tier: 'n/a' },
      3: { thrust: '12',  drift: 'n/a', momentum: 'n/a', tier: 'n/a' },
      4: { thrust: 'n/a', drift: 'n/a', momentum: 'n/a', tier: 'n/a' },
    };
    for (const [id, concepts] of Object.entries(expected)) {
      for (const [concept, value] of Object.entries(concepts)) {
        await expect(page.getByTestId(`person-row-${id}`).getByTestId(`concept-${concept}`)).toHaveText(value);
      }
    }
  });
});
