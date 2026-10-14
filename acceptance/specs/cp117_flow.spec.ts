import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// flow = yield + charge + tide (the Act II grand fusion).
//   yield (pivot + 2*lift): Ada 66+96=162, Ben -6+0=-6, Dot 500+1200=1700
//   vector (avg patrons' blend): Ada 98, Ben 0, Dot -3 ; charge = vector + yield: 260, -6, 1697
//   tide (positive followed brace; braces Ada39 Ben19 Dot300): Ada 19+300=319, Ben 0, Dot 19
//   flow: Ada 162+260+319=741, Ben -6-6+0=-12, Dot 1700+1697+19=3416

test.describe('flow', () => {
  test('flow is yield plus charge plus tide', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('741');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('-12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('3416');
  });
});
