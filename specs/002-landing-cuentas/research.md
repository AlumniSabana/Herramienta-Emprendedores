# Research: Página principal, cuentas e ingreso

No quedan `NEEDS CLARIFICATION`. Las comprobaciones contra el proyecto Supabase de prueba se hicieron con la clave publishable y solo con lecturas (resultados en "Hechos verificados").

## Hechos verificados en el proyecto de prueba

| Comprobación | Resultado | Consecuencia |
|---|---|---|
| `GET /auth/v1/settings` | Proveedor de correo activo, registro abierto (`disable_signup: false`), confirmación de correo exigida (`mailer_autoconfirm: false`), sin proveedores externos | El flujo de registro con verificación funciona como en CDP |
| Tabla `perfiles` | Existe; la clave pública recibe "permission denied" sin sesión (esperado: RLS/permisos) | El perfil se lee con la sesión de la persona; si RLS no lo permite se usa `user_metadata` como respaldo (lo mismo hace la plataforma de CDP) |
| Tabla `diagnosticos_emprendedor` | No existe | La crea el script de [contracts/diagnosticos_emprendedor.sql](contracts/diagnosticos_emprendedor.sql) |

Lo que **no** se pudo comprobar sin crear una cuenta real y que queda como dato pendiente del solicitante: que las plantillas de correo de "Confirm signup" y "Reset password" incluyan el código (`{{ .Token }}`) y no solo un enlace, y que un disparador cree la fila de `perfiles` a partir de los metadatos del registro (ver quickstart).

## 1. Cliente de Supabase en el navegador con clave publishable

- **Decision**: `@supabase/supabase-js` en `apps/web/src/lib/supabase.ts`, creado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Sesión persistida y renovada por el propio cliente (`persistSession`, `autoRefreshToken`).
- **Rationale**: es el mismo mecanismo de la plataforma de CDP (se observó `signUp`, `verifyOtp`, `resend`, `signInWithPassword`, `resetPasswordForEmail`, `updateUser`, `signOut`, `onAuthStateChange`). La clave publishable está diseñada para el navegador; la seguridad real la da RLS.
- **Clave secreta**: no se usa. Fue pegada en el chat; el plan no la necesita y no se guarda en `.env`, repositorio ni Vercel. Se recomienda rotarla.
- **Alternatives considered**: un backend propio que haga de proxy de autenticación (más código y más superficie sin beneficio); `@supabase/ssr` con cookies (pensado para frameworks con servidor, aquí hay una SPA).

## 2. Registro, verificación y recuperación por código

- **Decision**:
  - Registro: `auth.signUp({ email, password, options: { data: { nombre, facultad, programa, acuerdo_version, acuerdo_fecha } } })`; si devuelve un usuario con `identities` vacío, el correo ya existe (el servicio no lo avisa como error) y se muestra "ya existe". Luego `auth.verifyOtp({ email, token, type: 'signup' })`; reenvío con `auth.resend({ type: 'signup', email })`.
  - Recuperación: `auth.resetPasswordForEmail(email)` → `auth.verifyOtp({ email, token, type: 'recovery' })` → `auth.updateUser({ password })`.
  - Ingreso: `auth.signInWithPassword`. Salida: `auth.signOut`.
- **Rationale**: calca el flujo observado en CDP, así las mismas cuentas funcionan en ambos sitios y los textos de los correos son los del proyecto. `acuerdo_version` y `acuerdo_fecha` en los metadatos cumplen FR-010.
- **Cuenta sin verificar** (FR-014): `signInWithPassword` devuelve el error `email_not_confirmed`; se detecta y se lleva a `CodeStep` con reenvío.
- **Dominio** (FR-007): se valida en el formulario con la función de `core` ya existente. La plataforma de CDP además reconoce el dominio en sus mensajes de error, lo que indica una regla en el servicio; esta herramienta no puede garantizarlo desde el cliente. Queda como riesgo declarado.
- **Límites de envío** (FR-011, FR-020): los aplica Supabase; la interfaz añade una cuenta atrás de 60 s antes de permitir el reenvío y traduce el error de límite.
- **Alternatives considered**: enlace mágico (la referencia usa código); registro sin verificación (contradice la spec).

## 3. Interfaces `AuthService` y `ResultsService`

- **Decision**: la interfaz `AuthService` expone `getSession`, `onChange`, `signUp`, `verifySignup`, `resendSignupCode`, `signIn`, `requestRecovery`, `resetPassword`, `signOut` y `getProfile` (contrato en [contracts/auth-service.md](contracts/auth-service.md)). `ResultsService.getLatest()` devuelve el último resultado de la persona. Un `AuthProvider` recibe el servicio por propiedad; `main.tsx` inyecta el de Supabase y las pruebas el falso.
- **Rationale**: aísla Supabase para pruebas rápidas y deterministas; los errores se normalizan una sola vez en `errors.ts`.
- **Alternatives considered**: simular `@supabase/supabase-js` con `vi.mock` en cada prueba (frágil y repetitivo).

## 4. Perfil

- **Decision**: tras iniciar sesión se lee `perfiles` con `eq('id', user.id).maybeSingle()`; si no hay fila o RLS no lo permite, se arma el perfil con `user_metadata` (nombre, facultad, programa). El campo `ultimo_acceso` no se actualiza desde esta herramienta.
- **Rationale**: igual que CDP; evita escribir en una tabla ajena y soporta el caso "perfil incompleto" de la spec.
- **Alternatives considered**: actualizar `ultimo_acceso` (modifica una tabla de la otra plataforma; fuera de alcance).

## 5. Guardado del resultado sin clave de servicio

- **Decision**: `POST /api/submissions` recibe `Authorization: Bearer <access_token>` y `{ answers }`. La función: (1) `TokenVerifier.verify(token)` con `supabase.auth.getUser(token)` (valida firma y vigencia en el servicio de cuentas); (2) valida las 45 respuestas con el esquema de `core`; (3) recalcula con `scoreAnswers`; (4) inserta en `diagnosticos_emprendedor` con un cliente creado con la clave publishable y el JWT de la persona como cabecera `Authorization`; la política RLS `with check (user_id = auth.uid())` acepta solo filas propias. Responde 201 con `{ id, scores, dominant, secondary, createdAt }`, 401 sin sesión válida, 400 si el cuerpo es inválido, 500 si falla el guardado.
- **Rationale**: cumple FR-023 a FR-025: el puntaje lo calcula el servidor, la fila queda ligada a la identidad verificada y no existe ninguna credencial con poder total en el despliegue.
- **Alternatives considered**: inserción directa desde el navegador con una función SQL que recalcule (duplicaría la lógica de puntaje en otro lenguaje); clave de servicio en Vercel (poder total sobre la base compartida con otra plataforma: riesgo desproporcionado).

## 6. Tabla `diagnosticos_emprendedor` y RLS

- **Decision**: tabla con `id uuid`, `user_id uuid` (referencia `auth.users`, borrado en cascada), `answers jsonb`, `scores jsonb`, `dominant text[]`, `secondary text[]`, `created_at timestamptz`. RLS activada con dos políticas: `select` y `insert` solo para `authenticated` y solo con `user_id = auth.uid()`; sin `update` ni `delete` (los resultados son un historial; borrar la cuenta los borra). Índice por `(user_id, created_at desc)` para leer el último. Script completo en [contracts/diagnosticos_emprendedor.sql](contracts/diagnosticos_emprendedor.sql) y prueba manual de aislamiento en [contracts/verify-rls.sql](contracts/verify-rls.sql).
- **Rationale**: FR-024 y FR-025 (historial propio, nadie más lo lee). El equipo CEIS no accede por ahora; cuando se necesite, se añadirá una política o vista aparte.
- **Riesgo de integridad (declarado)**: como la API inserta con el JWT de la persona, esa misma persona también podría insertar directamente con la clave publishable y su sesión, saltándose el recálculo del puntaje. RLS limita el daño a sus propias filas y las `CHECK` de la tabla exigen 45 respuestas y 5 puntajes, pero no que el puntaje coincida con las respuestas. Aceptable mientras el equipo CEIS no consulte estadísticas; antes de hacerlo, añadir un disparador `BEFORE INSERT` que recalcule `scores`, `dominant` y `secondary` desde `answers` y retirar el permiso de inserción directa.
- **Riesgo**: no se pueden ejecutar scripts DDL desde el código; el solicitante debe correr el SQL en el editor de Supabase (de prueba y luego producción).
- **Alternatives considered**: una fila por persona con "último resultado" (pierde el historial); guardar dentro de `perfiles` (tabla ajena).

## 7. Rutas, guardas y retorno

- **Decision**: React Router 7. Públicas: `/`, `/ingresar`, `/registro`, `/recuperar`. Protegidas por `RequireAuth`: `/diagnostico`, `/test/:bloque`, `/resultado`. Sin sesión se redirige a `/ingresar` con `state.from`; tras ingresar se vuelve a esa ruta (FR-016). Con sesión, `/ingresar` y `/registro` llevan a `/diagnostico` (FR-018) y la landing cambia sus botones por "Ir al diagnóstico" (FR-002). Mientras la sesión se restaura (`cargando`), se muestra un estado de carga y no se redirige.
- **Rationale**: el patrón estándar; el estado de carga evita parpadeos hacia el ingreso en una recarga.
- **Alternatives considered**: `loader`s del enrutador de datos (la app usa el modo de componentes de la 001).

## 8. Estado del test en la sesión

- **Decision**: `DiagnosticContext` conserva `answers`, `result` y `saveStatus` en `sessionStorage` y elimina `entry`. Al cerrar sesión se limpian. Si la sesión vence a mitad del test, las respuestas se conservan y tras reingresar se retoma (edge case de la spec). `/resultado` sin resultado en memoria muestra el último guardado de `ResultsService`; si no hay ninguno, lleva a `/diagnostico`.
- **Rationale**: continuidad sin duplicar lógica. Las respuestas ya no incluyen correo ni programa.
- **Alternatives considered**: guardar respuestas parciales en la base (fuera de alcance).

## 9. Apariencia TalentHub

- **Decision**: tokens en `styles.css` con `@theme`: `--color-navy: #00135B`, fondo `#EEF2F8`, bordes `#D9E1EF`, azul de acento `#00387D`, texto en gris azulado oscuro; radios de 8 a 12 px. Fuentes `@fontsource-variable/libre-franklin` (cuerpo) y `@fontsource-variable/playfair-display` (títulos, cursiva), alojadas en el propio sitio en lugar de Google Fonts. Encabezado de 64 px con marca, separador y nombre en cursiva, botones "Ingresar" (contorno translúcido) y "Crear cuenta" (blanco), menú de hamburguesa en móvil. Hero con degradado azul marino. La barra lateral de pasos de la 001 desaparece.
- **Rationale**: FR-003; los valores salen de la inspección directa de las páginas de referencia. Alojar las fuentes evita una petición a un tercero (privacidad y rendimiento) y funciona sin conexión a Google.
- **Pendiente**: logo oficial de TalentHub (marca de texto provisional "TalentHub UniSabana").
- **Alternatives considered**: mantener la paleta AlumniCV (la contradice la spec).

## 10. Contenido editable

- **Decision**: `landing.json` (hero, tarjeta de la herramienta con viñetas, tres pasos, bloque de privacidad, pie) y `faculties.json` (`{ id, name, programs: [{ id, name }] }[]`, con "Otra / no está en la lista" al final) en `packages/core/content/`, validados con Zod al cargar y por pruebas. `programs.json` se elimina; `programs` y `programById` dejan de usarse (el test ya no pide programa).
- **Rationale**: FR-004, FR-009, SC-010.
- **Alternatives considered**: textos en los componentes (viola FR-004).

## 11. Pruebas y accesibilidad

- **Decision**: pruebas de componentes con `FakeAuthService`/`FakeResultsService`: landing (enlaces y estado con sesión), registro (filtrado de programas por facultad, validaciones, paso de código, correo existente), ingreso (errores sin revelar el dato, cuenta sin verificar), recuperación, `RequireAuth` (retorno) y entrada al diagnóstico. En la API: `handleSubmission` con `TokenVerifier` falso (401, 400, 201, aislamiento por `userId`). `vitest-axe` en cada pantalla nueva. Contraste AA calculado sobre los tokens nuevos (en jsdom `axe` no lo evalúa).
- **Rationale**: SC-003, SC-004, SC-005 (parte de aplicación) y SC-009. El aislamiento real entre cuentas (SC-005) solo lo comprueba RLS en la base: lo cubre `verify-rls.sql`.

## 12. Desarrollo local y paso a producción

- **Decision**: `.env` local (ignorado por git) con las cuatro variables y las de la 001. El servidor de desarrollo de la API reenvía `Authorization`. El paso a producción es cambiar las variables en Vercel y ejecutar la misma migración en la base de producción.
- **Rationale**: lo pidió el solicitante: "después todo pasará a la base de prod".
- **Checklist de producción**: migración ejecutada, plantillas de correo con código, `perfiles` con su disparador, límites de envío revisados y clave secreta de prueba rotada.
