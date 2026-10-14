import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp12 (mutates cp09). Patron is now many-to-many: seed uses a `patrons`
// join list and the patrons cell lists every patron name sorted ascending.
test.describe('patron', () => {
  test('shows each person their patron by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, // Dana <- Ravi, Uma
        { personId: 3, patronId: 2 },                               // Uma  <- Ravi
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-patrons')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-3').getByTestId('person-patrons')).toHaveText('Ravi');
    await expect(page.getByTestId('person-row-2').getByTestId('person-patrons')).toHaveText('');
  });
});
