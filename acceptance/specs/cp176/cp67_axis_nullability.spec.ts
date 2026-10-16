import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing raw number counts as zero in every concept, so none shows n/a because of it.
// force = delta * epsilon; sway = zeta - delta; torque = force + 3 * sway; phase from torque (EBB below
// 0, RUN 0..199, PEAK 200+); blend = momentum + torque (momentum 6 + 3*3 = 15 for everyone).
test.describe('axis nullability', () => {
  test('a missing second-axis value counts as zero', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: 4,    zeta: 10 },  // force 12, sway 7, torque 33, blend 48
        { id: 2, name: 'Nod', alpha: 2, beta: 3, gamma: 5, delta: null, epsilon: 4,    zeta: 10 },  // force 0, sway 10, torque 30, RUN, blend 45
        { id: 3, name: 'Pae', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: null, zeta: 10 },  // force 0, sway 7, torque 21, RUN, blend 36
        { id: 4, name: 'Rio', alpha: 2, beta: 3, gamma: 5, delta: 3,    epsilon: 4,    zeta: null },// force 12, sway -3, torque 3, RUN, blend 18
      ],
    });
    await page.goto('/');

    const expected: Record<number, Record<string, string>> = {
      1: { force: '12',  sway: '7',   torque: '33',  phase: 'RUN', blend: '48' },
      2: { force: '0',   sway: '10',  torque: '30',  phase: 'RUN', blend: '45' },
      3: { force: '0',   sway: '7',   torque: '21',  phase: 'RUN', blend: '36' },
      4: { force: '12',  sway: '-3',  torque: '3',   phase: 'RUN', blend: '18' },
    };
    for (const [id, concepts] of Object.entries(expected)) {
      for (const [concept, value] of Object.entries(concepts)) {
        await expect(page.getByTestId(`person-row-${id}`).getByTestId(`concept-${concept}`)).toHaveText(value);
      }
    }
  });
});
