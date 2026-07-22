# Despliegue del API en Render con PostgreSQL de Supabase

Esta guía describe el despliegue académico oficial del MVP. Render ejecuta el contenedor NestJS y Supabase proporciona únicamente PostgreSQL administrado. NestJS continúa siendo la única capa de autenticación, autorización, validaciones, reglas de negocio y documentación Swagger.

## 1. Arquitectura

```text
Postman / Swagger / futuro frontend
                 |
                 v
    Render Web Service (NestJS)
                 |
        TLS verificado + pooler
                 v
       Supabase PostgreSQL 17
```

No se utiliza Supabase Auth, `supabase-js`, la clave `anon`, la clave `service_role`, Edge Functions ni la Data API. Las tablas de la aplicación no deben exponerse a clientes externos.

## 2. Responsabilidades

El propietario de las cuentas realiza únicamente los pasos de creación de cuenta y tokens personales. El responsable técnico automatiza la creación de los recursos, configura los secretos, ejecuta migraciones y seed, despliega y valida el servicio.

Nunca enviar tokens por chat, incluirlos en capturas, guardarlos en `docs`, agregarlos a Git ni pegarlos en `render.yaml`.

## 3. Preparar la cuenta de Supabase

1. Abrir [Supabase Dashboard](https://supabase.com/dashboard) e iniciar sesión.
2. Confirmar que existe una organización propia con capacidad para crear un proyecto gratuito. Una cuenta nueva crea una organización predeterminada.
3. Abrir [Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
4. Seleccionar **Generate new token**.
5. Usar un nombre temporal como `codex-elearning-deploy`.
6. Copiar el Personal Access Token una sola vez y guardarlo en `.env.local` como `SUPABASE_ACCESS_TOKEN`.
7. Abrir la configuración de la organización y copiar su **slug**. Si la cuenta contiene una sola organización, este valor puede omitirse porque la automatización la detectará.
8. Elegir una contraseña nueva de base de datos, larga y exclusiva. No debe ser la contraseña personal de Supabase.

No crear manualmente el proyecto PostgreSQL. La automatización lo creará en una región de Estados Unidos Este compatible con Render Virginia y conservará la contraseña indicada.

## 4. Preparar la cuenta de Render

1. Abrir [Render Dashboard](https://dashboard.render.com) y crear o iniciar sesión en la cuenta.
2. Es recomendable iniciar sesión con GitHub usando la cuenta que administra `algodondev/elearning`. El repositorio es público, por lo que Render puede leerlo sin una credencial privada de Git.
3. Abrir **Account Settings → API Keys**.
4. Seleccionar **Create API Key**.
5. Usar un nombre temporal como `codex-elearning-deploy`.
6. Copiar la llave una sola vez y guardarla en `.env.local` como `RENDER_API_KEY`.
7. No crear manualmente el Web Service. La automatización consultará los workspaces accesibles y creará el servicio desde `main`.

## 5. Entregar secretos mediante el workspace local

El archivo `.env.local` ya está ignorado por Git. Abrirlo con el editor local y agregar:

```dotenv
# Automatización temporal de proveedores
RENDER_API_KEY="colocar-aqui-la-llave-de-render"
SUPABASE_ACCESS_TOKEN="colocar-aqui-el-token-personal-supabase"
SUPABASE_ORG_SLUG="dejar-vacio-si-solo-existe-una-organizacion"

# Credenciales que se crearán para la base y la demostración
SUPABASE_DB_PASSWORD="contraseña-unica-larga-para-postgresql"
DEPLOY_SEED_PASSWORD="contraseña-unica-para-admin-hr-y-employee"
```

Condiciones:

- `SUPABASE_DB_PASSWORD`: mínimo recomendado de 20 caracteres y uso exclusivo para PostgreSQL.
- `DEPLOY_SEED_PASSWORD`: mínimo de 12 caracteres; será compartida temporalmente por las tres cuentas de demostración.
- Si un valor contiene espacios o símbolos de shell, conservar las comillas dobles.
- No modificar `.env`, porque sigue representando el ambiente local con Docker.
- Después de guardar el archivo, informar únicamente que `.env.local` está listo. No copiar sus valores en la conversación.

## 6. Trabajo automatizado posterior

Con los secretos disponibles, el responsable técnico realizará:

1. Validar ambos tokens sin mostrarlos.
2. Detectar la organización de Supabase y el workspace de Render.
3. Crear `elearning-corporativo-esen` en Supabase Free.
4. Esperar que PostgreSQL esté saludable.
5. Obtener la conexión **Session Pooler** IPv4 en puerto `5432`.
6. Activar la exigencia de SSL.
7. Usar el bundle oficial de CA de Supabase con verificación de certificado y hostname.
8. Confirmar que las tablas no se exponen automáticamente por Data API.
9. Ejecutar las migraciones TypeORM contra la base vacía.
10. Ejecutar una sola vez el seed de demostración con `DEPLOY_SEED_PASSWORD`.
11. Verificar que existen las migraciones, tres usuarios, curso, evaluación y ruta.
12. Crear el Web Service gratuito de Render desde el Dockerfile.
13. Cargar credenciales PostgreSQL, CA y JWT en el almacén de variables de Render.
14. Desplegar la imagen y esperar que el health check pase.
15. Validar por HTTPS health, Swagger, OpenAPI, login y perfil de los tres roles.
16. Reiniciar el servicio y confirmar persistencia de datos.
17. Registrar URLs y evidencia sin registrar secretos.

## 7. Cuentas de demostración

El seed crea estas identidades con la contraseña definida en `DEPLOY_SEED_PASSWORD`:

| Rol        | Correo                    |
| ---------- | ------------------------- |
| ADMIN      | `admin@elearning.local`   |
| HR_MANAGER | `hr@elearning.local`      |
| EMPLOYEE   | `learner@elearning.local` |

La contraseña no debe escribirse en este documento ni en Postman compartido. Cada integrante debe almacenarla como variable local o recibirla por un canal privado.

## 8. URLs finales esperadas

```text
API base:      https://elearning-corporativo-esen.onrender.com/api/v1
Health:        https://elearning-corporativo-esen.onrender.com/api/v1/health
Swagger:       https://elearning-corporativo-esen.onrender.com/api
OpenAPI JSON:  https://elearning-corporativo-esen.onrender.com/api-json
```

El subdominio puede recibir un sufijo si el nombre ya está ocupado. Las URLs definitivas se registrarán después del despliegue.

## 9. Límites y preparación de la presentación

- Render Free suspende la API después de un período sin solicitudes. Abrir health y Swagger varios minutos antes de presentar.
- Supabase Free puede pausar el proyecto después de una semana sin actividad. Revisarlo el día anterior y restaurarlo desde el Dashboard si corresponde.
- El plan gratuito de Supabase no incluye backups automáticos. No utilizar esta base como producción corporativa real.
- No ejecutar nuevamente el seed contra una base con trabajo que deba conservarse: el seed trunca las tablas de la aplicación.
- No ejecutar pruebas E2E contra la base desplegada; esas pruebas limpian y reconstruyen datos.

## 10. Rotación después del despliegue

Una vez aceptado el despliegue:

1. Revocar el API Key temporal de Render.
2. Revocar el Personal Access Token temporal de Supabase.
3. El servicio seguirá funcionando porque utiliza únicamente las credenciales PostgreSQL guardadas en Render.
4. Eliminar los tokens temporales de `.env.local` o eliminar el archivo completo.
5. Conservar la contraseña de demostración en un gestor de secretos del equipo.
6. Si una llave apareció en chat, Git, logs o una captura, revocarla inmediatamente y emitir una nueva.

## 11. Recuperación rápida

| Síntoma                        | Acción                                                                 |
| ------------------------------ | ---------------------------------------------------------------------- |
| Render tarda en responder      | Esperar el cold start y volver a consultar health                      |
| Supabase está pausado          | Abrir el proyecto y seleccionar Restore                                |
| Error de certificado           | Confirmar `DB_SSL=true` y que `DB_SSL_CA` contiene el bundle completo  |
| Password authentication failed | Revisar host pooler, usuario `postgres.<project-ref>` y contraseña     |
| Migraciones faltantes          | Revisar logs de inicio; la aplicación usa `migrationsRun: true`        |
| Login no funciona              | Confirmar que se ejecutó el seed remoto con la contraseña configurada  |
| `403` con token válido         | Confirmar rol y propiedad del recurso; no es un problema de despliegue |

## 12. Evidencia de aceptación

El despliegue se considera completo cuando existen pruebas de:

- Build y deploy exitosos en Render.
- Conexión PostgreSQL con TLS verificado.
- Health `200` con aplicación y base en estado correcto.
- Swagger y OpenAPI accesibles.
- Login y perfil exitosos para ADMIN, HR_MANAGER y EMPLOYEE.
- Datos persistentes después de reiniciar la API.
- Ausencia de secretos en Git y documentación.
