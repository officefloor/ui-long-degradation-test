import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

test.describe('ledger by bracket', () => {
  test('sums momentum per quartile', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await expect(page.getByTestId('bracket-ledger-Q4')).toHaveText('800');
    await expect(page.getByTestId('bracket-ledger-Q3')).toHaveText('320');
    await expect(page.getByTestId('bracket-ledger-Q2')).toHaveText('140');
    await expect(page.getByTestId('bracket-ledger-Q1')).toHaveText('-10');
  });
});
