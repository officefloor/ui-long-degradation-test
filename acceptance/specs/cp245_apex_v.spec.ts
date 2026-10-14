import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// apex (sheet) = name of the person with the highest scaled (ties by name asc). Cam has scaled 900.

test.describe('apex by scaled', () => {
  test('names the highest-scaled person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45
  ],
});
    await page.goto('/');
    await expect(page.getByTestId('rollup-apex-v')).toHaveText('Cam');
  });
});
