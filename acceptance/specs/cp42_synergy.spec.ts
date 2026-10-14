import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// synergy = total of the thrust of all a person's allies. No allies -> 0.
//   thrust: Dana 12, Ravi 14, Uma 100
//   Dana allies Ravi,Uma -> 114; Ravi allies Dana -> 12; Uma allies Dana -> 12

test.describe('synergy', () => {
  test('synergy sums the allies thrust', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
  ],
  allies: [
    { a: 1, b: 2 },
    { a: 1, b: 3 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-synergy')).toHaveText('114');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-synergy')).toHaveText('12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-synergy')).toHaveText('12');
  });
});
