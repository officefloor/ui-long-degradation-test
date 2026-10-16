import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// vector = total of the blend of a person's patrons (0 if none).
//   blend: Ada 48, Ben -3, Dot 200, Sol 20 ; patrons: Ada <- Ben,Dot,Sol ; Dot <- Ben ; Ben none
//   vector: Ada -3+200+20=217, Ben 0, Dot -3
// Hela is on hold, so she does not count towards anyone else's figures: she is Ada's patron
// but is left out of Ada's vector (Hela's blend is 1 + 9 = 10).

test.describe('vector', () => {
  test('vector sums the patrons blend', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1, epsilon: 9,  zeta: 1,  kind: 'A', region: 'E9', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 1, patronId: 9 },
    { personId: 1, patronId: 8 },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'E9' },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone (blend 10 + 10 = 20)
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', region: 'E1', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-vector')).toHaveText('217');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-vector')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-vector')).toHaveText('-3');
  });
});
