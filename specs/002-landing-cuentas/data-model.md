# Data Model: Página principal, cuentas e ingreso

Se parte del [modelo de la 001](../001-diagnostico-perfil-emprendedor/data-model.md). Aquí solo se describe lo que cambia o se añade. Los tipos viven en `packages/core/src/types.ts`.

## Contenido (JSON en `packages/core/content/`)

### Faculty (`faculties.json`, reemplaza a `programs.json`)

`{ id: texto (slug), name: texto, programs: Program[] }[]` con `Program = { id: texto (slug), name: texto }`.

Reglas: 10 elementos (9 facultades y "Otra / no está en la lista" **siempre al final**); cada facultad con al menos un programa; ids únicos en todo el catálogo; el orden del archivo es el orden mostrado. Contenido inicial: el catálogo entregado en el spec (30 programas más los tres de "Otra": "Otro programa", "Posgrado", "Egresado de un programa que ya no se ofrece").

La cuenta guarda **nombres** (texto), no ids, en `facultad` y `programa`, porque así los guarda la plataforma de CDP (ver Perfil).

### LandingContent (`landing.json`)

| Campo | Tipo | Notas |
|---|---|---|
| `hero` | `{ eyebrow, title, lead, primaryCta, secondaryCta }` | Textos del bloque principal |
| `tool` | `{ eyebrow, title, description, bullets: texto[4], cta }` | Tarjeta de la herramienta; exactamente 4 viñetas |
| `steps` | `{ title, text }[3]` | "Cómo funciona"; exactamente 3 pasos |
| `privacy` | `{ title, text }` | Bloque "Tu información es tuya" |
| `footer` | `{ copyright, policyLabel }` | El enlace de la política sale de configuración |

Todos los textos no vacíos; validado con Zod al cargar y en `content.test.ts`.

## Cuentas y perfil (en Supabase; no se crean ni se modifican tablas ajenas)

### Cuenta (`auth.users`, gestionada por el servicio de cuentas)

Correo, contraseña (con hash en el servicio), `email_confirmed_at` (verificación), metadatos `user_metadata` con lo enviado al registrarse.

### Perfil (tabla existente `perfiles`, solo lectura propia)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | = `auth.users.id` |
| `correo` | texto | |
| `nombre` | texto | |
| `facultad` | texto | nombre de la facultad |
| `programa` | texto | nombre del programa |
| `rol` | texto | `usuario` o `admin`; esta herramienta no lo usa |
| `ultimo_acceso` | timestamptz | no se escribe desde esta herramienta |

Perfil en el cliente: `Profile = { id, email, name, faculty, program }`. Si no existe fila o RLS no la deja leer, se arma con `user_metadata` (`nombre`, `facultad`, `programa`); si falta algún dato queda vacío y la aplicación sigue funcionando (edge case "perfil incompleto").

### Metadatos de registro (`options.data` de `signUp`)

`{ nombre, facultad, programa, acuerdo_version, acuerdo_fecha }` donde `nombre` = nombre completo recortado; `acuerdo_version` = `AGREEMENT_VERSION` (constante en `core`, valor inicial `"1.1"`, a confirmar con el solicitante); `acuerdo_fecha` = fecha-hora ISO 8601 UTC del momento de aceptar.

## Formularios (validaciones en `packages/core/src/auth-rules.ts`)

### RegistrationInput

| Campo | Regla |
|---|---|
| `name` | Recortado, 2 a 120 caracteres |
| `faculty` | Debe existir en `faculties.json` |
| `program` | Debe pertenecer a la facultad elegida |
| `email` | Recortado, en minúsculas, formato local@dominio y dominio exactamente igual a `ALLOWED_EMAIL_DOMAIN` (por defecto `unisabana.edu.co`) |
| `password` | Mínimo 8 caracteres (`MIN_PASSWORD_LENGTH`) |
| `consent` | Debe ser `true` |

### VerificationCode

Cadena de dígitos; se eliminan espacios y saltos de línea antes de validar; longitud que el servicio de cuentas define (se toma 6 como valor por defecto en la interfaz y se acepta lo que el servicio acepte, sin fijarla en el código de validación más allá de "solo dígitos, no vacío").

### RecoveryInput

`email` (misma regla), `code` (VerificationCode), `newPassword` (mínimo 8).

## Resultados

### DiagnosticRecord (tabla nueva `diagnosticos_emprendedor`)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | uuid | clave primaria, `gen_random_uuid()` |
| `user_id` | uuid | referencia `auth.users(id)`, `on delete cascade`, no nulo; RLS exige `= auth.uid()` |
| `answers` | jsonb | exactamente las 45 claves `x.n` con enteros 1 a 4 (valida la API; la base verifica que sea un objeto con 45 claves) |
| `scores` | jsonb | un entero 9–36 por cada `ProfileId` |
| `dominant` | text[] | 1 o más `ProfileId`; no vacío |
| `secondary` | text[] | puede estar vacío |
| `created_at` | timestamptz | `now()` |

Sin `update` ni `delete` para la persona: es un historial. Índice `(user_id, created_at desc)`. Esquema completo en [contracts/diagnosticos_emprendedor.sql](contracts/diagnosticos_emprendedor.sql).

### Submission (tipo de `core`; sustituye al de la 001)

`{ id, userId, answers, scores, dominant, secondary, createdAt }`. Se eliminan `email`, `programId`, `consentAcceptedAt`, `consentTextVersion` y `submittedAt` (el consentimiento vive en la cuenta; la fecha se llama `createdAt`).

### SubmissionRequest (cuerpo de la API)

`{ answers }`: nada más. Cualquier otro campo se ignora.

## Sesión y estado del cliente

| Estado | Dónde | Notas |
|---|---|---|
| Sesión de Supabase (`access_token`, `refresh_token`) | gestionada por `@supabase/supabase-js` en `localStorage` | `cargando` mientras se restaura |
| `answers`, `result`, `saveStatus` | `sessionStorage` (clave de la 001) | Se limpian al cerrar sesión y al repetir el test |
| Último resultado guardado | consulta a `ResultsService` | No se cachea más allá de la pantalla |

El estado `entry` de la 001 desaparece.

## Transiciones del flujo

```text
Visitante ──(Crear cuenta)──▶ Registro ──(datos válidos)──▶ Código de verificación ──(código correcto)──▶ Sesión ──▶ /diagnostico
Visitante ──(Ingresar)──▶ Ingreso ──(correcto)──▶ Sesión ──▶ ruta pedida o /diagnostico
Ingreso ──(cuenta sin verificar)──▶ Código de verificación
Ingreso ──(Olvidé mi contraseña)──▶ Recuperar (correo) ──▶ Código + contraseña nueva ──▶ Sesión ──▶ /diagnostico
/diagnostico ──(Empezar o Repetir)──▶ /test/1 ──▶ … ──▶ /test/9 ──(Finalizar)──▶ /resultado
/resultado ──(en paralelo)──▶ POST /api/submissions (fallo no bloquea)
Sesión ──(Cerrar sesión)──▶ / (sin sesión)
```

## Relaciones

- `DiagnosticRecord.user_id` → `auth.users.id` ← `perfiles.id`.
- `Profile` se arma desde `perfiles` o, de respaldo, desde `user_metadata`.
- `RegistrationInput.program` ∈ `Faculty.programs` de `RegistrationInput.faculty`.
