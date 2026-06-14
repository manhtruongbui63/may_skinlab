import { type Locator, type Page } from '@playwright/test'

export class CustomerPage {
  readonly page: Page
  readonly addCustomerBtn: Locator
  readonly fullNameInput: Locator
  readonly phoneInput: Locator
  readonly phoneSecondaryInput: Locator
  readonly birthDateInput: Locator
  readonly genderTrigger: Locator
  readonly statusTrigger: Locator
  readonly houseNumberInput: Locator
  readonly provinceTrigger: Locator
  readonly wardTrigger: Locator
  readonly addressTextarea: Locator
  readonly autoAddressBtn: Locator
  readonly submitBtn: Locator
  readonly cancelBtn: Locator
  readonly ageInput: Locator

  constructor(page: Page) {
    this.page = page
    this.addCustomerBtn = page.locator('#add-customer-btn')
    this.fullNameInput = page.locator('#customer-fullName')
    this.phoneInput = page.locator('#customer-phone')
    this.phoneSecondaryInput = page.locator('#customer-phoneSecondary')
    this.birthDateInput = page.locator('#customer-birthDate')
    this.genderTrigger = page.locator('#customer-gender-trigger')
    this.statusTrigger = page.locator('#customer-status-trigger')
    this.houseNumberInput = page.locator('#customer-houseNumber')
    this.provinceTrigger = page.locator('#customer-provinceId-trigger')
    this.wardTrigger = page.locator('#customer-wardId-trigger')
    this.addressTextarea = page.locator('#customer-address')
    this.autoAddressBtn = page.locator('button:has-text("Tạo lại địa chỉ tự động")')
    this.submitBtn = page.locator('#customer-form-submit')
    this.cancelBtn = page.locator('#customer-form-cancel')
    this.ageInput = page.locator('#customer-age')
  }

  async goto() {
    await this.page.goto('/vi/customers')
    await this.page.waitForURL(/.*\/customers/)
  }

  async openCreateModal() {
    await this.addCustomerBtn.click()
    await this.page.waitForSelector('#customer-fullName')
  }

  async fillForm(data: {
    fullName: string
    phone: string
    phoneSecondary?: string
    birthDate: string
    gender: string
    status: string
    houseNumber?: string
    province?: string
    ward?: string
  }) {
    await this.fullNameInput.fill(data.fullName)
    await this.phoneInput.fill(data.phone)
    if (data.phoneSecondary) {
      await this.phoneSecondaryInput.fill(data.phoneSecondary)
    }
    await this.birthDateInput.fill(data.birthDate)

    // Select Gender
    await this.genderTrigger.click()
    await this.page.locator(`role=option[name="${data.gender}"]`).click()

    // Select Status
    await this.statusTrigger.click()
    await this.page.locator(`role=option[name="${data.status}"]`).click()

    if (data.houseNumber) {
      await this.houseNumberInput.fill(data.houseNumber)
    }

    if (data.province) {
      await this.provinceTrigger.click()
      await this.page.locator(`role=option[name="${data.province}"]`).click()
    }

    if (data.ward) {
      await this.wardTrigger.click()
      await this.page.locator(`role=option[name="${data.ward}"]`).click()
    }
  }

  async submit() {
    await this.submitBtn.click()
  }
}
