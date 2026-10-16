import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// crest = blend + flux; flux = average of the patrons' force, rounded down.
//   blend (momentum + torque): Ada 15+33=48, Ben -1-2=-3, Dot 100+100=200
//   flux: Ada (10+100)/2=55, Ben 0, Dot 10/1=10
//   crest: Ada 48+55=103, Ben -3+0=-3, Dot 200+10=210

test.describe('crest', () => {
  test('crest is blend plus flux', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-crest')).toHaveText('103');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-crest')).toHaveText('-3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-crest')).toHaveText('210');
  });
});
