import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing raw number (seeded as null) counts as zero in every concept, so none shows n/a because
// of it. thrust = alpha * beta; drift = gamma - alpha; momentum = thrust + 3 * drift; tier from
// momentum (SINK below 0, STEADY 0..199, SURGE 200+).
test.describe('concept nullability', () => {
  test('a missing raw value counts as zero in the concepts', { tag: '@functionality' }, async ({ page }) => {
    // a change dated after the anchor does not count yet (Full's beta 9 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [{ personId: 1, field: 'beta', value: 9, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Full',    alpha: 3,    beta: 4,    gamma: 10 },  // thrust 12, drift 7, momentum 33, STEADY
        { id: 2, name: 'NoBeta',  alpha: 3,    beta: null, gamma: 10 },  // thrust 3*0 = 0, drift 7, momentum 0+21 = 21, STEADY
        { id: 3, name: 'NoGamma', alpha: 3,    beta: 4,    gamma: null },// thrust 12, drift 0-3 = -3, momentum 12-9 = 3, STEADY
        { id: 4, name: 'NoAlpha', alpha: null, beta: 4,    gamma: 10 },  // thrust 0, drift 10, momentum 30, STEADY
      ],
    });
    await page.goto('/');

    const expected: Record<number, Record<string, string>> = {
      1: { thrust: '12',  drift: '7',   momentum: '33',  tier: 'STEADY' },
      2: { thrust: '0',   drift: '7',   momentum: '21',  tier: 'STEADY' },
      3: { thrust: '12',  drift: '-3',  momentum: '3',   tier: 'STEADY' },
      4: { thrust: '0',   drift: '10',  momentum: '30',  tier: 'STEADY' },
    };
    for (const [id, concepts] of Object.entries(expected)) {
      for (const [concept, value] of Object.entries(concepts)) {
        await expect(page.getByTestId(`person-row-${id}`).getByTestId(`concept-${concept}`)).toHaveText(value);
      }
    }
  });
});
