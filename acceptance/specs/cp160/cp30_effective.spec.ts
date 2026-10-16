import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// effective = net when active, else half of net rounded to the nearest whole number, a half rounding
// up (9/2 = 4.5 -> 5). With no patrons, net = momentum.


// The anchor is 2026-03-01. Uma's beta becomes 30 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('effective', () => {
  test('effective is net when active, else half of net to the nearest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // net 33 -> 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // net 8  -> 4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // net 100 -> 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // net 9  -> 4.5 -> 5
  ],
  history: [{ personId: 3, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-effective')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-effective')).toHaveText('5');

    // as of 2026-04-01 Uma's change counts: 5*30 = 150, active -> 150
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('150');
  });
});
