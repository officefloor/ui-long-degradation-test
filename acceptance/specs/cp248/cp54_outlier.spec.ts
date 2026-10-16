import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 600, band A x4 -> 2400).
//   mean floor = (40 + 60 + 80 + 240 + 900 + 2400) / 6 = 3720 / 6 = 620
//   norms: -580, -560, -540, -380, 280 -> yes, yes, yes, yes, yes

test.describe('outlier', () => {
  test('outlier when the norm magnitude exceeds 100', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true },
    // Hela is on hold: left out of the average and the outlier count; her own norm is 2000 - 620 = 1380 (counted, the mean would be 5720 / 7 = 817 and Jo's norm 83, not an outlier)
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 10, beta: 60, gamma: 10, active: true }, // 2400
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-outlier')).toHaveText('yes');
  });
});
