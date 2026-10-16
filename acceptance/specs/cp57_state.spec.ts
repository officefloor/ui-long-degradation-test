import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// State workflow: each person starts at DRAFT and moves forward DRAFT -> REVIEW -> FINAL via
// `person-advance-<id>`. Each change writes STATE_CHANGED id=<id> from=<old> to=<new>. FINAL is
// terminal: no advance control, and no rework control exists yet.
test.describe('state workflow', () => {
  test('advances DRAFT -> REVIEW -> FINAL with audit, then is terminal', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [{ id: 1, name: 'Al', alpha: 5, beta: 20, gamma: 5, state: 'DRAFT' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('DRAFT');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REVIEW');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');

    // terminal at FINAL
    await expect(page.getByTestId('person-advance-1')).toBeHidden();
    await expect(page.getByTestId('person-rework-1')).toHaveCount(0);

    await expect.poll(() => auditLines()).toContain('STATE_CHANGED id=1 from=DRAFT to=REVIEW');
    await expect.poll(() => auditLines()).toContain('STATE_CHANGED id=1 from=REVIEW to=FINAL');
  });
});
