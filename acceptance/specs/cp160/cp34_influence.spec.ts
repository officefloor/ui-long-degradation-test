import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// average of patrons' effective, rounded to the nearest (a half rounds up).
//   Sol is shared from sheet S9 as row 8 and is Ivo's patron on this sheet: Sol's effective 2*5 = 10,
//   so Ivo's effective is 60 + 10 = 70, clout 10, influence 80.
//   Kai: momentum 10 + backing 12+60 = 82 effective ; clout (133+70)/2 = 101.5 -> 102 ;
//   influence 82 + 102 = 184

// The anchor is 2026-03-01. Uma's beta becomes 30 from 2026-04-01: a change dated after the anchor does not count yet.
// Hela is on hold, so she counts towards nobody's patron figures. She is Kai's patron with effective
// 20*20 = 400; counting her would give Kai clout (133+70+400)/3 = 201, not 102.
test.describe('influence', () => {
  test('influence is effective plus clout', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
    { id: 9, name: 'Hela', alpha: 20, beta: 20, gamma: 20, active: true, hold: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
    { personId: 2, patronId: 8 },
    { personId: 4, patronId: 9 },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 1, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-influence')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-influence')).toHaveText('80');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('233');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('184');

    // as of 2026-04-01 Uma's change counts: Uma 150, Dana effective 33+150 = 183, clout 150, influence 333
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('333');
  });
});
