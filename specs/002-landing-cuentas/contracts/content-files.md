# Contrato de los archivos de contenido (feature 002)

Complementa el [contrato de la 001](../../001-diagnostico-perfil-emprendedor/contracts/content-files.md). `programs.json` desaparece y se añaden `faculties.json` y `landing.json`. Se validan al arrancar y en `npm test -w packages/core`.

Ubicación: `packages/core/content/`.

## `faculties.json`

```json
[
  {
    "id": "facultad-de-ingenieria",
    "name": "Facultad de Ingeniería",
    "programs": [
      { "id": "ingenieria-industrial", "name": "Ingeniería Industrial" }
    ]
  },
  {
    "id": "otra",
    "name": "Otra / no está en la lista",
    "programs": [
      { "id": "otro-programa", "name": "Otro programa" },
      { "id": "posgrado", "name": "Posgrado" },
      { "id": "egresado-programa-descontinuado", "name": "Egresado de un programa que ya no se ofrece" }
    ]
  }
]
```

Reglas verificadas: 10 facultades; "Otra / no está en la lista" siempre la última; todas con al menos un programa; ids únicos en todo el catálogo; 29 programas reales más los 3 de "Otra". El nombre (no el id) es lo que se guarda en la cuenta.

## `landing.json`

```json
{
  "hero": {
    "eyebrow": "CENTRO DE DESARROLLO PROFESIONAL · ALUMNI",
    "title": "Conoce tu carácter emprendedor.",
    "lead": "Un diagnóstico de 45 afirmaciones que te muestra, en un radar, qué perfil emprendedor tienes más desarrollado y cuál puedes potenciar.",
    "primaryCta": "Crear mi cuenta",
    "secondaryCta": "Ya tengo cuenta"
  },
  "tool": {
    "eyebrow": "DIAGNÓSTICO",
    "title": "Diagnóstico de perfil emprendedor",
    "description": "…",
    "bullets": ["…", "…", "…", "…"],
    "cta": "Hacer el diagnóstico"
  },
  "steps": [
    { "title": "Crea tu cuenta", "text": "Con tu correo @unisabana.edu.co. Un solo acceso sirve para todas las herramientas." },
    { "title": "Responde a tu ritmo", "text": "…" },
    { "title": "Conoce tu radar", "text": "…" }
  ],
  "privacy": { "title": "Tu información es tuya", "text": "…" },
  "footer": { "copyright": "© 2026 Universidad de La Sabana · Centro de Desarrollo Profesional", "policyLabel": "Política de datos personales" }
}
```

Reglas verificadas: `bullets` tiene exactamente 4 elementos y `steps` exactamente 3; ningún texto vacío; el bloque de privacidad debe mencionar lo que realmente se guarda (cuenta, respuestas y resultados) — lo revisa el solicitante antes de publicar. Los textos iniciales siguen el tono de la referencia y los aprueba el solicitante.

El enlace de la política no está en el JSON: sale de `VITE_DATA_POLICY_URL` (por defecto `https://www.unisabana.edu.co/politica-de-proteccion-de-datos`).

## Qué se puede y qué no cambiar sin tocar código

- Se puede: cualquier texto, el orden de facultades y programas, añadir o quitar programas.
- No se puede sin cambiar código y pruebas: añadir o quitar viñetas (siempre 4) o pasos (siempre 3), mover "Otra" de lugar, o cambiar `AGREEMENT_VERSION` sin avisar al solicitante (cambia el texto legal aceptado).
