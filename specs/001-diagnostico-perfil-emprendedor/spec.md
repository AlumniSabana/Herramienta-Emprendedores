# Feature Specification: Diagnóstico de Perfil Emprendedor

**Feature Branch**: `001-diagnostico-perfil-emprendedor` (directorio de la spec; no se creó rama git)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Herramienta web de 'Diagnóstico de perfil emprendedor' para estudiantes y alumni de la Universidad de La Sabana. La persona responde un test por bloques (9 bloques de 5 afirmaciones) y recibe su resultado en un mapa de radar con la explicación de cada perfil, lo que ya tiene desarrollado y lo que debe potenciar. Fuente de verdad del contenido y del puntaje: `Diagnostico perfil emprendedor-2 (1).xlsx` (CEIS, versión junio 2019). Debe verse como parte de la familia institucional AlumniCV."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingresar y responder el test completo (Priority: P1)

Un estudiante o egresado entra a la herramienta, registra su correo institucional y su programa académico, acepta el tratamiento de datos personales y responde los 9 bloques del test (5 afirmaciones por bloque, 45 en total), avanzando bloque por bloque con una barra de progreso.

**Why this priority**: Sin ingreso y test no existe diagnóstico. Es la entrada de datos de todo lo demás.

**Independent Test**: Se puede probar de punta a punta ingresando un correo válido, eligiendo un programa, aceptando la política y completando los 9 bloques; el sistema acepta el envío y llega a la pantalla de resultados.

**Acceptance Scenarios**:

1. **Given** la pantalla de ingreso, **When** la persona escribe un correo `@unisabana.edu.co` válido, elige un programa de la lista y marca la aceptación de datos, **Then** puede comenzar el test en el bloque 1.
2. **Given** la pantalla de ingreso, **When** el correo tiene formato inválido o dominio distinto al permitido, **Then** se muestra un mensaje claro en español y no se puede comenzar.
3. **Given** la pantalla de ingreso, **When** no se ha marcado la aceptación del tratamiento de datos (Ley 1581 de 2012), **Then** no se puede comenzar.
4. **Given** un bloque con alguna afirmación sin responder, **When** la persona pulsa Siguiente, **Then** no avanza y se señalan las afirmaciones pendientes.
5. **Given** que la persona está en el bloque 4 y ya respondió los bloques 1 a 3, **When** pulsa Anterior y luego Siguiente, **Then** sus respuestas previas siguen seleccionadas.
6. **Given** el último bloque completo, **When** pulsa el botón final, **Then** se calcula el resultado y se muestra la pantalla de resultados.

---

### User Story 2 - Ver el resultado en el radar con perfil dominante (Priority: P1)

Al terminar, la persona ve un radar de 5 ejes (uno por perfil) con sus puntajes, su perfil dominante (o perfiles empatados) y su perfil secundario, y puede interactuar con el radar para ver datos de cada perfil.

**Why this priority**: Es el valor central que recibe la persona; sin esto el test no entrega nada.

**Independent Test**: Con las respuestas del ejemplo del Excel, el resultado muestra Realizador-Comerciante 34 como dominante, Investigativo-Creador 30 como secundario, y el radar con los cinco puntajes (27, 34, 26, 25, 30).

**Acceptance Scenarios**:

1. **Given** respuestas completas, **When** se muestra el resultado, **Then** cada perfil tiene un puntaje entre 9 y 36 que es la suma de sus 9 ítems.
2. **Given** dos o más perfiles con el puntaje más alto, **When** se muestra el resultado, **Then** todos los empatados aparecen como dominantes.
3. **Given** un perfil dominante único, **When** se muestra el resultado, **Then** se muestra además el segundo puntaje más alto como perfil secundario.
4. **Given** el radar, **When** la persona pasa el cursor o toca un eje o punto, **Then** aparece una tarjeta con nombre del perfil, puntaje sobre 36, deseo central, miedo central, prioridad central y una descripción corta.
5. **Given** una persona que usa solo teclado o lector de pantalla, **When** consulta el resultado, **Then** dispone de una tabla o texto equivalente con los cinco puntajes y puede abrir la información de cada perfil sin usar el ratón.

---

### User Story 3 - Leer el detalle de cada perfil y el plan de acción (Priority: P2)

La persona lee el detalle del perfil dominante y puede cambiar a cualquiera de los otros cuatro desde el radar o desde pestañas: descripción, fortalezas, oportunidades de mejora, competencias fuertes (lo ya desarrollado), competencias para potenciar, perfiles que lo complementan y consejos prácticos / plan de acción.

**Why this priority**: Convierte el puntaje en orientación útil (qué tiene desarrollado y qué debe potenciar), pero el resultado ya es entendible sin ello.

**Independent Test**: Se abre cada uno de los cinco perfiles y se comprueba que muestra las siete secciones con el contenido de su hoja de perfil del Excel, sin texto faltante.

**Acceptance Scenarios**:

1. **Given** el resultado, **When** se abre por defecto el detalle, **Then** corresponde al perfil dominante (en empate, al primero de los empatados, con acceso a los demás).
2. **Given** el detalle de un perfil, **When** la persona selecciona otro perfil desde el radar o las pestañas, **Then** el detalle cambia a ese perfil.
3. **Given** cualquier perfil, **When** se muestra su detalle, **Then** aparecen las siete secciones tomadas de la hoja de ese perfil.

---

### User Story 4 - Consultar fuentes y repetir el test (Priority: P3)

La persona ve la sección de fuentes (elaboración CEIS, versión junio 2019 y las cuatro referencias) y puede repetir el test desde cero.

**Why this priority**: Aporta transparencia y reutilización, no es necesario para obtener el diagnóstico.

**Independent Test**: En la pantalla de resultados la sección "Fuentes" es visible y el botón de repetir lleva al inicio del test con respuestas vacías.

**Acceptance Scenarios**:

1. **Given** la pantalla de resultados, **When** se desplaza hasta el final, **Then** se ve "Elaboración CEIS – Centro de Emprendimiento e Innovación Sabana", "Versión junio 2019" y las cuatro referencias de la hoja "FUENTES DE ELABORACIÓN".
2. **Given** la pantalla de resultados, **When** la persona pulsa repetir el test, **Then** vuelve al bloque 1 con todas las respuestas en blanco.

---

### Edge Cases

- Empate en el puntaje más alto (incluido el caso extremo de los cinco perfiles con el mismo puntaje): todos se muestran como dominantes y no hay perfil secundario.
- Empate en el segundo puesto: se muestran todos los empatados como secundarios.
- Puntajes mínimos (todo 1 → 9 por perfil) y máximos (todo 4 → 36 por perfil): el radar y las tarjetas se muestran correctamente.
- Correo con mayúsculas, espacios al inicio o al final, o con subdominios parecidos (por ejemplo `@unisabana.edu.co.example.com`): se normaliza o se rechaza según la regla de dominio.
- Recarga de la página o cierre accidental a mitad del test: se informa que el avance puede perderse; si el avance se conserva en el navegador, se restaura sin mezclar datos de otra persona.
- Intento de enviar el test con respuestas fuera de 1–4, ítems faltantes o repetidos: el envío se rechaza y no se genera resultado.
- Pantallas pequeñas (móvil): la tarjeta del radar y las pestañas siguen siendo legibles y operables al tacto.
- Fallo al guardar el envío: la persona igual ve su resultado y recibe un aviso no bloqueante (o puede reintentar).

## Requirements *(mandatory)*

### Functional Requirements

**Ingreso**

- **FR-001**: El sistema MUST pedir únicamente correo institucional y programa académico; MUST NOT pedir cédula ni nombre completo.
- **FR-002**: El sistema MUST validar el formato del correo y que su dominio coincida con el dominio permitido, configurable, con valor por defecto `@unisabana.edu.co`.
- **FR-003**: El programa académico MUST elegirse de una lista cerrada, en orden alfabético, definida en un archivo de datos editable sin tocar código (`programs.json`), con la opción "Otro / posgrado" al final. El catálogo inicial es el entregado por el solicitante (29 programas más "Otro / posgrado").
- **FR-004**: El sistema MUST exigir la aceptación explícita del tratamiento de datos personales (Ley 1581 de 2012) antes de iniciar el test, y MUST registrar que se aceptó y cuándo.

**Test**

- **FR-005**: El test MUST tener 9 bloques de 5 afirmaciones cada uno (45 ítems), mostrados un bloque por pantalla, con texto de enunciado y de cada afirmación tomados del Excel.
- **FR-006**: Cada ítem MUST responderse con un valor entero de 1 a 4. Las etiquetas de la escala MUST tomarse del Excel por bloque: el bloque 1 usa "No es muy cierto de mí / Algo cierto de mí / Cierto de mí / Muy cierto de mí"; los bloques 2 a 9 usan "Nunca / Raras veces / Algunas veces / Usualmente".
- **FR-007**: El sistema MUST mostrar una barra de progreso, botones Anterior y Siguiente, y conservar las respuestas al moverse entre bloques.
- **FR-008**: El sistema MUST impedir avanzar al siguiente bloque o finalizar mientras haya ítems sin responder, indicando cuáles faltan.

**Puntaje**

- **FR-009**: Cada ítem x.n MUST asignarse a un perfil por su posición n dentro del bloque x: x.1 → Realista-Gerencial; x.2 → Realizador-Comerciante; x.3 → Artístico-Imaginativo; x.4 → Movilizador-Social; x.5 → Investigativo-Creador.
- **FR-010**: El puntaje de cada perfil MUST ser la suma de sus 9 ítems (mínimo 9, máximo 36).
- **FR-011**: El perfil dominante MUST ser el de mayor puntaje; si hay empate, todos los empatados MUST mostrarse como dominantes. El sistema MUST mostrar también el segundo puntaje más alto como perfil secundario (todos los empatados en ese puesto; ninguno si no queda un puntaje distinto).
- **FR-012**: El cálculo MUST ser único (una sola implementación para todo el sistema) y determinista: las mismas respuestas siempre producen el mismo resultado.
- **FR-013**: El cálculo MUST estar cubierto por pruebas automatizadas que incluyan los datos de ejemplo del Excel (Realista-Gerencial 27, Realizador-Comerciante 34, Artístico-Imaginativo 26, Movilizador-Social 25, Investigativo-Creador 30), los casos de empate y los extremos 9 y 36.

**Resultados**

- **FR-014**: El resultado MUST incluir un radar de 5 ejes, uno por perfil, con eje radial de 9 a 36.
- **FR-015**: Al pasar el cursor, tocar o enfocar con teclado un eje o punto del radar, el sistema MUST mostrar una tarjeta con nombre del perfil, puntaje /36, deseo central, miedo central, prioridad central y una descripción corta.
- **FR-016**: El sistema MUST mostrar el detalle del perfil dominante y permitir acceder a los otros cuatro desde el radar o desde pestañas. El detalle MUST contener: descripción, fortalezas, oportunidades de mejora, competencias fuertes, competencias para potenciar, perfiles emprendedores que lo complementan y consejos prácticos / plan de acción, con el contenido de la hoja de perfil correspondiente del Excel.
- **FR-017**: El resultado MUST incluir una sección "Fuentes" visible con la elaboración CEIS (Centro de Emprendimiento e Innovación Sabana), versión junio 2019, y las cuatro referencias de la hoja "FUENTES DE ELABORACIÓN".
- **FR-018**: La persona MUST poder repetir el test, empezando con todas las respuestas en blanco.

**Contenido, datos y persistencia**

- **FR-019**: El contenido del test (enunciados, afirmaciones, escalas), de los perfiles, de las fuentes y del catálogo de programas MUST vivir en archivos de datos (JSON), no escrito en los componentes de la interfaz.
- **FR-020**: Al finalizar el test el sistema MUST registrar el envío (correo, programa, respuestas, puntajes, perfiles dominante/secundario, aceptación y fecha) a través de una interfaz de almacenamiento, de modo que se pueda conectar una base de datos más adelante sin modificar la lógica de puntaje ni de resultados. En esta versión no se exige una base de datos.
- **FR-021**: Antes de registrar un envío, el sistema MUST validar de nuevo correo, programa del catálogo y las 45 respuestas de 1 a 4, y calcular el resultado con la misma lógica de puntaje; MUST NOT confiar en puntajes calculados por la persona o su dispositivo.

**Experiencia y calidad**

- **FR-022**: La interfaz MUST estar en español, ser responsive con prioridad en móvil, y ser accesible: operable por teclado, con contraste suficiente y con alternativa en texto o tabla para el radar.
- **FR-023**: La interfaz MUST verse como parte de la familia institucional de AlumniCV (misma paleta azul marino, títulos en serif cursiva, cuerpo en sans-serif, encabezado oscuro con identidad GovLab, tarjetas blancas de borde suave, botones azul marino y estructura de barra lateral), según las capturas y la página de referencia.

### Key Entities

- **Participante / Envío**: una persona que completa el test una vez. Atributos: correo institucional, programa académico, aceptación de tratamiento de datos (sí/fecha), fecha de envío.
- **Programa académico**: elemento del catálogo cerrado; incluye "Otro / posgrado".
- **Bloque**: enunciado del bloque (1 a 9), escala de respuesta propia y 5 afirmaciones.
- **Afirmación (ítem)**: identificada como x.n (bloque x, posición n); su posición determina el perfil al que suma.
- **Respuesta**: valor entero 1 a 4 para cada uno de los 45 ítems de un envío.
- **Perfil emprendedor**: uno de cinco (Realista-Gerencial, Realizador-Comerciante, Artístico-Imaginativo, Movilizador-Social, Investigativo-Creador); tiene deseo, miedo y prioridad centrales, descripción, fortalezas, oportunidades de mejora, competencias fuertes, competencias para potenciar, perfiles complementarios y consejos prácticos.
- **Resultado**: puntaje por perfil (9 a 36), perfil(es) dominante(s) y perfil(es) secundario(s) derivados de un envío.
- **Fuente**: referencia bibliográfica o de elaboración mostrada en resultados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona completa ingreso, los 9 bloques y llega a su resultado en menos de 10 minutos.
- **SC-002**: Con las respuestas del ejemplo del Excel, el resultado coincide exactamente con los puntajes del Excel (27, 34, 26, 25, 30) y señala Realizador-Comerciante como dominante e Investigativo-Creador como secundario.
- **SC-003**: El 100 % de los casos de prueba de puntaje (ejemplo del Excel, empates, extremos 9 y 36) pasan, y 1.000 combinaciones aleatorias de respuestas dan siempre puntajes entre 9 y 36 que suman la misma cantidad que la suma de todas las respuestas.
- **SC-004**: El 100 % de los intentos de avanzar con ítems sin responder o de iniciar con correo/dominio inválido o sin aceptar datos son bloqueados, con un mensaje claro.
- **SC-005**: Los cinco perfiles muestran las siete secciones de detalle completas y su texto coincide con las hojas del Excel.
- **SC-006**: Toda la información del radar (puntajes y datos del perfil) puede consultarse sin ratón y sin ver el gráfico, mediante tabla o texto equivalente.
- **SC-007**: La interfaz es utilizable en pantallas desde 360 px de ancho sin desplazamiento horizontal ni elementos cortados, y los textos cumplen contraste mínimo AA.
- **SC-008**: Cambiar un texto de pregunta, de perfil o un programa del catálogo se logra editando solo archivos de datos, sin cambiar código de la interfaz.
- **SC-009**: Al menos 9 de cada 10 personas de prueba dicen entender qué tienen desarrollado y qué deben potenciar tras leer su resultado.

## Assumptions

- Los usuarios son estudiantes y egresados de La Sabana con correo institucional; no hay inicio de sesión ni verificación real del correo en esta versión.
- El dominio de correo por defecto es `@unisabana.edu.co`; el solicitante podrá cambiarlo por configuración. Se acepta un único dominio por configuración (ampliable a lista más adelante).
- Las respuestas de ejemplo del Excel (nombre y cédula de la persona de muestra) se usan solo como datos de prueba de puntaje; la herramienta nunca pide nombre ni cédula.
- El Excel es la fuente de verdad del texto de preguntas, escalas, perfiles y fuentes; se transcribe a archivos de datos sin reescribir su contenido, salvo corrección ortográfica que el solicitante apruebe. Se advierte que el Excel contiene erratas de redacción (por ejemplo "caracer", "sispemativos") y que la escala del bloque 1 difiere de la de los bloques 2 a 9.
- En la hoja de preguntas del Excel el total de Realista-Gerencial (27) aparece sin etiqueta; se toma su nombre de la hoja "RADAR EMPRENDEDOR".
- El mapeo perfil–ítem es el declarado por el solicitante y se verificó contra el ejemplo del Excel (los cinco puntajes coinciden).
- En esta versión el avance del test no se guarda entre sesiones; el historial entre sesiones está fuera de alcance. Un participante puede enviar el test más de una vez; cada envío es independiente.
- El envío se registra mediante una interfaz de almacenamiento cuya primera implementación puede no ser duradera; la consulta de resultados por el CEIS queda para una versión posterior.
- El encabezado y la identidad visual (logo GovLab, tipografías) se reutilizan de AlumniCV; los archivos de logo y fuentes los aporta el solicitante o se toman de la aplicación de referencia.
- Las restricciones técnicas declaradas (monorepo con backend Node y frontend React/Vite/TypeScript/Tailwind/React Router, despliegue en Vercel) no se detallan aquí y se tratan en `/speckit-plan`.
- Fuera de alcance en esta versión: panel de administración, exportación de resultados, autenticación con verificación real del correo, envío de resultados por email e historial entre sesiones.
