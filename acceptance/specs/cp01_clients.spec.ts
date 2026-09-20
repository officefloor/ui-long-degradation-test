import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// ── data-testid conventions used by every spec (the stable contract; DESIGN.md §3) ────────────
//   table              <entity>s-table            e.g. clients-table
//   unique row         <entity>-row-<id>          e.g. client-row-1     (id = the seeded/created id)
//   cell within a row  <entity>-<field>           e.g. client-name      (generic; scoped by the row)
//   empty state        <entity>s-empty            e.g. clients-empty
//   form field         <entity>-form-<field>      e.g. client-form-email
//   form submit        <entity>-form-submit
//   field error        <entity>-form-<field>-error
//   nav link           nav-<section>              e.g. nav-clients
//   open detail        <entity>-open-<id>         e.g. project-open-1
// Seed fixture shape (grows over the run): { clients:[{id,name,email}], projects:[{id,name,clientId}],
//   invoices:[{id,projectId,amount,status?}] }. Navigation is via nav-* clicks, never URL paths.

test.describe('clients', () => {
  test('lists seeded clients', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await expect(page.getByTestId('clients-table')).toBeVisible();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(2);
    await expect(page.getByTestId('client-row-1').getByTestId('client-name')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('client-row-1').getByTestId('client-email')).toHaveText('ops@acme.example');
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Globex');
  });

  test('creates a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ clients: [] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId('clients-empty')).toBeVisible();

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('billing@initech.example');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^client-row-/).first();
    await expect(row.getByTestId('client-name')).toHaveText('Initech');
    await expect(row.getByTestId('client-email')).toHaveText('billing@initech.example');
  });
});
