import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cp178: balance = strength - cohesion*size, where cohesion = floor(strength/size). This is the
// leftover (strength mod size) once each member takes the floored even share. Strengths are chosen
// NOT divisible by size so the leftover is non-zero, and the groups vary in size (3, 2, 1).
test.describe('balance', () => {
  test('strength minus cohesion times size', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        // North (size 3): effective 100 + 120 + 61 = 281; cohesion floor(281/3)=93; balance 281-93*3 = 2
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true }, // 100
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true }, // 120
        { id: 3, name: 'Cal', alpha: 1, beta: 61, gamma: 1, active: true }, // 61
        // South (size 2): effective 45 + 40 = 85; cohesion floor(85/2)=42; balance 85-42*2 = 1
        { id: 4, name: 'Dot', alpha: 5, beta: 9, gamma: 5, active: true },  // 45
        { id: 5, name: 'Eli', alpha: 4, beta: 10, gamma: 4, active: true }, // 40
        // East (size 1): effective 30; cohesion 30; balance 30-30*1 = 0
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true },  // 30
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 1 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 2 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-balance')).toHaveText('2');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-balance')).toHaveText('1');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-balance')).toHaveText('0');
  });
});
