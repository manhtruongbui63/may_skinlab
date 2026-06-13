/**
 * @server-only
 *
 * This file imports `next/headers` and must NEVER be imported in Client Components.
 * Use `createServerAuthRepository()` only in Server Components and Route Handlers.
 */
import { getServerHttpClient } from '@/infra/api/server-http.service'
import { AuthRepository } from './auth.repository.impl'
import type { IAuthRepository } from './auth.repository'

/**
 * Returns a fresh, per-request auth repository authenticated via the
 * incoming Sanctum SPA session cookie (forwarded to the backend).
 *
 * @example
 * // Server Component or Route Handler only
 * const repo = await createServerAuthRepository()
 * const user = await repo.getMe()
 */
export async function createServerAuthRepository(): Promise<IAuthRepository> {
  const http = await getServerHttpClient()
  return new AuthRepository(http)
}
