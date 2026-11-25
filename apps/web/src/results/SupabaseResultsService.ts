import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileId, StoredResult } from '@emprendedor/core';
import type { ResultsService } from './ResultsService';

/** Lee el último resultado de la persona; RLS garantiza que solo ve filas suyas. */
export class SupabaseResultsService implements ResultsService {
  constructor(private readonly client: SupabaseClient) {}

  async getLatest(): Promise<StoredResult | null> {
    const { data, error } = await this.client
      .from('diagnosticos_emprendedor')
      .select('id,scores,dominant,secondary,created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id as string,
      scores: data.scores as Record<ProfileId, number>,
      dominant: data.dominant as ProfileId[],
      secondary: (data.secondary ?? []) as ProfileId[],
      createdAt: data.created_at as string,
    };
  }
}
