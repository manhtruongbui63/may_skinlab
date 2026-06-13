export async function register() {
  // Server-side mocking is enabled ONLY by the explicit NEXT_PUBLIC_USE_MOCK flag,
  // matching the client gate (msw-provider.tsx / mock-provider.tsx). NODE_ENV is
  // intentionally NOT a trigger: deployed images may run with NODE_ENV=development
  // and must never serve mock auth/data instead of the real backend.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { server } = await import('./infra/mocks/node')
    server.listen({ onUnhandledRequest: 'bypass' })
    console.log('[MSW] Server-side mocking enabled.')
  }
}
