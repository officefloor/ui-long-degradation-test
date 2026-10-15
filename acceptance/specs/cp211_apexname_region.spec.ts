import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by region', () => {
  test('top name per region', { tag: '@functionality' }, async ({ page }) => {
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
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N1' },
        { personId: 3, region: 'S2' },
        { personId: 4, region: 'S2' },
        { personId: 5, region: 'E3' },
        { personId: 6, region: 'E3' },
        { personId: 7, region: 'E3' },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('apexname-region-N1')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-region-S2')).toHaveText('Cam');
    await expect(page.getByTestId('apexname-region-E3')).toHaveText('Eli');
  });

  // Per-region apex tie-break: within region N1, Bob and Cat tie at the top value (scaled 2000);
  // the alphabetically-first name (Bob) is the region's apex. Ace is in N1 but lower (scaled 900).
  test('region apex tie-break picks the alphabetically-first name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
      ],
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N1' },
        { personId: 3, region: 'N1' },
      ],
    });
    await page.goto('/');
    // N1 by value desc, ties by name asc: Bob(2000), Cat(2000), Ace(900) -> apex Bob
    await expect(page.getByTestId('apexname-region-N1')).toHaveText('Bob');
  });
});
