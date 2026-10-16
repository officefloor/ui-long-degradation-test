import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (0 if none). crest = blend + flux follows. top crest is still Dot.
//   flux: Ada (10+100)/2=55, Ben 0, Dot 10/1=10
//   crest: Ada 48+55=103, Ben -3, Dot 200+10=210
//   Rix patrons Ada/Ben/Dot/Sol force 12/10/100/16 -> flux (12+10+100+16)/4 = 138/4 = 34.5 -> nearest 35

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol (force 2*8 = 16) is also Rix's patron.
// The anchor is 2026-03-01. Ada's beta becomes 5 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('flux as average', () => {
  test('flux averages patrons force; crest follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
    { id: 4, name: 'Rix', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 1,  zeta: 1 },
    // Hela is on hold: she counts in nobody's patron figures, so Rix's flux leaves out her force 50
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 5, epsilon: 10, zeta: 5, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 4, patronId: 1 }, { personId: 4, patronId: 2 }, { personId: 4, patronId: 3 }, { personId: 4, patronId: 9 }, { personId: 4, patronId: 8 },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 2, epsilon: 8, zeta: 2 }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 1, field: 'beta', value: 5, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flux')).toHaveText('55');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flux')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flux')).toHaveText('10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-flux')).toHaveText('35');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-crest')).toHaveText('103');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-crest')).toHaveText('-3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-crest')).toHaveText('210');
  });
});
