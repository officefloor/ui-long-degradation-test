import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// fathom = the size of a person's norm, ignoring its sign (the absolute value of norm).
// scaled: Ada 60, Ben 240, Cam 900, Dot 45. Hela is on hold -> left out of the middle and the peak.
// norm = scaled - floor(mean of the counted scaled) = scaled - floor((60+240+900+45)/4) = scaled - 311.
// norm: Ada -251, Ben -71, Cam 589, Dot -266 -> fathom 251, 71, 589, 266.
// peak over the people who count = 589 (Hela's own fathom is 1689 but she is held, so not the peak).

test.describe('fathom, the size of a norm', () => {
  test('shows each person\'s fathom and the peak', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60,  norm -251
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240, norm -71
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900, norm 589
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45,  norm -266
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-fathom')).toHaveText('251');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-fathom')).toHaveText('71');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-fathom')).toHaveText('589');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-fathom')).toHaveText('266');

    await expect(page.getByTestId('rollup-fathom-peak')).toHaveText('589');
  });
});
