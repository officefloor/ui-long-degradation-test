import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by bracket', () => {
  test('top name per quartile', { tag: '@functionality' }, async ({ page }) => {
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
    await expect(page.getByTestId('apexname-bracket-Q4')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-bracket-Q3')).toHaveText('Cam');
    await expect(page.getByTestId('apexname-bracket-Q2')).toHaveText('Eli');
    await expect(page.getByTestId('apexname-bracket-Q1')).toHaveText('Gwe');
  });

  // Per-quartile apex tie-break: Bob and Cat tie at the top value (scaled 2000); all three sit in
  // Q4 (value >= 800 under the recalibrated cut-offs), so the Q4 apex is the alphabetically-first
  // of the tied pair (Bob). Ace is Q4 too (scaled 900 >= 800) but lower.
  test('bracket apex tie-break picks the alphabetically-first name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900 -> Q4
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000 -> Q4
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000 -> Q4
      ],
    });
    await page.goto('/');
    // Q4 by value desc, ties by name asc: Bob(2000), Cat(2000), Ace(900) -> apex Bob
    await expect(page.getByTestId('apexname-bracket-Q4')).toHaveText('Bob');
  });
});
