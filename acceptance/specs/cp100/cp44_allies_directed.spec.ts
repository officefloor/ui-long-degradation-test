import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// to `follows: [{ from, to }]` (allies[] is gone). A person's allies are now only the people they
// follow. synergy totals the thrust of the people they follow and of the people who follow them,
// each person once; combined follows.
//   follows: Dana->Ravi, Dana->Uma, Uma->Dana
//   allies(followed): Dana [Ravi,Uma], Ravi [], Uma [Dana]
//   synergy: Dana (Ravi, Uma) 14+100=114, Ravi (followed by Dana) 12, Uma (Dana, once) 12
//   combined(influence=momentum): Dana 33+114=147, Ravi 8+12=20, Uma 100+12=112

test.describe('directed allies', () => {
  test('allies are the followed people', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, // Dana follows Ravi, Uma
    { from: 3, to: 1 },                     // Uma follows Dana
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-allies')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-2').getByTestId('person-allies')).toHaveText('');
    await expect(page.getByTestId('person-row-3').getByTestId('person-allies')).toHaveText('Dana');

    await expect(page.getByTestId('person-row-1').getByTestId('person-ally-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-ally-count')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('person-ally-count')).toHaveText('1');
  });

  test('synergy and combined count the followed people and the followers', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    // Hela is on hold: she counts in nobody's synergy, so Ravi's stays 12
    { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, hold: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, // Dana follows Ravi, Uma
    { from: 3, to: 1 },                     // Uma follows Dana
    { from: 9, to: 2 },                     // Hela follows Ravi
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-synergy')).toHaveText('114');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-synergy')).toHaveText('12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-synergy')).toHaveText('12');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('20');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-combined')).toHaveText('112');
  });
});
