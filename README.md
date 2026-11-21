# ReUse Campus

Plataforma web para que estudiantes publiquen, soliciten, intercambien o donen artículos usados (libros, calculadoras, apuntes, accesorios). Evaluación integradora del Electivo Angular, Instituto Profesional Virginio Gómez, Sede Chillán.

**Autor:** Kevin Carrasco

## Tecnologías

- **Frontend:** Angular (componentes standalone, formularios reactivos, HttpClient, interceptor y guards de rutas)
- **Backend:** Node.js + Express (API REST con JWT y bcrypt)
- **Base de datos:** SQL Server (acceso con el paquete `mssql`)

## Requisitos

- Node.js y npm
- Angular CLI (`npm install -g @angular/cli`)
- SQL Server (Express sirve) y SSMS
- ODBC Driver 17 o 18 for SQL Server (para autenticación de Windows)

## Instalación y ejecución

### 1. Base de datos

Abrir `database/ReUseCampus.sql` en SSMS y ejecutarlo completo. Crea la base `ReUseCampus`, las tablas (Usuarios, Publicaciones, Solicitudes, Entregas) y los datos de prueba. Se puede ejecutar más de una vez.

### 2. Backend (puerto 3000)

```powershell
cd backend-reuse
npm install
npm start
```

### 3. Frontend (puerto 4200)

```powershell
cd reuse-angular
npm install
ng serve
```

Abrir http://localhost:4200

## Configuración de la conexión a SQL Server

Por defecto usa **Autenticación de Windows** con el servidor `localhost\SQLEXPRESS` y la base `ReUseCampus`. Se puede cambiar con variables de entorno (PowerShell):

```powershell
$env:DB_SERVER = "localhost\SQLEXPRESS"
$env:DB_NAME = "ReUseCampus"
$env:DB_ODBC_DRIVER = "ODBC Driver 17 for SQL Server"
```

Si se prefiere usuario y contraseña de SQL Server:

```powershell
$env:DB_AUTH = "sql"
$env:DB_USER = "usuario"
$env:DB_PASSWORD = "clave"
$env:DB_PORT = "1433"      # o bien $env:DB_INSTANCE = "SQLEXPRESS"
npm start
```

Para comprobar solo la conexión: `npm run probar-conexion` (dentro de `backend-reuse`).

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@reuse.cl | Admin123 |
| Usuario | ana@reuse.cl | Clave123 |
| Usuario | luis@reuse.cl | Clave123 |
| Usuario | marta@reuse.cl | Clave123 |

## Funcionalidades

- Registro e inicio de sesión (JWT, 8 horas) con roles USUARIO y ADMINISTRADOR
- CRUD de publicaciones con filtros por estado, categoría y modalidad (donación o intercambio)
- Solicitudes sobre publicaciones de otros usuarios
- El propietario acepta o rechaza solicitudes; al aceptar se crea la entrega
- Confirmación de entrega por el propietario
- Administración de usuarios (solo ADMINISTRADOR): listar, crear y desactivar
- Mensajes de error claros desde la API y en pantalla

## Reglas de negocio y dónde están

| Regla | Dónde se aplica |
|---|---|
| RN01/RN02: la publicación nace DISPONIBLE y su propietario es el usuario con sesión | `backend-reuse/src/rutas/publicaciones.js` (POST) |
| RN03: no se puede solicitar la propia publicación (403) | `backend-reuse/src/rutas/solicitudes.js` (POST) |
| RN04/RN12/RN15: solo se solicitan publicaciones DISPONIBLES; una RESERVADA o ENTREGADA no recibe solicitudes (409) | `backend-reuse/src/rutas/solicitudes.js` (POST) |
| RN05: no se permite una segunda solicitud PENDIENTE del mismo usuario (409) | `backend-reuse/src/rutas/solicitudes.js` (POST) |
| RN06: una publicación puede tener varias solicitudes | `backend-reuse/src/rutas/solicitudes.js` (POST) |
| RN07: solo el propietario acepta o rechaza (403) | `backend-reuse/src/rutas/solicitudes.js` (PUT `/:id/aceptar`, `/:id/rechazar`) |
| RN08: solo una solicitud puede quedar ACEPTADA por publicación | `backend-reuse/src/rutas/solicitudes.js` (PUT `/:id/aceptar`) |
| RN09/RN10/RN11: al aceptar, la publicación pasa a RESERVADA, las demás solicitudes PENDIENTES pasan a RECHAZADA y se crea la Entrega PENDIENTE (todo en una transacción) | `backend-reuse/src/rutas/solicitudes.js` (PUT `/:id/aceptar`) |
| RN13: una publicación no pasa de DISPONIBLE a ENTREGADA (solo una RESERVADA puede entregarse; editar no cambia el estado) | `backend-reuse/src/rutas/entregas.js` y `publicaciones.js` (PUT) |
| RN14: al confirmar, la entrega pasa a COMPLETADA y la publicación a ENTREGADA | `backend-reuse/src/rutas/entregas.js` (PUT `/:id/confirmar`) |
| RN16: el solicitante solo cancela una solicitud PENDIENTE | `backend-reuse/src/rutas/solicitudes.js` (PUT `/:id/cancelar`) |
| RN17: no hay borrados físicos, solo cambios de estado | todas las rutas (cancelar publicación, desactivar usuario) |
| RN18: validación de datos en el backend | `backend-reuse/src/utilidades.js` y cada ruta |
| Autenticación y roles | `backend-reuse/src/auth.js` y `reuse-angular/src/app/guards/auth-guard.ts` |

Códigos HTTP usados: 200, 201, 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso), 404 (no existe), 409 (conflicto con una regla), 500.

## Endpoints de la API (`http://localhost:3000/api`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | /auth/login, /auth/registro | Iniciar sesión / registrarse |
| GET | /publicaciones, /publicaciones/:id | Listar (con filtros) / ver |
| POST | /publicaciones | Crear |
| PUT | /publicaciones/:id | Editar (solo propietario, solo DISPONIBLE) |
| DELETE | /publicaciones/:id | Cancelar (borrado lógico) |
| GET | /publicaciones/:id/solicitudes | Solicitudes recibidas (solo propietario) |
| POST | /solicitudes | Crear solicitud |
| GET | /solicitudes/mias | Mis solicitudes |
| PUT | /solicitudes/:id/aceptar, /rechazar, /cancelar | Cambiar el estado de una solicitud |
| GET | /entregas/mias | Mis entregas |
| PUT | /entregas/:id/confirmar | Confirmar entrega |
| GET, POST, DELETE | /usuarios, /usuarios/:id | Administración (solo ADMINISTRADOR) |

## Estructura del proyecto

```
ReUseCampus/
├── database/ReUseCampus.sql
├── backend-reuse/
│   ├── index.js
│   ├── pruebas/            (probar-conexion.js, probar-reglas.js)
│   └── src/
│       ├── db.js, auth.js, utilidades.js
│       └── rutas/          (auth, usuarios, publicaciones, solicitudes, entregas)
└── reuse-angular/src/app/
    ├── components/         (login, registro, publicaciones, detalle, formulario, mis-solicitudes, entregas, admin-usuarios, menu, cabecera)
    ├── services/           (auth, publicacion, solicitud, entrega, usuario)
    ├── guards/             (auth-guard)
    ├── interceptors/       (auth-interceptor)
    ├── models/             (modelos.ts)
    └── utilidades/         (errores.ts)
```

## Pruebas

- **Frontend:** `ng test --no-watch` (dentro de `reuse-angular`): 20 pruebas unitarias de servicios, guards, utilidades y login.
- **Reglas de negocio:** con el backend encendido, `npm run probar-reglas` (dentro de `backend-reuse`): 60 verificaciones contra la API real. Crea datos de ejemplo en la base.
- **Conexión:** `npm run probar-conexion`.

## Declaración de uso de inteligencia artificial

Usé **Claude (Anthropic)** como asistente durante este proyecto.

**Lo que generó la IA:** la propuesta del modelo de datos y el script SQL, el código del backend (rutas, reglas de negocio, autenticación), el código de los componentes y servicios de Angular, los scripts de prueba y un borrador de este README.

**Lo que hice yo:** instalé y configuré el entorno (Node, Angular CLI, SQL Server y driver ODBC); creé el proyecto con `ng new` y los archivos con `ng generate` y el editor; copié y revisé el código archivo por archivo; ejecuté el script SQL y comprobé la conexión con Autenticación de Windows en mi equipo; corregí errores de nombres de archivos e imports; probé el flujo completo manualmente en el navegador con distintos usuarios; ejecuté las pruebas automáticas y realicé los commits y el repositorio en GitHub.

**Cómo verifiqué el resultado:** `ng build`, `ng test`, `npm run probar-reglas` y la prueba manual de todo el flujo (publicar, solicitar, aceptar, confirmar entrega y administrar usuarios).

## Elección de la base de datos

Utilicé SQL Server debido al acceso y manejo que tenía con este programa dentro de mi computador. Es una base de datos relacional, por lo que permite las claves primarias y foráneas que exige el enunciado.