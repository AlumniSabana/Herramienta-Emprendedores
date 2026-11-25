# Quickstart: validar el Diagnóstico de Perfil Emprendedor

Guía para comprobar de punta a punta que la funcionalidad cumple la spec. No contiene implementación; los pasos de construcción están en `tasks.md` (siguiente comando).

## Prerrequisitos

- Node.js 22 y npm 10 (instalados: 22.20.0 / 10.9.3).
- No se necesita Vercel CLI ni base de datos.
- Copiar `.env.example` a `.env` y revisar:
  - `ALLOWED_EMAIL_DOMAIN=unisabana.edu.co` y `VITE_ALLOWED_EMAIL_DOMAIN=unisabana.edu.co`
  - `SUBMISSION_REPOSITORY=console` (`memory` para pruebas)
  - `VITE_DATA_POLICY_URL=` (URL de la política de tratamiento de datos; pendiente de definir)

## Instalación y arranque

```powershell
npm install
npm run dev
```

`npm run dev` levanta el servidor de desarrollo de la API y el de Vite con proxy en `/api`. Abrir la URL que muestre Vite (normalmente `http://localhost:5173`).

## Pruebas automáticas

```powershell
npm test
```

Debe pasar todo, en particular:

| Prueba | Qué prueba | Spec |
|---|---|---|
| `scoring.test.ts` con `excel-sample.json` | 27 / 34 / 26 / 25 / 30; dominante Realizador-Comerciante; secundario Investigativo-Creador | FR-013, SC-002 |
| `scoring.test.ts` (empates y extremos) | Empate de 2 a 5 perfiles, empate en segundo puesto, todo 1 → 9, todo 4 → 36 | FR-011, SC-003 |
| `content.test.ts` | 9×5 ítems, mapeo por posición, 5 perfiles completos, 4 fuentes, 29 programas únicos con "Otro / posgrado" al final | FR-003, FR-005, FR-019 |
| `email.test.ts` | Formato, mayúsculas y espacios, `…edu.co.example.com` rechazado | FR-002 |
| `handleSubmission.test.ts` | Rechaza respuestas faltantes/sobrantes/fuera de 1–4, programa inexistente, sin consentimiento; ignora puntajes enviados; llama al repositorio una vez | FR-020, FR-021 |
| Pruebas de componentes y flujo (web) | Guardas de ruta, no avanzar con ítems sin responder, conservar respuestas, flujo completo con el fixture | FR-007, FR-008, SC-004 |
| `vitest-axe` | Sin violaciones en ingreso, bloque, resultado y radar | FR-022, SC-006 |

## Escenarios manuales (con el navegador)

1. **Ingreso inválido** (Story 1): correo `alguien@gmail.com` → mensaje de dominio; sin marcar la aceptación → no deja empezar; programa de la lista cerrada con "Otro / posgrado" al final.
2. **Test**: en el bloque 1 dejar un ítem sin responder y pulsar Siguiente → no avanza y señala el pendiente. Responder, avanzar al bloque 3, volver con Anterior → respuestas intactas. Comprobar que el bloque 1 muestra la escala "No es muy cierto de mí…" y el bloque 2 "Nunca…".
3. **Resultado con datos del Excel**: responder las 45 afirmaciones con los valores de `packages/core/tests/fixtures/excel-sample.json`. Esperado: Realizador-Comerciante 34 (dominante), Investigativo-Creador 30 (secundario), Realista-Gerencial 27, Artístico-Imaginativo 26, Movilizador-Social 25.
4. **Radar interactivo**: con el ratón, pasar por cada punto; con teclado, Tab entre los cinco puntos y Esc para cerrar; en móvil (DevTools 360 px), tocar un punto. La tarjeta muestra nombre, puntaje /36, deseo, miedo, prioridad y descripción corta.
5. **Detalle**: se abre el perfil dominante; cambiar por pestañas o desde el radar; cada perfil muestra las siete secciones. Comparar el texto de 1 perfil con su hoja del Excel.
6. **Fuentes y repetir**: "Fuentes" visible con CEIS, versión junio 2019 y 4 referencias; "Repetir el test" vuelve al bloque 1 con respuestas en blanco.
7. **Accesibilidad**: recorrer todo el flujo solo con teclado; la tabla de puntajes está disponible junto al radar; contraste AA en botones y textos (herramienta de contraste del navegador).
8. **Fallo de guardado**: detener el servidor de la API y finalizar el test → el resultado se muestra igual con un aviso no bloqueante.
9. **Empate**: responder todos los ítems con el mismo valor → los cinco perfiles aparecen como dominantes y no hay secundario.

## Verificación del envío

- Con `SUBMISSION_REPOSITORY=console`, cada envío exitoso imprime una línea JSON en la terminal de la API con los campos del `Submission` (ver [data-model.md](data-model.md)); confirmar que `scores` coincide con lo mostrado en pantalla.
- Prueba directa del contrato ([submissions-api.yaml](contracts/submissions-api.yaml)):

```powershell
curl.exe -s -X POST http://localhost:5173/api/submissions -H "Content-Type: application/json" -d "{\"email\":\"x@gmail.com\"}"
```

Esperado: `400` con mensaje en español y sin registro.

## Despliegue (previsto)

Proyecto único en Vercel conectado al repositorio; variables de entorno de `.env.example` configuradas en el panel; build según `vercel.json`. La verificación en preview repite los escenarios 1, 3 y 8.
