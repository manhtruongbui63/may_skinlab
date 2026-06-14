import { test, expect } from '@playwright/test'
import { CustomerPage } from '../../pages/customer.page'

test.describe('Customer Management (PW) — E2E CRUD Flow', () => {
  let customerPage: CustomerPage

  test.beforeEach(async ({ page }) => {
    customerPage = new CustomerPage(page)
  })

  // PW-01: Happy Path - Add customer
  test('PW-01: Add a new customer successfully', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.fillForm({
      fullName: 'John Doe',
      phone: '0987654321',
      birthDate: '1990-01-01',
      gender: 'Nam',
      status: 'Hoạt động',
    })
    await customerPage.submit()
    
    // Toast success and modal closes
    await expect(page.locator('text=Tạo thành công')).toBeVisible()
    await expect(page.locator('#customer-fullName')).not.toBeVisible()
  })

  // PW-02: Happy Path - Submit using Enter key
  test('PW-02: Submit form by pressing Enter in input field', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.fullNameInput.fill('Jane Smith')
    await customerPage.phoneInput.fill('0912345678')
    
    await customerPage.genderTrigger.click()
    await page.locator('role=option[name="Nữ"]').click()

    await customerPage.birthDateInput.fill('1992-05-10')
    await customerPage.birthDateInput.press('Enter')

    await expect(page.locator('text=Tạo thành công')).toBeVisible()
  })

  // PW-03: Validation - submit empty form
  test('PW-03: Show validation errors when submitting empty form', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.submit()

    await expect(page.locator('text=Họ và tên là bắt buộc')).toBeVisible()
    await expect(page.locator('text=Số điện thoại không hợp lệ')).toBeVisible()
  })

  // PW-04: Auto calculation of age
  test('PW-04: Auto calculates and displays the correct age in form', async () => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.birthDateInput.fill('2000-12-15')
    const currentYear = new Date().getFullYear()
    const expectedAge = String(currentYear - 2000)
    await expect(customerPage.ageInput).toHaveValue(expectedAge)
  })

  // PW-05: Ward reset on province change
  test('PW-05: Reset ward selection when province changes', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.provinceTrigger.click()
    await page.locator('role=option[name="Hồ Chí Minh"]').click()
    
    await customerPage.wardTrigger.click()
    await page.locator('role=option[name="Phường Bến Nghé"]').click()

    // Change province
    await customerPage.provinceTrigger.click()
    await page.locator('role=option[name="Hà Nội"]').click()

    await expect(customerPage.wardTrigger).toHaveText('Chọn Phường/Xã')
  })

  // PW-06: Auto address generation
  test('PW-06: Auto generates address based on input location fields', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.houseNumberInput.fill('123 A')
    await customerPage.provinceTrigger.click()
    await page.locator('role=option[name="Hồ Chí Minh"]').click()
    
    await customerPage.wardTrigger.click()
    await page.locator('role=option[name="Phường Bến Nghé"]').click()

    await expect(customerPage.addressTextarea).toHaveValue('123 A, Phường Bến Nghé, Hồ Chí Minh')
  })

  // PW-07: Manual address edit disables auto assembly
  test('PW-07: Manual edit to address field overrides auto address assembling', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.houseNumberInput.fill('123 A')
    await expect(customerPage.addressTextarea).toHaveValue('123 A')

    await customerPage.addressTextarea.fill('Overridden Address')
    await customerPage.houseNumberInput.fill('456 B')

    await expect(customerPage.addressTextarea).toHaveValue('Overridden Address')
  })

  // PW-08: Auto address button restore
  test('PW-08: Restore auto address generation using restore button', async ({ page }) => {
    await customerPage.goto()
    await customerPage.openCreateModal()
    await customerPage.houseNumberInput.fill('123 A')
    await customerPage.addressTextarea.fill('Overridden Address')

    await customerPage.autoAddressBtn.click()
    await expect(customerPage.addressTextarea).toHaveValue('123 A')
  })

  // PW-09: Detail navigation
  test('PW-09: Navigate to customer detail page when code is clicked', async ({ page }) => {
    await customerPage.goto()
    const firstCodeLink = page.locator('a[href^="/vi/customers/"]').first()
    const codeText = await firstCodeLink.textContent()
    await firstCodeLink.click()

    await expect(page).toHaveURL(/.*\/customers\/\d+/)
    await expect(page.locator('h1')).toHaveText(new RegExp(codeText || ''))
  })

  // PW-10: Detail page actions and tabs
  test('PW-10: Switch between medical records tabs and open edit modal', async ({ page }) => {
    // Navigate directly to customer detail 1
    await page.goto('/vi/customers/1')
    await expect(page).toHaveURL(/.*\/customers\/1/)

    // Switch to plans tab
    await page.locator('role=tab[name="Liệu trình"]').click()
    await expect(page).toHaveURL(/.*tab=plans/)

    // Click edit button to open modal
    await page.locator('button:has-text("Chỉnh sửa")').click()
    await expect(page.locator('#customer-fullName')).toBeVisible()
  })

  // PW-11: Soft delete customer
  test('PW-11: Delete a customer and confirm delete dialog', async ({ page }) => {
    await customerPage.goto()
    const deleteBtn = page.locator('button[aria-label="Xóa"]').first()
    await deleteBtn.click()

    // Confirm dialog
    const confirmBtn = page.locator('#customer-delete-confirm')
    await confirmBtn.click()

    await expect(page.locator('text=Xóa thành công')).toBeVisible()
  })
})
