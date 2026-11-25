import { createClient } from '@supabase/supabase-js';
import type { TokenVerifier } from './TokenVerifier';

/** Valida el JWT contra el servicio de cuentas (firma y vigencia) usando solo la clave publishable. */
export class SupabaseTokenVerifier implements TokenVerifier {
  private readonly client;

  constructor(url: string, publishableKey: string) {
    this.client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async verify(accessToken: string) {
    try {
      const { data, error } = await this.client.auth.getUser(accessToken);
      return error || !data.user ? null : { userId: data.user.id };
    } catch {
      return null;
    }
  }
}
