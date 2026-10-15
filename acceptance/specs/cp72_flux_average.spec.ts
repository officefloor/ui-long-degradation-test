import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (0 if none). crest = blend + flux follows. top crest is still Dot.
//   flux: Ada (10+100)/2=55, Ben 0, Dot 10/1=10
//   crest: Ada 48+55=103, Ben -3, Dot 200+10=210
//   Rix patrons Ada/Ben/Dot force 12/10/100 -> flux (12+10+100)/3 = 122/3 = 40.67 -> floor 40

test.describe('flux as average', () => {
  test('flux averages patrons force; crest follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
    { id: 4, name: 'Rix', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 1,  zeta: 1 },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 4, patronId: 1 }, { personId: 4, patronId: 2 }, { personId: 4, patronId: 3 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flux')).toHaveText('55');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flux')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flux')).toHaveText('10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-flux')).toHaveText('40');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-crest')).toHaveText('103');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-crest')).toHaveText('-3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-crest')).toHaveText('210');
  });
});
