import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AccountProfile, RegistrationInput } from '@emprendedor/core';
import type { AuthService, AuthSession } from './AuthService';

export interface AuthValue {
  session: AuthSession | null;
  profile: AccountProfile | null;
  /** true mientras se restaura la sesión del navegador: no se debe redirigir todavía. */
  cargando: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegistrationInput) => Promise<{ status: 'verification-required' | 'already-registered' }>;
  verifySignup: (email: string, code: string) => Promise<void>;
  resendSignupCode: (email: string) => Promise<void>;
  requestRecovery: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ service, children }: { service: AuthService; children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let active = true;
    const stop = service.onChange((s) => active && setSession(s));
    void service.getSession().then((s) => {
      if (!active) return;
      setSession((current) => current ?? s);
      setCargando(false);
    });
    return () => {
      active = false;
      stop();
    };
  }, [service]);

  // El perfil se carga aparte: no se llama a Supabase dentro del callback de cambio de sesión.
  const userId = session?.userId;
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let active = true;
    void service.getProfile(session).then((p) => active && setProfile(p));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia la persona
  }, [service, userId]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      cargando,
      signIn: (e, p) => service.signIn(e, p),
      signUp: (i) => service.signUp(i),
      verifySignup: (e, c) => service.verifySignup(e, c),
      resendSignupCode: (e) => service.resendSignupCode(e),
      requestRecovery: (e) => service.requestRecovery(e),
      // Tras fijar la contraseña se relee la sesión: ya no está marcada como de recuperación.
      resetPassword: async (e, c, p) => {
        await service.resetPassword(e, c, p);
        setSession(await service.getSession());
      },
      updatePassword: async (p) => {
        await service.updatePassword(p);
        setSession(await service.getSession());
      },
      changePassword: (cur, p) => service.changePassword(cur, p),
      signOut: () => service.signOut(),
    }),
    [service, session, profile, cargando],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return v;
}
