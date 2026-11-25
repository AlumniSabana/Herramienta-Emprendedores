import { describe, expect, it } from 'vitest';
import { toAuthError } from '../src/auth/errors';

const err = (message: string, extra: Record<string, unknown> = {}) => ({ message, ...extra });

describe('toAuthError', () => {
  it.each([
    [err('Invalid login credentials', { code: 'invalid_credentials', status: 400 }), 'invalid-credentials', 'El correo o la contraseña no coinciden.'],
    [err('Email not confirmed', { code: 'email_not_confirmed', status: 400 }), 'email-not-verified', 'Tu correo aún no está verificado. Te enviamos un correo para verificarlo.'],
    [err('User already registered', { code: 'user_already_exists', status: 422 }), 'already-registered', 'Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña.'],
    [err('Token has expired or is invalid', { code: 'otp_expired', status: 403 }), 'invalid-code', 'El código no es correcto o venció. Pide uno nuevo.'],
    [err('Token has expired or is invalid', { status: 403 }), 'invalid-code', 'El código no es correcto o venció. Pide uno nuevo.'],
    [err('email rate limit exceeded', { code: 'over_email_send_rate_limit', status: 429 }), 'rate-limited', 'Espera un momento antes de pedir otro correo.'],
    [err('too many', { status: 429 }), 'rate-limited', 'Espera un momento antes de pedir otro correo.'],
    [err('Password should be at least 6 characters', { code: 'weak_password', status: 422 }), 'weak-password', 'La contraseña debe tener al menos 8 caracteres.'],
    [err('Failed to fetch', { name: 'AuthRetryableFetchError', status: 0 }), 'network', 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'],
    [new TypeError('Failed to fetch'), 'network', 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'],
    [err('algo raro'), 'unknown', 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
  ])('%j → %s', (input, code, message) => {
    const e = toAuthError(input);
    expect(e.code).toBe(code);
    expect(e.message).toBe(message);
  });

  it('un dominio rechazado por el servicio se traduce al mensaje del dominio', () => {
    const e = toAuthError(err('Database error saving new user: solo correos @unisabana.edu.co'));
    expect(e.code).toBe('domain-not-allowed');
    expect(e.message).toBe('Usa tu correo institucional (@unisabana.edu.co).');
  });

  it('conserva un AuthError que ya viene traducido', () => {
    const first = toAuthError(err('x', { code: 'invalid_credentials' }));
    expect(toAuthError(first)).toBe(first);
  });
});
