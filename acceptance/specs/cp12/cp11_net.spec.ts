import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp12 (mutates cp11). net = momentum + backing, where backing is now the
// SUM of all patrons' thrust (0 when the person has no patrons).
test.describe('net', () => {
  test('net is momentum plus summed backing (0 when no patron)', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // momentum 33
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // momentum 8
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // momentum 100
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, // Dana backing 14+100=114 -> net 147
        { personId: 3, patronId: 2 },                               // Uma  backing 14         -> net 114
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-net')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-net')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-net')).toHaveText('114');
  });
});
