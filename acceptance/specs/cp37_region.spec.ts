import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// region is a short code on each person, shown at `person-region`.
test.describe('region', () => {
  test('shows each person their region', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, region: 'N1' },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  region: 'S2' },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  region: 'E5' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-region')).toHaveText('N1');
    await expect(page.getByTestId('person-row-2').getByTestId('person-region')).toHaveText('S2');
    await expect(page.getByTestId('person-row-3').getByTestId('person-region')).toHaveText('E5');
  });
});
