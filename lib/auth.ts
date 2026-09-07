import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'ukk-app-super-secret-jwt-key-2026-secure-random'
const secretKey = new TextEncoder().encode(JWT_SECRET)

export interface UserJwtPayload {
  id: string
  email: string
  name?: string | null
  role: string
  [key: string]: unknown
}

/**
 * Buat (Sign) JWT token dengan masa berlaku 7 hari
 */
export async function signJWT(payload: UserJwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

/**
 * Verifikasi JWT token secara aman (kompatibel Edge runtime)
 */
export async function verifyJWT(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload as unknown as UserJwtPayload
  } catch {
    return null
  }
}
