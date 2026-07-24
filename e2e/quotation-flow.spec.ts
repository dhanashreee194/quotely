import { existsSync, statSync } from 'fs'
import { expect, test } from '@playwright/test'
import { ensureCustomerAndTemplate, launchQuotely } from './helpers'

test.describe('quotation flow', () => {
  test('create quotation → live totals → preview → export PDF', async () => {
    const harness = await launchQuotely()
    const { page, pdfPath } = harness

    try {
      await ensureCustomerAndTemplate(page)

      // Create via API so seed/template/customer wiring is deterministic, then open editor
      const created = await page.evaluate(async () => {
        const customers = await window.api.customers.list()
        const templates = await window.api.quotationTemplates.list()
        return window.api.quotations.create({
          date: new Date().toISOString().slice(0, 10),
          customerId: customers[0].id,
          templateId: templates[0].id,
          currency: 'INR',
          items: [
            {
              qty: 2,
              rate: 50,
              discount: 0,
              discountType: 'fixed',
              columnValues: { description: 'E2E line' }
            }
          ]
        })
      })

      expect(created.subtotal).toBe(100)
      expect(created.grandTotal).toBeGreaterThan(0)

      await page.evaluate((id) => {
        window.location.hash = `#/quotations/${id}`
      }, created.id)
      await expect(page.getByRole('heading', { name: created.quotationNumber })).toBeVisible({
        timeout: 20_000
      })

      // Live totals on the editor (subtotal 100.00)
      await expect(page.getByText('100.00').first()).toBeVisible()

      // Change qty and confirm live recalculation (3 * 50 = 150)
      const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first()
      if (await qtyInput.count()) {
        await qtyInput.fill('3')
        await expect(page.getByText('150.00').first()).toBeVisible({ timeout: 10_000 })
        await page.getByRole('button', { name: 'Save draft' }).click()
        await page.waitForTimeout(500)
      }

      await page.getByRole('button', { name: 'Preview' }).click()
      await expect(page).toHaveURL(/#\/quotations\/\d+\/preview/)
      await expect(page.getByRole('heading', { name: 'QUOTATION' })).toBeVisible({
        timeout: 15_000
      })
      await expect(
        page.getByRole('heading', { name: `Preview ${created.quotationNumber}` })
      ).toBeVisible()

      await page.getByRole('button', { name: 'Export PDF' }).click()
      await expect.poll(() => existsSync(pdfPath), { timeout: 45_000 }).toBe(true)
      expect(statSync(pdfPath).size).toBeGreaterThan(1000)
    } finally {
      await harness.cleanup()
    }
  })
})
