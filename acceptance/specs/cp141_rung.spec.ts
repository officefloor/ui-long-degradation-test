import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// rung
test.describe('rung', () => {
  test('rung is a within-group percentile', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      // rung = (size - within-group rank) / (size - 1) * 100, rank 1 = top. A group of one is 100.
      groups: [{ id: 1, name: 'North', state: 'REVIEW' }, { id: 2, name: 'South', state: 'REVIEW' }, { id: 3, name: 'East', state: 'REVIEW' }, { id: 4, name: 'West', state: 'REVIEW' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'REVIEW' },
        { id: 7, name: 'Gus', alpha: 3, beta: 7, gamma: 3, active: true, state: 'REVIEW' }, // alone in West -> 100
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }, { personId: 7, groupId: 4 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rung')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rung')).toHaveText('100');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rung')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rung')).toHaveText('0');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rung')).toHaveText('100');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-rung')).toHaveText('0');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-rung')).toHaveText('100');
  });
});
