import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Reach span is the person's home group's strength plus its cohesion. Every member is FINAL (a DRAFT
// member would be left out of the group's figures). Members' effective values: Ann 100, Bea 120,
// Cal 60, Dot 40, Eli 300, Fia 30.
//   North (Ann, Bea): strength 220, cohesion 220 / 2 = 110 -> 220 + 110 = 330
//   South (Cal, Dot): strength 100, cohesion 50 -> 150
//   East  (Eli, Fia): strength 330, cohesion 165 -> 495
test.describe('reach span', () => {
  test('home strength plus cohesion', { tag: '@functionality' }, async ({ page }) => {
    // a change dated after the anchor does not count yet (Ann's beta 40 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [{ personId: 1, field: 'beta', value: 40, from: '2026-04-01' }],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'FINAL' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'FINAL' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'FINAL' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'FINAL' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'FINAL' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'FINAL' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach-span')).toHaveText('330');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach-span')).toHaveText('330');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach-span')).toHaveText('150');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-reach-span')).toHaveText('150');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-reach-span')).toHaveText('495');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-reach-span')).toHaveText('495');
  });
});
