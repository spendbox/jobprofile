export const ADMIN_COOKIE = 'admin_session'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function uint8ToBase64url(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlToUint8(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    b64.length + (4 - (b64.length % 4)) % 4, '='
  )
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_JWT_SECRET!
  const payload = new TextEncoder().encode(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })
  )
  const key = await hmacKey(secret)
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, payload))
  return `${uint8ToBase64url(payload)}.${uint8ToBase64url(sig)}`
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return false
    const payloadBytes = base64urlToUint8(payloadB64)
    const sigBytes     = base64urlToUint8(sigB64)
    const key = await hmacKey(process.env.ADMIN_JWT_SECRET!)
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes.buffer as ArrayBuffer, payloadBytes.buffer as ArrayBuffer)
    if (!valid) return false
    const { exp } = JSON.parse(new TextDecoder().decode(payloadBytes))
    return Date.now() < exp
  } catch {
    return false
  }
}
