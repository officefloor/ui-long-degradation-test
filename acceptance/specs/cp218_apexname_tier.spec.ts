import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by tier', () => {
  test('top name per tier', { tag: '@functionality' }, async ({ page }) => {
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
    await expect(page.getByTestId('apexname-tier-SURGE')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-tier-STEADY')).toHaveText('Dot');
    await expect(page.getByTestId('apexname-tier-SINK')).toHaveText('Gwe');
  });

  // Per-tier apex tie-break: Bob and Cat tie at the top value (scaled 2000); all three are SURGE
  // (momentum >= 200), so the SURGE apex is the alphabetically-first of the tied pair (Bob).
  // Ace is SURGE too (momentum 300) but lower (scaled 900).
  test('tier apex tie-break picks the alphabetically-first name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 (SURGE) -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 (SURGE) -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 (SURGE) -> band A x4 -> scaled 2000
      ],
    });
    await page.goto('/');
    // SURGE by value desc, ties by name asc: Bob(2000), Cat(2000), Ace(900) -> apex Bob
    await expect(page.getByTestId('apexname-tier-SURGE')).toHaveText('Bob');
  });
});
