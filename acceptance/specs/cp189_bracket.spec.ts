import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('bracket', () => {
  test('assigns a quartile', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 2400 (thrust 600, drift 0, band A x4). The others' quartiles do not
    // depend on her.
    // the sheet's own band D multiplier is 4: Eli 80*4 = 320 and Fin 60*4 = 240
    await resetAndSeed({
      settings: { bandMultipliers: { D: 4 } },
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bracket')).toHaveText('Q4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bracket')).toHaveText('Q3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bracket')).toHaveText('Q3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bracket')).toHaveText('Q2');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-bracket')).toHaveText('Q2');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-bracket')).toHaveText('Q2');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-bracket')).toHaveText('Q1');
  });
});
