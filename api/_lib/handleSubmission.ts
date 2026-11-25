import { randomUUID } from 'node:crypto';
import { scoreAnswers, submissionRequestSchema, type Submission } from '../../packages/core/src';
import type { TokenVerifier } from './auth/TokenVerifier';
import type { SubmissionRepository } from './repositories/SubmissionRepository';

export interface HandleDeps {
  verifier: TokenVerifier;
  /** Repositorio que guarda con la identidad de esa persona (su access_token). */
  repositoryFor: (accessToken: string) => SubmissionRepository;
  now?: () => Date;
  newId?: () => string;
}

export interface HandleResult {
  status: number;
  body: unknown;
}

const SESSION_ERROR = 'Necesitas iniciar sesión para guardar tu resultado.';

/** Verifica la sesión → valida las respuestas → puntúa con la lógica compartida → guarda. */
export async function handleSubmission(
  input: { body: unknown; accessToken: string | undefined },
  deps: HandleDeps,
): Promise<HandleResult> {
  const token = input.accessToken?.trim();
  const user = token ? await deps.verifier.verify(token) : null;
  if (!token || !user) return { status: 401, body: { error: SESSION_ERROR } };

  const parsed = submissionRequestSchema.safeParse(input.body);
  if (!parsed.success)
    return {
      status: 400,
      body: {
        error: 'El envío no es válido. Revisa los datos e inténtalo de nuevo.',
        fields: { answers: parsed.error.issues[0]?.message ?? 'Respuestas inválidas.' },
      },
    };
  const { answers } = parsed.data;

  const submission: Submission = {
    id: (deps.newId ?? randomUUID)(),
    userId: user.userId,
    answers,
    ...scoreAnswers(answers),
    createdAt: (deps.now ?? (() => new Date()))().toISOString(),
  };

  try {
    await deps.repositoryFor(token).save(submission);
  } catch {
    return { status: 500, body: { error: 'No pudimos registrar tu diagnóstico. Tu resultado sigue disponible en pantalla.' } };
  }
  const { id, scores, dominant, secondary, createdAt } = submission;
  return { status: 201, body: { id, scores, dominant, secondary, createdAt } };
}
