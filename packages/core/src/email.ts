export const DEFAULT_ALLOWED_EMAIL_DOMAIN = 'unisabana.edu.co';

export type EmailCheck = { ok: true; email: string } | { ok: false; error: string };

const FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida formato y que el dominio sea exactamente el permitido (no un sufijo). */
export function validateInstitutionalEmail(
  input: string,
  allowedDomain: string = DEFAULT_ALLOWED_EMAIL_DOMAIN,
): EmailCheck {
  const email = (input ?? '').trim().toLowerCase();
  if (!FORMAT.test(email)) return { ok: false, error: 'Escribe un correo válido, por ejemplo nombre@unisabana.edu.co.' };
  const domain = allowedDomain.trim().toLowerCase().replace(/^@/, '');
  if (email.slice(email.indexOf('@') + 1) !== domain)
    return { ok: false, error: `Usa tu correo institucional (@${domain}).` };
  return { ok: true, email };
}
