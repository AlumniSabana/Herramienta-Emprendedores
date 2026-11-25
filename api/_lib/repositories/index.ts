import { InMemorySubmissionRepository } from './InMemorySubmissionRepository';
import { SupabaseSubmissionRepository } from './SupabaseSubmissionRepository';
import type { SubmissionRepository } from './SubmissionRepository';

export type { SubmissionRepository };

const memory = new InMemorySubmissionRepository();

/** Elige la implementación según SUBMISSION_REPOSITORY (`supabase` por defecto, o `memory`). */
export function createRepository(env: Record<string, string | undefined>, accessToken: string): SubmissionRepository {
  if (env.SUBMISSION_REPOSITORY === 'memory') return memory;
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY)
    throw new Error('Faltan SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY.');
  return new SupabaseSubmissionRepository(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, accessToken);
}
