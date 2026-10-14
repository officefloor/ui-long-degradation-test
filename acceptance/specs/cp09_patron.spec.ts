import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// First relationship: a person may have one patron (another person). Seeded as patronId on the
// person (many-to-one). The patron is shown through `person-patrons` (one name here; cp12 will make
// it many). A person with no patron shows an empty patrons cell.
test.describe('patron', () => {
  test('shows each person their patron by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, patronId: 2 },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  patronId: null },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  patronId: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-patrons')).toHaveText('Ravi');
    await expect(page.getByTestId('person-row-3').getByTestId('person-patrons')).toHaveText('Ravi');
    await expect(page.getByTestId('person-row-2').getByTestId('person-patrons')).toHaveText('');
  });
});
