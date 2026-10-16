import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// fathom is now never more than 500: a person whose norm is further than 500 from the middle shows 500.
// norm: Ada -251, Ben -71, Cam 589, Dot -266 -> fathom 251, 71, 500 (capped from 589), 266.
// cascade reads fathom, so Cam's cascade moves: 500 + 900 = 1400. peak fathom over the counted = 500.

test.describe('fathom capped at 500', () => {
  test('caps a large fathom and the cascade that reads it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // fathom 251
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // fathom 71
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // fathom 589 -> 500; cascade 1400
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // fathom 266
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-fathom')).toHaveText('500');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-fathom')).toHaveText('251');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-cascade')).toHaveText('1400');

    await expect(page.getByTestId('rollup-fathom-peak')).toHaveText('500');
  });
});
