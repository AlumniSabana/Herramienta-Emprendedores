# Data Model: Diagnóstico de Perfil Emprendedor

Dos familias de datos: **contenido** (JSON versionado, solo lectura en runtime) y **envíos** (lo que se registra por cada persona). Todos los tipos viven en `packages/core/src/types.ts`; las formas se validan con Zod (`schemas.ts`).

## Contenido (archivos JSON en `packages/core/content/`)

### ProfileId

Enumeración cerrada de cinco ids, en este orden (también el orden de los ejes del radar y del mapeo por posición):

| Posición del ítem | ProfileId | Nombre mostrado |
|---|---|---|
| x.1 | `realista-gerencial` | Realista - Gerencial |
| x.2 | `realizador-comerciante` | Realizador - Comerciante |
| x.3 | `artistico-imaginativo` | Artístico - Imaginativo |
| x.4 | `movilizador-social` | Movilizador - Social |
| x.5 | `investigativo-creador` | Investigativo - Creador |

### Block (`test.json` → `blocks[]`, 9 elementos)

| Campo | Tipo | Notas |
|---|---|---|
| `number` | entero 1–9 | único |
| `prompt` | texto | Enunciado, por ejemplo "Al comenzar un proyecto nuevo lo primero que haces es:" |
| `scaleLabels` | 4 textos | Etiquetas de los valores 1–4. Bloque 1: "No es muy cierto de mí / Algo cierto de mí / Cierto de mí / Muy cierto de mí"; bloques 2–9: "Nunca / Raras veces / Algunas veces / Usualmente" |
| `items` | 5 Item | Posiciones 1–5 |

### Item

| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto `"x.n"` | Único en todo el test (p. ej. `"3.4"`) |
| `position` | entero 1–5 | n |
| `text` | texto | Afirmación tal como está en el Excel |
| `profileId` | ProfileId | Debe coincidir con la tabla de posición (lo verifica una prueba) |

### Profile (`profiles.json`, 5 elementos)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ProfileId | |
| `name` | texto | Nombre mostrado |
| `centralDesire` | texto | Deseo central (p. ej. "Capitalizar oportunidades") |
| `centralFear` | texto | Miedo central |
| `centralPriority` | texto | Prioridad central |
| `description` | texto | Descripción completa de la hoja |
| `shortDescription` | texto | Para la tarjeta del radar; derivada de la primera oración y editable |
| `strengths` | texto | Fortalezas |
| `improvementAreas` | texto | Oportunidades de mejora |
| `strongCompetencies` | lista de `CompetencyGroup` | Lo ya desarrollado |
| `competenciesToDevelop` | lista de `CompetencyGroup` | Lo que debe potenciar |
| `complementaryProfiles` | lista de ProfileId | 2 por perfil, normalizados desde el texto del Excel |
| `practicalAdvice` | `{ intro: texto, steps: texto[] }` | Párrafo introductorio y consejos numerados |

`CompetencyGroup` = `{ title: texto, items: texto[] }` (p. ej. "Competencias gerenciales" → "Liderazgo", "Delegación"…).

### Source (`sources.json`)

`{ authorship: texto, version: "Versión Junio 2019", references: texto[4] }`. `authorship` incluye "Elaboración CEIS – Centro de Emprendimiento e Innovación Sabana".

### Program (`programs.json`)

`{ id: texto (slug), name: texto }[]`: 29 programas en el orden entregado por el solicitante (casi alfabético; ver contracts/content-files.md) y, al final, `{ id: "otro-posgrado", name: "Otro / posgrado" }`.

## Envíos y resultados

### EntryData (ingreso)

| Campo | Tipo | Regla |
|---|---|---|
| `email` | texto | Recortado y en minúsculas; formato local@dominio; dominio exactamente igual a `ALLOWED_EMAIL_DOMAIN` |
| `programId` | texto | Debe existir en `programs.json` |
| `consentAccepted` | booleano | Debe ser `true` |

### Answers

Objeto `{ "1.1": 1–4, …, "9.5": 1–4 }` con **exactamente** las 45 claves del test y valores enteros de 1 a 4. Cualquier clave faltante, sobrante o fuera de rango es inválida.

### ScoreResult (salida de `scoreAnswers`)

| Campo | Tipo | Notas |
|---|---|---|
| `scores` | `Record<ProfileId, entero 9–36>` | Suma de los 9 ítems de cada perfil |
| `dominant` | ProfileId[] | 1 o más (empate); orden estable según la tabla de posición |
| `secondary` | ProfileId[] | Perfiles del siguiente puntaje distinto; vacío si no existe |

Invariante: la suma de los cinco puntajes es igual a la suma de las 45 respuestas.

### Submission (lo que guarda el repositorio)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | Generado en la API |
| `email` | texto | Ya normalizado |
| `programId` | texto | |
| `answers` | Answers | |
| `scores`, `dominant`, `secondary` | de ScoreResult | **Recalculado en la API**, nunca tomado del cliente |
| `consentAcceptedAt` | fecha-hora ISO 8601 UTC | Momento de recepción del envío |
| `consentTextVersion` | texto | Versión del texto de autorización mostrado |
| `submittedAt` | fecha-hora ISO 8601 UTC | |

Un correo puede tener varios envíos; cada uno es independiente (sin clave única por correo).

### Estado del cliente (sessionStorage, solo `apps/web`)

`{ entry: EntryData | null, answers: Partial<Answers>, result: ScoreResult | null }`. Se borra al cerrar la pestaña o al pulsar "Repetir el test" (se limpian `answers` y `result`; se conserva `entry`).

## Transiciones de estado del flujo

```text
Sin ingreso ──(ingreso válido + consentimiento)──▶ Test bloque 1
Test bloque n ──(5/5 respondidos, Siguiente)──▶ bloque n+1
Test bloque n ──(Anterior)──▶ bloque n−1   (respuestas conservadas)
Test bloque 9 ──(45/45, Finalizar)──▶ cálculo local ──▶ Resultado ──┐
                                      └─▶ POST /api/submissions (en paralelo; fallo no bloquea)
Resultado ──(Repetir)──▶ Test bloque 1 con respuestas vacías
```

## Relaciones

- `Item.profileId` → `Profile.id`; `Profile.complementaryProfiles[]` → `Profile.id`.
- `Submission.programId` → `Program.id`.
- `Submission.scores/dominant/secondary` se derivan únicamente de `Submission.answers` y de `Item.profileId`.
