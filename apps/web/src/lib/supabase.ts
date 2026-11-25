import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente único de Supabase con la clave PUBLISHABLE (pensada para el navegador).
 * La clave secret / service role no se usa ni se configura en esta herramienta.
 *
 * `detectSessionInUrl` queda activo: los enlaces de verificación y de recuperación del correo vuelven con la
 * sesión en la URL. El control de seguridad está en la aplicación: una sesión abierta por un enlace de
 * recuperación queda marcada (`recovery`) y no puede usar nada hasta definir la contraseña nueva.
 */
export function createSupabaseClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key)
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y complétalas.');
  return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}
