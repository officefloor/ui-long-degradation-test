import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex and runner-up', () => {
  test('names the top two people', { tag: '@functionality' }, async ({ page }) => {
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
    await expect(page.getByTestId('rollup-apexname')).toHaveText('Ada');
    await expect(page.getByTestId('rollup-runnerup')).toHaveText('Ben');
  });

  // Apex tie-break: Bob and Cat tie at the top value (scaled 2000); the name first alphabetically
  // (Bob) is the apex, the other (Cat) the runner-up. Ace is lower (scaled 900) and never apex
  // despite sorting first by name, proving value wins before the name tie-break is applied.
  test('apex tie-break picks the alphabetically-first name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // thrust 300, drift 0, momentum 300 -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // thrust 500, drift 0, momentum 500 -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // thrust 500, drift 0, momentum 500 -> band A x4 -> scaled 2000
      ],
    });
    await page.goto('/');
    // sorted by value desc, ties by name asc: Bob(2000), Cat(2000), Ace(900)
    await expect(page.getByTestId('rollup-apexname')).toHaveText('Bob');
    await expect(page.getByTestId('rollup-runnerup')).toHaveText('Cat');
  });
});
