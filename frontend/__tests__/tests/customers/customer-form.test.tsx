import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '../../utils/render-with-intl'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CustomerFormModal } from '@/features/customers/components/customer-form-modal'
import * as masterData from '@/features/customers/hooks/use-master-data'

// Mock use-master-data hooks
vi.mock('@/features/customers/hooks/use-master-data', () => ({
  useProvinces: vi.fn(),
  useWards: vi.fn(),
}))

describe('CustomerFormModal (VT) — Logic & Validation', () => {
  const mockOnSubmit = vi.fn()
  const mockOnOpenChange = vi.fn()
  const defaultProvinces = [
    { id: 1, name: 'Hồ Chí Minh' },
    { id: 2, name: 'Hà Nội' },
  ]
  const defaultWards = [
    { id: 10, province_id: 1, name: 'Phường Bến Nghé' },
    { id: 11, province_id: 1, name: 'Phường Bến Thành' },
  ]

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnOpenChange.mockClear()
    vi.mocked(masterData.useProvinces).mockReturnValue({
      data: defaultProvinces,
      isLoading: false,
    } as any)
    vi.mocked(masterData.useWards).mockReturnValue({
      data: defaultWards,
      isLoading: false,
    } as any)
  })

  // VT-01: Render basic elements
  it('VT-01: Renders all basic form fields correctly', () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    expect(screen.getByPlaceholderText('BNxxxxxx')).toBeInTheDocument()
    expect(screen.getByLabelText(/họ và tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/số điện thoại chính/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/địa chỉ/i)).toBeInTheDocument()
  })

  // VT-02: Age calculation when birth date changes
  it('VT-02: Real-time calculation of age when birth date is entered', async () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const birthDateInput = screen.getByLabelText(/ngày sinh/i)
    fireEvent.change(birthDateInput, { target: { value: '1995-06-15' } })
    const currentYear = new Date().getFullYear()
    const expectedAge = String(currentYear - 1995)
    await waitFor(() => {
      expect(screen.getByLabelText(/tuổi/i)).toHaveValue(expectedAge)
    })
  })

  // VT-03: Local state province change resets ward selection
  it('VT-03: Resets ward select when province is changed', async () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
        customer={{
          id: 1,
          code: 'BN000001',
          fullName: 'Nguyen Van A',
          phone: '0987654321',
          province: { id: 1, name: 'Hồ Chí Minh' },
          ward: { id: 10, provinceId: 1, name: 'Phường Bến Nghé' },
          isAddressManuallyEdited: false,
          status: { value: 1, label: 'Active' },
          outstandingAmount: 0,
        }}
      />
    )
    const provinceSelect = screen.getByLabelText(/tỉnh \/ thành phố/i)
    fireEvent.change(provinceSelect, { target: { value: '2' } })
    await waitFor(() => {
      expect(screen.getByLabelText(/phường \/ xã/i)).toHaveValue('')
    })
  })

  // VT-04: Auto-assembling address
  it('VT-04: Auto-assembles address from house number, ward, and province', async () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const houseNumberInput = screen.getByLabelText(/số nhà/i)
    const provinceSelect = screen.getByLabelText(/tỉnh \/ thành phố/i)
    const wardSelect = screen.getByLabelText(/phường \/ xã/i)

    fireEvent.change(houseNumberInput, { target: { value: '123' } })
    fireEvent.change(provinceSelect, { target: { value: '1' } })
    fireEvent.change(wardSelect, { target: { value: '10' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/địa chỉ/i)).toHaveValue('123, Phường Bến Nghé, Hồ Chí Minh')
    })
  })

  // VT-05: Manually editing address stops auto-assembling
  it('VT-05: Stops auto-address generation when address textarea is edited manually', async () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const houseNumberInput = screen.getByLabelText(/số nhà/i)
    const addressInput = screen.getByLabelText(/địa chỉ/i)

    fireEvent.change(houseNumberInput, { target: { value: '123' } })
    await waitFor(() => {
      expect(addressInput).toHaveValue('123')
    })

    fireEvent.change(addressInput, { target: { value: 'Manual Address Edit' } })
    fireEvent.change(houseNumberInput, { target: { value: '456' } })

    await waitFor(() => {
      expect(addressInput).toHaveValue('Manual Address Edit')
    })
  })

  // VT-06: Auto-generation address button restores auto-assembling
  it('VT-06: Restores auto-address generation when auto-generate button is clicked', async () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const houseNumberInput = screen.getByLabelText(/số nhà/i)
    const addressInput = screen.getByLabelText(/địa chỉ/i)

    fireEvent.change(houseNumberInput, { target: { value: '123' } })
    fireEvent.change(addressInput, { target: { value: 'Manual Address Edit' } })
    
    const restoreBtn = screen.getByRole('button', { name: /tạo lại địa chỉ tự động/i })
    fireEvent.click(restoreBtn)

    await waitFor(() => {
      expect(addressInput).toHaveValue('123')
    })
  })

  // VT-07: Validation - submit empty form shows validation errors
  it('VT-07: Shows validation errors on empty form submit', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const submitBtn = screen.getByRole('button', { name: /lưu/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/họ và tên là bắt buộc/i)).toBeInTheDocument()
      expect(screen.getByText(/số điện thoại không hợp lệ/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  // VT-08: Validation - phone format validation rules
  it('VT-08: Shows validation error on invalid phone format', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const phoneInput = screen.getByLabelText(/số điện thoại chính/i)
    await user.type(phoneInput, '123')
    const submitBtn = screen.getByRole('button', { name: /lưu/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/số điện thoại không hợp lệ/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  // VT-09: Validation - secondary phone format validation rules
  it('VT-09: Shows validation error on invalid secondary phone format', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const phoneSecondaryInput = screen.getByLabelText(/số điện thoại phụ/i)
    await user.type(phoneSecondaryInput, '123')
    const submitBtn = screen.getByRole('button', { name: /lưu/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/số điện thoại không hợp lệ/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  // VT-10: Valid form submission calls onSubmit
  it('VT-10: Calls onSubmit with mapped data when form is valid', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    await user.type(screen.getByLabelText(/họ và tên/i), 'Nguyen Van A')
    await user.type(screen.getByLabelText(/số điện thoại chính/i), '+84987654321')
    
    // Choose gender
    const genderSelect = screen.getByLabelText(/giới tính/i)
    fireEvent.change(genderSelect, { target: { value: '1' } })

    // Set birth date
    const birthDateInput = screen.getByLabelText(/ngày sinh/i)
    fireEvent.change(birthDateInput, { target: { value: '1995-06-15' } })

    const submitBtn = screen.getByRole('button', { name: /lưu/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nguyen Van A',
          phone: '+84987654321',
          gender: 1,
          birthDate: '1995-06-15',
        })
      )
    })
  })
})

describe('CustomerFormModal (VT-DS) — Design System Compliance', () => {
  const mockOnSubmit = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.mocked(masterData.useProvinces).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.mocked(masterData.useWards).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
  })

  // VT-DS-01: Semantic color token - error
  it('VT-DS-01: Rendered field errors use text-destructive class without inline hex colors', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    await user.click(screen.getByRole('button', { name: /lưu/i }))
    await waitFor(() => {
      const errorMsg = screen.getByText(/họ và tên là bắt buộc/i)
      expect(errorMsg).toHaveClass('text-destructive')
      expect(errorMsg).not.toHaveStyle({ color: expect.stringMatching(/^#|^rgb/) })
    })
  })

  // VT-DS-02: Semantic color token - muted
  it('VT-DS-02: Labels use text-muted-foreground class', () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const label = screen.getByText(/ngày sinh/i)
    expect(label).toHaveClass('text-muted-foreground')
  })

  // VT-DS-03: Field composition hierarchy
  it('VT-DS-03: Field composition renders labels and inputs wrapped in field containers', () => {
    const { container } = renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const field = container.querySelector('[data-slot="field"]')
    expect(field).toBeInTheDocument()
    expect(screen.getByLabelText(/họ và tên/i)).toBeInTheDocument()
  })

  // VT-DS-04: FieldLabel không uppercase
  it('VT-DS-04: FieldLabel is not uppercase by default CSS', () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const label = screen.getByText(/họ và tên/i)
    const style = window.getComputedStyle(label)
    expect(style.textTransform).not.toBe('uppercase')
  })

  // VT-DS-05: Button variant/tone đúng
  it('VT-DS-05: Action buttons use proper DS classes', () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const submitBtn = screen.getByRole('button', { name: /lưu/i })
    expect(submitBtn).toHaveClass('bg-primary')
  })

  // VT-DS-06: Scrollable container
  it('VT-DS-06: Modal body contains custom-scrollbar and overflow-y-auto classes', () => {
    const { container } = renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const scrollable = container.querySelector('.custom-scrollbar')
    expect(scrollable).toBeInTheDocument()
    expect(scrollable).toHaveClass('overflow-y-auto')
  })

  // VT-DS-07: data-slot present on inputs
  it('VT-DS-07: Form inputs carry the correct data-slot attribute', () => {
    renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const input = screen.getByLabelText(/họ và tên/i)
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  // VT-DS-08: Required indicator rendered
  it('VT-DS-08: Required indicators are rendered on required labels', () => {
    const { container } = renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const requiredIndicator = container.querySelector('[data-slot="field-required-indicator"]')
    expect(requiredIndicator).toBeInTheDocument()
  })

  // VT-DS-09: Upload primitive check
  it('VT-DS-09: Avatar upload section uses input upload image design primitive', () => {
    const { container } = renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const uploadPrimitive = container.querySelector('[data-slot="input-upload-image"]')
    expect(uploadPrimitive).toBeInTheDocument()
  })

  // VT-DS-10: Spacing token check
  it('VT-DS-10: Containers use spacing classes rather than inline styles', () => {
    const { container } = renderWithIntl(
      <CustomerFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        isSubmitting={false}
        onSubmit={mockOnSubmit}
      />
    )
    const formEl = container.querySelector('form')
    expect(formEl).not.toHaveStyle({ gap: expect.any(String) })
    expect(formEl).not.toHaveStyle({ padding: expect.any(String) })
  })
})
