import { existsSync } from 'fs'
import { expect, test } from '@playwright/test'
import { ensureCustomerAndTemplate, launchQuotely } from './helpers'

test.describe('backup restore', () => {
  test('backup → mutate → restore round-trip', async () => {
    const harness = await launchQuotely()
    const { page, backupPath } = harness

    try {
      await ensureCustomerAndTemplate(page)

      // Electron confirm() is flaky under Playwright; accept restores explicitly.
      await page.evaluate(() => {
        window.confirm = () => true
      })

      const before = await page.evaluate(async () => {
        const quotations = await window.api.quotations.list({})
        return {
          count: quotations.length,
          numbers: quotations.map((q) => q.quotationNumber)
        }
      })

      await page.getByRole('link', { name: 'Settings' }).click()
      await page.getByRole('tab', { name: 'Backup & Restore' }).click()
      await page.getByRole('button', { name: 'Create backup' }).click()

      await expect
        .poll(() => existsSync(backupPath), { timeout: 30_000 })
        .toBe(true)
      await expect(page.getByText(/Backup saved to/i)).toBeVisible({ timeout: 15_000 })

      const mutated = await page.evaluate(async () => {
        const customers = await window.api.customers.list()
        const templates = await window.api.quotationTemplates.list()
        const customer =
          customers[0] ??
          (await window.api.customers.create({
            name: 'Backup Probe Customer',
            email: 'probe@example.com'
          }))
        const quotation = await window.api.quotations.create({
          date: new Date().toISOString().slice(0, 10),
          customerId: customer.id,
          templateId: templates[0].id,
          items: [
            {
              qty: 1,
              rate: 123,
              discount: 0,
              discountType: 'fixed',
              columnValues: { description: 'Should disappear after restore' }
            }
          ]
        })
        return { quotationNumber: quotation.quotationNumber, id: quotation.id }
      })

      expect(mutated.quotationNumber).toBeTruthy()
      expect(before.numbers).not.toContain(mutated.quotationNumber)

      await page.getByRole('button', { name: 'Restore backup' }).click()
      await expect(page.getByText(/Restore complete/i)).toBeVisible({ timeout: 30_000 })

      // Restore reloads the app; wait for UI to come back
      await page.waitForSelector('text=Quotely', { timeout: 60_000 })
      // Re-apply after reload (page scripts reset)
      await page.evaluate(() => {
        window.confirm = () => true
      })

      const after = await page.evaluate(async () => {
        const quotations = await window.api.quotations.list({})
        return {
          count: quotations.length,
          numbers: quotations.map((q) => q.quotationNumber)
        }
      })

      expect(after.numbers).not.toContain(mutated.quotationNumber)
      expect(after.count).toBe(before.count)
      expect(after.numbers).toEqual(before.numbers)
    } finally {
      await harness.cleanup()
    }
  })
})
