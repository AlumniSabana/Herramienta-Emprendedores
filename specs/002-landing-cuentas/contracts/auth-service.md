# Contrato: `AuthService` y `ResultsService`

Interfaces del lado web (`apps/web/src/auth/` y `apps/web/src/results/`). Las pantallas solo conocen estas interfaces; `SupabaseAuthService` es la implementación real y `FakeAuthService` la de pruebas. Tipos de entrada y reglas en [data-model.md](../data-model.md).

## AuthService

```ts
interface AuthService {
  /** Sesión actual restaurada del almacenamiento del navegador, o null. */
  getSession(): Promise<AuthSession | null>;
  /** Suscripción a cambios (ingreso, salida, renovación). Devuelve la función para cancelar. */
  onChange(listener: (session: AuthSession | null) => void): () => void;

  signUp(input: RegistrationInput): Promise<{ status: 'verification-required' | 'already-registered' }>;
  verifySignup(email: string, code: string): Promise<void>;       // deja la sesión iniciada
  resendSignupCode(email: string): Promise<void>;

  signIn(email: string, password: string): Promise<void>;          // lanza AuthError('email-not-verified') si falta verificar

  requestRecovery(email: string): Promise<void>;                   // no revela si el correo existe
  resetPassword(email: string, code: string, newPassword: string): Promise<void>; // deja la sesión iniciada

  signOut(): Promise<void>;
  getProfile(session: AuthSession): Promise<Profile>;              // perfiles → respaldo user_metadata
}

interface AuthSession { userId: string; email: string; accessToken: string }
interface Profile { id: string; email: string; name: string; faculty: string; program: string }
```

## Correspondencia con Supabase

| Método | Llamada |
|---|---|
| `signUp` | `auth.signUp({ email, password, options: { data: { nombre, facultad, programa, acuerdo_version, acuerdo_fecha } } })`; si `user.identities.length === 0` → `already-registered` |
| `verifySignup` | `auth.verifyOtp({ email, token, type: 'signup' })` |
| `resendSignupCode` | `auth.resend({ type: 'signup', email })` |
| `signIn` | `auth.signInWithPassword({ email, password })` |
| `requestRecovery` | `auth.resetPasswordForEmail(email)` |
| `resetPassword` | `auth.verifyOtp({ email, token, type: 'recovery' })` y luego `auth.updateUser({ password })` |
| `signOut` | `auth.signOut()` |
| `getProfile` | `from('perfiles').select('*').eq('id', userId).maybeSingle()`; si no hay fila o error de permisos, usa `user_metadata` |

El correo siempre se normaliza (recortar, minúsculas) antes de llamar; el código se limpia de espacios y saltos de línea.

## Errores (`AuthError`)

`AuthError` lleva un `code` estable y un mensaje en español listo para mostrar. `errors.ts` traduce los errores de Supabase una sola vez.

| `code` | Cuándo | Mensaje al usuario |
|---|---|---|
| `invalid-credentials` | correo o contraseña incorrectos | "El correo o la contraseña no coinciden." (no dice cuál) |
| `email-not-verified` | `email_not_confirmed` | "Tu correo aún no está verificado. Te enviamos un código." (lleva a `CodeStep`) |
| `already-registered` | correo existente | "Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña." |
| `invalid-code` | código incorrecto o vencido (`otp_expired`, token inválido) | "El código no es correcto o venció. Pide uno nuevo." |
| `rate-limited` | `over_email_send_rate_limit`, `over_request_rate_limit`, estado 429 | "Espera un momento antes de pedir otro código." |
| `weak-password` | contraseña rechazada por el servicio | "La contraseña debe tener al menos 8 caracteres." |
| `domain-not-allowed` | el servicio rechaza el dominio | "Usa tu correo institucional (@unisabana.edu.co)." |
| `network` | sin conexión o error de red | "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo." |
| `unknown` | cualquier otro | "Ocurrió un error inesperado. Inténtalo de nuevo." |

La recuperación (`requestRecovery`) devuelve siempre éxito aparente salvo `rate-limited` o `network`, para no revelar si el correo existe (FR-020, FR-029).

## ResultsService

```ts
interface ResultsService {
  /** Último resultado guardado de la persona con sesión, o null si nunca hizo el test. */
  getLatest(): Promise<StoredResult | null>;
}

interface StoredResult { id: string; scores: Record<ProfileId, number>; dominant: ProfileId[]; secondary: ProfileId[]; createdAt: string }
```

`SupabaseResultsService.getLatest()`: `from('diagnosticos_emprendedor').select('id,scores,dominant,secondary,created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()` con la sesión de la persona; RLS asegura que solo vea lo suyo.

## Guarda de rutas

`RequireAuth` lee `{ session, cargando }` del `AuthContext`: con `cargando` muestra un estado de carga; sin sesión redirige a `/ingresar` con `state.from = ubicación pedida`; con sesión renderiza la ruta. `LoginPage` y `RegisterPage` hacen el recorrido inverso: con sesión redirigen a `/diagnostico`.
