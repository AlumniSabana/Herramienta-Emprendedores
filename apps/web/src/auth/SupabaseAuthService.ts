import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AGREEMENT_VERSION, cleanVerificationCode, type AccountProfile, type RegistrationInput } from '@emprendedor/core';
import type { AuthService, AuthSession } from './AuthService';
import { authError, toAuthError } from './errors';

const RECOVERY_KEY = 'auth-recovery-pending';
const norm = (email: string) => email.trim().toLowerCase();

const storage = {
  get: () => {
    try {
      return window.sessionStorage.getItem(RECOVERY_KEY) === '1';
    } catch {
      return false;
    }
  },
  set: (on: boolean) => {
    try {
      if (on) window.sessionStorage.setItem(RECOVERY_KEY, '1');
      else window.sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
      /* sin almacenamiento: la marca solo vive en memoria */
    }
  },
};

/** Implementación real contra Supabase Auth; mismo flujo que la plataforma de Herramientas CDP. */
export class SupabaseAuthService implements AuthService {
  /** Sesión abierta con un enlace de recuperación: solo puede definir la contraseña nueva. */
  private recovery = storage.get();

  constructor(private readonly client: SupabaseClient) {
    // Si la URL trae un enlace de recuperación, se marca ya (antes de que nadie lea la sesión).
    if (typeof window !== 'undefined' && /(^|[#&?])type=recovery\b/.test(window.location.hash + window.location.search))
      this.setRecovery(true);
    // Suscripción propia desde el constructor: así no se pierde el evento que llega al restaurar la sesión.
    this.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') this.setRecovery(true);
      if (event === 'SIGNED_OUT') this.setRecovery(false);
    });
  }

  private setRecovery(on: boolean) {
    this.recovery = on;
    storage.set(on);
  }

  private get auth() {
    return this.client.auth;
  }

  private toSession(s: Session | null): AuthSession | null {
    return s
      ? {
          userId: s.user.id,
          email: s.user.email ?? '',
          accessToken: s.access_token,
          metadata: s.user.user_metadata ?? {},
          recovery: this.recovery,
        }
      : null;
  }

  /** Lanza el error ya traducido (también los fallos de red que Supabase lanza en vez de devolver). */
  private async run<T extends { error: unknown }>(call: () => Promise<T>): Promise<T> {
    let result: T;
    try {
      result = await call();
    } catch (e) {
      throw toAuthError(e);
    }
    if (result.error) throw toAuthError(result.error);
    return result;
  }

  async getSession() {
    const { data } = await this.auth.getSession();
    return this.toSession(data.session);
  }

  onChange(listener: (session: AuthSession | null) => void) {
    const { data } = this.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') this.setRecovery(true);
      listener(this.toSession(session));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(input: RegistrationInput) {
    const { data } = await this.run(() =>
      this.auth.signUp({
        email: norm(input.email),
        password: input.password,
        options: {
          // El enlace del correo de verificación vuelve a la aplicación, ya con la sesión iniciada.
          emailRedirectTo: `${window.location.origin}/diagnostico`,
          data: {
            nombre: input.name.trim(),
            facultad: input.faculty,
            programa: input.program,
            acuerdo_version: AGREEMENT_VERSION,
            acuerdo_fecha: new Date().toISOString(),
          },
        },
      }),
    );
    // Con correo existente el servicio no devuelve error: devuelve un usuario sin identidades.
    if (data.user && data.user.identities?.length === 0) return { status: 'already-registered' as const };
    return { status: 'verification-required' as const };
  }

  async verifySignup(email: string, code: string) {
    await this.run(() => this.auth.verifyOtp({ email: norm(email), token: cleanVerificationCode(code), type: 'signup' }));
  }

  async resendSignupCode(email: string) {
    await this.run(() =>
      this.auth.resend({ type: 'signup', email: norm(email), options: { emailRedirectTo: `${window.location.origin}/diagnostico` } }),
    );
  }

  async signIn(email: string, password: string) {
    await this.run(() => this.auth.signInWithPassword({ email: norm(email), password }));
  }

  async requestRecovery(email: string) {
    try {
      await this.run(() => this.auth.resetPasswordForEmail(norm(email), { redirectTo: `${window.location.origin}/restablecer` }));
    } catch (e) {
      // No se revela si el correo existe: solo se muestran el límite de envíos y los fallos de red.
      const code = (e as { code?: string }).code;
      if (code === 'rate-limited' || code === 'network') throw e;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    await this.run(() => this.auth.verifyOtp({ email: norm(email), token: cleanVerificationCode(code), type: 'recovery' }));
    await this.setNewPassword(newPassword);
  }

  async updatePassword(newPassword: string) {
    await this.setNewPassword(newPassword);
  }

  /** Quita la marca de recuperación antes de guardar (así el evento de cambio ya la trae apagada) y la repone si falla. */
  private async setNewPassword(newPassword: string) {
    this.setRecovery(false);
    try {
      await this.run(() => this.auth.updateUser({ password: newPassword }));
    } catch (e) {
      this.setRecovery(true);
      throw e;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await this.auth.getSession();
    const email = data.session?.user.email;
    if (!email) throw authError('invalid-credentials');
    try {
      await this.run(() => this.auth.signInWithPassword({ email, password: currentPassword }));
    } catch (e) {
      throw (e as { code?: string }).code === 'invalid-credentials' ? authError('wrong-current-password') : e;
    }
    await this.run(() => this.auth.updateUser({ password: newPassword }));
  }

  async signOut() {
    this.setRecovery(false);
    await this.auth.signOut();
  }

  async getProfile(session: AuthSession): Promise<AccountProfile> {
    const meta = session.metadata as { nombre?: string; facultad?: string; programa?: string };
    const fallback: AccountProfile = {
      id: session.userId,
      email: session.email,
      name: meta.nombre ?? '',
      faculty: meta.facultad ?? '',
      program: meta.programa ?? '',
    };
    try {
      const { data } = await this.client.from('perfiles').select('*').eq('id', session.userId).maybeSingle();
      if (!data) return fallback;
      return {
        id: session.userId,
        email: data.correo ?? fallback.email,
        name: data.nombre ?? fallback.name,
        faculty: data.facultad ?? fallback.faculty,
        program: data.programa ?? fallback.program,
      };
    } catch {
      return fallback;
    }
  }
}
