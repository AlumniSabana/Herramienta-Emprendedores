# Feature Specification: Página principal, cuentas e ingreso

**Feature Branch**: `002-landing-cuentas` (directorio de la spec; no se creó rama git)

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Una página principal pública que explique qué es la herramienta 'Diagnóstico de perfil emprendedor' y desde la cual se pueda crear cuenta o ingresar. Usa como referencia las páginas de inicio, ingreso y registro de TalentHub UniSabana · Herramientas del CDP (herramientas-cdp.vercel.app). Las cuentas se reutilizan de Herramientas CDP, con verificación de correo por código y recuperación de contraseña activa. Reemplaza en parte el ingreso de la feature 001."

## Relación con la feature 001

Esta feature **amplía** la [feature 001](../001-diagnostico-perfil-emprendedor/spec.md) y **reemplaza** estas decisiones suyas:

| Feature 001 | Pasa a ser |
|---|---|
| FR-001: ingreso pidiendo solo correo y programa, sin cuenta; no pedir nombre completo | Cuenta real con nombre completo, facultad, programa, correo y contraseña (FR-006 a FR-010 de esta spec). El test ya no pide correo ni programa: salen de la cuenta. |
| FR-003: catálogo plano de programas (`programs.json`) | Catálogo de facultades con sus programas, también editable como archivo de datos (FR-009). |
| FR-004: aceptación de datos al empezar el test | La aceptación se da una sola vez al crear la cuenta, con versión y fecha (FR-010). |
| FR-020 y entidad "Envío": registro identificado por un correo escrito a mano | El resultado queda asociado a la cuenta de la persona (FR-024). |
| FR-023: apariencia de AlumniCV | Apariencia de TalentHub UniSabana · Herramientas CDP en toda la aplicación (FR-003). |
| Fuera de alcance: "autenticación con verificación real del correo" | Dentro de alcance: verificación del correo por código y recuperación de contraseña. |

Todo lo demás de la 001 (test de 9 bloques, puntaje, radar, detalle de perfiles, fuentes, repetir el test) se mantiene igual.

## Enmienda 2026-11-25: enlace del correo y configuración de cuenta

**Decisión del solicitante**: no se configura un servidor de correo propio, así que las plantillas de correo del servicio de cuentas quedan por defecto (traen **enlace**, no código). Consecuencias, que **prevalecen** sobre lo que dicen en contrario las historias y requisitos de abajo:

- **Recuperar contraseña (historia 4)**: la persona pide el correo, abre el **enlace** que le llega y llega a una pantalla *obligatoria* "Define tu nueva contraseña". Mientras no la defina, no puede usar nada más de la aplicación (el enlace no la deja "entrar" sin cambiarla). Si el correo trae un código en lugar de enlace (por ejemplo, en producción, donde la cuenta es la de Herramientas CDP), la misma pantalla permite escribir el código y la contraseña nueva: se admiten los dos formatos.
- **Verificar el correo al registrarse (historia 2)**: la persona abre el enlace del correo y queda con sesión iniciada; si el correo trae código, lo escribe. Se admiten los dos formatos.
- **Enlace vencido o ya usado** (los correos institucionales a veces abren los enlaces antes que la persona): se muestra un mensaje claro y se ofrece pedir otro.
- **Nueva historia 6 — Configuración de cuenta (P2)**: con sesión, una pantalla "Mi cuenta" muestra nombre, facultad, programa y correo (solo lectura) y permite **cambiar la contraseña** escribiendo la actual, la nueva (mínimo 8 caracteres) y su confirmación. Antes estaba fuera de alcance; la edición de los demás datos del perfil sigue fuera de alcance.
- **Requisito de configuración**: la dirección de la aplicación (local y de producción) debe estar en la lista de direcciones de redirección permitidas del servicio de cuentas; si no, el enlace del correo no vuelve a la aplicación.

Requisitos añadidos:

- **FR-030**: Tras abrir un enlace de recuperación, el sistema MUST mostrar la pantalla de contraseña nueva (con confirmación, mínimo 8 caracteres) y MUST impedir el acceso al resto de la aplicación hasta que se defina o la persona cierre sesión; esto aplica también si recarga la página o abre otra ruta.
- **FR-031**: Un enlace vencido, ya usado o inválido MUST mostrar un mensaje claro y un acceso para pedir otro, sin iniciar sesión.
- **FR-032**: La verificación del correo MUST funcionar abriendo el enlace del correo o, si el correo trae código, escribiéndolo.
- **FR-033**: La pantalla "Mi cuenta" MUST ser accesible solo con sesión, mostrar nombre, facultad, programa y correo, y ofrecer el cambio de contraseña.
- **FR-034**: Cambiar la contraseña MUST exigir la contraseña actual (un mensaje claro si no coincide), la nueva con mínimo 8 caracteres y una confirmación igual; al terminar MUST confirmar el cambio sin cerrar la sesión.
- **FR-035**: El encabezado MUST ofrecer el acceso a "Mi cuenta" con sesión iniciada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender qué es la herramienta desde la página principal (Priority: P1)

Una persona llega a la página principal sin tener cuenta. Lee qué es el diagnóstico, qué mide, cuánto toma y qué se hace con sus datos, y desde ahí puede crear su cuenta o ingresar.

**Why this priority**: Es la puerta de entrada: sin explicación y sin accesos claros, nadie llega al test.

**Independent Test**: Abrir la dirección principal sin sesión y comprobar que se explica la herramienta y que desde el encabezado y desde el bloque principal se llega a "Crear cuenta" y a "Ingresar".

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** abre la página principal, **Then** ve el nombre de la herramienta, una explicación de qué mide (cinco perfiles emprendedores, 9 bloques de 5 afirmaciones, radar de resultados, lo que ya tiene desarrollado y lo que debe potenciar), el tiempo aproximado, y un bloque de privacidad.
2. **Given** la página principal, **When** la persona pulsa "Crear mi cuenta" o "Crear cuenta" del encabezado, **Then** llega al registro.
3. **Given** la página principal, **When** pulsa "Ya tengo cuenta" o "Ingresar" del encabezado, **Then** llega al ingreso.
4. **Given** una persona con sesión iniciada, **When** abre la página principal, **Then** ve un acceso directo al diagnóstico en lugar de "Crear cuenta" e "Ingresar".
5. **Given** la página principal en un teléfono, **When** se desplaza de arriba abajo, **Then** todo el contenido y los botones son legibles y alcanzables sin desplazamiento horizontal.

---

### User Story 2 - Crear cuenta y verificar el correo (Priority: P1)

Una persona crea su cuenta con nombre, facultad, programa, correo institucional y contraseña, acepta el tratamiento de datos y confirma su correo con un código que le llega.

**Why this priority**: Sin cuenta verificada no hay acceso al diagnóstico.

**Independent Test**: Completar el registro con datos válidos, recibir el código en el correo, escribirlo y quedar dentro con sesión iniciada; probar también los rechazos (dominio, contraseña corta, sin aceptación, correo ya registrado, código incorrecto).

**Acceptance Scenarios**:

1. **Given** el registro, **When** la persona elige una facultad, **Then** el campo programa muestra solo los programas de esa facultad y queda vacío hasta que elija uno.
2. **Given** datos válidos y la autorización marcada, **When** pulsa "Crear cuenta", **Then** se le pide un código de verificación enviado a su correo y todavía no entra.
3. **Given** la pantalla del código, **When** escribe el código correcto, **Then** la cuenta queda verificada, la sesión se inicia y llega al diagnóstico.
4. **Given** la pantalla del código, **When** escribe un código incorrecto o vencido, **Then** ve un mensaje claro y puede reintentar o pedir un código nuevo.
5. **Given** un correo que no termina en el dominio institucional, **When** intenta registrarse, **Then** se rechaza con un mensaje que indica el dominio permitido.
6. **Given** una contraseña de menos de 8 caracteres, **When** intenta registrarse, **Then** se rechaza e indica el mínimo.
7. **Given** la autorización de datos sin marcar, **When** intenta registrarse, **Then** no puede continuar.
8. **Given** un correo que ya tiene cuenta (por ejemplo, creada en Herramientas CDP), **When** intenta registrarse, **Then** se le indica que ya existe y se le ofrece ingresar o recuperar la contraseña.

---

### User Story 3 - Ingresar, usar el diagnóstico y cerrar sesión (Priority: P1)

Una persona con cuenta ingresa con su correo y contraseña, accede al diagnóstico y puede cerrar sesión. Si ya hizo el test, puede ver su último resultado o repetirlo.

**Why this priority**: Es el uso diario de la cuenta y protege el test.

**Independent Test**: Ingresar con una cuenta verificada y llegar al diagnóstico; cerrar sesión y comprobar que el test ya no es accesible; probar contraseña errónea y cuenta sin verificar.

**Acceptance Scenarios**:

1. **Given** una cuenta verificada, **When** ingresa con correo y contraseña correctos, **Then** llega al diagnóstico y el encabezado muestra su sesión y la opción de cerrar sesión.
2. **Given** correo o contraseña incorrectos, **When** intenta ingresar, **Then** ve un mensaje claro que no revela cuál de los dos falló.
3. **Given** una cuenta creada pero sin verificar, **When** intenta ingresar, **Then** se le pide terminar la verificación con el código y se le ofrece reenviarlo.
4. **Given** una persona sin sesión, **When** abre directamente la dirección del test o del resultado, **Then** se la lleva al ingreso y, al ingresar, vuelve a lo que quería abrir.
5. **Given** una persona con sesión, **When** pulsa "Cerrar sesión", **Then** vuelve a la página principal y ya no puede abrir el test sin ingresar de nuevo.
6. **Given** una persona que ya completó el test antes, **When** entra al diagnóstico, **Then** ve su último resultado con la opción de repetir el test.
7. **Given** una persona que nunca hizo el test, **When** entra al diagnóstico, **Then** ve cómo empezar el test.

---

### User Story 4 - Recuperar la contraseña (Priority: P2)

Una persona que olvidó su contraseña pide un código al correo, lo escribe y define una contraseña nueva.

**Why this priority**: Evita que una cuenta quede inutilizable, pero no bloquea el primer uso.

**Independent Test**: Desde el ingreso, pedir recuperación, recibir el código, escribirlo, definir una contraseña nueva e ingresar con ella.

**Acceptance Scenarios**:

1. **Given** la pantalla de ingreso, **When** la persona pulsa "Olvidé mi contraseña" y escribe su correo, **Then** se envía un código a ese correo y se muestra la pantalla para escribirlo.
2. **Given** un correo sin cuenta, **When** pide recuperación, **Then** la respuesta visible es la misma que con un correo con cuenta (sin revelar si existe).
3. **Given** el código correcto y una contraseña nueva válida (mínimo 8 caracteres), **When** confirma, **Then** la contraseña cambia y la persona queda con sesión iniciada o es llevada a ingresar.
4. **Given** un código incorrecto o vencido, **When** lo escribe, **Then** ve un mensaje claro y puede pedir uno nuevo.

---

### User Story 5 - Mis resultados quedan con mi cuenta (Priority: P2)

Cuando la persona termina el test, su resultado se guarda en su cuenta y solo ella puede verlo; al volver a entrar, lo encuentra.

**Why this priority**: Da continuidad entre sesiones y reemplaza el registro anónimo por correo de la 001, pero el test funciona sin ello.

**Independent Test**: Completar el test con una cuenta, cerrar sesión, volver a ingresar y ver el mismo resultado; comprobar que otra cuenta no puede leerlo.

**Acceptance Scenarios**:

1. **Given** una persona con sesión, **When** termina el test, **Then** se muestra su resultado y queda guardado en su cuenta sin pedirle correo ni programa.
2. **Given** una persona con resultado guardado, **When** vuelve a ingresar, **Then** encuentra su último resultado.
3. **Given** dos cuentas distintas, **When** una consulta resultados, **Then** nunca ve los de la otra.
4. **Given** que falla el guardado, **When** termina el test, **Then** igual ve su resultado en pantalla con un aviso no bloqueante (como en la 001).
5. **Given** una persona que repite el test, **When** termina de nuevo, **Then** se conservan los resultados anteriores y el último pasa a ser el que se muestra.

---

### Edge Cases

- Sesión vencida a mitad del test: se avisa, se pide ingresar de nuevo y se conservan las respuestas ya dadas en ese navegador.
- Perfil de la cuenta incompleto (por ejemplo, creada en Herramientas CDP sin programa): el diagnóstico sigue funcionando; el programa se toma del perfil si existe.
- Correo escrito con mayúsculas o espacios al inicio o al final: se normaliza antes de validar.
- Varias solicitudes seguidas de código (verificación o recuperación): se limita la frecuencia de reenvío y se informa cuánto esperar.
- Código con espacios o pegado con saltos de línea: se limpia antes de comprobarlo.
- Cuenta existente en Herramientas CDP: se puede ingresar con la misma contraseña, sin registrarse de nuevo.
- Doble clic en "Crear cuenta" o "Ingresar": no genera dos solicitudes ni dos cuentas.
- Sin conexión o error del servicio de cuentas: mensaje comprensible y la posibilidad de reintentar; el formulario conserva lo escrito (menos la contraseña).
- Navegación con teclado y lector de pantalla en los formularios y en la pantalla de código.

## Requirements *(mandatory)*

### Functional Requirements

**Página principal**

- **FR-001**: La página principal MUST ser pública y explicar: qué es el diagnóstico, qué mide (cinco perfiles emprendedores, 9 bloques de 5 afirmaciones, radar), qué recibe la persona (lo que ya tiene desarrollado y lo que debe potenciar), cuánto toma aproximadamente, y qué se hace con sus datos.
- **FR-002**: La página principal MUST ofrecer "Crear cuenta" e "Ingresar" en el encabezado y en el bloque principal; con sesión iniciada MUST ofrecer en su lugar el acceso al diagnóstico.
- **FR-003**: Toda la aplicación (página principal, ingreso, registro, verificación, recuperación, test y resultado) MUST adoptar la apariencia de TalentHub UniSabana · Herramientas CDP: encabezado azul marino con marca y nombre de la herramienta, tipografía de cuerpo sans-serif y títulos en serif cursiva, fondo gris azulado claro, tarjetas blancas de borde suave, botones azul marino, etiquetas en mayúsculas pequeñas, bloque principal con degradado azul marino y pie con créditos y enlace a la política de datos.
- **FR-004**: El contenido de la página principal (títulos, párrafos, viñetas, pasos "Cómo funciona", bloque de privacidad y pie) MUST vivir en un archivo de datos editable sin tocar la interfaz.
- **FR-005**: La página principal MUST incluir una sección de tres pasos (crea tu cuenta con el correo institucional, responde el test por bloques, conoce tu radar y plan de acción) y un bloque de privacidad coherente con lo que realmente se guarda.

**Registro y verificación**

- **FR-006**: El registro MUST pedir nombre completo, facultad, programa, correo institucional y contraseña, y la aceptación del tratamiento de datos personales (Ley 1581 de 2012).
- **FR-007**: El correo MUST validarse en formato y tener exactamente el dominio institucional permitido (configurable; por defecto `@unisabana.edu.co`), con mensaje claro si no lo cumple.
- **FR-008**: La contraseña MUST tener mínimo 8 caracteres; el campo MUST permitir mostrarla u ocultarla.
- **FR-009**: Facultad y programa MUST salir de un catálogo cerrado y editable como archivo de datos: el programa depende de la facultad elegida, y existe la facultad "Otra / no está en la lista" con las opciones "Otro programa", "Posgrado" y "Egresado de un programa que ya no se ofrece". El catálogo inicial es el entregado en el Input (9 facultades más "Otra").
- **FR-010**: Al crear la cuenta el sistema MUST registrar la versión del acuerdo de tratamiento de datos y la fecha en que se aceptó, junto con nombre, facultad, programa y correo en el perfil de la cuenta.
- **FR-011**: Tras el registro el sistema MUST enviar un código de verificación al correo y MUST exigir escribirlo antes de permitir el ingreso; MUST permitir reenviarlo con un límite de frecuencia.
- **FR-012**: Si el correo ya tiene cuenta, el sistema MUST decirlo y ofrecer ingresar o recuperar la contraseña, sin crear una cuenta duplicada.

**Ingreso y sesión**

- **FR-013**: El ingreso MUST pedir correo y contraseña, mostrar errores sin revelar cuál dato falló, y ofrecer "Olvidé mi contraseña" y "Crear cuenta".
- **FR-014**: Una cuenta sin verificar MUST poder terminar la verificación desde el ingreso (con reenvío de código).
- **FR-015**: Las cuentas MUST ser las mismas que usa Herramientas CDP: una persona con cuenta allí puede ingresar aquí con las mismas credenciales, y una cuenta creada aquí sirve allá.
- **FR-016**: El test y el resultado MUST requerir sesión; sin sesión MUST llevar al ingreso y, tras ingresar, devolver a la dirección pedida. La página principal, el ingreso, el registro y la recuperación son públicos.
- **FR-017**: El encabezado MUST mostrar, con sesión, el nombre o correo de la persona y "Cerrar sesión"; al cerrar sesión MUST volver a la página principal y bloquear el acceso al test hasta ingresar de nuevo.
- **FR-018**: Una persona con sesión que abre el ingreso o el registro MUST ser llevada al diagnóstico.

**Recuperación de contraseña**

- **FR-019**: "Olvidé mi contraseña" MUST pedir el correo, enviar un código a ese correo y permitir escribirlo junto con una contraseña nueva (mínimo 8 caracteres).
- **FR-020**: La recuperación MUST responder igual exista o no una cuenta con ese correo, MUST limitar la frecuencia de envíos y MUST permitir pedir un código nuevo si el anterior venció o falló.

**Diagnóstico con cuenta**

- **FR-021**: El test MUST dejar de pedir correo, programa y aceptación de datos: toma esos datos de la cuenta (programa y facultad del perfil).
- **FR-022**: La pantalla de entrada al diagnóstico MUST mostrar el último resultado si existe (con opción de repetir) o cómo empezar si no existe.
- **FR-023**: El sistema MUST seguir calculando el resultado con la misma lógica única de la 001 y MUST validar de nuevo el envío antes de guardarlo (como FR-021 de la 001).
- **FR-024**: Cada resultado MUST guardarse asociado a la cuenta de la persona con sus respuestas, puntajes, perfil(es) dominante(s) y secundario(s) y fecha; los resultados anteriores se conservan al repetir el test.
- **FR-025**: Los resultados MUST ser legibles únicamente por la propia persona; ninguna otra cuenta ni este equipo de producto los ve.
- **FR-026**: Si falla el guardado, el resultado MUST mostrarse igual con un aviso no bloqueante.

**Experiencia y calidad**

- **FR-027**: Todo MUST estar en español, ser responsive con prioridad en móvil y accesible: teclado, contraste mínimo AA, errores asociados a su campo y anunciados, estados de carga y de envío anunciados, y foco gestionado al cambiar de pantalla.
- **FR-028**: Los formularios MUST evitar envíos dobles y conservar lo escrito (salvo contraseñas) ante errores.
- **FR-029**: Los mensajes de error MUST ser comprensibles, en español y sin exponer detalles técnicos ni confirmar si un correo existe cuando eso comprometa la privacidad.

### Key Entities

- **Cuenta**: identidad de la persona, compartida con Herramientas CDP; correo, contraseña, estado de verificación.
- **Perfil**: datos de la cuenta: nombre completo, facultad, programa, correo, rol, fecha de último acceso y acuerdo de datos aceptado (versión y fecha).
- **Catálogo de facultades y programas**: facultades y, para cada una, sus programas; incluye "Otra / no está en la lista".
- **Código de verificación o de recuperación**: código de un solo uso enviado al correo, con vencimiento y límite de reenvío.
- **Sesión**: estado de una persona que ya ingresó; permite acceder al diagnóstico.
- **Contenido de la página principal**: textos, viñetas y pasos editables.
- **Resultado de diagnóstico**: respuestas, puntajes, perfil(es) dominante(s) y secundario(s) y fecha, vinculado a una cuenta (reemplaza al "Envío" por correo de la 001).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona nueva completa registro, verificación del correo y llega al test en menos de 3 minutos (sin contar la espera del correo).
- **SC-002**: Una persona con cuenta ingresa y llega al diagnóstico en menos de 30 segundos y con no más de 2 pantallas.
- **SC-003**: El 100 % de los intentos con dominio incorrecto, contraseña corta, aceptación sin marcar, código inválido o cuenta sin verificar quedan bloqueados con un mensaje claro.
- **SC-004**: El 100 % de los accesos directos al test o al resultado sin sesión terminan en el ingreso, y tras ingresar la persona llega a lo que pidió.
- **SC-005**: Un resultado guardado solo es visible para su dueño: en las pruebas con dos cuentas, 0 lecturas cruzadas.
- **SC-006**: Una persona con cuenta de Herramientas CDP puede ingresar aquí sin registrarse de nuevo en el 100 % de las pruebas.
- **SC-007**: La recuperación de contraseña se completa de punta a punta en menos de 3 minutos (sin contar la espera del correo).
- **SC-008**: Al menos 9 de cada 10 personas de prueba explican con sus palabras qué es la herramienta y qué recibirán después de leer la página principal.
- **SC-009**: Todas las pantallas nuevas funcionan desde 360 px sin desplazamiento horizontal, son operables solo con teclado y cumplen contraste AA.
- **SC-010**: Cambiar un texto de la página principal o un programa del catálogo se logra editando solo archivos de datos.

## Assumptions

- **Cuentas compartidas.** Se reutiliza el servicio de cuentas y la base de datos de Herramientas CDP (basada en Supabase): correo y contraseña, verificación del correo y recuperación por código, y una tabla de perfiles con id, correo, nombre, facultad, programa, rol y último acceso. Esa plataforma se mantiene sin cambios.
- **Sesión por sitio.** Esta herramienta y Herramientas CDP están en direcciones distintas: la cuenta es la misma, pero la sesión no se comparte automáticamente; la persona ingresa en cada una.
- **Datos que debe aportar el solicitante.** La dirección del servicio de cuentas y su clave pública (no secreta) como configuración del despliegue, y confirmar que el servicio de correo del proyecto existente envía los códigos con textos aceptables para esta herramienta.
- **Tabla nueva en la base compartida.** Para guardar resultados se añade una tabla propia de esta herramienta, con acceso restringido al dueño de cada fila; no se modifican las tablas existentes. Crearla requiere que el solicitante ejecute el script que se entregará.
- **Acuerdo de datos.** Se reutiliza el texto y la versión 1.1 del acuerdo de Herramientas CDP, ampliándolo con lo que esta herramienta guarda (respuestas y resultado del diagnóstico); el texto definitivo lo aprueba el solicitante. La política enlazada es https://www.unisabana.edu.co/politica-de-proteccion-de-datos.
- **Apariencia.** Los valores observados (azul marino #00135B, fondo #EEF2F8, bordes #D9E1EF, fuentes Libre Franklin y Playfair Display cursiva) se toman de la referencia; el logo "TalentHub UniSabana" lo aporta el solicitante o se reutiliza de Herramientas CDP, y mientras tanto hay una marca de texto provisional.
- **Contenido de la página principal.** Los textos iniciales se redactan siguiendo el tono de la referencia; los aprueba el solicitante antes de publicar.
- **Una sola herramienta en esta página.** A diferencia de la referencia (dos herramientas), esta página principal presenta solo el Diagnóstico de perfil emprendedor; un enlace a Herramientas CDP queda como mejora posible.
- **Resultados anteriores de la 001.** Los envíos que se hayan registrado por correo en pruebas de la 001 no se migran.
- **Tiempo de respuesta del test.** El test dura unos 10 minutos, según el criterio de éxito de la 001.
- **Fuera de alcance.** Panel de administración, exportación de resultados, ingreso con proveedores externos (Google), cambio de contraseña estando dentro de la cuenta, edición del perfil, consulta de resultados por el equipo del CEIS y cualquier cambio en la plataforma TalentHub existente.
