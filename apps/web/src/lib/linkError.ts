const KEY = 'auth-link-error';

/**
 * Los enlaces vencidos o ya usados vuelven a la aplicación con `#error=access_denied&error_code=otp_expired`.
 * Se guarda antes de crear el cliente de Supabase (que limpia la URL) para mostrarlo en /restablecer.
 */
export function captureLinkError(hash: string = window.location.hash): void {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const code = params.get('error_code') ?? params.get('error');
  if (!code) return;
  try {
    window.sessionStorage.setItem(KEY, code);
  } catch {
    /* sin almacenamiento: no se muestra el motivo, solo el mensaje genérico */
  }
}

/** Lee el error guardado sin borrarlo (la pantalla puede renderizarse más de una vez). */
export function peekLinkError(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLinkError(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nada que borrar */
  }
}
