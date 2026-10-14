import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// spool = thrum - blend.
//   thrum: Ada 48, Ben -2, Dot 300 ; blend (momentum+torque): Ada 48, Ben -3, Dot 200
//   spool: Ada 0, Ben 1, Dot 100

test.describe('spool', () => {
  test('spool is thrum minus blend', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-spool')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-spool')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-spool')).toHaveText('100');
  });
});
