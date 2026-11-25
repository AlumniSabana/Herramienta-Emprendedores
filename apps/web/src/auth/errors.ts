import { AuthError, type AuthErrorCode } from './AuthService';

const MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'El correo o la contraseña no coinciden.',
  'email-not-verified': 'Tu correo aún no está verificado. Te enviamos un correo para verificarlo.',
  'already-registered': 'Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña.',
  'invalid-code': 'El código no es correcto o venció. Pide uno nuevo.',
  'link-expired': 'El enlace venció o ya fue usado. Pide uno nuevo.',
  'wrong-current-password': 'La contraseña actual no es correcta.',
  'rate-limited': 'Espera un momento antes de pedir otro correo.',
  'weak-password': 'La contraseña debe tener al menos 8 caracteres.',
  'domain-not-allowed': 'Usa tu correo institucional (@unisabana.edu.co).',
  network: 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
  unknown: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
};

export const authError = (code: AuthErrorCode) => new AuthError(code, MESSAGES[code]);

const BY_CODE: Record<string, AuthErrorCode> = {
  invalid_credentials: 'invalid-credentials',
  email_not_confirmed: 'email-not-verified',
  user_already_exists: 'already-registered',
  email_exists: 'already-registered',
  otp_expired: 'invalid-code',
  over_email_send_rate_limit: 'rate-limited',
  over_request_rate_limit: 'rate-limited',
  over_sms_send_rate_limit: 'rate-limited',
  weak_password: 'weak-password',
  same_password: 'weak-password',
};

/** Traduce cualquier error de Supabase (o de red) a un AuthError estable, una sola vez. */
export function toAuthError(input: unknown): AuthError {
  if (input instanceof AuthError) return input;

  const e = (input ?? {}) as { message?: string; code?: string; status?: number; name?: string };
  const message = e.message ?? '';

  if (e.code && BY_CODE[e.code]) return authError(BY_CODE[e.code]!);
  if (input instanceof TypeError || e.name === 'AuthRetryableFetchError' || e.status === 0 || /failed to fetch|network/i.test(message))
    return authError('network');
  if (e.status === 429) return authError('rate-limited');
  if (/invalid login credentials/i.test(message)) return authError('invalid-credentials');
  if (/email not confirmed/i.test(message)) return authError('email-not-verified');
  if (/already registered|already been registered/i.test(message)) return authError('already-registered');
  if (/token has expired|otp|invalid token/i.test(message)) return authError('invalid-code');
  if (/password should be at least|weak/i.test(message)) return authError('weak-password');
  if (/unisabana\.edu\.co|dominio/i.test(message)) return authError('domain-not-allowed');
  return authError('unknown');
}
