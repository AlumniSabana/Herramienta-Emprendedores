# Herramienta-Emprendedores

Diagnóstico de perfil emprendedor para estudiantes y alumni de la Universidad de La Sabana, con la apariencia de TalentHub UniSabana · Herramientas CDP.

- Página principal pública que explica la herramienta, con **crear cuenta** (verificación del correo), **ingresar**, **recuperar contraseña** y **Mi cuenta** (cambiar la contraseña dentro de la aplicación).
- Test de 9 bloques × 5 afirmaciones (1 a 4), radar de cinco perfiles y detalle de cada uno. Contenido y puntaje: Excel del CEIS, versión junio 2019.
- **El resultado se guarda por usuario**: al volver a ingresar se ve el último resultado y se puede rehacer el test (el historial se conserva).

Especificaciones, planes y tareas: [`specs/001-diagnostico-perfil-emprendedor/`](specs/001-diagnostico-perfil-emprendedor/) (test y resultados) y [`specs/002-landing-cuentas/`](specs/002-landing-cuentas/) (landing, cuentas y resultados por usuario).

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `packages/core` | Puntaje, validaciones (correo, registro, códigos), esquemas y el contenido en JSON (`content/`). Lo usan la web y la API. |
| `apps/web` | Frontend React + Vite + TypeScript + Tailwind + React Router. |
| `api/` | Vercel Function `POST /api/submissions` (lógica en `api/_lib/`). |
| `supabase/` | Migración SQL de la tabla de resultados y verificación de RLS. |
| `tools/` | `extract-content.py`: pasó el Excel a JSON (una sola vez). |

## Requisitos y arranque

Node.js 22 y npm.

```powershell
npm install
Copy-Item .env.example .env   # y completar las variables de Supabase (abajo)
npm run dev                   # API en :3001 y web en http://localhost:5173
npm test                      # núcleo, API y web (con servicios simulados; no usa la red)
npm run build                 # genera apps/web/dist
```

> **OneDrive:** este repositorio vive dentro de OneDrive y allí la resolución de paquetes de Vite 8 falló de forma intermitente. `apps/web/vite.config.ts` incluye un rodeo (`preserveSymlinks` + alias a `packages/core`). Lo más sano es mover el repo fuera de OneDrive, o excluir `node_modules` de la sincronización, y entonces quitar ese rodeo.

## Cuentas y base de datos (Supabase)

Las cuentas son las de **Herramientas CDP** (mismo proyecto de Supabase): correo y contraseña, verificación del correo y recuperación de contraseña. La misma cuenta sirve en ambas herramientas, pero la sesión no se comparte entre los dos sitios.

| Variable | Dónde | Notas |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | web | URL del proyecto y clave **publishable** |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | API | las mismas dos |
| `ALLOWED_EMAIL_DOMAIN`, `VITE_ALLOWED_EMAIL_DOMAIN` | API, web | por defecto `unisabana.edu.co` |
| `SUBMISSION_REPOSITORY` | API | `supabase` (por defecto) o `memory` para pruebas |
| `VITE_DATA_POLICY_URL` | web | enlace a la política de datos |

**Nunca se usa ni se guarda la clave secreta (`sb_secret_…` / service role).** La web y la API trabajan con la clave publishable; la API guarda los resultados con la propia sesión de la persona (RLS), no con una clave de servicio.

Una sola vez por proyecto (prueba y luego producción), en el SQL Editor de Supabase:

1. Ejecutar [`supabase/migrations/20261125_diagnosticos_emprendedor.sql`](supabase/migrations/20261125_diagnosticos_emprendedor.sql): crea `diagnosticos_emprendedor` con RLS (cada persona solo lee e inserta lo suyo).
2. Ejecutar [`supabase/verify-rls.sql`](supabase/verify-rls.sql) con dos cuentas de prueba (instrucciones en el archivo): imprime cinco avisos `OK`.
3. **Correos (sin servidor SMTP propio):** se dejan las plantillas por defecto de Supabase, que traen un **enlace**. La aplicación admite enlace y código: si la plantilla del proyecto trae `{{ .Token }}` (como en producción de CDP), la persona puede escribir el código en la misma pantalla.
4. En Authentication → URL Configuration: poner el **Site URL** y añadir en **Redirect URLs** `http://localhost:5173/**` y la dirección de producción. Sin esto, el enlace del correo no vuelve a la aplicación.
5. La tabla `perfiles` debe crearse a partir de los metadatos del registro (nombre, facultad, programa); si no se puede leer, la app usa los metadatos de la cuenta.

**Paso a producción:** cambiar las cuatro variables de Supabase en Vercel, repetir los pasos 1 a 3 en la base de producción y rotar cualquier clave secreta que se haya compartido.

## Rutas

| Ruta | Acceso |
|---|---|
| `/` landing, `/ingresar`, `/registro`, `/recuperar` | públicas |
| `/restablecer` (destino del enlace de recuperación) | pública; con el enlace obliga a definir la contraseña nueva |
| `/diagnostico` (último resultado, empezar o rehacer), `/test/:bloque`, `/resultado`, `/cuenta` (datos y cambio de contraseña) | con sesión; sin ella llevan a `/ingresar` y vuelven a lo pedido |

### Cómo funciona la recuperación de contraseña

1. `/recuperar`: la persona escribe su correo y Supabase le envía el correo (con enlace; la respuesta es la misma exista o no la cuenta).
2. El enlace abre `/restablecer` con una sesión **marcada como de recuperación**. Mientras esté marcada, cualquier ruta protegida lleva de vuelta a `/restablecer` (también tras recargar): el enlace no deja "entrar" sin cambiar la contraseña. "Cancelar" cierra esa sesión.
3. Si el enlace venció o ya se usó (los correos institucionales a veces lo abren antes que la persona), se muestra un mensaje y se ofrece pedir otro.
4. Con la sesión normal, la contraseña se cambia en `/cuenta` escribiendo la actual.

## Editar el contenido

Todo vive en `packages/core/content/` y se valida al arrancar y en `npm test`:

- `landing.json`: textos de la página principal (siempre 4 viñetas y 3 pasos).
- `faculties.json`: facultades y programas (la última debe ser "Otra / no está en la lista").
- `test.json`, `profiles.json`, `sources.json`: el test, los 5 perfiles y las fuentes.

No se puede añadir un perfil ni cambiar el número de bloques sin tocar código: el radar y el rango 9 a 36 dependen de 5 perfiles × 9 ítems. El Excel tiene erratas de redacción que se transcribieron tal cual.

## Limitaciones conocidas

- Quien tenga sesión podría insertar directamente en su propia tabla saltándose el recálculo del puntaje de la API; solo afecta sus filas. Antes de que el equipo CEIS consulte estadísticas hay que añadir un disparador en la base que recalcule los puntajes (ver `specs/002-landing-cuentas/research.md`, sección 6).
- Los enlaces del correo de Supabase sirven una sola vez; si un filtro de correo los abre antes que la persona, hay que pedir otro. Con las plantillas por código no pasa.
- El dominio del correo se valida en la pantalla; el servicio de cuentas puede o no aplicarlo por su cuenta.
- Marca provisional "TalentHub UniSabana" en texto: falta el logo oficial.

## Despliegue en Vercel

Un solo proyecto conectado al repositorio. `vercel.json` ya define el build (`apps/web/dist`) y el rewrite de la SPA. Configurar las variables de arriba en el panel.
