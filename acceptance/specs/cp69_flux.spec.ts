import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// flux = total of the force of a person's patrons (0 if none). Patrons are the Act I many-to-many.
//   force: Ada 12, Ben 10, Dot 100
//   patrons: Ada <- Ben,Dot ; Dot <- Ben ; Ben none
//   flux: Ada 10+100=110, Ben 0, Dot 10

test.describe('flux', () => {
  test('flux sums the patrons force', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flux')).toHaveText('110');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flux')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flux')).toHaveText('10');
  });
});
