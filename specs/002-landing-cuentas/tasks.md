---

description: "Task list for Página principal, cuentas e ingreso"
---

# Tasks: Página principal, cuentas e ingreso

**Input**: Design documents from `/specs/002-landing-cuentas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md. Parte de la feature 001 ya implementada (74 pruebas en verde).

**Tests**: Se incluyen (la 001 ya usa Vitest + React Testing Library + `vitest-axe`). Las pruebas de cada fase se escriben primero y deben fallar antes de implementar. Toda la web se prueba con `FakeAuthService` y `FakeResultsService`; no hay pruebas contra la red.

**Organization**: Agrupadas por historia de usuario. **Orden de fases**: el solicitante pidió que el resultado quede guardado por usuario, se vea al iniciar sesión y se pueda rehacer, así que la historia 5 (P2) se construye **antes** que la 4 (P2, recuperar contraseña).

**Credenciales**: las claves y la cuenta de prueba que dio el solicitante **no se escriben en el repositorio** (ni en código, pruebas, specs ni README). La web usa solo URL + clave *publishable* desde `.env` (ignorado por git). La clave *secret* no se usa en ningún lado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario (US1–US5)
- Rutas relativas a la raíz del repositorio

## Path Conventions

Monorepo npm workspaces de la 001: `packages/core/`, `apps/web/`, `api/` (Vercel Functions, lógica en `api/_lib/`) y la carpeta nueva `supabase/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencias, variables, migración y tema visual

- [X] T001 Instalar `@supabase/supabase-js` como dependencia en el `package.json` raíz (lo usan web y API) y `@fontsource-variable/libre-franklin` y `@fontsource-variable/playfair-display` en `apps/web`; comprobar que `npm run build` sigue pasando (el repo vive en OneDrive: si Vite falla al resolver paquetes, revisar el rodeo de `apps/web/vite.config.ts`)
- [X] T002 [P] Actualizar `.env.example` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (vacías) y `SUBMISSION_REPOSITORY=supabase` (valores `supabase` o `memory`; se elimina `console`); `VITE_DATA_POLICY_URL=https://www.unisabana.edu.co/politica-de-proteccion-de-datos`; confirmar que `.gitignore` ya ignora `.env`
- [X] T003 [P] Copiar sin cambios `specs/002-landing-cuentas/contracts/diagnosticos_emprendedor.sql` a `supabase/migrations/20261125_diagnosticos_emprendedor.sql` y `specs/002-landing-cuentas/contracts/verify-rls.sql` a `supabase/verify-rls.sql`
- [X] T004 [P] Reemplazar los tokens y fuentes de `apps/web/src/styles.css` por los de TalentHub: `--color-navy: #00135B`, fondo `#EEF2F8`, bordes `#D9E1EF`, acento `#00387D`, texto gris azulado oscuro; cuerpo con Libre Franklin y títulos (`h1`, `.display`) con Playfair Display cursiva, importados desde `@fontsource-variable/*` (quitar el `@import` de Google Fonts); conservar `--color-field` y el anillo de foco de la 001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Núcleo, API v2, servicios de cuentas y resultados, encabezado y rutas protegidas que necesitan todas las historias

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

### Pruebas (escribirlas primero; deben fallar hasta implementar)

- [X] T005 [P] Escribir `packages/core/tests/auth-rules.test.ts`: contraseña "Mínimo 8 caracteres" (7 falla, 8 pasa); nombre recortado de "2 a 120 caracteres"; `faculty` debe existir en `faculties.json` y `program` pertenecer a esa facultad; correo recortado, en minúsculas y con dominio exactamente igual al permitido; `consent` debe ser `true`; el código se limpia de espacios y saltos de línea y exige solo dígitos no vacíos; `RecoveryInput` valida correo, código y contraseña nueva de mínimo 8
- [X] T006 [P] Actualizar `packages/core/tests/content.test.ts`: reemplazar la prueba de `programs` por `faculties`: 10 facultades con "Otra / no está en la lista" siempre la última, cada una con al menos un programa, ids únicos en todo el catálogo, 29 programas reales más los 3 de "Otra"
- [X] T007 [P] Reescribir `api/_lib/handleSubmission.test.ts` para el contrato v2 de `contracts/submissions-api.yaml` con un `FakeTokenVerifier`: 201 con `{ id, scores, dominant, secondary, createdAt }` y fila con el `userId` verificado; ignora `email`, `programId`, puntajes y cualquier campo extra del cuerpo; 401 sin token o con token inválido (nada se guarda); 400 con respuestas faltantes, sobrantes, fuera de 1–4, no enteras o sin `answers` (mensaje en español); 500 si el repositorio falla; el repositorio se llama una sola vez y solo en éxito
- [X] T008 [P] Escribir `apps/web/tests/errors.test.ts` según la tabla de `contracts/auth-service.md`: `invalid_credentials`→`invalid-credentials`, `email_not_confirmed`→`email-not-verified`, usuario ya registrado→`already-registered`, `otp_expired` o token inválido→`invalid-code`, `over_email_send_rate_limit` o estado 429→`rate-limited`, contraseña débil→`weak-password`, fallo de red→`network`, otro→`unknown`; cada código con su mensaje en español exacto

### Núcleo (packages/core)

- [X] T009 Actualizar `packages/core/src/types.ts` según data-model.md: `Submission = { id, userId, answers, scores, dominant, secondary, createdAt }` (se eliminan `email`, `programId`, `consentAcceptedAt`, `consentTextVersion`, `submittedAt`); eliminar `EntryData` y `CONSENT_TEXT_VERSION`; añadir `AGREEMENT_VERSION = '1.1'`, `Faculty`, `LandingContent`, `Profile` (`{ id, email, name, faculty, program }`), `RegistrationInput`, `RecoveryInput` y `StoredResult` (`{ id, scores, dominant, secondary, createdAt }`)
- [X] T010 [P] Crear `packages/core/content/faculties.json` con las 9 facultades y sus programas exactamente como en el spec (Escuela Internacional de Ciencias Económicas y Administrativas; Ciencias del Comportamiento; Ciencias de la Vida y el Bienestar; Comunicación; Educación; Estudios Jurídicos, Políticos e Internacionales; Filosofía y Ciencias Humanas; Ingeniería; Medicina) y al final "Otra / no está en la lista" con "Otro programa", "Posgrado" y "Egresado de un programa que ya no se ofrece"; ids en slug sin tildes
- [X] T011 Actualizar `packages/core/src/schemas.ts`: `SubmissionRequest = { answers }` (los campos extra se descartan); añadir `facultiesSchema` y los esquemas de `RegistrationInput` y `RecoveryInput` con los mensajes en español de data-model.md; quitar `programsSchema` y el esquema del correo/consentimiento de la 001 (depende de T009)
- [X] T012 Actualizar `packages/core/src/content.ts` para cargar y validar `faculties.json` y exportar `faculties`; eliminar `programs` y `packages/core/content/programs.json` (depende de T010, T011)
- [X] T013 Crear `packages/core/src/auth-rules.ts` con `MIN_PASSWORD_LENGTH = 8`, `validateRegistration(input, allowedDomain)`, `cleanVerificationCode(raw)` y `validateRecovery(input, allowedDomain)` reutilizando `validateInstitutionalEmail`; exportar desde `packages/core/src/index.ts`. Verificar que T005 y T006 pasan (depende de T009, T011, T012)

### API (backend)

- [X] T014 [P] Crear `api/_lib/auth/TokenVerifier.ts` (interfaz `verify(token): Promise<{ userId: string } | null>`) y `api/_lib/auth/FakeTokenVerifier.ts` para pruebas
- [X] T015 [P] Crear `api/_lib/auth/SupabaseTokenVerifier.ts`: crea un cliente con `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (sin persistir sesión) y valida con `auth.getUser(token)`; devuelve `null` ante cualquier error o usuario ausente
- [X] T016 [P] Crear `api/_lib/repositories/SupabaseSubmissionRepository.ts`: cliente con la clave publishable y cabecera `Authorization: Bearer <accessToken>` de la persona; inserta en `diagnosticos_emprendedor` (`user_id`, `answers`, `scores`, `dominant`, `secondary`) y lanza si hay error; **no usa clave de servicio**
- [X] T017 Actualizar `api/_lib/repositories/index.ts` con `createRepository(env, accessToken)` (`memory` o `supabase`, por defecto `supabase`) y eliminar `api/_lib/repositories/ConsoleSubmissionRepository.ts`; ajustar `InMemorySubmissionRepository.ts` al nuevo tipo `Submission` (depende de T009, T016)
- [X] T018 Reescribir `api/_lib/handleSubmission.ts`: `handleSubmission({ body, accessToken }, { verifier, repositoryFor })`: sin token o `verify` nulo → 401; cuerpo no objeto o `answers` inválidas → 400 con mensaje en español; recalcula con `scoreAnswers`; arma `Submission` con el `userId` verificado y `createdAt` ISO 8601 UTC; guarda y responde 201 con `{ id, scores, dominant, secondary, createdAt }`; fallo al guardar → 500 con el mensaje de la 001. Verificar que T007 pasa (depende de T007, T009, T011, T014, T017)
- [X] T019 Actualizar `api/submissions.ts` para leer `Authorization` (formato `Bearer <token>`), crear `SupabaseTokenVerifier` y delegar en `handleSubmission` (405 si no es POST), y `api/_lib/devServer.ts` para reenviar la cabecera `Authorization` (depende de T015, T018)

### Web: cuentas, resultados y estructura

- [X] T020 [P] Crear `apps/web/src/lib/supabase.ts`: un único cliente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (`persistSession` y `autoRefreshToken` activos); si faltan variables, lanza un error claro en español al arrancar
- [X] T021 [P] Crear `apps/web/src/auth/AuthService.ts` con la interfaz, `AuthSession` y `AuthError` (con `code` y mensaje) exactamente como en `contracts/auth-service.md`
- [X] T022 Crear `apps/web/src/auth/errors.ts` con `toAuthError(error)` según la tabla de errores del contrato (depende de T021). Verificar que T008 pasa
- [X] T023 [P] Crear `apps/web/src/auth/FakeAuthService.ts`: implementación en memoria con cuentas sembradas, códigos fijos (`123456`), estados "sin verificar" y "ya registrada", cuenta atrás de reenvío simulable y una sesión inicial opcional (depende de T021)
- [X] T024 Crear `apps/web/src/auth/SupabaseAuthService.ts` según la tabla "Correspondencia con Supabase" del contrato: `signUp` con `options.data = { nombre, facultad, programa, acuerdo_version: AGREEMENT_VERSION, acuerdo_fecha }` (fecha-hora ISO 8601 UTC) y `already-registered` cuando `user.identities.length === 0`; `verifyOtp` de tipo `signup` y `recovery`; `resend`; `signInWithPassword`; `resetPasswordForEmail`; `updateUser`; `signOut`; `getProfile` leyendo `perfiles` con `eq('id', userId).maybeSingle()` y, si no hay fila o permiso, `user_metadata`; normalizar correo (recortar, minúsculas) y código antes de llamar (depende de T020, T021, T022)
- [X] T025 Crear `apps/web/src/auth/AuthContext.tsx`: `AuthProvider` recibe el `AuthService`, expone `{ session, profile, cargando, signIn, signUp, verifySignup, resendSignupCode, requestRecovery, resetPassword, signOut }`, restaura la sesión con `getSession`, se suscribe con `onChange` y carga el perfil al iniciar sesión (depende de T021)
- [X] T026 [P] Crear `apps/web/src/results/ResultsService.ts` (interfaz `getLatest(): Promise<StoredResult | null>`) y `apps/web/src/results/FakeResultsService.ts` (historial en memoria por usuario, el más reciente primero)
- [X] T027 [P] Crear `apps/web/src/results/SupabaseResultsService.ts`: `from('diagnosticos_emprendedor').select('id,scores,dominant,secondary,created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()` con la sesión de la persona; devuelve `null` si no hay filas (depende de T020, T026)
- [X] T028 Crear `apps/web/src/auth/RequireAuth.tsx`: con `cargando` muestra un estado de carga y no redirige; sin sesión redirige a `/ingresar` con `state.from` = ubicación pedida; con sesión renderiza `<Outlet />` (depende de T025)
- [X] T029 Actualizar `apps/web/src/state/DiagnosticContext.tsx`: eliminar `entry` y `setEntry`; conservar `answers`, `result`, `saveStatus` en `sessionStorage` con la misma clave; ampliar `SaveStatus` con `'unauthorized'`; añadir `clearAll()` (se llama al cerrar sesión); mantener `restartTest()`, `firstIncompleteBlock` e `isComplete`
- [X] T030 [P] Actualizar `apps/web/src/api/submitDiagnostic.ts`: `submitDiagnostic(accessToken, answers)` envía `POST /api/submissions` con `Authorization: Bearer <accessToken>` y solo `{ answers }`; devuelve `{ ok: true } | { ok: false, unauthorized: boolean }` (401 → `unauthorized`); nunca lanza
- [X] T031 [P] Actualizar `apps/web/src/components/ui.tsx` con la apariencia TalentHub: botones primario (azul marino), secundario (contorno) y `onDark` (blanco), radios 8 px, tarjeta con borde `#D9E1EF`, y un componente `Eyebrow` (mayúsculas pequeñas con espaciado, azul); conservar `ProgressBar` (depende de T004)
- [X] T032 [P] Crear `apps/web/src/components/SiteHeader.tsx`, `SiteFooter.tsx` y `SiteLayout.tsx` (encabezado de 64 px azul marino con marca de texto provisional "TalentHub UniSabana", separador y "Diagnóstico emprendedor" en cursiva; sin sesión "Ingresar" y "Crear cuenta"; con sesión nombre o correo y "Cerrar sesión" que llama a `signOut`, limpia `DiagnosticContext` y navega a `/`; menú de hamburguesa en móvil; pie con "© 2026 Universidad de La Sabana · Centro de Desarrollo Profesional" y enlace a `VITE_DATA_POLICY_URL`) (depende de T025, T029, T031)
- [X] T033 Actualizar `apps/web/src/pages/BlockPage.tsx`: quitar el uso de `entry`; al finalizar, calcular `scoreAnswers` localmente y llamar a `submitDiagnostic(session.accessToken, answers)`; `saveStatus` queda en `saved`, `failed` o `unauthorized` (depende de T025, T029, T030)
- [X] T034 Reescribir `apps/web/src/routes.tsx` y `apps/web/src/main.tsx`: `SiteLayout` envolviendo las rutas; rutas protegidas con `RequireAuth` para `/test/:bloque` (con la guarda de bloque de la 001) y `/resultado` (exige `result`; si no hay, redirige a `/diagnostico`); `main.tsx` crea `SupabaseAuthService` y `SupabaseResultsService` y los inyecta en `AuthProvider` y un `ResultsProvider` (depende de T025–T029, T032, T033)
- [X] T035 Retirar `apps/web/src/pages/EntryPage.tsx`, `apps/web/src/components/AppShell.tsx` y `apps/web/tests/EntryPage.test.tsx`; actualizar `apps/web/tests/helpers.tsx` (envolver con `AuthProvider` + `FakeAuthService` con sesión iniciada y `FakeResultsService`; `seed` sin `entry`) y ajustar `BlockPage.test.tsx`, `ResultPage.test.tsx`, `ProfileDetail.test.tsx`, `SourcesAndRepeat.test.tsx` y `routes.test.tsx` (los casos que dependen de `/ingresar` se reescriben en la historia 3); todas las pruebas en verde (depende de T034)

**Checkpoint**: núcleo, API v2 y servicios probados (`npm test` en verde); `/test/*` y `/resultado` funcionan con una sesión simulada. La web no es recorrible a mano hasta terminar las historias 1 a 3.

---

## Phase 3: User Story 1 - Entender qué es la herramienta desde la página principal (Priority: P1) 🎯 MVP

**Goal**: Landing pública que explica la herramienta y lleva a crear cuenta o ingresar.

**Independent Test**: Abrir `/` sin sesión: se explica la herramienta y desde el encabezado y el hero se llega a registro e ingreso; con sesión aparece "Ir al diagnóstico".

### Tests for User Story 1 ⚠️

- [X] T036 [P] [US1] Escribir `apps/web/tests/LandingPage.test.tsx`: aparece el título del hero, qué mide (cinco perfiles, 9 bloques de 5 afirmaciones, radar), tiempo aproximado, tarjeta con 4 viñetas, 3 pasos y bloque de privacidad; los botones "Crear mi cuenta" y "Ya tengo cuenta" y los del encabezado llevan a `/registro` y `/ingresar`; con sesión se muestra "Ir al diagnóstico" y no los de crear cuenta e ingresar; sin violaciones de `vitest-axe`

### Implementation for User Story 1

- [X] T037 [P] [US1] Crear `packages/core/content/landing.json` según `contracts/content-files.md`: `hero`, `tool` con exactamente 4 viñetas, `steps` con exactamente 3 pasos, `privacy` (menciona cuenta, respuestas y resultados guardados, y que solo la persona los ve) y `footer`; textos en español con el tono de la referencia (el solicitante los aprueba antes de publicar)
- [X] T038 [US1] Añadir `landingSchema` en `packages/core/src/schemas.ts` y exportar `landing` desde `packages/core/src/content.ts`; añadir a `packages/core/tests/content.test.ts` la comprobación de 4 viñetas, 3 pasos y ningún texto vacío (depende de T037)
- [X] T039 [US1] Crear `apps/web/src/pages/LandingPage.tsx`: hero con degradado azul marino, eyebrow, título en cursiva y los dos botones (blanco y contorno); tarjeta de la herramienta con icono, viñetas con check y botón de abrir; sección "Cómo funciona" de 3 pasos numerados; bloque de privacidad; con sesión los botones del hero cambian por "Ir al diagnóstico" (depende de T038, T032)
- [X] T040 [US1] Registrar la ruta pública `/` en `apps/web/src/routes.tsx` y hacer que `*` redirija a `/` (depende de T039)

**Checkpoint**: la landing se ve y navega; los botones llevan a rutas que se completan en las historias 2 y 3

---

## Phase 4: User Story 2 - Crear cuenta y verificar el correo (Priority: P1)

**Goal**: Registro con nombre, facultad, programa, correo, contraseña y consentimiento; verificación con código; sesión iniciada al terminar.

**Independent Test**: Registrar con datos válidos, escribir el código y quedar dentro; probar los rechazos (dominio, contraseña corta, sin consentimiento, correo ya registrado, código incorrecto).

### Tests for User Story 2 ⚠️

- [X] T041 [P] [US2] Escribir `apps/web/tests/RegisterPage.test.tsx` con `FakeAuthService`: el campo programa muestra solo los programas de la facultad elegida y queda vacío al cambiar de facultad; rechazos de dominio, contraseña de 7 caracteres y consentimiento sin marcar (cada error asociado a su campo con `aria-describedby`); con datos válidos pasa al paso de código sin entrar todavía; código correcto → sesión y navegación a `/diagnostico`; código incorrecto → mensaje y opción de reenviar con cuenta atrás de 60 s; correo ya registrado → mensaje con enlaces a ingresar y recuperar; doble clic no envía dos veces; con sesión iniciada `/registro` redirige a `/diagnostico`; sin violaciones de `vitest-axe`

### Implementation for User Story 2

- [X] T042 [P] [US2] Crear `apps/web/src/components/Field.tsx` (etiqueta, ayuda y error asociados al control con `aria-describedby`, `aria-invalid` y `role="alert"`) y `apps/web/src/components/PasswordField.tsx` (con botón accesible para mostrar u ocultar y ayuda "Mínimo 8 caracteres.")
- [X] T043 [US2] Crear `apps/web/src/components/CodeStep.tsx`: campo de código (limpia espacios y saltos de línea con `cleanVerificationCode`), botón verificar, reenvío con cuenta atrás de 60 s, estado de envío anunciado (`role="status"`), error con `role="alert"` y foco al primer elemento de la pantalla al montarse; se reutiliza en registro, ingreso (cuenta sin verificar) y recuperación (depende de T042)
- [X] T044 [US2] Crear `apps/web/src/pages/RegisterPage.tsx`: título "Crea tu cuenta" en cursiva, subtítulo de la referencia, campos nombre completo, facultad, programa (dependiente), correo institucional (placeholder `nombre.apellido@unisabana.edu.co`), contraseña y casilla con el texto de consentimiento (Ley 1581 de 2012, versión `AGREEMENT_VERSION`) y enlace a la política; validar con `validateRegistration`; enviar con `signUp` y, si es `verification-required`, mostrar `CodeStep`; `already-registered` muestra el mensaje con enlaces; bloquear el envío mientras hay una solicitud en curso; conservar lo escrito (menos la contraseña) ante errores (depende de T043, T012, T013, T025)
- [X] T045 [US2] Registrar la ruta pública `/registro` en `apps/web/src/routes.tsx`, con redirección a `/diagnostico` si ya hay sesión (depende de T044)

**Checkpoint**: US1 y US2 permiten llegar de la landing a una cuenta verificada

---

## Phase 5: User Story 3 - Ingresar, usar el diagnóstico y cerrar sesión (Priority: P1)

**Goal**: Ingreso con correo y contraseña, rutas protegidas con retorno, pantalla de entrada al diagnóstico y cierre de sesión.

**Independent Test**: Ingresar con una cuenta verificada y llegar a `/diagnostico`; cerrar sesión y comprobar que `/test/1` ya no abre; probar contraseña errónea y cuenta sin verificar.

### Tests for User Story 3 ⚠️

- [X] T046 [P] [US3] Escribir `apps/web/tests/LoginPage.test.tsx`: credenciales incorrectas muestran "El correo o la contraseña no coinciden." sin decir cuál falló; cuenta sin verificar lleva al `CodeStep` con reenvío; ingreso correcto lleva a la ruta pedida (`state.from`) o a `/diagnostico`; enlaces "Olvidé mi contraseña" (`/recuperar`) y "Créala aquí" (`/registro`); con sesión `/ingresar` redirige a `/diagnostico`; sin violaciones de `vitest-axe`
- [X] T047 [P] [US3] Escribir `apps/web/tests/RequireAuth.test.tsx` y ampliar `apps/web/tests/routes.test.tsx`: sin sesión `/test/1` y `/resultado` redirigen a `/ingresar` con retorno; con `cargando` no redirige; con sesión pasan; al cerrar sesión se limpian `answers` y `result` de `sessionStorage` y `/test/1` deja de abrir
- [X] T048 [P] [US3] Escribir `apps/web/tests/DiagnosticHomePage.test.tsx`: sin resultado guardado muestra cómo empezar el test; con resultado guardado muestra el último resultado (perfil dominante y fecha) con "Ver mi resultado" y "Rehacer el test"; sin violaciones de `vitest-axe`

### Implementation for User Story 3

- [X] T049 [US3] Crear `apps/web/src/pages/LoginPage.tsx`: título "Ingresa a tu cuenta" en cursiva, subtítulo "Usa tu correo institucional.", correo y contraseña, botón "Ingresar" a todo el ancho, "Olvidé mi contraseña" y "¿Aún no tienes cuenta? Créala aquí"; manejar `email-not-verified` mostrando `CodeStep` con reenvío; volver a `state.from` tras ingresar; evitar envíos dobles (depende de T043, T025)
- [X] T050 [US3] Crear `apps/web/src/pages/DiagnosticHomePage.tsx`: saludo con el nombre del perfil; consulta `ResultsService.getLatest()` al montarse con estado de carga; sin resultado: explicación breve y botón "Empezar el test" (`/test/1`); con resultado: tarjeta con perfil dominante, fecha y botones "Ver mi resultado" y "Rehacer el test" (depende de T026, T025)
- [X] T051 [US3] Registrar en `apps/web/src/routes.tsx` la ruta pública `/ingresar` (redirige a `/diagnostico` con sesión) y la protegida `/diagnostico`; comprobar que "Cerrar sesión" del encabezado vuelve a `/` (depende de T049, T050, T034)

**Checkpoint**: US1 a US3 forman el MVP: landing → cuenta → ingreso → test protegido

---

## Phase 6: User Story 5 - Mis resultados quedan con mi cuenta (Priority: P2)

**Goal**: El resultado se guarda por usuario, se ve al volver a iniciar sesión y se puede rehacer conservando el historial.

**Independent Test**: Completar el test con una cuenta, cerrar sesión, volver a ingresar y ver el mismo resultado en `/diagnostico`; "Rehacer el test" empieza de cero y el nuevo resultado pasa a ser el mostrado; otra cuenta nunca ve ese resultado.

### Tests for User Story 5 ⚠️

- [X] T052 [P] [US5] Escribir `apps/web/tests/ResultsFlow.test.tsx` con `FakeAuthService` y `FakeResultsService` (cliente HTTP simulado): al finalizar el test se llama a la API con el token y solo `{ answers }`; al volver a `/diagnostico` aparece el último resultado; "Ver mi resultado" abre `/resultado` con radar y detalle a partir del resultado guardado, sin las 45 respuestas en memoria; "Rehacer el test" limpia respuestas y resultado en memoria y lleva a `/test/1`, y al terminar el historial conserva el anterior y el último pasa a ser el mostrado; dos cuentas distintas no ven resultados de la otra; con 401 se muestra el aviso "Tu sesión venció" y se conservan las respuestas; con fallo de guardado se muestra el resultado con el aviso no bloqueante

### Implementation for User Story 5

- [X] T053 [US5] En `apps/web/src/pages/DiagnosticHomePage.tsx`, "Ver mi resultado" copia el resultado guardado a `DiagnosticContext` (`setResult`) y navega a `/resultado`; "Rehacer el test" llama a `restartTest()` y navega a `/test/1` con un texto que aclara "Tu resultado anterior se conserva"; tras terminar un test nuevo, `/diagnostico` consulta de nuevo (depende de T050, T029)
- [X] T054 [US5] En `apps/web/src/routes.tsx` cambiar la guarda de `/resultado` para exigir solo `result` en `DiagnosticContext` (ya no las 45 respuestas) y, si no hay, redirigir a `/diagnostico` (depende de T034)
- [X] T055 [US5] En `apps/web/src/pages/ResultPage.tsx` mostrar el aviso no bloqueante cuando `saveStatus` sea `failed` y, cuando sea `unauthorized`, el aviso "Tu sesión venció" con botón "Ingresar de nuevo" que conserva las respuestas y reintenta el guardado tras ingresar; mantener "Repetir el test" de la 001 apuntando a `restartTest()` (depende de T033)
- [X] T056 [US5] Comprobar de punta a punta en `apps/web/tests/ResultsFlow.test.tsx` que T052 pasa y que las pruebas de `ResultPage.test.tsx` y `SourcesAndRepeat.test.tsx` siguen en verde

**Checkpoint**: el historial por usuario funciona en la web con servicios simulados; la parte real (Supabase y RLS) se valida en las tareas manuales de Polish

---

## Phase 7: User Story 4 - Recuperar la contraseña (Priority: P2)

**Goal**: Pedir un código al correo, escribirlo y definir una contraseña nueva.

**Independent Test**: Desde el ingreso pedir recuperación, escribir el código, definir una contraseña nueva e ingresar con ella; con un correo sin cuenta la respuesta visible es igual.

### Tests for User Story 4 ⚠️

- [X] T057 [P] [US4] Escribir `apps/web/tests/RecoverPage.test.tsx` con `FakeAuthService`: pedir código con un correo con cuenta y con uno sin cuenta muestra exactamente la misma pantalla de código; código correcto y contraseña nueva de mínimo 8 caracteres cambian la contraseña y dejan la sesión iniciada; contraseña corta, código incorrecto o vencido muestran error y permiten pedir otro; límite de envíos muestra "Espera un momento antes de pedir otro código."; sin violaciones de `vitest-axe`

### Implementation for User Story 4

- [X] T058 [US4] Crear `apps/web/src/pages/RecoverPage.tsx`: paso 1 (correo → `requestRecovery`), paso 2 con `CodeStep` ampliado con campo de contraseña nueva (`PasswordField`) → `resetPassword`; misma respuesta exista o no la cuenta (solo `rate-limited` y `network` se muestran como error); al terminar, navegar a `/diagnostico` (depende de T043, T025)
- [X] T059 [US4] Registrar la ruta pública `/recuperar` en `apps/web/src/routes.tsx` y comprobar que el enlace "Olvidé mi contraseña" de `LoginPage` la abre (depende de T058)

**Checkpoint**: Todas las historias funcionan con servicios simulados

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificación contra la spec, seguridad, documentación y pruebas contra el proyecto de Supabase

- [X] T060 [P] Revisión responsive a 360 px de landing, registro con código, ingreso, recuperación y `/diagnostico`: sin desplazamiento horizontal, menú de hamburguesa operable, formularios legibles (SC-009)
- [X] T061 [P] Calcular el contraste AA de los tokens nuevos de `apps/web/src/styles.css` (texto sobre `#EEF2F8` y sobre blanco, botón blanco sobre el degradado del hero, "Ingresar" translúcido sobre `#00135B`, eyebrow azul, estados de foco y de error) y ajustar los valores que no lleguen a 4.5:1 (texto) o 3:1 (controles)
- [X] T062 [P] Actualizar `README.md`: cuentas con Supabase (variables, solo clave publishable), ejecutar la migración y `verify-rls.sql`, plantillas de correo con `{{ .Token }}`, rutas de la aplicación, paso a producción (cuatro variables y migración en la base de producción) y recomendación de rotar la clave secreta compartida; quitar lo que dice que el correo se registra en los logs
- [X] T063 Comprobar la seguridad de credenciales: `git grep -n "sb_secret_"` sin resultados, `.env` no aparece en `git status`, ninguna contraseña de cuenta de prueba en el repositorio y ningún uso de clave de servicio en `api/` ni `apps/web/`
- [ ] T064 [Manual, solicitante] Ejecutar `supabase/migrations/20261125_diagnosticos_emprendedor.sql` en el SQL Editor del proyecto de prueba, comprobar que la tabla aparece con RLS activada y ejecutar `supabase/verify-rls.sql` con dos cuentas (cinco avisos `OK`); repetir después en producción
- [ ] T065 [Manual, solicitante] Revisar en Supabase → Authentication → Email Templates que "Confirm signup" y "Reset password" incluyan `{{ .Token }}` y que exista el disparador que crea la fila de `perfiles` desde los metadatos del registro; aprobar el texto del acuerdo de datos (versión `1.1`) y los textos de `landing.json`; aportar el logo de TalentHub
- [ ] T066 Ejecutar los 12 escenarios manuales de `specs/002-landing-cuentas/quickstart.md` contra el proyecto de prueba con la cuenta de prueba que el solicitante indicó (credenciales fuera del repositorio; si el solicitante prefiere, las escribe él en el navegador) y registrar el resultado de cada uno
- [X] T067 Ejecutar `npm run build` y `npm test` completos (core, api y web) y confirmar que no queda ninguna referencia a `programs`, `EntryPage`, `AppShell`, `ConsoleSubmissionRepository` ni `CONSENT_TEXT_VERSION` (`git grep`)

---

## Phase 9: Enmienda — enlace del correo y configuración de cuenta (US2, US4 y US6)

**Origen**: el solicitante decidió no configurar SMTP propio; las plantillas de correo quedan por defecto (con enlace). Ver "Enmienda 2026-11-25" en spec.md. Se admiten **enlace y código** (el código sigue sirviendo si la plantilla del proyecto lo trae, como en producción de CDP).

**Goal**: Recuperar contraseña y verificar el correo con el enlace del correo, con una pantalla obligatoria de contraseña nueva, y una pantalla "Mi cuenta" donde se cambia la contraseña.

**Independent Test**: Con el servicio simulado: una sesión de recuperación solo puede usar `/restablecer`; definir la contraseña nueva libera el acceso; en `/cuenta` se cambia la contraseña con la actual.

### Tests ⚠️ (escribir primero)

- [X] T068 [P] [US4] Escribir `apps/web/tests/ResetPasswordPage.test.tsx`: con sesión de recuperación `/restablecer` muestra "Define tu nueva contraseña" con confirmación; contraseña de menos de 8 caracteres o confirmación distinta se rechazan en su campo; al guardar queda libre el acceso y lleva a `/diagnostico`; sin sesión ni enlace válido muestra "Este enlace no es válido o ya venció" con acceso a `/recuperar`; un error de enlace guardado (`otp_expired`) se muestra como "El enlace venció o ya fue usado"; una sesión normal (sin recuperación) en `/restablecer` redirige a `/cuenta`; sin violaciones de `vitest-axe`
- [X] T069 [P] [US6] Escribir `apps/web/tests/AccountPage.test.tsx`: muestra nombre, facultad, programa y correo; la contraseña actual incorrecta da "La contraseña actual no es correcta."; nueva de menos de 8 caracteres o confirmación distinta se rechazan en su campo; éxito muestra "Contraseña actualizada." sin cerrar la sesión y la contraseña nueva sirve para ingresar; el encabezado ofrece "Mi cuenta"; sin sesión lleva a `/ingresar`; sin violaciones de `vitest-axe`
- [X] T070 [P] [US4] Ampliar `apps/web/tests/RequireAuth.test.tsx`: una sesión marcada como `recovery` redirige cualquier ruta protegida a `/restablecer`, también tras recargar; "Cancelar" cierra la sesión

### Implementation

- [X] T071 [US4] Ampliar `apps/web/src/auth/AuthService.ts` y `FakeAuthService.ts`: `AuthSession.recovery: boolean`; `updatePassword(newPassword)` (termina la recuperación y deja la sesión normal) y `changePassword(currentPassword, newPassword)` (comprueba la actual; error `invalid-credentials`); el simulador gana `simulateRecoveryLink(email)`
- [X] T072 [US4] Actualizar `apps/web/src/auth/SupabaseAuthService.ts` y `apps/web/src/lib/supabase.ts`: volver a `detectSessionInUrl: true` (el control de seguridad pasa a ser la guarda de recuperación); `requestRecovery` y `signUp` envían `redirectTo`/`emailRedirectTo` = `${origin}/restablecer` y `${origin}/diagnostico`; marcar la sesión como `recovery` al evento `PASSWORD_RECOVERY` o si la URL trae `type=recovery` (suscribirse en el constructor y guardar la marca en `sessionStorage`); `updatePassword` hace `updateUser` y borra la marca; `signOut` la borra; `changePassword` hace `signInWithPassword` con la actual y luego `updateUser`
- [X] T073 [US4] En `apps/web/src/main.tsx` capturar antes de crear el cliente el error del enlace en `window.location.hash` (`error_code=otp_expired`, `access_denied`) y guardarlo en `sessionStorage` (`auth-link-error`); en `apps/web/src/auth/errors.ts` añadir `link-expired`: "El enlace venció o ya fue usado. Pide uno nuevo."
- [X] T074 [US4] Actualizar `apps/web/src/auth/AuthContext.tsx` (exponer `updatePassword` y `changePassword`) y `apps/web/src/auth/RequireAuth.tsx` (si `session.recovery`, redirigir a `/restablecer`) (depende de T071)
- [X] T075 [US4] Crear `apps/web/src/pages/ResetPasswordPage.tsx`: tres estados (con sesión de recuperación: formulario de contraseña nueva y confirmación, con "Cancelar" que cierra sesión; sin sesión: "Este enlace no es válido o ya venció" y el error guardado si existe, con enlace a `/recuperar`; con sesión normal: redirige a `/cuenta`) (depende de T074)
- [X] T076 [US6] Crear `apps/web/src/pages/AccountPage.tsx`: datos del perfil en solo lectura y formulario de cambio de contraseña (actual, nueva, confirmación; mensajes del contrato; éxito con `role="status"`) (depende de T074)
- [X] T077 [US6] En `apps/web/src/components/SiteHeader.tsx` añadir "Mi cuenta" (enlace del nombre en escritorio y entrada del menú móvil) y registrar en `apps/web/src/routes.tsx` la ruta pública `/restablecer` y la protegida `/cuenta` (depende de T075, T076)
- [X] T078 [US2] Ajustar los textos de `RegisterPage.tsx`, `LoginPage.tsx` y `RecoverPage.tsx` para admitir enlace y código ("Abre el enlace del correo. Si en lugar del enlace te llegó un código, escríbelo aquí."); en la recuperación, el paso 2 ofrece el enlace y el código con la contraseña nueva; actualizar sus pruebas
- [ ] T079 [Manual, solicitante] En Supabase → Authentication → URL Configuration, poner el Site URL de la aplicación y añadir en Redirect URLs `http://localhost:5173/**` y la dirección de producción; dejar las plantillas por defecto
- [X] T080 Ejecutar `npm run build` y `npm test`, y actualizar `README.md` (enlace y código, `/restablecer`, `/cuenta`, direcciones de redirección)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; **bloquea** todas las historias
- **US1, US2, US3 (P1)**: tras Foundational. US1 y US2 son independientes entre sí; US3 reutiliza `CodeStep` (T043) de US2
- **US5 (P2)**: depende de US3 (`DiagnosticHomePage`, rutas protegidas)
- **US4 (P2)**: depende de `CodeStep` (T043); puede ir en paralelo con US5
- **Polish**: depende de las historias deseadas; T064 y T065 son del solicitante y se pueden hacer desde el principio

### Within Foundational

- T009 → T011 → T012 → T013; T010 → T012
- T005, T006, T007, T008 antes de sus implementaciones y deben fallar primero
- API: T014, T015, T016 en paralelo → T017 → T018 → T019 (incluye el servidor de desarrollo)
- Web: T020, T021 en paralelo → T022, T023 → T024; T025 → T028; T026 → T027; T029 → T033; T031 → T032; todo converge en T034 → T035

### Parallel Opportunities

- Setup: T002, T003, T004
- Foundational: T005–T008 (pruebas); T010; T014–T016; T020, T021, T023, T026, T027, T030, T031, T032
- US1: T036 y T037; US2: T041 y T042; US3: T046, T047, T048
- Polish: T060, T061, T062

---

## Parallel Example: Foundational (pruebas primero)

```text
Task: "auth-rules.test.ts en packages/core/tests/auth-rules.test.ts"
Task: "content.test.ts (facultades) en packages/core/tests/content.test.ts"
Task: "handleSubmission.test.ts v2 en api/_lib/handleSubmission.test.ts"
Task: "errors.test.ts en apps/web/tests/errors.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Setup y Foundational (núcleo, API v2 y servicios probados con simulaciones)
2. US1 landing → US2 registro → US3 ingreso y entrada al diagnóstico
3. **Validar el MVP** con el solicitante: ejecutar T064 y T065 en el proyecto de prueba y recorrer a mano landing → registro con código → ingreso → test

### Incremental Delivery

1. MVP → demo
2. US5 (resultados por usuario, ver al volver, rehacer) → demo con cuenta de prueba real
3. US4 (recuperación de contraseña)
4. Polish y paso a producción (variables y migración en la base de producción)

### Pendientes de decisión (no bloquean el MVP)

- Logo oficial de TalentHub; texto final del acuerdo de datos y de la landing
- Rotar la clave secreta que se compartió en el chat
- Antes de que el equipo CEIS consulte estadísticas: disparador en la base que recalcule los puntajes (riesgo declarado en `research.md` §6)

---

## Notes

- [P] = archivos distintos, sin dependencias
- La etiqueta [Story] enlaza cada tarea con su historia
- No hay constitución vigente
- Confirmar que las pruebas fallan antes de implementar
- Hacer commit tras cada tarea o grupo lógico
