import { faculties } from './content';
import { DEFAULT_ALLOWED_EMAIL_DOMAIN, validateInstitutionalEmail } from './email';
import type { RecoveryInput, RegistrationInput } from './types';

export const MIN_PASSWORD_LENGTH = 8;

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const PASSWORD_ERROR = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;

/** Quita espacios y saltos de línea (los códigos se pegan a veces con ellos). */
export const cleanVerificationCode = (raw: string): string => (raw ?? '').replace(/\s+/g, '');

export function validateVerificationCode(raw: string): { ok: true; code: string } | { ok: false; error: string } {
  const code = cleanVerificationCode(raw);
  return /^\d+$/.test(code) ? { ok: true, code } : { ok: false, error: 'Escribe el código de verificación (solo números).' };
}

export function validateRegistration(
  input: RegistrationInput,
  allowedDomain: string = DEFAULT_ALLOWED_EMAIL_DOMAIN,
): Validation<RegistrationInput> {
  const errors: Record<string, string> = {};

  const name = (input.name ?? '').trim();
  if (name.length < 2 || name.length > 120) errors.name = 'Escribe tu nombre completo (entre 2 y 120 caracteres).';

  const faculty = faculties.find((f) => f.name === input.faculty);
  if (!faculty) errors.faculty = 'Elige tu facultad.';
  if (!faculty || !faculty.programs.some((p) => p.name === input.program)) errors.program = 'Elige un programa de la facultad.';

  const email = validateInstitutionalEmail(input.email, allowedDomain);
  if (!email.ok) errors.email = email.error;

  if ((input.password ?? '').length < MIN_PASSWORD_LENGTH) errors.password = PASSWORD_ERROR;
  if (input.consent !== true) errors.consent = 'Debes aceptar el tratamiento de datos personales para continuar.';

  if (Object.keys(errors).length > 0 || !email.ok) return { ok: false, errors };
  return { ok: true, value: { ...input, name, email: email.email } };
}

export function validateRecovery(
  input: RecoveryInput,
  allowedDomain: string = DEFAULT_ALLOWED_EMAIL_DOMAIN,
): Validation<RecoveryInput> {
  const errors: Record<string, string> = {};
  const email = validateInstitutionalEmail(input.email, allowedDomain);
  if (!email.ok) errors.email = email.error;
  const code = validateVerificationCode(input.code);
  if (!code.ok) errors.code = code.error;
  if ((input.newPassword ?? '').length < MIN_PASSWORD_LENGTH) errors.newPassword = PASSWORD_ERROR;
  if (Object.keys(errors).length > 0 || !email.ok || !code.ok) return { ok: false, errors };
  return { ok: true, value: { email: email.email, code: code.code, newPassword: input.newPassword } };
}
