# Research: Diagnóstico de Perfil Emprendedor

Todas las decisiones de abajo resuelven las incógnitas del Technical Context. No quedan `NEEDS CLARIFICATION`.

## 1. Estructura del monorepo y despliegue en Vercel

- **Decision**: npm workspaces (`packages/core`, `apps/web`) más carpeta `api/` en la raíz como Vercel Functions, en un único proyecto de Vercel. `vercel.json` define el comando de build del web, el directorio de salida (`apps/web/dist`) y un rewrite de SPA (todo lo que no sea `/api/*` sirve `index.html`).
- **Rationale**: `api/` en la raíz es la convención de Vercel y evita un segundo proyecto. npm ya viene con Node 22 (no hay que instalar pnpm/turbo). Un solo endpoint no justifica un workspace de backend.
- **Alternatives considered**: (a) dos proyectos de Vercel (web y api) — más configuración, CORS y dos despliegues; (b) Express/Fastify en una función única — dependencia extra sin necesidad para un endpoint; (c) pnpm/Turborepo — más herramientas sin beneficio a este tamaño.
- **Nota**: las funciones importan `packages/core` por ruta relativa (`../packages/core/src`), no por nombre de paquete, para no depender de cómo Vercel resuelve workspaces al empaquetar. El web sí usa el nombre `@emprendedor/core`.

## 2. Una sola implementación del puntaje

- **Decision**: función pura `scoreAnswers(answers) → Result` en `packages/core/src/scoring.ts`, usada por el web y por la API. La asignación ítem→perfil sale del campo `profileId` de cada ítem en `test.json`; una prueba verifica que ese campo coincide con la regla por posición (x.1…x.5).
- **Rationale**: FR-012 pide cálculo único y determinista. El web lo usa para mostrar el resultado aunque falle el guardado; la API lo recalcula y nunca confía en puntajes del cliente (FR-021).
- **Reglas fijadas** (de la spec): puntaje = suma de 9 ítems; dominante = máximo, con todos los empatados; secundario = todos los del siguiente puntaje distinto, vacío si no existe.
- **Pruebas**: fixture del Excel (27/34/26/25/30), empates de 2 a 5 perfiles, empate en segundo lugar, extremos 9 y 36, y propiedad (respuestas aleatorias con semilla fija → todos entre 9 y 36 y suma total constante).
- **Alternatives considered**: calcular solo en servidor (el resultado dependería de la red) o solo en cliente (permitiría manipulación al guardar).

## 3. Contenido en JSON y transcripción desde el Excel

- **Decision**: cuatro archivos en `packages/core/content/` (`test.json`, `profiles.json`, `sources.json`, `programs.json`). Un script único `tools/extract-content.py` (openpyxl) los genera desde el Excel; después se mantienen a mano. Esquemas Zod validan su forma en pruebas (`content.test.ts`): 9 bloques × 5 ítems, ids `x.n` únicos, 5 perfiles con las siete secciones no vacías, 4 fuentes, 29 programas únicos con "Otro / posgrado" al final (se respeta el orden entregado, que no es estrictamente alfabético).
- **Rationale**: FR-019 y SC-008 piden editar sin tocar la interfaz. Transcribir con script evita errores de copia en textos largos; versionar el JSON resultante lo hace la fuente de verdad en adelante.
- **Decisiones de contenido**:
  - La escala del bloque 1 difiere de los bloques 2–9: cada bloque lleva su propio arreglo de 4 etiquetas.
  - Las secciones de cada perfil que el Excel entrega como texto con saltos de línea (competencias, consejos numerados) se guardan como listas de cadenas; los títulos de subgrupo ("Cognitivas o intelectuales:") se conservan como `groups`.
  - "Perfiles que lo complementan" se guarda como ids de perfil (el Excel escribe "Investigador - Creador" en una hoja; se normaliza a `investigativo-creador`).
  - Campo nuevo `shortDescription` para la tarjeta del radar: se deriva de la primera oración de la descripción y queda editable (el Excel no trae una versión corta).
  - Las erratas del Excel se transcriben tal cual; la corrección ortográfica requiere aprobación del solicitante (ver spec, Assumptions).
- **Alternatives considered**: tabla de base de datos o CMS (excesivo para v1); copiar texto a mano (propenso a error).

## 4. Radar accesible

- **Decision**: componente `RadarChart` en SVG propio, 5 ejes en pentágono, anillos en 9, 18, 27 y 36, polígono de resultado, y un punto enfocable (`tabindex=0`, `role="button"` con `aria-label` completo) por eje. La tarjeta `ProfileTooltipCard` se muestra con hover, foco y toque, se cierra con Escape y se posiciona dentro del viewport. `ScoresTable` presenta los mismos cinco puntajes en una tabla visible y legible por lector de pantalla; el SVG lleva `role="img"` con `aria-describedby` apuntando a ella.
- **Rationale**: FR-014, FR-015 y FR-022 exigen teclado, tarjeta interactiva y alternativa textual; con una librería (Recharts/Chart.js) lograrlo cuesta más que dibujar cinco ejes. Menos dependencias y bundle pequeño.
- **Alternatives considered**: Recharts (tooltip no accesible por teclado de forma nativa), Chart.js en canvas (sin DOM accesible), D3 (peso innecesario).

## 5. Estado del test y navegación

- **Decision**: React Router 7 en modo librería con rutas `/` (ingreso), `/test/:bloque` (1–9) y `/resultado`. El estado (ingreso, respuestas, resultado) vive en un contexto de React respaldado por `sessionStorage`: sobrevive a una recarga, se borra al cerrar la pestaña y no se comparte entre personas. Guardas de ruta: sin ingreso válido no se entra a `/test/*`; sin los 45 ítems no se entra a `/resultado`; no se puede saltar a un bloque posterior al primero incompleto.
- **Rationale**: cumple el edge case de recarga sin implementar historial (fuera de alcance). Un contexto basta; no se justifica Redux/Zustand.
- **Alternatives considered**: `localStorage` (persistiría datos de otra persona en un equipo compartido); solo memoria (pierde el avance al recargar).

## 6. Persistencia v1 detrás de repositorio

- **Decision**: interfaz `SubmissionRepository { save(s: Submission): Promise<void> }`. Implementaciones: `InMemorySubmissionRepository` (pruebas y desarrollo) y `ConsoleSubmissionRepository` (escribe una línea JSON estructurada por envío en los logs de la función). La implementación se elige por la variable `SUBMISSION_REPOSITORY` (`memory` | `console`, por defecto `console`).
- **Rationale**: Vercel Functions no tienen disco duradero; el sistema de archivos no sirve como almacenamiento. La interfaz cumple FR-020 y permite añadir `PostgresSubmissionRepository` sin tocar `handleSubmission` ni el puntaje.
- **Riesgo declarado**: el registro por consola deja el correo (dato personal) en los logs de Vercel, con la retención y acceso de ese proyecto. Es aceptable solo como paso provisional porque la persona aceptó el tratamiento de datos; antes de uso real conviene sustituirlo por una base de datos o, como mínimo, registrar el correo con hash. Esta decisión queda para el solicitante.
- **Alternatives considered**: archivo JSON local (no duradero en Vercel), Vercel KV/Postgres (BD real, fuera de v1), solo en memoria (se pierde en cada arranque en frío).

## 6b. Datos personales y política

- **Decision**: la pantalla de ingreso muestra un texto corto de autorización y un enlace a la política de tratamiento de datos, configurable por variable (`VITE_DATA_POLICY_URL`). Se guarda `consentAcceptedAt` (ISO 8601 UTC) junto con la versión del texto aceptado.
- **Rationale**: FR-004 pide registrar aceptación y fecha. La URL oficial de la política de La Sabana no está en la solicitud; queda como configuración pendiente.

## 7. Validación del correo

- **Decision**: función `validateInstitutionalEmail(email, allowedDomain)` en `core`: recorta espacios, pasa a minúsculas, exige una expresión simple local@dominio y que el dominio sea **exactamente** `allowedDomain` (no `endsWith` de texto libre, para rechazar `unisabana.edu.co.example.com` ni `xunisabana.edu.co`). El dominio se lee de `ALLOWED_EMAIL_DOMAIN` (API) y `VITE_ALLOWED_EMAIL_DOMAIN` (web), con valor por defecto `unisabana.edu.co`.
- **Rationale**: FR-002 y los edge cases. Se valida en ambos lados con la misma función.
- **Limitación conocida**: no verifica que el buzón exista (fuera de alcance).

## 8. Diseño visual (familia AlumniCV)

- **Decision**: tokens de tema en `styles.css` con Tailwind 4 (`@theme`): azul marino de encabezado y botones (≈ `#00185E`/`#001A5C`, a confirmar sobre la captura), fondo gris azulado claro, tarjetas blancas con borde suave y radio medio, títulos en serif cursiva (candidata: Instrument Serif o Cormorant en cursiva) y cuerpo en sans-serif humanista (candidata: Mulish). `AppShell` reproduce encabezado oscuro con marca "Govlab | Diagnóstico emprendedor", y barra lateral con los tres pasos (Ingreso, Test, Resultado); en móvil la barra lateral se convierte en un indicador de pasos superior.
- **Rationale**: FR-023. Solo se dispone de dos capturas; no pude abrir la aplicación de referencia (requiere sesión). Los colores y fuentes exactos son aproximaciones y deben verificarse contra los tokens reales de AlumniCV; por eso viven como tokens centralizados, fáciles de cambiar.
- **Pendiente**: logo GovLab/Universidad de La Sabana en SVG o PNG (lo aporta el solicitante); fuentes definitivas.
- **Alternatives considered**: librería de componentes (MUI/Chakra) — choca con el estilo propio y añade peso.

## 9. Pruebas y accesibilidad

- **Decision**: Vitest en todos los workspaces; React Testing Library para formularios, guardas de ruta y flujo completo (ingreso → 9 bloques → resultado con el fixture del Excel); `vitest-axe` sobre cada página y sobre el radar; revisión manual con teclado y lector de pantalla listada en quickstart. Contraste AA verificado sobre los tokens de color.
- **Rationale**: SC-003, SC-004, SC-006 y SC-007 son comprobables con estas herramientas sin añadir un navegador automatizado en v1.
- **Alternatives considered**: Playwright para e2e (útil después; se puede añadir cuando haya despliegue de preview).

## 10. Desarrollo local sin Vercel CLI

- **Decision**: `api/_lib/devServer.ts` (node:http, ejecutado con `tsx`) expone `POST /api/submissions` con el mismo `handleSubmission`; el servidor de Vite lo proxya en `/api`. Un script raíz `npm run dev` levanta ambos.
- **Rationale**: el entorno no tiene `vercel` instalado ni sesión; así el flujo completo corre localmente con solo Node.
- **Alternatives considered**: `vercel dev` (requiere CLI y cuenta).
