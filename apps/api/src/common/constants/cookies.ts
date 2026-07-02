export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const isSecureCookie = process.env.COOKIE_SECURE === 'true';

export const getCookieOptions = (maxAgeMs: number, path = '/') => ({
  httpOnly: true,
  secure: isSecureCookie,
  // Cross-origin (e.g. Vercel frontend + Render API) requires SameSite=None with Secure.
  sameSite: isSecureCookie ? ('none' as const) : ('lax' as const),
  maxAge: maxAgeMs,
  path,
});
