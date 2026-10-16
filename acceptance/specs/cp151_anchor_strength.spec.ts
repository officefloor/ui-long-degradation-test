import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// anchor strength
// The anchor is 2026-03-01. Eli's beta becomes 40 from 2026-04-01: a change dated after the anchor
// does not count yet, so Eli is still 10*30 = 300.
test.describe('anchor strength', () => {
  test('the home group\'s strength', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      groups: [{ id: 1, name: 'North', state: 'REVIEW' }, { id: 2, name: 'South', state: 'REVIEW' }, { id: 3, name: 'East', state: 'REVIEW' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'REVIEW' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
      history: [{ personId: 5, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-anchor-strength')).toHaveText('220');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-anchor-strength')).toHaveText('220');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-anchor-strength')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-anchor-strength')).toHaveText('100');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-anchor-strength')).toHaveText('330');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-anchor-strength')).toHaveText('330');

    // as of 2026-04-01 the change counts: Eli 10*40 = 400, East 400 + 30 = 430
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-5').getByTestId('concept-anchor-strength')).toHaveText('430');
  });
});
