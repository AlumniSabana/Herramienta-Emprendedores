# Implementation Plan: Página principal, cuentas e ingreso

**Branch**: `002-landing-cuentas` (directorio de spec; sin rama git) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-landing-cuentas/spec.md`

## Summary

Se añade a la aplicación de la [feature 001](../001-diagnostico-perfil-emprendedor/plan.md) una landing pública, registro con verificación por código, ingreso, recuperación de contraseña y sesión, y se protege el test. Los resultados pasan a guardarse por cuenta.

Enfoque técnico (detalle en [research.md](research.md)):

- **Cuentas en el proyecto Supabase de Herramientas CDP**, usadas desde el navegador con `@supabase/supabase-js` y **solo la URL y la clave publishable**. La clave secreta no se usa ni se guarda. Cambiar de proyecto (prueba → producción) es cambiar cuatro variables de entorno.
- **Una interfaz `AuthService`** entre la interfaz y Supabase, con una implementación real y una falsa para pruebas, de modo que las 74 pruebas actuales y las nuevas no dependan de red.
- **Resultados en una tabla nueva `diagnosticos_emprendedor`** con RLS (solo el dueño inserta y lee). Un script SQL que ejecuta el solicitante la crea; no se toca ninguna tabla existente.
- **`POST /api/submissions` sigue siendo el único camino de escritura**: exige el JWT de la sesión, valida a la persona con Supabase, recalcula el puntaje con `packages/core` e inserta la fila **con el propio JWT** (RLS), sin clave de servicio. Se conserva `SubmissionRepository` y se sustituye la implementación de consola por una de Supabase.
- **Apariencia TalentHub** en toda la aplicación (Libre Franklin + Playfair Display cursiva, #00135B). El contenido de la landing y el catálogo facultad→programas pasan a JSON editable.

## Technical Context

**Language/Version**: TypeScript 7 estricto sobre Node.js 22 (igual que la 001)

**Primary Dependencies**: las de la 001 (React 19, React Router 7, Vite 8, Tailwind 4, Zod 4) más `@supabase/supabase-js` (web y API) y `@fontsource-variable/libre-franklin` + `@fontsource-variable/playfair-display` (fuentes alojadas en el propio sitio)

**Storage**: Supabase Postgres compartido con Herramientas CDP. Tabla existente `perfiles` (solo lectura propia); tabla nueva `diagnosticos_emprendedor` con RLS. Sesión del navegador gestionada por el cliente de Supabase.

**Testing**: Vitest + React Testing Library + `vitest-axe` (ya instalados). `FakeAuthService` y `FakeResultsService` en memoria para la web; `InMemorySubmissionRepository` y un validador de token falso para la API. RLS: script SQL de verificación manual ([contracts/verify-rls.sql](contracts/verify-rls.sql)) que ejecuta el solicitante.

**Target Platform**: igual que la 001 (navegadores modernos desde 360 px; Vercel con una Function de Node 22)

**Project Type**: web application (frontend + función serverless) en monorepo, con base de datos externa compartida

**Performance Goals**: landing con primer contenido útil en < 2 s en móvil 4G; ingreso o registro con respuesta visible en < 1 s tras la respuesta del servicio de cuentas; la API sigue en < 500 ms (validar token + validar + puntuar + insertar)

**Constraints**: español; AA; teclado; sin clave secreta en ningún lado; el registro/ingreso no puede depender de nada que no sea Supabase Auth; el servicio de cuentas aplica sus propios límites de envío de códigos; el repositorio está en OneDrive (rodeo de Vite ya aplicado)

**Scale/Scope**: cientos a pocos miles de cuentas y resultados; 6 pantallas nuevas (landing, ingresar, registro con código, recuperar con código, entrada al diagnóstico) más las 3 existentes; 1 tabla nueva; 1 endpoint (modificado)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` sigue siendo la plantilla sin rellenar: no hay principios ni compuertas vigentes, la compuerta pasa por vacío (igual que en la 001). Tras el diseño no hay cambios. Observación de seguridad propia del plan: **la clave secreta (service role) queda excluida por diseño**; toda escritura usa la identidad de la persona y RLS.

## Project Structure

### Documentation (this feature)

```text
specs/002-landing-cuentas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── submissions-api.yaml        # POST /api/submissions v2 (JWT, cuerpo solo con answers)
│   ├── auth-service.md             # interfaz AuthService + errores y mensajes
│   ├── content-files.md            # landing.json y faculties.json
│   ├── diagnosticos_emprendedor.sql  # DDL + RLS que ejecuta el solicitante
│   └── verify-rls.sql              # comprobación manual de RLS con dos cuentas
├── checklists/requirements.md
└── tasks.md                        # lo crea /speckit-tasks
```

### Source Code (repository root)

Solo se listan archivos nuevos o modificados respecto a la 001 (`+` nuevo, `~` modificado, `-` eliminado).

```text
.env.example                        ~ añade SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
supabase/
└── migrations/
    └── 20261125_diagnosticos_emprendedor.sql   + copia de contracts/diagnosticos_emprendedor.sql

packages/core/
├── content/
│   ├── landing.json                + contenido de la landing
│   ├── faculties.json              + facultades y programas (reemplaza programs.json)
│   └── programs.json               - se elimina
├── src/
│   ├── types.ts                    ~ Submission con userId (sin email/programId/consentimiento); Faculty, LandingContent
│   ├── schemas.ts                  ~ SubmissionRequest = { answers }; esquemas de landing y facultades; registro y recuperación
│   ├── content.ts                  ~ carga landing y faculties
│   └── auth-rules.ts               + MIN_PASSWORD_LENGTH, validadores de registro/código/contraseña, AGREEMENT_VERSION
└── tests/
    ├── content.test.ts             ~ facultades y landing en lugar de programas
    └── auth-rules.test.ts          +

api/
├── submissions.ts                  ~ lee Authorization y delega
└── _lib/
    ├── handleSubmission.ts         ~ recibe { body, accessToken }, valida la sesión, ya no valida correo ni programa
    ├── auth/
    │   ├── TokenVerifier.ts        + interfaz verify(token) → { userId }
    │   └── SupabaseTokenVerifier.ts + getUser(token) con la clave publishable
    ├── repositories/
    │   ├── SupabaseSubmissionRepository.ts  + inserta con el JWT de la persona
    │   ├── ConsoleSubmissionRepository.ts   - se elimina
    │   └── index.ts                ~ createRepository(env, accessToken)
    ├── devServer.ts                ~ reenvía Authorization
    └── handleSubmission.test.ts    ~

apps/web/
├── vite.config.ts                  ~ (sin cambios de lógica)
└── src/
    ├── lib/supabase.ts             + cliente único (URL + publishable key de variables VITE_*)
    ├── auth/
    │   ├── AuthService.ts          + interfaz (ver contracts/auth-service.md)
    │   ├── SupabaseAuthService.ts  + implementación real
    │   ├── FakeAuthService.ts      + implementación para pruebas
    │   ├── AuthContext.tsx         + sesión, perfil y acciones; onAuthStateChange
    │   ├── errors.ts               + mapeo de errores de Supabase a mensajes en español
    │   └── RequireAuth.tsx         + guarda de rutas con retorno
    ├── results/
    │   ├── ResultsService.ts       + interfaz: último resultado de la persona
    │   └── SupabaseResultsService.ts + lectura bajo RLS
    ├── api/submitDiagnostic.ts     ~ envía Authorization: Bearer <access_token>, solo { answers }
    ├── state/DiagnosticContext.tsx ~ elimina entry; conserva answers/result/saveStatus
    ├── routes.tsx                  ~ rutas públicas y protegidas
    ├── components/
    │   ├── SiteHeader.tsx          + encabezado TalentHub (reemplaza AppShell) con menú móvil
    │   ├── SiteFooter.tsx          +
    │   ├── AppShell.tsx            - se elimina (la barra lateral de pasos desaparece)
    │   ├── Field.tsx               + campo con etiqueta, error asociado y ayuda
    │   ├── PasswordField.tsx       + con mostrar/ocultar
    │   ├── CodeStep.tsx            + pantalla de código (verificación y recuperación) con reenvío y cuenta atrás
    │   └── ui.tsx                  ~ botones, tarjetas y eyebrow con la nueva apariencia
    ├── pages/
    │   ├── LandingPage.tsx         +
    │   ├── LoginPage.tsx           +
    │   ├── RegisterPage.tsx        + formulario → CodeStep
    │   ├── RecoverPage.tsx         + correo → CodeStep + contraseña nueva
    │   ├── DiagnosticHomePage.tsx  + último resultado o cómo empezar
    │   ├── EntryPage.tsx           - se elimina
    │   ├── BlockPage.tsx           ~ ya no usa entry
    │   └── ResultPage.tsx          ~ muestra el último resultado guardado si no hay uno en memoria
    ├── styles.css                  ~ tokens TalentHub y fuentes de Fontsource
    └── tests/                      ~ las 11 pruebas actuales se ajustan; + LandingPage, Register, Login, Recover, RequireAuth, DiagnosticHome
```

**Structure Decision**: se mantiene el monorepo de la 001. El acceso a Supabase se encierra en dos interfaces del lado web (`AuthService`, `ResultsService`) y una del lado API (`SubmissionRepository` + `TokenVerifier`), para poder simular todo en pruebas y para que cambiar de proveedor o de proyecto no toque la lógica ni las pantallas. No se crea un workspace nuevo.

## Complexity Tracking

Sin violaciones de constitución (no existe). Decisiones que añaden estructura y por qué:

| Elemento | Por qué hace falta | Alternativa más simple descartada |
|----------|-------------------|-----------------------------------|
| `AuthService` / `ResultsService` | Probar sin red y aislar a Supabase | Llamar a `supabase.auth` desde las páginas: obliga a simular el módulo entero en cada prueba |
| API intermedia para guardar el resultado | Recalcular el puntaje en servidor (FR-023) sin clave de servicio | Insertar directo desde el navegador: la persona podría guardar puntajes falsos |
| `TokenVerifier` en la API | Saber quién es la persona sin confiar en lo que dice el cuerpo | Decodificar el JWT a mano: no valida la firma ni la revocación |
