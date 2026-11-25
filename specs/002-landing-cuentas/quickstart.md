# Quickstart: validar la feature 002 (landing, cuentas e ingreso)

Guía de validación; la construcción está en `tasks.md`. Complementa el [quickstart de la 001](../001-diagnostico-perfil-emprendedor/quickstart.md).

## Prerrequisitos

- Node.js 22 y npm 10.
- Proyecto Supabase de **prueba** con la URL y la clave publishable (ya en `.env`; el archivo está ignorado por git).
- **Una sola vez en el SQL Editor de Supabase** (de prueba, luego producción): ejecutar [contracts/diagnosticos_emprendedor.sql](contracts/diagnosticos_emprendedor.sql). Verificación: la tabla `diagnosticos_emprendedor` aparece en Table Editor con RLS activada.
- En Supabase → Authentication → Email Templates, las plantillas **Confirm signup** y **Reset password** deben incluir el código `{{ .Token }}` (no solo un enlace). Si el proyecto de prueba se copió de CDP, ya lo trae.
- Para probar correos reales hace falta una bandeja `@unisabana.edu.co` que puedas leer. El servicio de correo gratuito de Supabase tiene un tope bajo de envíos por hora.

Variables (`.env`; no se commitea):

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | web |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | API |
| `ALLOWED_EMAIL_DOMAIN`, `VITE_ALLOWED_EMAIL_DOMAIN` | dominio permitido |
| `VITE_DATA_POLICY_URL` | enlace a la política de datos |

La clave secreta (`sb_secret_…`) **no** se usa ni se pone en ninguna variable.

## Arranque y pruebas automáticas

```powershell
npm install
npm run dev     # API en :3001 y web en http://localhost:5173
npm test
```

| Prueba | Qué comprueba | Spec |
|---|---|---|
| `auth-rules.test.ts` | Contraseña mínima 8, nombre, facultad/programa coherentes, correo con dominio exacto, código limpio | FR-006 a FR-008 |
| `content.test.ts` | 10 facultades con "Otra" al final, programas únicos, `landing.json` con 4 viñetas y 3 pasos | FR-004, FR-009 |
| `LandingPage.test.tsx` | Contenido visible, enlaces a registro e ingreso, con sesión muestra "Ir al diagnóstico" | FR-001, FR-002 |
| `RegisterPage.test.tsx` | El programa depende de la facultad; rechazos (dominio, contraseña, sin consentimiento); paso de código; correo ya registrado; sin doble envío | FR-006 a FR-012 |
| `LoginPage.test.tsx` | Error sin revelar qué falló; cuenta sin verificar lleva al código | FR-013, FR-014 |
| `RecoverPage.test.tsx` | Misma respuesta exista o no la cuenta; código y contraseña nueva | FR-019, FR-020 |
| `RequireAuth.test.tsx` | Sin sesión → ingresar con retorno; con sesión pasa; cargando no redirige | FR-016, FR-018 |
| `handleSubmission.test.ts` | 401 sin token válido, 400 con respuestas inválidas, ignora puntajes y correo del cliente, usa el `userId` verificado | FR-023 a FR-025 |
| `vitest-axe` | Sin violaciones en cada pantalla nueva | FR-027 |

## Escenarios manuales con el navegador (proyecto de prueba)

1. **Landing sin sesión** (US1): `/` explica la herramienta, tiene "Crear cuenta" e "Ingresar" en el encabezado y en el hero; a 360 px sin desplazamiento horizontal.
2. **Registro** (US2): elegir una facultad y ver solo sus programas; probar `x@gmail.com`, contraseña de 7 caracteres y sin consentimiento (todo rechazado). Registrar `tu.nombre@unisabana.edu.co`, leer el código del correo, escribirlo y quedar dentro.
3. **Correo ya registrado**: repetir el registro con el mismo correo → mensaje de "ya tiene cuenta".
4. **Código inválido y reenvío**: escribir un código errado → mensaje; el reenvío espera la cuenta atrás.
5. **Ingreso y retorno** (US3): sin sesión abrir `/resultado` → lleva a `/ingresar`; tras ingresar vuelve a la ruta. Contraseña errónea → mensaje que no dice qué dato falló.
6. **Cuenta sin verificar**: crear una cuenta, no verificarla, intentar ingresar → lleva al código con reenvío.
7. **Cuenta de CDP**: ingresar con una cuenta que ya exista en Herramientas CDP (misma contraseña) → entra sin registrarse.
8. **Recuperación** (US4): "Olvidé mi contraseña" → código → contraseña nueva → ingresar con ella. Con un correo sin cuenta se ve la misma respuesta.
9. **Resultado ligado a la cuenta** (US5): hacer el test con las respuestas de `packages/core/tests/fixtures/excel-sample.json` → 34/30/27/26/25; cerrar sesión y volver a ingresar → `/diagnostico` muestra ese último resultado; repetir el test conserva el anterior en la base.
10. **Aislamiento** (SC-005): ejecutar [contracts/verify-rls.sql](contracts/verify-rls.sql) con dos cuentas (reemplazando los UUID) → los cinco pasos imprimen `OK`.
11. **Teclado y lector de pantalla**: recorrer landing, registro con código y recuperación solo con teclado; los errores se anuncian y el foco pasa al primer campo con error.
12. **Cerrar sesión**: vuelve a `/` y el test deja de ser accesible.

## Verificación directa de la API

Sin sesión debe rechazar (contrato en [contracts/submissions-api.yaml](contracts/submissions-api.yaml)):

```powershell
curl.exe -s -i -X POST http://localhost:5173/api/submissions -H "Content-Type: application/json" -d "{\"answers\":{}}"
```

Esperado: `401` con mensaje en español y nada guardado.

## Paso a producción

1. Ejecutar la migración y `verify-rls.sql` en la base de producción.
2. Cambiar en Vercel las cuatro variables de Supabase por las de producción.
3. Comprobar las plantillas de correo y el perfil (`perfiles`) en producción.
4. **Rotar la clave secreta del proyecto de prueba** (se compartió en un chat) y no usar nunca una clave secreta en Vercel para esta herramienta.
5. Repetir los escenarios 2, 5, 8 y 9 en el despliegue.
