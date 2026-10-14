import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';


test.describe('allies', () => {
  test('allies are the followed people and counted', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 1 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-allies')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-2').getByTestId('person-allies')).toHaveText('');
    await expect(page.getByTestId('person-row-3').getByTestId('person-allies')).toHaveText('Dana');

    await expect(page.getByTestId('person-row-1').getByTestId('person-ally-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-ally-count')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('person-ally-count')).toHaveText('1');
  });
});
