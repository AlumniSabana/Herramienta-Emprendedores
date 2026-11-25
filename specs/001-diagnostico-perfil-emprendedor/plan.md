# Implementation Plan: Diagnóstico de Perfil Emprendedor

**Branch**: `001-diagnostico-perfil-emprendedor` (directorio de spec; sin rama git creada) | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-diagnostico-perfil-emprendedor/spec.md`

## Summary

Aplicación web en español, mobile-first y con la identidad visual de AlumniCV, donde una persona ingresa (correo institucional + programa + aceptación Ley 1581), responde 9 bloques × 5 afirmaciones (1–4) y ve un radar de 5 perfiles con detalle de cada uno.

Enfoque técnico (detalle en [research.md](research.md)):

- **Monorepo npm workspaces** con tres piezas: `packages/core` (puntaje, validación y contenido JSON, compartidos), `apps/web` (React + Vite) y `api/` (función Node de Vercel).
- **Una sola implementación del puntaje** en `packages/core`, importada por el navegador (para mostrar el resultado aun si falla el guardado) y por la API (que recalcula y valida antes de guardar; FR-012, FR-021).
- **Todo el contenido en JSON** dentro de `packages/core/content/` (test, perfiles, fuentes, programas), transcrito una sola vez desde el Excel por un script; después se edita a mano (FR-019).
- **Persistencia detrás de `SubmissionRepository`**: en v1 solo hay implementación en memoria y de registro por consola; conectar una BD después es añadir una clase (FR-020).
- **Radar en SVG propio** (sin librería de gráficos) para controlar accesibilidad, teclado y tarjeta interactiva (FR-014, FR-015, FR-022).

## Technical Context

**Language/Version**: TypeScript 5.x (estricto) sobre Node.js 22 LTS (el entorno local tiene 22.20; Vercel soporta 22)

**Primary Dependencies**: React 19, React Router 7 (modo librería), Vite, Tailwind CSS 4 (plugin de Vite), Zod (esquemas compartidos de validación). Sin librería de gráficos ni de formularios.

**Storage**: N/A en v1 (sin base de datos). Interfaz `SubmissionRepository` con implementaciones `InMemory` (pruebas/desarrollo) y `Console` (registro estructurado en logs de Vercel). La base de datos real queda para una versión posterior.

**Testing**: Vitest en los tres workspaces; React Testing Library para componentes y flujo; `vitest-axe` para comprobaciones de accesibilidad automáticas; pruebas del puntaje con fixture del Excel, empates y extremos (FR-013).

**Target Platform**: Navegadores modernos (últimas 2 versiones de Chrome, Edge, Safari, Firefox; iOS Safari y Android Chrome) desde 360 px de ancho; API como Vercel Function (Node 22) en un único proyecto de Vercel.

**Project Type**: web application (frontend + backend) en monorepo

**Performance Goals**: Primera pantalla útil en < 2 s en móvil con 4G; transición entre bloques instantánea (estado local); respuesta de la API < 500 ms (solo validar, puntuar y guardar).

**Constraints**: Español únicamente; contraste AA; operable por teclado; el radar debe tener tabla equivalente; sin cédula ni nombre; funciona sin base de datos; el resultado se muestra aunque falle el guardado.

**Scale/Scope**: Cientos a pocos miles de envíos al semestre (estudiantes y alumni); 3 rutas (ingreso, test por bloque, resultado), 1 endpoint (`POST /api/submissions`), 5 perfiles, 9 bloques, 45 ítems, 30 programas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` sigue siendo la plantilla sin rellenar (placeholders como `[PRINCIPLE_1_NAME]`); no existen principios ni compuertas vigentes. **Resultado: sin violaciones evaluables; la compuerta pasa por vacío.** Recomendación: ejecutar `/speckit-constitution` antes de implementar si se quieren fijar reglas (por ejemplo, pruebas primero para el puntaje, tratamiento de datos personales, accesibilidad AA).

Re-evaluación tras el diseño (Fase 1): sin cambios; ninguna decisión del diseño contradice los criterios implícitos de simplicidad, pruebas del cálculo y datos mínimos de la spec.

## Project Structure

### Documentation (this feature)

```text
specs/001-diagnostico-perfil-emprendedor/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/           # Fase 1
│   ├── submissions-api.yaml
│   └── content-files.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks, no lo crea este comando)
```

### Source Code (repository root)

```text
package.json                    # workspaces: packages/*, apps/*
tsconfig.base.json
vercel.json                     # build del web + rewrites SPA; /api queda como funciones
.env.example                    # ALLOWED_EMAIL_DOMAIN, VITE_ALLOWED_EMAIL_DOMAIN, SUBMISSION_REPOSITORY

packages/core/                  # @emprendedor/core — lógica y contenido compartidos
├── content/
│   ├── test.json               # 9 bloques, escala por bloque, 45 ítems con profileId
│   ├── profiles.json           # 5 perfiles (deseo/miedo/prioridad, descripción, etc.)
│   ├── sources.json            # elaboración CEIS, versión, 4 referencias
│   └── programs.json           # catálogo cerrado + "Otro / posgrado"
├── src/
│   ├── scoring.ts              # calcula puntajes, dominante(s), secundario(s)
│   ├── schemas.ts              # Zod: ingreso, envío, archivos de contenido
│   ├── email.ts                # validación de formato y dominio (parametrizada)
│   ├── content.ts              # carga tipada de los JSON
│   ├── types.ts
│   └── index.ts
└── tests/
    ├── fixtures/excel-sample.json   # 45 respuestas + puntajes esperados del Excel
    ├── scoring.test.ts
    ├── content.test.ts              # integridad de los JSON (45 ítems, 9×5, mapeo por posición)
    └── email.test.ts

api/                            # Vercel Functions (backend Node)
├── submissions.ts              # POST /api/submissions — adaptador delgado
└── _lib/                       # el prefijo _ evita que Vercel lo exponga como ruta
    ├── handleSubmission.ts     # valida → puntúa (core) → guarda → responde
    ├── repositories/
    │   ├── SubmissionRepository.ts
    │   ├── InMemorySubmissionRepository.ts
    │   └── ConsoleSubmissionRepository.ts
    ├── devServer.ts            # servidor node:http solo para desarrollo local
    └── handleSubmission.test.ts

apps/web/                       # React + Vite + TS + Tailwind + React Router
├── index.html
├── vite.config.ts              # proxy /api → devServer en desarrollo
├── src/
│   ├── main.tsx
│   ├── routes.tsx              # /, /test/:bloque, /resultado (con guardas)
│   ├── state/DiagnosticContext.tsx   # respuestas, ingreso, resultado (sessionStorage)
│   ├── api/submitDiagnostic.ts       # cliente de POST /api/submissions
│   ├── components/
│   │   ├── AppShell.tsx        # encabezado oscuro + barra lateral de pasos
│   │   ├── Card.tsx, Button.tsx, ProgressBar.tsx
│   │   ├── LikertItem.tsx      # grupo de radio 1–4 accesible
│   │   ├── RadarChart.tsx      # SVG, ejes 9–36, puntos enfocables
│   │   ├── ProfileTooltipCard.tsx
│   │   ├── ScoresTable.tsx     # alternativa en texto del radar
│   │   ├── ProfileTabs.tsx, ProfileDetail.tsx
│   │   └── SourcesSection.tsx
│   ├── pages/
│   │   ├── EntryPage.tsx, BlockPage.tsx, ResultPage.tsx
│   └── styles.css              # tokens de tema (paleta, tipografías) con Tailwind
└── tests/                      # componentes + flujo de punta a punta con RTL

tools/
└── extract-content.py          # una sola vez: Excel → JSON de contenido (no se usa en runtime)
```

**Structure Decision**: aplicación web con frontend y backend en un único proyecto de Vercel (frontend estático + función en `api/`) dentro de un monorepo npm workspaces. La lógica común (puntaje, validación, contenido) vive en `packages/core` para garantizar que exista una sola implementación (FR-012). El backend es mínimo (un endpoint), por lo que no se crea un workspace `apps/api`: `api/` es la convención de Vercel y su lógica testeable queda en `api/_lib`. Se importa `packages/core` por ruta relativa desde `api/` para evitar problemas de resolución de workspaces en el empaquetado de funciones de Vercel.

## Complexity Tracking

Sin violaciones de constitución (no hay constitución vigente). Una decisión que añade estructura y se justifica:

| Elemento | Por qué hace falta | Alternativa más simple descartada |
|----------|-------------------|-----------------------------------|
| Patrón repositorio (`SubmissionRepository`) | Lo exige la spec (FR-020): conectar una BD sin tocar la lógica | Guardar directo en el handler: obligaría a reescribirlo al añadir BD |
| Workspace `packages/core` | Una sola implementación del puntaje para web y API (FR-012) | Duplicar el cálculo en cliente y servidor: riesgo de divergencia |
