-- =====================================================================
-- Script de base de datos - ReUse Campus
-- Motor: Microsoft SQL Server
-- Se puede ejecutar varias veces sin errores (crea solo lo que falta).
-- Usuarios de ejemplo: clave de admin@reuse.cl = Admin123
--                      clave de ana@, luis@ y marta@reuse.cl = Clave123
-- =====================================================================

-- 1. Crear la base de datos si no existe
IF DB_ID('ReUseCampus') IS NULL
    CREATE DATABASE ReUseCampus;
GO

USE ReUseCampus;
GO

-- 2. Tabla Usuarios
IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        id        INT IDENTITY(1,1) PRIMARY KEY,
        nombre    NVARCHAR(100) NOT NULL,
        correo    NVARCHAR(150) NOT NULL UNIQUE,          -- no se repite entre usuarios
        password  NVARCHAR(100) NOT NULL,                 -- se guarda cifrada (bcrypt), nunca en texto plano
        rol       NVARCHAR(20)  NOT NULL
                  CONSTRAINT CK_Usuarios_rol CHECK (rol IN ('USUARIO', 'ADMINISTRADOR')),
        estado    NVARCHAR(20)  NOT NULL
                  CONSTRAINT DF_Usuarios_estado DEFAULT 'ACTIVO'
                  CONSTRAINT CK_Usuarios_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
    );
END
GO

-- 3. Tabla Publicaciones (cada una pertenece a un usuario propietario)
IF OBJECT_ID('dbo.Publicaciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Publicaciones (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        titulo           NVARCHAR(150) NOT NULL,
        descripcion      NVARCHAR(MAX) NOT NULL,
        categoria        NVARCHAR(50)  NOT NULL,
        modalidad        NVARCHAR(20)  NOT NULL
                         CONSTRAINT CK_Publicaciones_modalidad CHECK (modalidad IN ('DONACION', 'INTERCAMBIO')),
        estado           NVARCHAR(20)  NOT NULL
                         CONSTRAINT DF_Publicaciones_estado DEFAULT 'DISPONIBLE'
                         CONSTRAINT CK_Publicaciones_estado CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA')),
        fechaPublicacion DATETIME      NOT NULL CONSTRAINT DF_Publicaciones_fecha DEFAULT GETDATE(),
        usuarioId        INT           NOT NULL,
        CONSTRAINT FK_Publicaciones_Usuarios FOREIGN KEY (usuarioId) REFERENCES dbo.Usuarios(id)
    );
END
GO

-- 4. Tabla Solicitudes (un usuario pide una publicacion)
IF OBJECT_ID('dbo.Solicitudes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Solicitudes (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        publicacionId  INT           NOT NULL,
        solicitanteId  INT           NOT NULL,
        mensaje        NVARCHAR(500) NOT NULL,
        fechaSolicitud DATETIME      NOT NULL CONSTRAINT DF_Solicitudes_fecha DEFAULT GETDATE(),
        estado         NVARCHAR(20)  NOT NULL
                       CONSTRAINT DF_Solicitudes_estado DEFAULT 'PENDIENTE'
                       CONSTRAINT CK_Solicitudes_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA')),
        CONSTRAINT FK_Solicitudes_Publicaciones FOREIGN KEY (publicacionId) REFERENCES dbo.Publicaciones(id),
        CONSTRAINT FK_Solicitudes_Usuarios      FOREIGN KEY (solicitanteId) REFERENCES dbo.Usuarios(id)
    );
END
GO

-- 5. Tabla Entregas (se genera al aceptar una solicitud)
IF OBJECT_ID('dbo.Entregas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Entregas (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        publicacionId INT      NOT NULL,
        solicitudId   INT      NOT NULL,
        propietarioId INT      NOT NULL,
        receptorId    INT      NOT NULL,
        fechaAcuerdo  DATETIME NOT NULL CONSTRAINT DF_Entregas_acuerdo DEFAULT GETDATE(),
        fechaEntrega  DATETIME NULL,                      -- se llena al confirmar la entrega
        estado        NVARCHAR(20) NOT NULL
                      CONSTRAINT DF_Entregas_estado DEFAULT 'PENDIENTE'
                      CONSTRAINT CK_Entregas_estado CHECK (estado IN ('PENDIENTE', 'COMPLETADA')),
        CONSTRAINT FK_Entregas_Publicaciones FOREIGN KEY (publicacionId) REFERENCES dbo.Publicaciones(id),
        CONSTRAINT FK_Entregas_Solicitudes   FOREIGN KEY (solicitudId)   REFERENCES dbo.Solicitudes(id),
        CONSTRAINT FK_Entregas_Propietario   FOREIGN KEY (propietarioId) REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_Entregas_Receptor      FOREIGN KEY (receptorId)    REFERENCES dbo.Usuarios(id)
    );
END
GO

-- 6. Usuarios de ejemplo (solo si la tabla esta vacia)
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios)
BEGIN
    INSERT INTO dbo.Usuarios (nombre, correo, password, rol)
    VALUES
    (N'Administrador', N'admin@reuse.cl', N'$2b$10$9P6M.E35ue6y9fcfQFBlNOqvYCOhdkJwf6I6ee30A2yEIwRUZZ0fe', 'ADMINISTRADOR'),
    (N'Ana Torres',    N'ana@reuse.cl',   N'$2b$10$e7XhZ6mFurFTa2kpg/mJxeB9f3TNPfexpAj3v/WEkyQ4Smp2PvncO', 'USUARIO'),
    (N'Luis Soto',     N'luis@reuse.cl',  N'$2b$10$e7XhZ6mFurFTa2kpg/mJxeB9f3TNPfexpAj3v/WEkyQ4Smp2PvncO', 'USUARIO'),
    (N'Marta Rojas',   N'marta@reuse.cl', N'$2b$10$e7XhZ6mFurFTa2kpg/mJxeB9f3TNPfexpAj3v/WEkyQ4Smp2PvncO', 'USUARIO');
END
GO

-- 7. Publicaciones de ejemplo (solo si la tabla esta vacia)
IF NOT EXISTS (SELECT 1 FROM dbo.Publicaciones)
BEGIN
    INSERT INTO dbo.Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
    SELECT N'Libro de Calculo I', N'Libro en buen estado, con algunos subrayados a lapiz.', 'Libros', 'DONACION', id
    FROM dbo.Usuarios WHERE correo = N'ana@reuse.cl';

    INSERT INTO dbo.Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
    SELECT N'Calculadora cientifica', N'Calculadora que funciona perfecto, cambio por otra util de estudio.', 'Calculadoras', 'INTERCAMBIO', id
    FROM dbo.Usuarios WHERE correo = N'ana@reuse.cl';

    INSERT INTO dbo.Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
    SELECT N'Kit de Arduino Uno', N'Placa Arduino con cables y sensores basicos, ideal para practicar.', 'Componentes', 'INTERCAMBIO', id
    FROM dbo.Usuarios WHERE correo = N'luis@reuse.cl';

    INSERT INTO dbo.Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
    SELECT N'Apuntes de Base de Datos', N'Apuntes impresos del semestre pasado, ordenados por unidad.', 'Materiales', 'DONACION', id
    FROM dbo.Usuarios WHERE correo = N'marta@reuse.cl';
END
GO

-- 8. Comprobacion
SELECT id, nombre, correo, rol, estado FROM dbo.Usuarios ORDER BY id;
SELECT id, titulo, modalidad, estado, usuarioId FROM dbo.Publicaciones ORDER BY id;
GO