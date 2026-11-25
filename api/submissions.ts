import type { IncomingMessage, ServerResponse } from 'node:http';
import { SupabaseTokenVerifier } from './_lib/auth/SupabaseTokenVerifier';
import { handleSubmission } from './_lib/handleSubmission';
import { createRepository } from './_lib/repositories';

type Req = IncomingMessage & { body?: unknown };

const bearer = (header: string | string[] | undefined) => {
  const value = Array.isArray(header) ? header[0] : header;
  const match = /^Bearer\s+(.+)$/i.exec(value ?? '');
  return match?.[1];
};

/** Vercel Function: POST /api/submissions. Contrato en specs/002-landing-cuentas/contracts/submissions-api.yaml. */
export default async function handler(req: Req, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end();
    return;
  }
  const verifier = new SupabaseTokenVerifier(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_PUBLISHABLE_KEY ?? '');
  const result = await handleSubmission(
    { body: req.body, accessToken: bearer(req.headers.authorization) },
    { verifier, repositoryFor: (token) => createRepository(process.env, token) },
  );
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result.body));
}
