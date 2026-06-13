import { http, HttpResponse, delay, type HttpHandler } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'

let mockUser = {
  id: 1,
  name: 'Admin System',
  email: 'admin@example.com',
  status: 1,
  roles: ['admin'],
  permissions: [],
}

// Sanctum SPA mode is cookie-based; in mock mode we emulate the session with a
// simple in-memory flag toggled by login/logout.
let mockSessionActive = false

export class AuthMock extends BaseMock {
  public getHandlers(): HttpHandler[] {
    return [
      http.get('*/sanctum/csrf-cookie', async () => {
        await delay(50)
        return new HttpResponse(null, { status: 204 })
      }),

      http.post('*/api/auth/register', async ({ request }) => {
        await delay(400)
        const body = (await request.json()) as {
          name?: string
          email?: string
          password?: string
          password_confirmation?: string
        }

        if (!body.name || !body.email || !body.password || !body.password_confirmation) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Dữ liệu không hợp lệ.',
              errors: {
                name: !body.name ? ['Tên hiển thị là bắt buộc.'] : [],
                email: !body.email ? ['Email là bắt buộc.'] : [],
                password: !body.password ? ['Mật khẩu là bắt buộc.'] : [],
              },
              data: null,
            },
            { status: 422 }
          )
        }

        if (body.email === mockUser.email) {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { email: ['The email has already been taken.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        mockUser = {
          id: 2,
          name: body.name,
          email: body.email,
          status: 1,
          roles: ['admin'],
          permissions: [],
        }

        return HttpResponse.json({
          success: true,
          message: 'Đăng ký thành công.',
          errors: null,
          data: mockUser,
        })
      }),

      http.post('*/api/auth/login', async ({ request }) => {
        await delay(400)
        const body = (await request.json()) as { email?: string; password?: string }

        if (body.email === '500@example.com') {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
        }

        if (body.email !== mockUser.email || body.password !== 'admin123') {
          return HttpResponse.json(
            {
              success: false,
              message: 'Sai thông tin đăng nhập.',
              errors: null,
              data: null,
            },
            { status: 401 }
          )
        }

        mockSessionActive = true

        return HttpResponse.json({
          success: true,
          message: 'Đăng nhập thành công.',
          errors: null,
          data: mockUser,
        })
      }),

      http.post('*/api/auth/logout', async () => {
        await delay(200)
        mockSessionActive = false
        return HttpResponse.json({
          success: true,
          message: 'Đăng xuất thành công.',
          errors: null,
          data: null,
        })
      }),

      http.post('*/api/auth/profile', async ({ request }) => {
        await delay(300)
        if (!mockSessionActive) {
          return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        }

        const body = (await request.json()) as { name?: string }
        if (!body.name) {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { name: ['Tên hiển thị là bắt buộc.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        mockUser = { ...mockUser, name: body.name }
        return HttpResponse.json({
          success: true,
          message: 'Cập nhật thành công.',
          errors: null,
          data: mockUser,
        })
      }),

      http.post('*/api/auth/change-password', async ({ request }) => {
        await delay(400)
        if (!mockSessionActive) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Vui lòng đăng nhập lại để tiếp tục.',
              errors: null,
              data: null,
            },
            { status: 401 }
          )
        }

        const body = (await request.json()) as { current_password?: string }
        if (body.current_password === 'wrongpassword') {
          return HttpResponse.json(
            {
              success: false,
              message: 'Dữ liệu bạn đã nhập không chính xác. Vui lòng thử lại.',
              errors: { current_password: ['Mật khẩu hiện tại không chính xác.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        return HttpResponse.json({
          success: true,
          message: 'Đổi mật khẩu thành công.',
          errors: null,
          data: true,
        })
      }),

      http.get('*/api/auth/me', async () => {
        await delay(300)
        if (!mockSessionActive) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({
          success: true,
          message: 'Success',
          errors: null,
          data: mockUser,
        })
      }),

      // Forgot password — reveals whether the email is registered. Known
      // accounts get a success; anything else returns a 422 "email not found".
      http.post('*/api/auth/forgot-password', async ({ request }) => {
        await delay(300)
        const body = (await request.json()) as { email?: string }
        const registered = ['admin@example.com', 'jane@example.com', 'user@example.com']

        if (!body.email || !registered.includes(body.email.toLowerCase())) {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { email: ['No account was found with this email address.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        return HttpResponse.json({
          success: true,
          message: 'A password reset link has been sent to your email.',
          errors: null,
          data: null,
        })
      }),

      // Reset password — the `token` value selects the outcome so component and
      // integration tests can exercise success + each 422 branch.
      http.post('*/api/auth/reset-password', async ({ request }) => {
        await delay(300)
        const body = (await request.json()) as { token?: string }

        if (body.token === 'expired-token') {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { token: ['This password reset link has expired. Please request a new one.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        if (body.token === 'same-password') {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { password: ['The new password must be different from your current password.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        if (body.token !== 'valid-token') {
          return HttpResponse.json(
            {
              success: false,
              message: 'The given data was invalid.',
              errors: { token: ['This password reset link is invalid.'] },
              data: null,
            },
            { status: 422 }
          )
        }

        return HttpResponse.json({
          success: true,
          message: 'Your password has been reset. Please sign in with your new password.',
          errors: null,
          data: null,
        })
      }),
    ]
  }
}
