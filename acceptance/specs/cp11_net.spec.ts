import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// net = momentum + backing, treating backing as 0 when the person has no patron.
test.describe('net', () => {
  test('net is momentum plus backing (0 when no patron)', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, patronId: 2 }, // momentum 33, backing 14 -> net 47
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  patronId: null }, // momentum 8, no patron -> net 8
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  patronId: 2 }, // momentum 100, backing 14 -> net 114
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-net')).toHaveText('47');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-net')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-net')).toHaveText('114');
  });
});
