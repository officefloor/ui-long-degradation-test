import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// combined = influence + synergy (influence = momentum here: no patrons, everyone active).
// synergy totals the thrust of the people a person follows AND of the people who follow them,
// each person once (Dana and Uma follow each other, so each counts the other once).
//   thrust: Dana 12, Ravi 14, Uma 100
//   Dana follows Ravi, Uma; followed by Uma -> Ravi, Uma: 14+100 = 114
//   Ravi follows nobody; followed by Dana (and Hela, on hold: she counts in nobody's figures) -> 12
//   Uma follows Dana; followed by Dana -> Dana: 12
//   combined: Dana 33+114 = 147, Ravi 8+12 = 20, Uma 100+12 = 112

test.describe('combined', () => {
  test('combined is influence plus synergy', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, hold: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 1 },
    { from: 9, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('20');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-combined')).toHaveText('112');
  });
});
