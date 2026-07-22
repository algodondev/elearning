# Guía de práctica — E-Learning Corporativo

**Base de conocimiento y guion para seis presentadores**

**Versión:** 1.0

**Fecha:** 22 de julio de 2026

**Duración de la exposición:** 15 minutos

**Presentación relacionada:** `E-Learning_Corporativo_MVP_Lectura_Guiada.pptx`

**Curso:** ______________________________________________

**Presentador 1:** ______________________________________

**Presentador 2:** ______________________________________

**Presentador 3:** ______________________________________

**Presentador 4:** ______________________________________

**Presentador 5:** ______________________________________

**Presentador 6:** ______________________________________

> **Propósito del documento.** Dar a todo el equipo una base común para explicar qué hace el MVP, qué reglas protege, por qué se tomaron esas decisiones y cómo defender su alcance. No es material para leer palabra por palabra durante la exposición: es una guía para comprender, practicar y responder preguntas.

## 1. Cómo utilizar esta guía

Cada integrante debe estudiar primero las secciones 2 a 8. Esa parte explica el proyecto completo y evita que los presentadores den respuestas contradictorias. Después, cada persona debe practicar su fase en la sección 9 y conocer al menos las respuestas principales de la sección 11.

La preparación tiene tres niveles:

1. **Dominio general:** explicar en 30 segundos el problema, el público y el ciclo completo.
2. **Dominio de fase:** exponer las tres diapositivas asignadas en aproximadamente 2 minutos y 25 segundos.
3. **Defensa:** responder una pregunta propia y otra perteneciente a una fase distinta.

### Regla para hablar

Cada explicación debe conectar cuatro ideas en este orden:

`Función → Regla o condición → Riesgo evitado → Valor empresarial`

Ejemplo correcto: “El sistema no permite evaluar mientras existan módulos obligatorios pendientes. Así evita certificados obtenidos sin completar la preparación definida por la empresa.”

Evitar explicaciones basadas en nombres de archivos, código, tablas, rutas individuales o detalles del framework. Los términos técnicos básicos solo se utilizan cuando ayudan a explicar una consecuencia empresarial.

## 2. Resumen ejecutivo del proyecto

E-Learning Corporativo es un MVP backend para una empresa que necesita administrar capacitación interna y transformarla en evidencia verificable. Organiza empleados por área y nivel, permite preparar cursos y evaluaciones, controla inscripciones y progreso, limita intentos, emite certificados, gestiona rutas secuenciales, genera alertas de vigencia y calcula cumplimiento por área.

El producto está construido alrededor de una idea: una capacitación no termina cuando alguien abre un contenido. Debe existir una secuencia demostrable entre preparación, evaluación, aprobación, certificación y reporte. El backend conserva esa secuencia y aplica las reglas aunque el consumidor sea Swagger, Postman o una interfaz futura.

> **Tesis común:** E-Learning Corporativo convierte capacitación dispersa en progreso verificable, certificación trazable y cumplimiento medible.

### Explicación de 30 segundos

“E-Learning Corporativo es un MVP backend para administrar formación interna dentro de una empresa. RR. HH. prepara cursos, inscribe empleados y supervisa resultados; el empleado completa módulos, realiza evaluaciones y conserva certificados. El sistema valida cada transición, limita los intentos, mantiene el historial y calcula cumplimiento sin duplicar personas. Así, la capacitación deja de ser información dispersa y se convierte en evidencia útil para actuar.”

### Qué significa que sea backend

El backend es la fuente de verdad del proceso. Recibe solicitudes, identifica a la persona, comprueba su permiso, revisa el estado actual y decide si la acción es válida. Actualmente se puede utilizar mediante Swagger y Postman. Un futuro sitio web o aplicación móvil sería otro consumidor de las mismas reglas; no reemplazaría las validaciones.

El MVP está desplegado para demostración en Render y utiliza PostgreSQL administrado por Supabase. Ese despliegue permite practicar y presentar el sistema, pero el plan gratuito y el alcance académico no equivalen a una operación productiva con alta disponibilidad.

## 3. Problema empresarial y público objetivo

### Problema que se resuelve

En una empresa, los cursos, hojas de cálculo, intentos y certificados pueden quedar separados. Esto dificulta responder preguntas simples: quién debía capacitarse, quién completó los requisitos, quién aprobó, qué certificado venció y qué área presenta una brecha.

El MVP conecta esos elementos en un solo recorrido y conserva el historial necesario para que RR. HH. y dirección interpreten los resultados con criterios consistentes.

| Público                       | Necesidad                             | Respuesta del MVP                                    |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Empresa con formación interna | Unificar el seguimiento               | Registro conectado desde curso hasta cumplimiento    |
| Recursos Humanos              | Preparar, asignar y supervisar        | Cursos, rutas, alertas, certificados y reportes      |
| Empleado                      | Saber qué completar y demostrar logro | Progreso propio, intentos, resultados y certificados |
| Dirección o auditoría interna | Obtener evidencia consistente         | Clasificación y porcentaje de cumplimiento por área  |

### Público que no se pretende atender

- Universidades con pensum, períodos académicos y matrícula estudiantil.
- Marketplace público para comprar o vender cursos.
- Plataforma para múltiples empresas dentro de la misma instalación.
- Proveedor de transmisión de video o almacenamiento masivo de archivos.
- Registro abierto de usuarios anónimos.

> **Decisión empresarial:** validar primero las reglas de una sola empresa reduce ambigüedad y permite comprobar el ciclo principal antes de diseñar aislamiento entre organizaciones.

## 4. Roles y responsabilidades

| Rol        | Responsabilidad en el MVP                              | Límite principal                                                  |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| ADMIN      | Gobierna configuración, usuarios y todo el proceso     | Debe respetar las mismas reglas de estado e integridad            |
| HR_MANAGER | Administra formación, asignaciones, alertas y reportes | No convierte el historial en información arbitrariamente editable |
| EMPLOYEE   | Completa su recorrido y consulta información propia    | No administra contenido ni observa recorridos ajenos              |

Autenticarse no concede acceso total. Después de comprobar la identidad, el sistema también verifica el rol y, cuando corresponde, que la información pertenezca al empleado autenticado.

### Por qué no existe Instructor

El rol Instructor es viable, pero quedó fuera del MVP porque ADMIN y HR_MANAGER cubren la autoría y administración del contenido durante esta etapa. Agregar un nombre de rol no basta: habría que definir qué cursos posee, quién asigna esa propiedad, qué resultados puede ver, si puede publicar, si puede modificar un curso utilizado y si una misma persona puede ser instructor y empleado.

> **Respuesta recomendada:** “No descartamos Instructor. Lo diferimos porque todavía requiere reglas de propiedad, visibilidad y publicación. Añadirlo sin esas decisiones produciría permisos ambiguos.”

## 5. Cómo se utiliza el sistema desde la perspectiva del negocio

El sistema acompaña siete momentos conectados:

1. **Organizar personas:** se definen áreas, niveles, cuentas y empleados.
2. **Diseñar cursos:** se agregan módulos, contenidos y una evaluación coherente.
3. **Publicar:** se declara que el curso está listo y estable para utilizarse.
4. **Inscribir:** se asigna un curso o una ruta a un empleado activo.
5. **Registrar progreso:** los módulos requeridos determinan cuándo puede evaluar.
6. **Evaluar y certificar:** se califican intentos y se emite evidencia al aprobar.
7. **Supervisar:** se calculan vigencia, alertas y cumplimiento por área.

ADMIN y RR. HH. preparan y supervisan. El empleado realiza su recorrido. El backend decide si cada transición es válida y conserva el resultado para futuras consultas.

### Estados importantes en lenguaje común

- Una inscripción comienza como **inscrita**, pasa a **en progreso** y llega a **lista para evaluación**.
- Una aprobación cierra positivamente el recorrido y produce un certificado.
- Tres fallos exigen una **nueva inscripción enlazada**, sin borrar intentos anteriores.
- Un certificado puede estar **válido**, **por vencer** o **vencido** según la fecha consultada.
- Una ruta abre el primer curso y mantiene bloqueados los siguientes hasta aprobar el anterior.

## 6. Reglas de negocio que definen el MVP

| Área          | Regla                                                                     | Riesgo que evita                                     | Resultado empresarial                      |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Identidad     | Solo una cuenta activa puede ingresar                                     | Uso de identidades deshabilitadas                    | Acceso atribuible y controlado             |
| Acceso        | Cada acción exige rol y, cuando aplica, propiedad                         | Lectura o cambio de información ajena                | Separación de responsabilidades            |
| Publicación   | Un curso debe tener estructura y evaluación válidas                       | Capacitación incompleta disponible                   | Experiencia evaluable y comparable         |
| Estabilidad   | La estructura utilizada se protege contra cambios críticos                | Alterar el significado de resultados previos         | Historial consistente                      |
| Inscripción   | Empleado activo, curso publicado y sin duplicado activo                   | Recorridos inválidos o repetidos                     | Asignación clara por persona y curso       |
| Progreso      | La inscripción crea todos sus progresos como una sola operación           | Inscripciones sin módulos asociados                  | Recorrido completo desde el inicio         |
| Preparación   | Todos los módulos requeridos deben completarse antes de evaluar           | Aprobar sin cumplir la preparación                   | Criterio uniforme de elegibilidad          |
| Intentos      | Máximo tres intentos por inscripción                                      | Oportunidades ilimitadas o cuarto intento simultáneo | Política de evaluación auditable           |
| Reinscripción | El tercer fallo exige un nuevo ciclo enlazado                             | Reiniciar o borrar evidencia anterior                | Nueva oportunidad con historial conservado |
| Calificación  | Selección múltiple requiere coincidencia exacta                           | Interpretación parcial no definida                   | Resultado determinista                     |
| Certificación | Aprobación y certificado se registran juntos y solo una vez               | Aprobados sin certificado o duplicados               | Evidencia completa y única                 |
| Rutas         | Cada curso exige aprobación histórica del anterior                        | Saltar la secuencia formativa                        | Progresión controlada                      |
| Vigencia      | El estado se calcula según la fecha de consulta                           | Estado almacenado que se vuelve falso                | Información temporal actualizada           |
| Alertas       | Un evento de vigencia genera una sola alerta                              | Avisos duplicados y ruido operativo                  | Seguimiento accionable                     |
| Cumplimiento  | Solo empleados activos y cursos obligatorios publicados; sin doble conteo | Indicadores inflados o inconsistentes                | Medición comparable por área               |

### Aprobación histórica y vigencia documental

Una aprobación demuestra que el empleado alcanzó un resultado en el pasado. La vigencia indica si el documento aún satisface una necesidad actual de cumplimiento. Por eso, un certificado vencido no borra la aprobación ni vuelve a bloquear una ruta ya avanzada; sí aparece como una brecha que puede requerir recertificación.

## 7. Validaciones y confianza

El sistema combina controles porque ninguno protege por sí solo todo el proceso:

1. **Forma:** datos obligatorios, tipos, rangos y rechazo de información inesperada.
2. **Identidad:** quién realiza la acción y si su cuenta continúa activa.
3. **Rol:** qué responsabilidad tiene dentro del sistema.
4. **Propiedad:** si la información pertenece al empleado autenticado.
5. **Estado:** si la acción está permitida en ese momento del recorrido.
6. **Integridad:** relaciones, unicidad y consistencia final de la información.
7. **Concurrencia:** dos solicitudes simultáneas no deben crear resultados duplicados.
8. **Error seguro:** se informa el problema sin revelar detalles internos ni respuestas correctas.

> **Idea para defender:** bloquear un botón en una interfaz no protege una regla. El backend debe volver a comprobarla porque cualquier cliente puede modificarse o sustituirse.

## 8. Alcance, evidencia y límites

### Qué incluye el MVP

- Organización de empleados por área y nivel.
- Tres roles con acceso diferenciado.
- Cursos, módulos, contenidos y evaluaciones.
- Publicación y protección de estructuras utilizadas.
- Inscripción, progreso, intentos y reinscripción.
- Certificados, vigencia y alertas sin duplicados.
- Rutas de aprendizaje secuenciales.
- Cumplimiento por área sin doble conteo.
- Documentación Swagger, pruebas automatizadas y colección Postman.

### Qué quedó fuera y por qué

| Función diferida                | Razón empresarial                               | Decisión necesaria para incorporarla                                     |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Instructor                      | Propiedad y visibilidad todavía ambiguas        | Definir cursos, empleados, publicación y combinación de roles            |
| Obligatoriedad por área o nivel | El MVP usa obligatoriedad global                | Acordar matriz de aplicabilidad y cambios organizacionales               |
| Varias empresas                 | El MVP representa una organización              | Diseñar aislamiento, administración y gobierno por empresa               |
| Email, SMS y PDF                | Son canales posteriores a reglas ya validadas   | Elegir proveedores, plantillas, costos y operación                       |
| Frontend                        | No agrega una regla central nueva               | Diseñar experiencia y consumir el mismo backend                          |
| Video propio, SCORM o LTI       | Son infraestructura e integración de contenido  | Definir almacenamiento, interoperabilidad y derechos                     |
| Operación productiva            | La demostración no incluye garantías operativas | Observabilidad, respaldo, recuperación, escalado y objetivos de servicio |

### Evidencia que se puede afirmar

- El recorrido automatizado de Postman ejecutó 37 solicitudes y 55 validaciones sin fallos.
- La suite local más reciente pasó 57 pruebas unitarias, 24 pruebas E2E y 4 pruebas de contrato OpenAPI.
- La cobertura registrada fue 92.36% en sentencias, 77.12% en ramas, 96.40% en funciones y 94.32% en líneas.
- El benchmark local utilizó 5,000 empleados, 30 cursos obligatorios y 100,000 certificados.
- El reporte obtuvo 913.29 ms de p95 en 25 ejecuciones medidas después del calentamiento.
- El contrato documenta 74 operaciones y el flujo desplegado fue verificado con los tres roles.

### Qué no demuestra la evidencia

El benchmark no es una promesa de que todas las solicitudes tardarán 913 ms ni un acuerdo de servicio. Las pruebas demuestran los escenarios implementados y una carga local reproducible; no sustituyen monitoreo real, pruebas continuas de seguridad, recuperación ante desastres ni dimensionamiento productivo.

## 9. Mapa de la presentación

| Fase                       | Presentador | Diapositivas | Tiempo | Pregunta que resuelve                         |
| -------------------------- | ----------- | -----------: | -----: | --------------------------------------------- |
| Propósito y público        | 1           |          1–3 |   2:20 | ¿Qué problema resolvemos y para quién?        |
| Preparación                | 2           |          4–6 |   2:25 | ¿Cómo se prepara una capacitación válida?     |
| Experiencia del empleado   | 3           |          7–9 |   2:30 | ¿Cómo controla el sistema el aprendizaje?     |
| Continuidad y cumplimiento | 4           |        10–12 |   2:30 | ¿Cómo se mantiene continuidad y cumplimiento? |
| Confianza y evidencia      | 5           |        13–15 |   2:30 | ¿Por qué podemos confiar en los resultados?   |
| Defensa del MVP            | 6           |        16–18 |   2:25 | ¿Por qué este alcance es correcto?            |

El objetivo acumulado es 14:40, dejando aproximadamente 20 segundos para cambios de persona. Si el equipo excede el tiempo, debe eliminar repeticiones antes de acelerar el habla.

## 10. Guion por presentador y diapositiva

# Fase 1 — Presentador 1: propósito, equipo y público

**Objetivo de la fase:** presentar al equipo, establecer el problema empresarial y ofrecer el mapa completo que seguirá la exposición.

**Debe dominar:** tesis del producto, público objetivo, público excluido, uso de un backend sin frontend y ciclo completo.

## Diapositiva 1 — E-Learning Corporativo

**Tiempo:** 0:35

**Mensaje visible:** `Capacitación → Evidencia → Cumplimiento`

**Guion sugerido:**

“Buenos días. Somos [nombres del equipo] y presentamos E-Learning Corporativo. Como equipo backend, nuestro trabajo no fue solamente registrar cursos: convertimos políticas de capacitación en condiciones que el sistema puede verificar. El MVP conecta tres resultados. Primero, organiza la formación que una empresa necesita impartir. Después, conserva evidencia del progreso y la evaluación de cada empleado. Finalmente, utiliza esa evidencia para interpretar certificación y cumplimiento. Durante la exposición explicaremos qué hace el sistema, qué reglas protegen el recorrido y por qué delimitamos este alcance. Nuestra idea central es sencilla: capacitación, evidencia y cumplimiento deben formar un mismo proceso.”

**Decisión que se defiende:** presentar valor empresarial antes de mencionar tecnología.

**No afirmar:** “Es una plataforma completa lista para cualquier empresa.”

**Transición:** “Para comprender ese proceso, primero debemos identificar quién necesita este control.”

## Diapositiva 2 — Una solución para capacitación interna controlada

**Tiempo:** 0:50

**Guion sugerido:**

“El MVP está dirigido a una empresa que administra formación interna. RR. HH. necesita preparar cursos, asignarlos y saber quién avanzó, aprobó o perdió vigencia. El empleado necesita claridad sobre lo que debe completar y evidencia de sus resultados. Dirección necesita una lectura consolidada, sin revisar manualmente archivos y certificados dispersos. Por eso centralizamos personas, formación y resultados dentro de una sola organización. No intentamos construir una universidad virtual, un marketplace ni una plataforma para muchas empresas. Esa delimitación fue intencional: antes de introducir nuevas reglas de aislamiento o gestión académica, quisimos validar correctamente el ciclo corporativo principal.”

**Ejemplo:** reemplazar varias hojas de cálculo por una historia conectada de asignación, avance, aprobación y vigencia.

**Pregunta probable:** “¿Por qué no sirve para una universidad?”

**Respuesta breve:** “Porque no modela pensum, períodos académicos o matrícula estudiantil; modela formación laboral y cumplimiento.”

**Transición:** “Con el público claro, veamos el recorrido completo que la empresa puede administrar.”

## Diapositiva 3 — El sistema acompaña todo el ciclo

**Tiempo:** 0:55

**Guion sugerido:**

“El sistema conecta siete momentos: organizar personas, diseñar cursos, inscribir empleados, registrar progreso, evaluar, certificar y reportar cumplimiento. ADMIN y RR. HH. preparan y supervisan el proceso. El empleado completa los módulos, presenta la evaluación y consulta su evidencia. En cada transición, el backend revisa identidad, permisos, estado y coherencia antes de aceptar la acción. Actualmente Swagger y Postman permiten consumir el sistema; una interfaz futura enviaría las mismas solicitudes y quedaría sujeta a las mismas reglas. El valor del MVP no está en una función aislada, sino en conservar una secuencia completa que la organización pueda revisar y utilizar para decidir.”

**Pregunta probable:** “¿Cómo se usa si no tiene frontend?”

**Respuesta breve:** “Swagger y Postman ya permiten operar la API; un frontend futuro consumiría el mismo contrato sin reemplazar sus reglas.”

**Transición al presentador 2:** “Con el ciclo definido, [nombre] explicará cómo se prepara una capacitación válida antes de asignarla.”

# Fase 2 — Presentador 2: preparación de la capacitación

**Objetivo de la fase:** explicar responsabilidades, estructura de curso y significado empresarial de publicar.

**Debe dominar:** roles, ausencia de Instructor, jerarquía curso–módulo–contenido–evaluación, borrador, publicación y protección histórica.

## Diapositiva 4 — Tres roles separan las responsabilidades

**Tiempo:** 0:45

**Guion sugerido:**

“El MVP separa responsabilidades mediante tres roles. ADMIN gobierna la configuración general, los usuarios y todo el proceso. HR_MANAGER representa a RR. HH. o capacitación: prepara contenido, realiza asignaciones y supervisa resultados. EMPLOYEE trabaja únicamente con su recorrido, progreso, intentos y certificados. Tener una identidad válida no significa tener acceso total; cada acción necesita el permiso correcto y, para el empleado, la información debe pertenecerle. No incluimos Instructor porque durante el MVP la autoría está centralizada en ADMIN y RR. HH. Agregarlo exigiría definir propiedad de cursos, visibilidad de resultados y capacidad de publicación. Sin esas reglas, el nuevo rol sería solo un nombre con permisos ambiguos.”

**Pregunta probable:** “¿Sería viable agregar Instructor?”

**Respuesta breve:** “Sí, después de definir propiedad, asignación, visibilidad y publicación; por eso fue diferido y no descartado.”

**Transición:** “Esas responsabilidades se aplican sobre una estructura que debe permitir aprender y demostrar el resultado.”

## Diapositiva 5 — Un curso debe ser ordenado y evaluable

**Tiempo:** 0:50

**Guion sugerido:**

“Un curso no es solamente un título. Define duración, obligatoriedad y vigencia del certificado. Se divide en módulos ordenados que pueden ser requeridos u opcionales. Cada módulo contiene texto o referencias a documentos, enlaces y videos. Finalmente, una evaluación reúne preguntas, opciones, puntos y un umbral de aprobación. Esta jerarquía permite conocer qué debe completar el empleado, cuándo está preparado y cómo se calcula el resultado. Decidimos no alojar video directamente porque almacenar y transmitir archivos es un problema de infraestructura distinto. El MVP se concentra en controlar el aprendizaje y utiliza referencias de contenido para mantener ese límite claro.”

**Ejemplo:** un curso con cuatro módulos requeridos produce cuatro avances verificables antes de evaluar.

**Pregunta probable:** “¿Por qué no guardan videos?”

**Respuesta breve:** “Porque el valor validado es el control del recorrido; el alojamiento multimedia requiere infraestructura y operación adicionales.”

**Transición:** “Una estructura completa todavía no está disponible hasta superar la decisión de publicación.”

## Diapositiva 6 — Publicar declara que el curso está listo

**Tiempo:** 0:50

**Guion sugerido:**

“Mientras un curso está en borrador puede prepararse sin afectar a empleados. Para publicarlo, el sistema comprueba que exista una estructura utilizable y una evaluación publicada con preguntas coherentes. Publicar equivale a declarar que la capacitación está lista. Después de que una estructura ya fue utilizada, sus partes críticas quedan protegidas: cambiarlas podría provocar que dos empleados obtengan resultados bajo condiciones distintas, pero con el mismo curso. También preferimos archivar antes que borrar evidencia. La decisión prioriza comparabilidad histórica sobre edición irrestricta. Así, una aprobación anterior mantiene un significado comprensible aunque el catálogo evolucione.”

**Regla clave:** un curso incompleto no puede entrar al recorrido y una estructura utilizada no debe reescribir el pasado.

**No afirmar:** “Una vez publicado nunca puede cambiar nada”; se protegen los elementos críticos según uso y estado.

**Transición al presentador 3:** “Con el curso preparado, [nombre] explicará qué sucede desde que un empleado inicia su recorrido.”

# Fase 3 — Presentador 3: experiencia controlada del empleado

**Objetivo de la fase:** explicar inscripción, progreso, preparación, intentos, aprobación y reinscripción.

**Debe dominar:** inscripción válida, progreso atómico, idempotencia, máximo de intentos, calificación exacta, certificado e historial.

## Diapositiva 7 — Cada inscripción crea un recorrido completo

**Tiempo:** 0:50

**Guion sugerido:**

“Una inscripción representa el recorrido de una persona dentro de un curso. Solo puede crearse para un empleado activo y un curso publicado, y no puede existir otra inscripción activa para la misma combinación. Cuando se acepta, el sistema también crea el progreso inicial de todos los módulos como una sola operación. Si el curso tiene cuatro módulos, nacen cuatro estados pendientes; si una parte no puede crearse, no queda una inscripción incompleta. Esta decisión permite que RR. HH. sepa desde el primer momento qué debe completar la persona y evita registros huérfanos que luego producirían reportes o evaluaciones incoherentes.”

**Ejemplo:** dos solicitudes simultáneas para la misma persona y curso deben terminar con un solo recorrido activo.

**Pregunta probable:** “¿Por qué crear todo el progreso al inicio?”

**Respuesta breve:** “Porque hace visible el recorrido completo y garantiza que inscripción y módulos siempre sean coherentes.”

**Transición:** “Tener un recorrido no significa estar preparado para la evaluación.”

## Diapositiva 8 — La evaluación exige preparación demostrada

**Tiempo:** 0:50

**Guion sugerido:**

“La inscripción avanza de inscrita a en progreso y luego a lista para evaluación. El cambio depende de completar todos los módulos requeridos; los opcionales no bloquean. Marcar dos veces el mismo módulo conserva un solo avance, y un módulo perteneciente a otro curso no puede satisfacer el requisito. La validación ocurre en el backend. Aunque alguien modifique una pantalla o construya una solicitud por su cuenta, el sistema consulta el progreso real y rechaza el intento si falta preparación. Esto protege el significado empresarial de aprobar: no basta con llegar a un botón, hay que cumplir las condiciones definidas por la capacitación.”

**Regla clave:** ningún intento es válido mientras exista un módulo obligatorio pendiente.

**Pregunta probable:** “¿No podría bloquearlo solamente el frontend?”

**Respuesta breve:** “No; el cliente puede sustituirse. La fuente de verdad debe comprobar la regla en cada solicitud.”

**Transición:** “Cuando la persona está preparada, todavía existen reglas sobre oportunidades, puntuación y evidencia.”

## Diapositiva 9 — Tres intentos sin borrar el historial

**Tiempo:** 0:50

**Guion sugerido:**

“Cada inscripción admite un máximo de tres intentos. En selección múltiple, la respuesta debe coincidir exactamente porque el negocio no definió una política de crédito parcial. Alcanzar el umbral significa aprobar y, en ese mismo resultado, se actualiza el recorrido y se crea un único certificado. Si ocurre un tercer fallo, la inscripción ya no acepta otro intento: RR. HH. debe crear una nueva inscripción enlazada, con progreso reiniciado. El ciclo anterior y sus intentos permanecen visibles. Esta decisión da una nueva oportunidad sin fingir que los intentos anteriores nunca existieron. Reintentar significa comenzar un nuevo ciclo, no reescribir la evidencia.”

**Pregunta probable:** “¿Por qué no reiniciar el contador?”

**Respuesta breve:** “Porque borraría el significado del historial; una nueva inscripción distingue claramente cada ciclo.”

**Transición al presentador 4:** “Aprobar resuelve el curso inmediato; [nombre] explicará cómo ese logro se relaciona con rutas, vigencia y cumplimiento.”

# Fase 4 — Presentador 4: continuidad y cumplimiento

**Objetivo de la fase:** diferenciar aprobación histórica de vigencia y explicar rutas, alertas y reporte.

**Debe dominar:** secuencia de rutas, estados temporales, alertas únicas, denominador del cumplimiento y categorías de brecha.

## Diapositiva 10 — La aprobación abre el siguiente curso

**Tiempo:** 0:50

**Guion sugerido:**

“Una ruta organiza varios cursos en secuencia. El primero está disponible desde el inicio; cada curso posterior permanece bloqueado hasta que exista una aprobación histórica del inmediatamente anterior. Aprobar el último completa la ruta. La regla distingue dos conceptos: el aprendizaje alcanzado y la vigencia documental. Si un certificado vence después, no se borra la aprobación ni se vuelve a bloquear el avance. Exigir vigencia para continuar convertiría una política de recertificación en un prerrequisito académico distinto. Por eso la ruta utiliza el logro histórico y el reporte de cumplimiento mide la vigencia de forma separada.”

**Ejemplo:** una persona puede haber aprobado seguridad básica y avanzar a seguridad avanzada, aunque meses después necesite renovar el certificado básico.

**Pregunta probable:** “¿Un certificado vencido debería bloquear nuevamente?”

**Respuesta breve:** “No en este MVP; el logro histórico abre la ruta y la vigencia genera una brecha de recertificación separada.”

**Transición:** “Esa vigencia cambia con el tiempo y no debe tratarse como un dato fijo.”

## Diapositiva 11 — La vigencia depende de la fecha actual

**Tiempo:** 0:50

**Guion sugerido:**

“Cada certificado tiene fecha de emisión y expiración. Al consultarlo, el sistema lo clasifica como válido, por vencer cuando faltan hasta treinta días, o vencido cuando se alcanza la fecha de expiración. No guardamos un estado fijo porque se volvería incorrecto con el paso del tiempo; lo calculamos para la fecha de referencia. El sistema también genera alertas por vencer y vencido, pero cada evento se registra una sola vez. La ejecución automática y la revisión manual comparten la misma regla, de modo que repetir el proceso no llena el sistema de avisos duplicados.”

**Ejemplo:** al llegar la fecha de expiración, la clasificación cambia sin editar manualmente el certificado.

**Pregunta probable:** “¿Por qué una alerta por vencer todavía cuenta como válida?”

**Respuesta breve:** “Porque la expiración sigue en el futuro; la alerta permite actuar antes de perder cumplimiento.”

**Transición:** “Con esa clasificación temporal, el sistema puede explicar el cumplimiento y el tipo de brecha.”

## Diapositiva 12 — El reporte distingue la brecha

**Tiempo:** 0:50

**Guion sugerido:**

“El reporte considera empleados activos y cursos obligatorios publicados. Cada combinación de persona y curso se cuenta una sola vez, aunque exista un historial con varios certificados. Luego se clasifica como certificado válido, solo certificado vencido o nunca certificado. Los cursos opcionales y empleados inactivos no modifican el indicador. El porcentaje se obtiene dividiendo certificados válidos entre casos aplicables. Separar las categorías importa: un caso vencido necesita recertificación, mientras que alguien nunca certificado necesita capacitación inicial. Así, el reporte no entrega solamente un número; identifica qué tipo de acción debe considerar RR. HH.”

**Pregunta probable:** “¿Cómo evitan contar dos veces a alguien con varios certificados?”

**Respuesta breve:** “El reporte consolida primero el historial por empleado y curso y asigna una única clasificación.”

**Transición al presentador 5:** “Para actuar con esa información, la empresa debe confiar en las reglas y en la evidencia de que fueron probadas.”

# Fase 5 — Presentador 5: confianza y evidencia

**Objetivo de la fase:** explicar capas de validación, resistencia a simultaneidad y significado correcto de las pruebas.

**Debe dominar:** autenticación, autorización, propiedad, estado, integridad, concurrencia, respuestas seguras, cobertura y p95.

## Diapositiva 13 — Validar evita convertir errores en historial

**Tiempo:** 0:50

**Guion sugerido:**

“Antes de aceptar una acción, el sistema revisa varias capas. Comprueba que los datos tengan la forma esperada, identifica a la persona, verifica su rol y, cuando corresponde, confirma que el registro le pertenezca. Después revisa si el proceso está en un estado que permita la acción y conserva la integridad final. Estas capas responden a riesgos diferentes. Una solicitud puede estar bien escrita y aun así ser realizada por la persona equivocada o en un momento inválido. Cuando ocurre un error, la respuesta es útil para el consumidor, pero no expone detalles internos ni respuestas correctas de una evaluación.”

**Pregunta probable:** “¿Qué diferencia hay entre autenticación y autorización?”

**Respuesta breve:** “Autenticación identifica a la persona; autorización decide si esa identidad puede ejecutar una acción concreta.”

**Transición:** “Esas reglas también deben sostenerse cuando dos acciones llegan prácticamente al mismo tiempo.”

## Diapositiva 14 — La simultaneidad no debe duplicar resultados

**Tiempo:** 0:50

**Guion sugerido:**

“Las solicitudes no siempre llegan en un orden ideal. Dos inscripciones simultáneas no deben crear dos recorridos activos. Dos finalizaciones del mismo módulo deben conservar un único avance. Dos intentos no pueden producir una cuarta oportunidad ni dos certificados. Para esos casos, el sistema combina revisión del estado, operaciones completas y restricciones finales, conservando una sola decisión válida. Además, la vista del empleado nunca incluye las respuestas correctas, porque proteger el contenido evaluativo también protege el valor de la certificación. Esto no garantiza cualquier carga productiva, pero sí demuestra consistencia en los riesgos críticos que probamos.”

**Pregunta probable:** “¿Qué recibe la segunda solicitud conflictiva?”

**Respuesta breve:** “Un conflicto controlado; no un segundo resultado ni un error interno expuesto.”

**Transición:** “Además de probar reglas adversas, medimos recorridos completos y un escenario de volumen reproducible.”

## Diapositiva 15 — La evidencia combina recorrido y volumen

**Tiempo:** 0:50

**Guion sugerido:**

“La evidencia tiene dos dimensiones. Primero, pruebas funcionales recorrieron autenticación, permisos, inscripción, progreso, intentos, certificación, rutas, casos negativos y reportes. La colección de aceptación completó 55 validaciones sin fallos y el contrato documenta 74 operaciones. Segundo, el benchmark cargó 5,000 empleados, 30 cursos obligatorios y 100,000 certificados. Después de calentar la base, se midieron 25 ejecuciones del reporte y el percentil 95 fue 913.29 milisegundos. Esto significa que el 95% de las ejecuciones observadas quedó en ese tiempo o menos. Es un resultado local reproducible, no una promesa productiva.”

**Pregunta probable:** “¿Por qué presentar p95 y no solo promedio?”

**Respuesta breve:** “Porque muestra el comportamiento de los casos más lentos sin ocultarlos detrás de un promedio.”

**No afirmar:** “El sistema siempre responde en 913 ms.”

**Transición al presentador 6:** “Con el funcionamiento demostrado, [nombre] cerrará defendiendo por qué este alcance constituye un MVP coherente.”

# Fase 6 — Presentador 6: defensa del MVP y conclusiones

**Objetivo de la fase:** consolidar las reglas esenciales, defender exclusiones y cerrar con valor empresarial.

**Debe dominar:** reglas adoptadas, Instructor, aplicabilidad por área, multitenencia, canales diferidos y requisitos antes de producción.

## Diapositiva 16 — Las reglas conectan aprendizaje y evidencia

**Tiempo:** 0:50

**Guion sugerido:**

“Priorizamos las reglas que forman el ciclo mínimo completo. El empleado debe completar preparación antes de evaluar. Tiene tres intentos y, después del tercer fallo, una nueva inscripción conserva el historial. Aprobar crea un certificado como parte del mismo resultado. Las rutas avanzan por aprobación histórica; la vigencia genera alertas sin duplicados; y el cumplimiento clasifica cada caso una sola vez. También se protege el acceso por rol y propiedad. Estas reglas no son detalles internos: definen qué significa aprender, demostrar, certificar y medir dentro del producto. Si una de ellas faltara, el ciclo podría producir evidencia incompleta o contradictoria.”

**Pregunta probable:** “¿Cuál es la regla más importante?”

**Respuesta breve:** “No existe una sola aislada; el valor está en conectar preparación, evaluación, certificación y medición sin romper el historial.”

**Transición:** “Ese enfoque también explica por qué algunas funciones viables quedaron fuera.”

## Diapositiva 17 — Lo diferido necesita decisiones de negocio

**Tiempo:** 0:50

**Guion sugerido:**

“Las funciones fuera del MVP no fueron descartadas por imposibilidad. Instructor requiere reglas de propiedad y visibilidad. Obligatoriedad por área o nivel necesita una política para determinar aplicabilidad y cambios de puesto. Varias empresas exigen aislamiento y gobierno por organización. Email, SMS y PDF necesitan proveedores y operación de canales. Un frontend, video propio o integraciones como SCORM mejorarían la experiencia, pero consumirían el mismo núcleo. Decidimos no inventar políticas que el negocio todavía no había definido. Primero validamos un recorrido empresarial coherente; después, cada evolución puede incorporarse con requisitos explícitos y sin debilitar las reglas existentes.”

**Pregunta probable:** “¿Qué agregarían primero?”

**Respuesta breve:** “Depende de la política real de la empresa; probablemente aplicabilidad por área o Instructor, pero solo después de definir sus reglas.”

**No afirmar:** “No se hizo porque no hubo tiempo.”

**Transición:** “El resultado es un núcleo que demuestra valor sin exagerar su madurez.”

## Diapositiva 18 — El backend convierte reglas en confianza

**Tiempo:** 0:45

**Guion sugerido:**

“E-Learning Corporativo entrega tres resultados. Para RR. HH., un ciclo completo para preparar y supervisar capacitación. Para el empleado, un recorrido claro con progreso y resultados conservados. Para la empresa, certificación trazable y cumplimiento útil para actuar. El MVP demuestra que una formación puede organizarse, validarse y medirse de principio a fin mediante reglas aplicadas de forma consistente. No afirmamos que sea una plataforma productiva terminada; afirmamos que el núcleo empresarial fue delimitado, implementado y verificado. Su siguiente evolución debe responder a políticas reales y no a funciones agregadas por intuición. Gracias. Estamos listos para sus preguntas.”

**Cierre común:** `Aprendizaje verificable · Certificación trazable · Cumplimiento medible`

**No olvidar:** agradecer, mantener silencio y dirigir la mirada al jurado antes de abrir preguntas.

## 11. Banco de preguntas del jurado

### ¿Cuál es el problema principal?

La información de capacitación puede quedar dispersa entre asignaciones, avances, evaluaciones y certificados. El MVP conecta esas etapas y aplica un mismo criterio para que RR. HH. pueda interpretar progreso y cumplimiento sin reconstruir manualmente el historial.

### ¿Por qué solo una empresa?

Porque el objetivo era validar el ciclo interno antes de diseñar multitenencia. Varias empresas requerirían aislamiento de datos, administradores por organización, reglas de pertenencia y decisiones sobre información compartida.

### ¿Por qué no existe Instructor?

ADMIN y HR_MANAGER cubren la autoría en el MVP. Instructor requiere definir propiedad de cursos, alcance sobre empleados y resultados, facultad de publicación y combinación con otros roles. Sin esas decisiones, su acceso sería ambiguo.

### ¿Por qué la obligatoriedad no depende del área o nivel?

La obligatoriedad actual es global para mantener un criterio claro. Segmentar necesita una matriz de aplicabilidad y decisiones sobre cambios de área, cambios de nivel y excepciones. Es una evolución valiosa, pero necesita política empresarial explícita.

### ¿Por qué bloquear cambios después de utilizar un curso?

Porque modificar módulos, evaluación o secuencia podría hacer que dos personas obtengan resultados bajo condiciones distintas, pero con la misma identidad de curso. Proteger la estructura conserva comparabilidad histórica.

### ¿Por qué no evaluar antes de terminar módulos?

Porque la empresa declaró esos módulos como preparación requerida. Si el backend permitiera saltarlos, una aprobación dejaría de demostrar que se completó el proceso definido.

### ¿Por qué tres intentos?

Es la política concreta definida para el MVP y permite demostrar control del límite. Después del tercer fallo, una nueva inscripción crea otro ciclo con progreso reiniciado y mantiene visible el historial anterior.

### ¿Por qué no existe crédito parcial?

Porque el MVP necesita una calificación determinista y la organización no definió ponderaciones parciales. Agregar crédito parcial exigiría acordar cómo se distribuyen puntos entre combinaciones correctas, incompletas e incorrectas.

### ¿Cómo se evita una cuarta oportunidad simultánea?

El sistema vuelve a comprobar el estado y el número de intentos dentro de una operación protegida. Las restricciones finales impiden aceptar dos resultados incompatibles y el conflicto se comunica sin crear evidencia duplicada.

### ¿Por qué crear aprobación y certificado juntos?

Porque representan un solo resultado empresarial. Si se guardaran por separado, podría existir una aprobación sin certificado o un certificado sin recorrido aprobado. Registrarlos juntos evita esa historia incompleta.

### ¿Por qué el certificado no guarda un estado fijo?

Porque válido, por vencer o vencido depende de la fecha de consulta. Un valor fijo quedaría desactualizado y necesitaría procesos de corrección. Calcularlo mantiene la interpretación temporal coherente.

### ¿Un certificado vencido borra una aprobación?

No. La aprobación es un logro histórico; la vigencia representa cumplimiento actual. El vencimiento puede exigir recertificación, pero no cambia lo que ocurrió ni bloquea retroactivamente una ruta.

### ¿Cómo se calcula cumplimiento?

Se consideran empleados activos y cursos obligatorios publicados. Cada persona y curso se clasifica una vez como certificado válido, solo vencido o nunca certificado. El porcentaje es certificados válidos dividido entre casos aplicables.

### ¿Qué demuestra el benchmark?

Demuestra que el reporte fue ejecutado de manera reproducible con un volumen local de 5,000 empleados, 30 cursos y 100,000 certificados, alcanzando 913.29 ms de p95. No demuestra un nivel de servicio productivo universal.

### ¿Cómo saben que funciona?

Existen pruebas unitarias, recorridos E2E con base real, casos de simultaneidad, validación del contrato OpenAPI, una colección Postman/Newman y un benchmark reproducible. Además, el despliegue fue probado con los tres roles.

### ¿Qué falta antes de producción?

Definir infraestructura y objetivos de servicio, observabilidad, copias de seguridad, recuperación, rotación operativa de secretos, escalado, monitoreo de seguridad, pruebas sobre carga real y políticas empresariales específicas.

## 12. Glosario para hablar con claridad

| Término              | Definición aplicada al proyecto                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| MVP                  | Versión enfocada que valida el ciclo mínimo de capacitación, evidencia y cumplimiento                       |
| Backend              | Parte que recibe acciones, aplica reglas y conserva resultados, independientemente de la pantalla utilizada |
| API                  | Contrato mediante el cual Swagger, Postman o una interfaz solicitan acciones al backend                     |
| Autenticación        | Comprobación de quién intenta utilizar el sistema                                                           |
| Autorización         | Decisión sobre qué puede hacer esa identidad según su rol y propiedad                                       |
| Validación           | Revisión de datos, permisos, estado y coherencia antes de aceptar una acción                                |
| Idempotencia         | Repetir una acción válida, como completar un módulo, sin duplicar su efecto                                 |
| Operación atómica    | Conjunto de cambios que se registra completo o no se registra                                               |
| Concurrencia         | Situación en la que dos solicitudes intentan cambiar el mismo caso al mismo tiempo                          |
| Historial auditable  | Evidencia anterior que se conserva y puede explicarse sin ser reescrita                                     |
| Aprobación histórica | Logro obtenido al superar una evaluación en un ciclo anterior                                               |
| Vigencia             | Interpretación temporal de un certificado según su fecha de expiración                                      |
| Cumplimiento         | Proporción de casos aplicables que mantienen certificado válido                                             |
| Benchmark            | Medición reproducible bajo un escenario y ambiente específicos                                              |
| p95                  | Tiempo igual o superior al observado por el 95% de las ejecuciones medidas                                  |
| Producción           | Operación real que exige garantías, monitoreo, recuperación y políticas adicionales                         |

## 13. Vocabulario común del equipo

Utilizar siempre:

- `RR. HH.` o `HR_MANAGER`, explicando la equivalencia una vez.
- `Empleado`, no estudiante ni alumno.
- `Aprobación histórica` para el logro obtenido.
- `Certificado vigente` para cumplimiento actual.
- `Función diferida` en lugar de función faltante.
- `Resultado local reproducible` para el benchmark.
- `MVP backend para una empresa` para describir el alcance.

Evitar:

- “Eso no se pudo hacer” o “no nos dio tiempo”.
- “El framework lo hace”.
- “La base de datos se encarga de todo”.
- “Está listo para producción”.
- “Es cien por ciento seguro”.
- “Siempre responde en 913 ms”.
- “ADMIN y RR. HH. son lo mismo”.
- “Un certificado vencido significa que nunca aprobó”.

## 14. Plan de ensayo

### Ronda 1 — Dominio

- Cada persona explica su fase sin leer el guion completo.
- Otro integrante comprueba reglas, cifras y términos.
- Todos practican la explicación de 30 segundos del proyecto.
- Se corrigen contradicciones antes de trabajar velocidad.

### Ronda 2 — Tiempo y transiciones

- Cronometrar la exposición completa con objetivo de 14:40.
- Practicar nombres y transiciones entre presentadores.
- Eliminar repeticiones antes de acelerar el habla.
- Confirmar que el primer presentador introduce al equipo y el sexto abre preguntas.

### Ronda 3 — Jurado adversarial

- Cada integrante responde dos preguntas fuera de su fase.
- Responder primero con la decisión empresarial y después con el soporte del backend.
- Para algo fuera de alcance: confirmar viabilidad, explicar por qué se difirió y qué reglas exigiría.
- Si no se conoce una política, no inventarla; delimitar qué decisión faltaría.

| Presentador | Tiempo | Claridad | Regla explicada | Decisión defendida | Preguntas pendientes |
| ----------- | ------ | -------- | --------------- | ------------------ | -------------------- |
| 1           |        |          |                 |                    |                      |
| 2           |        |          |                 |                    |                      |
| 3           |        |          |                 |                    |                      |
| 4           |        |          |                 |                    |                      |
| 5           |        |          |                 |                    |                      |
| 6           |        |          |                 |                    |                      |

## 15. Lista final de comprobación

- [ ] Los seis integrantes pueden explicar el propósito en 30 segundos.
- [ ] Cada presentador conoce sus tres diapositivas sin leerlas literalmente.
- [ ] La exposición completa dura 14:40 o menos antes de preguntas.
- [ ] Público objetivo y público excluido quedan claros.
- [ ] Cada fase conecta función, regla, riesgo y valor.
- [ ] No se enumeran endpoints, clases ni detalles de código.
- [ ] Instructor se explica como función diferida y viable.
- [ ] Aprobación histórica y vigencia no se confunden.
- [ ] Las cifras coinciden con la evidencia del proyecto.
- [ ] El benchmark se presenta como resultado local reproducible.
- [ ] Nadie afirma que el MVP está listo para producción.
- [ ] Las transiciones entre personas están practicadas.
- [ ] Cada integrante puede responder una pregunta de otra fase.
- [ ] El cierre comunica valor empresarial y abre el espacio de preguntas.

## 16. Fuentes internas

- Prompt de presentación de lectura guiada.
- Arquitectura, esquema y reglas canónicas del proyecto.
- Plan de implementación y trazabilidad.
- Evidencia de pruebas y benchmark.
- Modelo de rutas de aprendizaje.
- Contrato OpenAPI y colección de aceptación.
- Guía de despliegue en Render y Supabase.

> **Mensaje final para el equipo:** no memoricen términos aislados. Comprendan qué hace el sistema, qué condición aplica, qué riesgo evita y por qué esa decisión produce evidencia confiable.
