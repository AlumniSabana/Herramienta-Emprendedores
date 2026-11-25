# Contrato de los archivos de contenido

Estos JSON son la interfaz entre quien edita el contenido (CEIS / equipo) y la aplicación. Se editan sin tocar código; cualquier cambio se valida con `npm test -w packages/core` (pruebas de integridad en `content.test.ts`). Las formas completas están en [data-model.md](../data-model.md).

Ubicación: `packages/core/content/`.

## `programs.json`

```json
[
  { "id": "administracion-y-servicio", "name": "Administración & Servicio" },
  { "id": "otro-posgrado", "name": "Otro / posgrado" }
]
```

Reglas verificadas: ids únicos (slug en minúsculas sin tildes); la lista se muestra en el orden del archivo (el catálogo entregado no es estrictamente alfabético: agrupa las ingenierías, con "Ingeniería de…" y "Ingeniería en…" después de "Ingeniería Química") y `otro-posgrado` siempre va al final; el catálogo inicial tiene 29 programas más "Otro / posgrado".

## `test.json`

```json
{
  "intro": "Estimado Emprendedor, este cuestionario le ayudará a perfilar…",
  "blocks": [
    {
      "number": 1,
      "prompt": "Al comenzar un proyecto nuevo lo primero que haces es:",
      "scaleLabels": ["No es muy cierto de mí", "Algo cierto de mí", "Cierto de mí", "Muy cierto de mí"],
      "items": [
        { "id": "1.1", "position": 1, "text": "Planificar cada detalle y haces listas.", "profileId": "realista-gerencial" }
      ]
    }
  ]
}
```

Reglas verificadas: 9 bloques numerados 1–9; 5 ítems por bloque (45 en total); `id` = `"{bloque}.{posición}"`; `profileId` coincide con la posición (1 → realista-gerencial, 2 → realizador-comerciante, 3 → artistico-imaginativo, 4 → movilizador-social, 5 → investigativo-creador); `scaleLabels` tiene exactamente 4 textos.

## `profiles.json`

Arreglo de 5 perfiles con los campos de `Profile` (ver data-model). Reglas verificadas: los cinco ids presentes una sola vez; ningún campo de texto vacío; `complementaryProfiles` referencia ids existentes y nunca al propio perfil; `strongCompetencies`, `competenciesToDevelop` y `practicalAdvice.steps` no vacíos.

## `sources.json`

```json
{
  "authorship": "Elaboración CEIS – Centro de Emprendimiento e Innovación Sabana…",
  "version": "Versión Junio 2019",
  "references": ["…", "…", "…", "…"]
}
```

Reglas verificadas: exactamente 4 referencias (las de la hoja "FUENTES DE ELABORACIÓN").

## Cambiar contenido: qué se puede y qué no

- Se puede: corregir textos, reordenar competencias, añadir o quitar programas (respetando el orden y "Otro / posgrado" al final), ajustar `shortDescription`.
- No se puede sin cambiar código y pruebas: añadir un sexto perfil, cambiar el número de bloques o de ítems por bloque, o cambiar el rango 1–4 (el radar y la regla de 9 a 36 dependen de 9 ítems por perfil).
