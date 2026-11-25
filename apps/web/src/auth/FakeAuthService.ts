import type { AccountProfile, RegistrationInput } from '@emprendedor/core';
import { cleanVerificationCode } from '@emprendedor/core';
import { type AuthService, type AuthSession } from './AuthService';
import { authError } from './errors';

export const FAKE_CODE = '123456';

interface FakeAccount {
  id: string;
  email: string;
  password: string;
  verified: boolean;
  name: string;
  faculty: string;
  program: string;
  recovery: boolean;
}

export interface FakeAccountSeed {
  email: string;
  password?: string;
  verified?: boolean;
  name?: string;
  faculty?: string;
  program?: string;
}

/** Cuentas en memoria para pruebas: el código de verificación y de recuperación es siempre `123456`. */
export class FakeAuthService implements AuthService {
  private readonly accounts = new Map<string, FakeAccount>();
  private session: AuthSession | null = null;
  private readonly listeners = new Set<(s: AuthSession | null) => void>();
  private counter = 0;

  /** Registro de llamadas, para que las pruebas comprueben lo enviado. */
  readonly signUps: RegistrationInput[] = [];
  readonly resends: string[] = [];
  readonly recoveries: string[] = [];
  /** Si es true, los reenvíos y la recuperación fallan con `rate-limited`. */
  rateLimited = false;
  /** Pausa artificial (ms) en signIn/signUp, para probar el doble envío. */
  delayMs = 0;

  constructor(opts: { accounts?: FakeAccountSeed[]; signedInAs?: string } = {}) {
    for (const a of opts.accounts ?? []) this.addAccount(a);
    if (opts.signedInAs) {
      if (!this.accounts.has(opts.signedInAs)) this.addAccount({ email: opts.signedInAs });
      this.session = this.toSession(this.accounts.get(opts.signedInAs)!);
    }
  }

  addAccount(seed: FakeAccountSeed): FakeAccount {
    const account: FakeAccount = {
      id: `user-${++this.counter}`,
      email: seed.email.toLowerCase(),
      password: seed.password ?? 'Clave_segura1',
      verified: seed.verified ?? true,
      name: seed.name ?? 'Ana Pérez',
      faculty: seed.faculty ?? 'Facultad de Ingeniería',
      program: seed.program ?? 'Ingeniería Industrial',
      recovery: false,
    };
    this.accounts.set(account.email, account);
    return account;
  }

  userIdFor(email: string): string | undefined {
    return this.accounts.get(email.toLowerCase())?.id;
  }

  /** userId al que pertenece un access_token emitido por este servicio. */
  userIdForToken(token: string): string | undefined {
    return [...this.accounts.values()].find((a) => `token-${a.id}` === token)?.id;
  }

  private toSession(a: FakeAccount): AuthSession {
    return {
      userId: a.id,
      email: a.email,
      accessToken: `token-${a.id}`,
      metadata: { nombre: a.name, facultad: a.faculty, programa: a.program },
      recovery: a.recovery,
    };
  }

  /** Equivale a abrir el enlace de recuperación del correo: sesión que solo puede fijar la contraseña nueva. */
  simulateRecoveryLink(email: string) {
    const account = this.accounts.get(email.toLowerCase())!;
    account.recovery = true;
    this.setSession(this.toSession(account));
  }

  private current(): FakeAccount {
    const account = [...this.accounts.values()].find((a) => a.id === this.session?.userId);
    if (!account) throw authError('invalid-credentials');
    return account;
  }

  private setSession(s: AuthSession | null) {
    this.session = s;
    for (const l of this.listeners) l(s);
  }

  private async pause() {
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
  }

  async getSession() {
    return this.session;
  }

  onChange(listener: (s: AuthSession | null) => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  async signUp(input: RegistrationInput) {
    await this.pause();
    this.signUps.push(input);
    if (this.accounts.has(input.email)) return { status: 'already-registered' as const };
    this.addAccount({
      email: input.email,
      password: input.password,
      verified: false,
      name: input.name,
      faculty: input.faculty,
      program: input.program,
    });
    return { status: 'verification-required' as const };
  }

  async verifySignup(email: string, code: string) {
    const account = this.accounts.get(email.toLowerCase());
    if (!account || cleanVerificationCode(code) !== FAKE_CODE) throw authError('invalid-code');
    account.verified = true;
    this.setSession(this.toSession(account));
  }

  async resendSignupCode(email: string) {
    if (this.rateLimited) throw authError('rate-limited');
    this.resends.push(email.toLowerCase());
  }

  async signIn(email: string, password: string) {
    await this.pause();
    const account = this.accounts.get(email.trim().toLowerCase());
    if (!account || account.password !== password) throw authError('invalid-credentials');
    if (!account.verified) throw authError('email-not-verified');
    this.setSession(this.toSession(account));
  }

  async requestRecovery(email: string) {
    if (this.rateLimited) throw authError('rate-limited');
    this.recoveries.push(email.toLowerCase());
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const account = this.accounts.get(email.toLowerCase());
    if (!account || cleanVerificationCode(code) !== FAKE_CODE) throw authError('invalid-code');
    account.password = newPassword;
    account.verified = true;
    account.recovery = false;
    this.setSession(this.toSession(account));
  }

  async updatePassword(newPassword: string) {
    const account = this.current();
    account.password = newPassword;
    account.recovery = false;
    this.setSession(this.toSession(account));
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const account = this.current();
    if (account.password !== currentPassword) throw authError('wrong-current-password');
    account.password = newPassword;
    this.setSession(this.toSession(account));
  }

  async signOut() {
    for (const a of this.accounts.values()) a.recovery = false;
    this.setSession(null);
  }

  async getProfile(session: AuthSession): Promise<AccountProfile> {
    const a = [...this.accounts.values()].find((x) => x.id === session.userId)!;
    return { id: a.id, email: a.email, name: a.name, faculty: a.faculty, program: a.program };
  }
}
