---

description: "Task list for Diagnóstico de Perfil Emprendedor"
---

# Tasks: Diagnóstico de Perfil Emprendedor

**Input**: Design documents from `/specs/001-diagnostico-perfil-emprendedor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen. La spec los exige para el puntaje (FR-013, SC-003) y el plan define Vitest + React Testing Library + vitest-axe. En cada fase las pruebas se escriben primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario. El puntaje, la API y el contenido son Fundacionales porque los usan las historias 1 y 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario (US1–US4)
- Todas las rutas son relativas a la raíz del repositorio

## Path Conventions

Monorepo npm workspaces (ver plan.md): `packages/core/`, `apps/web/`, `api/` (Vercel Functions, lógica en `api/_lib/`), `tools/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esqueleto del monorepo y herramientas

- [X] T001 Crear `package.json` raíz (workspaces `packages/*` y `apps/*`; scripts `dev`, `test`, `build`), `tsconfig.base.json` (TypeScript estricto, Node 22), `.gitignore` (node_modules, dist, .env, .vercel) y `.env.example` con `ALLOWED_EMAIL_DOMAIN=unisabana.edu.co`, `VITE_ALLOWED_EMAIL_DOMAIN=unisabana.edu.co`, `SUBMISSION_REPOSITORY=console`, `VITE_DATA_POLICY_URL=`
- [X] T002 [P] Crear el workspace `packages/core/` con `package.json` (nombre `@emprendedor/core`, `main` a `src/index.ts`, dependencia `zod`), `tsconfig.json` y `vitest.config.ts`
- [X] T003 [P] Crear el workspace `apps/web/` con `package.json` (React 19, React Router 7, Vite, Tailwind 4 con `@tailwindcss/vite`, Vitest, React Testing Library, `vitest-axe`), `index.html` (`lang="es"`), `vite.config.ts` (proxy `/api` → `http://localhost:3001`), `tsconfig.json`, `vitest.config.ts` (jsdom) y `src/main.tsx`
- [X] T004 [P] Crear la base del backend: `api/tsconfig.json`, `vercel.json` (build del web con salida `apps/web/dist`, rewrite SPA que excluye `/api/*`) y dependencias de desarrollo `tsx` y `vitest` en el `package.json` raíz
- [X] T005 Ejecutar `npm install` en la raíz y verificar que `npm test` corre sin errores aunque no haya pruebas (depende de T001–T004)
- [X] T006 [P] Definir los tokens de tema en `apps/web/src/styles.css` con Tailwind 4 `@theme`: azul marino de encabezado/botones (≈ `#00185E`, a confirmar), fondo gris azulado claro, tarjeta blanca con borde suave, títulos en serif cursiva y cuerpo en sans-serif, importando las fuentes candidatas (ver research.md §8)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contenido, puntaje, validación, API y estructura de la aplicación que necesitan todas las historias

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta terminar esta fase

### Tipos y contenido (core)

- [X] T007 Definir los tipos en `packages/core/src/types.ts` según data-model.md: `ProfileId` (`realista-gerencial`, `realizador-comerciante`, `artistico-imaginativo`, `movilizador-social`, `investigativo-creador`, en ese orden), `Block` (`number` entero 1–9, `scaleLabels` "4 textos", `items` "5 Item"), `Item` (`id` "x.n", `position` entero 1–5, `profileId`), `Profile`, `CompetencyGroup`, `Source`, `Program`, `EntryData`, `Answers` ("exactamente las 45 claves", valores enteros de 1 a 4), `ScoreResult` (`scores` entero 9–36, `dominant` "1 o más", `secondary`) y `Submission`; exportar `CONSENT_TEXT_VERSION` como constante
- [X] T008 [P] Escribir `tools/extract-content.py` (uv + openpyxl; recibe la ruta del Excel como argumento) que lea las hojas "PREGUNTAS EMPRENDEDOR", los cinco "PERFIL …" y "FUENTES DE ELABORACIÓN" y genere `test.json`, `profiles.json` y `sources.json` según contracts/content-files.md (escala propia por bloque; competencias y consejos como listas con `groups`; `complementaryProfiles` normalizados a ids)
- [X] T009 [P] Crear `packages/core/content/programs.json` con los 29 programas del catálogo entregado, en ese orden, con `id` en slug sin tildes, y `{ "id": "otro-posgrado", "name": "Otro / posgrado" }` al final
- [X] T010 Ejecutar `tools/extract-content.py` con el Excel `C:\Users\esteb\Downloads\Diagnostico perfil emprendedor-2 (1).xlsx` para generar `packages/core/content/test.json`, `packages/core/content/profiles.json` y `packages/core/content/sources.json`; ejecutar con `python -I` y guardar el resultado en UTF-8 (depende de T008)
- [X] T011 Revisar y completar `packages/core/content/profiles.json` contra cada hoja de perfil del Excel: añadir `shortDescription` (primera oración de la descripción, editable), comprobar que no hay texto truncado, normalizar "Investigador - Creador" a `investigativo-creador` y dejar las erratas del Excel tal cual (depende de T010)

### Pruebas del núcleo (escribirlas primero; deben fallar hasta T016–T019)

- [X] T012 [P] Crear `packages/core/tests/fixtures/excel-sample.json` con las 45 respuestas del ejemplo del Excel (1.1=2, 1.2=3, 1.3=1, 1.4=3, 1.5=3, 2.1=3, 2.2=4, 2.3=2, 2.4=3, 2.5=3, 3.1=3, 3.2=4, 3.3=3, 3.4=3, 3.5=3, 4.1=2, 4.2=4, 4.3=2, 4.4=3, 4.5=3, 5.1=4, 5.2=3, 5.3=3, 5.4=3, 5.5=4, 6.1=3, 6.2=4, 6.3=4, 6.4=1, 6.5=4, 7.1=3, 7.2=4, 7.3=4, 7.4=3, 7.5=4, 8.1=4, 8.2=4, 8.3=3, 8.4=3, 8.5=3, 9.1=3, 9.2=4, 9.3=4, 9.4=3, 9.5=3) y los puntajes esperados 27/34/26/25/30
- [X] T013 [P] Escribir `packages/core/tests/scoring.test.ts`: fixture del Excel (dominante Realizador-Comerciante 34, secundario Investigativo-Creador 30), empate de 2 a 5 perfiles (los cinco empatados → sin secundario), empate en segundo puesto, todo 1 → 9 y todo 4 → 36, y propiedad con semilla fija (puntajes entre 9 y 36, suma de puntajes = suma de respuestas)
- [X] T014 [P] Escribir `packages/core/tests/content.test.ts`: 9 bloques × 5 ítems, ids `x.n` únicos, `profileId` igual a la regla por posición (x.1 realista … x.5 investigativo), `scaleLabels` de 4 textos (bloque 1 distinto de los bloques 2–9), 5 perfiles con las siete secciones no vacías y `complementaryProfiles` válidos, 4 referencias en fuentes y 29 programas únicos con "Otro / posgrado" al final
- [X] T015 [P] Escribir `packages/core/tests/email.test.ts`: correo válido, mayúsculas y espacios normalizados, formato inválido, dominio distinto, `x@unisabana.edu.co.example.com` y `x@xunisabana.edu.co` rechazados, dominio configurable

### Implementación del núcleo

- [X] T016 Implementar `packages/core/src/schemas.ts` (Zod) para los cuatro archivos de contenido y para `SubmissionRequest` (`email`, `programId`, `consentAccepted` literal `true`, `consentTextVersion`, `answers` con exactamente las 45 claves y valores enteros 1–4) (depende de T007)
- [X] T017 Implementar `packages/core/src/content.ts` (carga tipada y validada de los JSON) y `packages/core/src/index.ts` que exporte tipos, contenido, esquemas, correo y puntaje (depende de T010, T016)
- [X] T018 [P] Implementar `packages/core/src/email.ts`: `validateInstitutionalEmail(email, allowedDomain)` que recorta, pasa a minúsculas, valida local@dominio y exige dominio exactamente igual (no `endsWith`), con valor por defecto `unisabana.edu.co`
- [X] T019 Implementar `packages/core/src/scoring.ts`: `scoreAnswers(answers)` puro y determinista; puntaje de perfil = suma de sus 9 ítems según `profileId` de `test.json`; dominante = todos los de mayor puntaje en orden estable; secundario = todos los del siguiente puntaje distinto, vacío si no existe (depende de T017). Verificar que T013–T015 pasan

### API (backend Node)

- [X] T020 [P] Crear `api/_lib/repositories/SubmissionRepository.ts` (interfaz `save(submission): Promise<void>`) e `InMemorySubmissionRepository.ts` (guarda en un arreglo y lo expone para pruebas)
- [X] T021 [P] Crear `api/_lib/repositories/ConsoleSubmissionRepository.ts` (una línea JSON estructurada por envío con `console.log`) y `api/_lib/repositories/index.ts` con `createRepository(env)` que elige `memory` o `console` según `SUBMISSION_REPOSITORY` (por defecto `console`)
- [X] T022 [P] Escribir `api/_lib/handleSubmission.test.ts` según contracts/submissions-api.yaml: 201 con `id`, `scores`, `dominant`, `secondary`, `submittedAt`; 400 con mensaje en español para correo/dominio inválido, programa inexistente, `consentAccepted` distinto de `true`, respuestas faltantes, sobrantes o fuera de 1–4; ignora puntajes enviados por el cliente; llama una vez al repositorio solo en éxito; devuelve 500 si el repositorio falla
- [X] T023 Implementar `api/_lib/handleSubmission.ts`: validar con los esquemas y `validateInstitutionalEmail` de core, recalcular con `scoreAnswers`, generar `id` (UUID) y `submittedAt`/`consentAcceptedAt` (ISO 8601 UTC), guardar vía repositorio y responder según el contrato; importar core por ruta relativa `../../packages/core/src` (depende de T019, T020, T022)
- [X] T024 Crear `api/submissions.ts`, adaptador delgado de Vercel Function (`POST` únicamente, 405 en otros métodos) que llama a `handleSubmission` con `createRepository(process.env)` (depende de T021, T023)
- [X] T025 [P] Crear `api/_lib/devServer.ts` (servidor `node:http` en el puerto 3001 que sirve `POST /api/submissions` con el mismo handler) y los scripts `dev` (API con `tsx` + Vite) y `test` en el `package.json` raíz (depende de T024)

### Estructura de la web

- [X] T026 [P] Crear `apps/web/src/state/DiagnosticContext.tsx`: estado `{ entry, answers, result, saveStatus }` respaldado por `sessionStorage` (envuelto en try/catch), con acciones para guardar ingreso, fijar una respuesta, guardar resultado, marcar estado de guardado y reiniciar respuestas conservando el ingreso
- [X] T027 [P] Crear los componentes base `apps/web/src/components/Button.tsx`, `Card.tsx` (tarjeta blanca de borde suave) y `ProgressBar.tsx` (con `role="progressbar"` y valor accesible)
- [X] T028 Crear `apps/web/src/components/AppShell.tsx`: encabezado oscuro con marca "Govlab | Diagnóstico emprendedor" y barra lateral con los pasos Ingreso, Test, Resultado (en móvil se convierte en indicador de pasos superior), usando los tokens de T006
- [X] T029 Crear `apps/web/src/routes.tsx` y conectar `apps/web/src/main.tsx`: rutas `/`, `/test/:bloque` y `/resultado` dentro de `AppShell`, con guardas (sin ingreso válido no se entra a `/test/*`; sin las 45 respuestas no se entra a `/resultado`; no se puede saltar a un bloque posterior al primero incompleto); páginas provisionales vacías para las tres rutas (depende de T026–T028)
- [X] T030 [P] Crear `apps/web/src/api/submitDiagnostic.ts`: cliente de `POST /api/submissions` que nunca lanza hacia la interfaz y devuelve `{ ok: true } | { ok: false }`

**Checkpoint**: Contenido, puntaje y API funcionan y están probados (`npm test`); la web arranca con las tres rutas vacías

---

## Phase 3: User Story 1 - Ingresar y responder el test completo (Priority: P1) 🎯 MVP

**Goal**: La persona ingresa correo y programa, acepta el tratamiento de datos, responde los 9 bloques y llega a `/resultado` con el envío registrado.

**Independent Test**: Ingresar un correo `@unisabana.edu.co` válido, elegir un programa, aceptar los datos, completar los 9 bloques y llegar a `/resultado`; comprobar los bloqueos (dominio, consentimiento, ítems sin responder) y que Anterior conserva las respuestas.

### Tests for User Story 1 ⚠️ (escribir primero; deben fallar)

- [X] T031 [P] [US1] Escribir `apps/web/tests/EntryPage.test.tsx`: correo inválido o de otro dominio muestra mensaje y no deja empezar; sin aceptación de datos no deja empezar; programas en el orden del catálogo con "Otro / posgrado" al final; no existen campos de nombre ni cédula
- [X] T032 [P] [US1] Escribir `apps/web/tests/BlockPage.test.tsx`: Siguiente bloqueado con ítems sin responder y se señalan los pendientes; Anterior conserva respuestas; el bloque 1 muestra la escala "No es muy cierto de mí…" y el bloque 2 "Nunca…"; barra de progreso; el último bloque muestra el botón de finalizar
- [X] T033 [P] [US1] Escribir `apps/web/tests/routes.test.tsx`: las guardas redirigen (sin ingreso → `/`; sin 45 respuestas → primer bloque incompleto) y una recarga con `sessionStorage` restaura el avance sin mezclar datos

### Implementation for User Story 1

- [X] T034 [P] [US1] Crear `apps/web/src/components/LikertItem.tsx`: grupo de radios 1–4 con etiquetas del bloque, `fieldset`/`legend`, operable con teclado, estado de error visible para ítem pendiente
- [X] T035 [US1] Crear `apps/web/src/pages/EntryPage.tsx`: campos correo (validado con `validateInstitutionalEmail` y `VITE_ALLOWED_EMAIL_DOMAIN`) y programa (`programs.json`), casilla de aceptación con texto de autorización (Ley 1581 de 2012) y enlace a `VITE_DATA_POLICY_URL`; al continuar guarda `EntryData` y navega a `/test/1` (depende de T029)
- [X] T036 [US1] Crear `apps/web/src/pages/BlockPage.tsx`: lee el bloque de `test.json`, muestra enunciado y sus 5 `LikertItem`, `ProgressBar`, botones Anterior y Siguiente con validación de completitud; en el bloque 9 el botón Finalizar calcula `scoreAnswers` localmente, guarda el resultado, dispara `submitDiagnostic` sin bloquear, registra `saveStatus` y navega a `/resultado` (depende de T030, T034)

**Checkpoint**: US1 funciona y se prueba por separado; `/resultado` aún es provisional

---

## Phase 4: User Story 2 - Ver el resultado en el radar con perfil dominante (Priority: P1)

**Goal**: La persona ve el radar de 5 ejes (9–36), el perfil dominante o empatados, el secundario y la tarjeta interactiva de cada perfil, con alternativa textual.

**Independent Test**: Con el fixture del Excel el resultado muestra Realizador-Comerciante 34 dominante, Investigativo-Creador 30 secundario y puntajes 27/34/26/25/30; la tarjeta aparece con ratón, toque y teclado; la tabla equivalente está disponible.

### Tests for User Story 2 ⚠️

- [X] T037 [P] [US2] Escribir `apps/web/tests/RadarChart.test.tsx`: cinco puntos enfocables con `aria-label` completo, tarjeta visible con hover, foco y clic, Esc la cierra, eje radial de 9 a 36, sin violaciones de `vitest-axe`
- [X] T038 [P] [US2] Escribir `apps/web/tests/ResultPage.test.tsx`: flujo completo con el fixture de `excel-sample.json` (dominante y secundario correctos, cinco puntajes), caso de empate de los cinco perfiles (todos dominantes y sin secundario), y aviso no bloqueante cuando `saveStatus` es fallido

### Implementation for User Story 2

- [X] T039 [P] [US2] Crear `apps/web/src/components/RadarChart.tsx`: SVG con 5 ejes en pentágono, anillos en 9, 18, 27 y 36, polígono del resultado, un punto por eje con `tabindex="0"` y `aria-label` con nombre y puntaje; `role="img"` con `aria-describedby` hacia la tabla
- [X] T040 [P] [US2] Crear `apps/web/src/components/ProfileTooltipCard.tsx`: tarjeta con nombre, puntaje /36, deseo central, miedo central, prioridad central y `shortDescription`; visible con hover, foco y toque, se cierra con Esc y se mantiene dentro del viewport
- [X] T041 [P] [US2] Crear `apps/web/src/components/ScoresTable.tsx`: tabla visible con los cinco perfiles y su puntaje /36, marcando dominante y secundario
- [X] T042 [US2] Crear `apps/web/src/pages/ResultPage.tsx`: radar + `ProfileTooltipCard` + `ScoresTable`, bloque de perfil(es) dominante(s) y secundario(s) con el empate resuelto según FR-011, y aviso no bloqueante si `saveStatus` es fallido (depende de T039–T041)

**Checkpoint**: US1 y US2 juntas entregan el flujo completo ingreso → test → radar

---

## Phase 5: User Story 3 - Leer el detalle de cada perfil y el plan de acción (Priority: P2)

**Goal**: Detalle de siete secciones del perfil dominante, con acceso a los otros cuatro desde pestañas o desde el radar.

**Independent Test**: Abrir cada uno de los cinco perfiles y comprobar las siete secciones con el texto de su hoja del Excel; seleccionar un punto del radar cambia el perfil mostrado.

### Tests for User Story 3 ⚠️

- [X] T043 [P] [US3] Escribir `apps/web/tests/ProfileDetail.test.tsx`: para cada uno de los cinco perfiles aparecen las siete secciones (descripción, fortalezas, oportunidades de mejora, competencias fuertes, competencias para potenciar, perfiles complementarios, consejos prácticos) y ninguna está vacía; por defecto se abre el dominante (el primero si hay empate); cambiar de pestaña o seleccionar un punto del radar cambia el perfil

### Implementation for User Story 3

- [X] T044 [P] [US3] Crear `apps/web/src/components/ProfileTabs.tsx`: pestañas accesibles (`role="tablist"`, flechas de teclado) con los cinco perfiles
- [X] T045 [P] [US3] Crear `apps/web/src/components/ProfileDetail.tsx`: las siete secciones, con competencias agrupadas por `CompetencyGroup`, perfiles complementarios por nombre y consejos como lista numerada
- [X] T046 [US3] Integrar en `apps/web/src/pages/ResultPage.tsx`: estado de perfil seleccionado (dominante por defecto), `ProfileTabs` + `ProfileDetail`, y clic o Enter en un punto del radar selecciona ese perfil (depende de T042, T044, T045)

**Checkpoint**: US1–US3 funcionan de forma independiente

---

## Phase 6: User Story 4 - Consultar fuentes y repetir el test (Priority: P3)

**Goal**: Sección "Fuentes" visible en resultados y opción de repetir el test desde cero.

**Independent Test**: En `/resultado` se ve "Elaboración CEIS – Centro de Emprendimiento e Innovación Sabana", "Versión junio 2019" y las 4 referencias; "Repetir el test" lleva al bloque 1 con respuestas en blanco.

### Tests for User Story 4 ⚠️

- [X] T047 [P] [US4] Escribir `apps/web/tests/SourcesAndRepeat.test.tsx`: la sección de fuentes muestra la elaboración, la versión y las 4 referencias de `sources.json`; "Repetir el test" limpia respuestas y resultado, conserva el ingreso y navega a `/test/1`

### Implementation for User Story 4

- [X] T048 [P] [US4] Crear `apps/web/src/components/SourcesSection.tsx` que lea `sources.json` y muestre elaboración, versión y las 4 referencias
- [X] T049 [US4] Añadir a `apps/web/src/pages/ResultPage.tsx` la sección de fuentes y el botón "Repetir el test" (acción de reinicio de `DiagnosticContext`) (depende de T046, T048)

**Checkpoint**: Las cuatro historias funcionan

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Calidad transversal y verificación contra la spec

- [X] T050 [P] Revisión responsive a 360 px en ingreso, bloques y resultado: sin desplazamiento horizontal, radar y tarjeta legibles y operables al tacto, barra lateral convertida en pasos superiores (SC-007)
- [X] T051 [P] Añadir `vitest-axe` a las pruebas de `EntryPage`, `BlockPage` y `ResultPage` y corregir las violaciones (FR-022, SC-006)
- [X] T052 [P] Verificar contraste AA de los tokens de `apps/web/src/styles.css` (texto, botones, anillos del radar, estados de foco y de error) y ajustar los valores que no lo cumplan
- [X] T053 Comprobar la fidelidad del contenido (SC-005): comparar con el Excel los cinco perfiles de `profiles.json`, las 45 afirmaciones de `test.json` y las 4 referencias de `sources.json`; anotar las erratas conservadas
- [X] T054 [P] Actualizar `README.md` con descripción, requisitos, variables de entorno, `npm run dev`, `npm test`, cómo editar los JSON de contenido y cómo desplegar en Vercel
- [X] T055 Ejecutar `npm run build` y verificar que `apps/web/dist` se genera y que `vercel.json` sirve la SPA sin interceptar `/api/*`
- [ ] T056 Ejecutar los nueve escenarios manuales de `specs/001-diagnostico-perfil-emprendedor/quickstart.md` y registrar el resultado de cada uno
  - Estado: verificados en navegador el escenario 3 (datos del Excel: 34/30/27/26/25), el 4 (tarjeta al pasar el cursor) y el ancho de 360 px sin desborde; los escenarios 1, 2, 5, 6, 8 y 9 están cubiertos por pruebas automáticas. Pendiente de revisión humana: recorrido solo con teclado, lector de pantalla y el contraste con las herramientas del navegador.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; **bloquea** todas las historias
- **US1 (Phase 3)** y **US2 (Phase 4)** (ambas P1): empiezan tras Foundational. US2 puede construirse en paralelo con US1 usando el fixture como estado inicial; el flujo completo se valida al juntarlas
- **US3 (Phase 5)**: depende de que exista `ResultPage` (T042)
- **US4 (Phase 6)**: depende de `ResultPage` con detalle (T046)
- **Polish (Phase 7)**: depende de las historias deseadas

### Within Foundational

- T007 → T016 → T017 → T019; T010 → T011 → T017
- T012–T015 (pruebas) antes de T016–T019 y deben fallar primero
- T020, T021, T022 → T023 → T024 → T025
- T026, T027, T030 en paralelo → T028 → T029

### Within Each User Story

- Las pruebas se escriben primero y deben fallar
- Componentes antes de la página; la página al final de cada historia

### Parallel Opportunities

- Setup: T002, T003, T004, T006 en paralelo
- Foundational: T008, T009, T012, T013, T014, T015, T018, T020, T021, T022, T026, T027, T030 en paralelo (archivos distintos)
- US1: T031–T033 y T034 en paralelo
- US2: T037, T038 y luego T039, T040, T041 en paralelo
- US3: T043, T044, T045 en paralelo
- Polish: T050, T051, T052, T054 en paralelo

---

## Parallel Example: Foundational (núcleo)

```text
# Pruebas del núcleo, todas a la vez:
Task: "Fixture excel-sample.json en packages/core/tests/fixtures/excel-sample.json"
Task: "scoring.test.ts en packages/core/tests/scoring.test.ts"
Task: "content.test.ts en packages/core/tests/content.test.ts"
Task: "email.test.ts en packages/core/tests/email.test.ts"
```

## Parallel Example: User Story 2

```text
Task: "RadarChart.tsx en apps/web/src/components/RadarChart.tsx"
Task: "ProfileTooltipCard.tsx en apps/web/src/components/ProfileTooltipCard.tsx"
Task: "ScoresTable.tsx en apps/web/src/components/ScoresTable.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

La spec marca dos historias P1: sin resultado el test no entrega valor. El MVP real es **Setup + Foundational + US1 + US2**.

1. Completar Setup y Foundational (puntaje y API probados)
2. Completar US1 y validar el flujo hasta `/resultado`
3. Completar US2 y **validar con el fixture del Excel** (27/34/26/25/30)
4. Desplegar o mostrar al CEIS

### Incremental Delivery

1. MVP (arriba) → demo
2. US3 (detalle y plan de acción) → demo
3. US4 (fuentes y repetir) → demo
4. Polish y quickstart completo antes del despliegue real

### Pendientes de decisión (no bloquean el MVP)

- URL de la política de datos (`VITE_DATA_POLICY_URL`), logo GovLab/La Sabana, fuentes y colores definitivos de AlumniCV
- Sustituir `ConsoleSubmissionRepository` por una base de datos o registrar el correo con hash antes de uso real

---

## Notes

- [P] = archivos distintos, sin dependencias
- La etiqueta [Story] enlaza cada tarea con su historia
- No hay `constitution` vigente; si se define, revisar estas tareas contra ella
- Confirmar que las pruebas fallan antes de implementar
- Hacer commit tras cada tarea o grupo lógico
