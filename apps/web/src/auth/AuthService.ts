import type { AccountProfile, RegistrationInput } from '@emprendedor/core';

export interface AuthSession {
  userId: string;
  email: string;
  accessToken: string;
  /** user_metadata de la cuenta: respaldo del perfil si `perfiles` no se puede leer. */
  metadata: Record<string, unknown>;
  /** true tras abrir un enlace de recuperación: solo puede definir la contraseña nueva. */
  recovery: boolean;
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-not-verified'
  | 'already-registered'
  | 'invalid-code'
  | 'link-expired'
  | 'wrong-current-password'
  | 'rate-limited'
  | 'weak-password'
  | 'domain-not-allowed'
  | 'network'
  | 'unknown';

/** Error de cuentas con código estable y mensaje en español listo para mostrar. */
export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthService {
  /** Sesión restaurada del almacenamiento del navegador, o null. */
  getSession(): Promise<AuthSession | null>;
  /** Cambios de sesión (ingreso, salida, renovación). Devuelve la función para cancelar. */
  onChange(listener: (session: AuthSession | null) => void): () => void;

  signUp(input: RegistrationInput): Promise<{ status: 'verification-required' | 'already-registered' }>;
  /** Deja la sesión iniciada. */
  verifySignup(email: string, code: string): Promise<void>;
  resendSignupCode(email: string): Promise<void>;

  /** Lanza AuthError('email-not-verified') si la cuenta no está verificada. */
  signIn(email: string, password: string): Promise<void>;

  /** No revela si el correo existe. */
  requestRecovery(email: string): Promise<void>;
  /** Deja la sesión iniciada. */
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;

  /** Con sesión de recuperación: fija la contraseña nueva y termina la recuperación. */
  updatePassword(newPassword: string): Promise<void>;
  /** Con sesión normal: comprueba la contraseña actual y la cambia. Lanza AuthError('wrong-current-password'). */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  signOut(): Promise<void>;
  getProfile(session: AuthSession): Promise<AccountProfile>;
}
