import { createClient } from '@supabase/supabase-js';
import type { Submission } from '../../../packages/core/src';
import type { SubmissionRepository } from './SubmissionRepository';

/**
 * Inserta en `diagnosticos_emprendedor` con la identidad de la persona (su JWT): la política RLS
 * `with check (user_id = auth.uid())` solo acepta filas propias. No usa clave de servicio.
 */
export class SupabaseSubmissionRepository implements SubmissionRepository {
  private readonly client;

  constructor(url: string, publishableKey: string, accessToken: string) {
    this.client = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  async save(s: Submission): Promise<void> {
    const { error } = await this.client.from('diagnosticos_emprendedor').insert({
      id: s.id,
      user_id: s.userId,
      answers: s.answers,
      scores: s.scores,
      dominant: s.dominant,
      secondary: s.secondary,
      created_at: s.createdAt,
    });
    if (error) throw new Error(error.message);
  }
}
