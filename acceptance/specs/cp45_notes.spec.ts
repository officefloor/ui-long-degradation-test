import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// notes: several per person, each with a whole-number score. Seeded as `notes: [{ personId, score }]`.
// person-notes lists the scores sorted ascending; concept-note-sum is their total (0 when none).
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
  ],
  notes: [
    { personId: 1, score: 10 }, { personId: 1, score: 20 }, { personId: 1, score: 30 }, // sum 60
    { personId: 2, score: 5 },                                                           // sum 5
  ],
};

test.describe('notes', () => {
  test('shows notes and their total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-notes')).toHaveText('10, 20, 30');
    await expect(page.getByTestId('person-row-2').getByTestId('person-notes')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('person-notes')).toHaveText('');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-note-sum')).toHaveText('60');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-note-sum')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-note-sum')).toHaveText('0');
  });
});
