import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// follows. max thrum is still Dot.
//   thrum: Ada 15+66=81, Ben 0-4=-4, Dot 200+200=400
//   spool: Ada 81-48=33, Ben -4-(-3)=-1, Dot 400-200=200

test.describe('thrum coefficient raised to 2', () => {
  test('thrum = scaled + 2*torque; spool follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrum')).toHaveText('81');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-thrum')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-thrum')).toHaveText('400');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-spool')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-spool')).toHaveText('-1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-spool')).toHaveText('200');
  });
});
