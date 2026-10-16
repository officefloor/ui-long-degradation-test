import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Clout is the average of a person's patrons' effective: their total divided by the number of
// patrons, rounded down. A person with no patrons has clout 0. Influence adds clout to effective,
// so with two patrons Kai's influence falls below Dana's and Dana leads.
//   clout: Uma 0, Ivo 0, Dana 100/1=100, Kai (133+60)/2=96 (193/2=96.5 -> 96)
//   influence: Uma 100, Ivo 60, Dana 233, Kai 82+96=178
//   top influence: Dana (233) now beats Kai (178)

test.describe('clout as average', () => {
  test('clout averages patrons effective and the leader flips', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
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
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-clout')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-clout')).toHaveText('96');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('233');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('178');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Dana');
  });
});
