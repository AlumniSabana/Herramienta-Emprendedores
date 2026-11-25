import type { Answers } from '@emprendedor/core';

export type SubmitOutcome = { ok: true } | { ok: false; unauthorized: boolean };

/** POST /api/submissions con la sesión de la persona. Nunca lanza: un fallo de guardado no bloquea el resultado. */
export async function submitDiagnostic(accessToken: string, answers: Answers): Promise<SubmitOutcome> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ answers }),
    });
    return res.ok ? { ok: true } : { ok: false, unauthorized: res.status === 401 };
  } catch {
    return { ok: false, unauthorized: false };
  }
}
