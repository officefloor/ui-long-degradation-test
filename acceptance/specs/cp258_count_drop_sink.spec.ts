import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every count of people now also leaves out a SINK person (one whose momentum is below zero).
// Sid has thrust 10 and drift -10, so momentum = 10 + 3*(-10) = -20 (SINK), and his scaled is 0 (even).
// Even-scaled people: Ada 60, Ben 240, Cam 900 (even) and Sid 0 (even) -> but Sid is a SINK, left out.
// So even-count is 3, not 4. Headcount and active-count drop Sid for the same reason.

test.describe('a SINK person is left out of counts', () => {
  test('counts leave out a person below zero momentum', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // momentum 60, scaled 60
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // momentum 120, scaled 240
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // momentum 300, scaled 900
        { id: 5, name: 'Sid', alpha: 10, beta: 1,  gamma: 0,  active: true }, // momentum -20 (SINK), scaled 0
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-5').getByTestId('concept-tier')).toHaveText('SINK');
    await expect(page.getByTestId('rollup-even-count')).toHaveText('3');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
  });
});
