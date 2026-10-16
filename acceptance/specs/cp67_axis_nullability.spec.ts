import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A concept shows 'n/a' when a number it needs is missing. force needs delta and epsilon; sway needs
// zeta and delta; torque needs force and sway; phase needs torque; blend needs momentum and torque.
test.describe('axis nullability', () => {
  test('missing second-axis value makes the concepts that need it n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: 4,    zeta: 10 },  // force 12, sway 7, torque 33, blend 48
        { id: 2, name: 'Nod', alpha: 2, beta: 3, gamma: 5, delta: null, epsilon: 4,    zeta: 10 },  // all five n/a
        { id: 3, name: 'Pae', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: null, zeta: 10 },  // sway 7, the rest n/a
        { id: 4, name: 'Rio', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: 4,    zeta: null },// force 12, the rest n/a
      ],
    });
    await page.goto('/');

    const expected: Record<number, Record<string, string>> = {
      1: { force: '12',  sway: '7',   torque: '33',  phase: 'RUN', blend: '48' },
      2: { force: 'n/a', sway: 'n/a', torque: 'n/a', phase: 'n/a', blend: 'n/a' },
      3: { force: 'n/a', sway: '7',   torque: 'n/a', phase: 'n/a', blend: 'n/a' },
      4: { force: '12',  sway: 'n/a', torque: 'n/a', phase: 'n/a', blend: 'n/a' },
    };
    for (const [id, concepts] of Object.entries(expected)) {
      for (const [concept, value] of Object.entries(concepts)) {
        await expect(page.getByTestId(`person-row-${id}`).getByTestId(`concept-${concept}`)).toHaveText(value);
      }
    }
  });
});
