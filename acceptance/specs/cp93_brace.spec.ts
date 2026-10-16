import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// brace fuses with the Act I influence: brace = influence + force. With no patrons that count, influence
// = effective = momentum (all active).
//   Ada mom15 force12 -> 27 ; Ben mom-1 force10 -> 9 ; Dot mom100 force100 -> 200
// Hela is on hold, so she counts towards nobody's patron figures. She is Ada's patron with thrust 100
//   and effective 100; counting her would give Ada net 15+100=115, clout 100, influence 215, brace 227.

test.describe('brace', () => {
  test('brace is influence plus force', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 1, epsilon: 1, zeta: 1, active: true, hold: true },
  ],
  patrons: [{ personId: 1, patronId: 9 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-brace')).toHaveText('27');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-brace')).toHaveText('9');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-brace')).toHaveText('200');
  });
});
