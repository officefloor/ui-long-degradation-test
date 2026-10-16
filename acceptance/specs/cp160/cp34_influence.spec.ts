import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// average of patrons' effective, rounded to the nearest (a half rounds up).
//   Kai: momentum 10 + backing 12+60 = 82 effective ; clout (133+60)/2 = 96.5 -> 97 ;
//   influence 82 + 97 = 179

// The anchor is 2026-03-01. Uma's beta becomes 30 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('influence', () => {
  test('influence is effective plus clout', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
  ],
  history: [{ personId: 1, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-influence')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-influence')).toHaveText('60');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('233');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('179');

    // as of 2026-04-01 Uma's change counts: Uma 150, Dana effective 33+150 = 183, clout 150, influence 333
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('333');
  });
});
