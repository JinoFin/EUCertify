import { test, expect } from '@playwright/test';

test('bluetooth speaker workflow', async ({ page }) => {
  await page.goto('/wizard');
  await page.getByLabel('Produktkategorie').fill('Bluetooth Speaker');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Versorgungsspannung AC (Volt)').fill('0');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Versorgungsspannung DC (Volt)').fill('12');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Bluetooth/WLAN').check();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Ja').first().click(); // isEEE true
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Ja').first().click(); // has battery
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Verbraucher').check();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Kurzbeschreibung').fill('Portable speaker with Li-Ion battery and Bluetooth.');
  await page.getByRole('button', { name: 'Zusammenfassung' }).click();
  await expect(page.getByText('RED 2014/53/EU')).toBeVisible();
  await expect(page.getByText('BATTERY_2023_1542')).toBeVisible();
});

test('mains lamp workflow', async ({ page }) => {
  await page.goto('/wizard');
  await page.getByLabel('Produktkategorie').fill('LED Work Lamp');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Versorgungsspannung AC (Volt)').fill('230');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Versorgungsspannung DC (Volt)').fill('0');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Nein').check();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Ja').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Verbraucher').check();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByText('Nein').first().click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Kurzbeschreibung').fill('AC powered LED work lamp for indoor use.');
  await page.getByRole('button', { name: 'Zusammenfassung' }).click();
  await expect(page.getByText('LVD 2014/35/EU')).toBeVisible();
  await expect(page.getByText('EMC 2014/30/EU')).toBeVisible();
});

