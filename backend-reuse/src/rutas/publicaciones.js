const express = require('express');
const { consultar, enTransaccion } = require('../db');
const { autenticar } = require('../auth');
const {
    ErrorNegocio, CATEGORIAS, MODALIDADES,
    leerId, leerTexto, leerOpcion, responderError
} = require('../utilidades');

const router = express.Router();

// RN01: todas las rutas de publicaciones exigen un usuario con sesión iniciada
router.use(autenticar);

// Consulta base: la publicación con el nombre de su propietario y cuántas solicitudes pendientes tiene
const SELECT_PUBLICACION = `
    SELECT p.id, p.titulo, p.descripcion, p.categoria, p.modalidad, p.estado, p.fechaPublicacion,
           p.usuarioId, u.nombre AS propietarioNombre,
           (SELECT COUNT(*) FROM Solicitudes s
             WHERE s.publicacionId = p.id AND s.estado = 'PENDIENTE') AS solicitudesPendientes
    FROM Publicaciones p
    INNER JOIN Usuarios u ON u.id = p.usuarioId`;

async function buscarPublicacion(id) {
    const resultado = await consultar(`${SELECT_PUBLICACION} WHERE p.id = @id`, { id });
    const publicacion = resultado.recordset[0];
    if (!publicacion) {
        throw new ErrorNegocio(404, 'Publicación no encontrada');
    }
    return publicacion;
}

// GET /api/publicaciones?estado=&categoria=&modalidad=: lista con filtros opcionales
router.get('/', async (req, res) => {
    try {
        let condiciones = '';
        const parametros = {};
        if (req.query.estado) { condiciones += ' AND p.estado = @estado'; parametros.estado = req.query.estado; }
        if (req.query.categoria) { condiciones += ' AND p.categoria = @categoria'; parametros.categoria = req.query.categoria; }
        if (req.query.modalidad) { condiciones += ' AND p.modalidad = @modalidad'; parametros.modalidad = req.query.modalidad; }

        const resultado = await consultar(
            `${SELECT_PUBLICACION} WHERE 1 = 1 ${condiciones} ORDER BY p.id DESC`,
            parametros
        );
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// GET /api/publicaciones/mias: las publicaciones del usuario con sesión iniciada
// (va antes de /:id para que "mias" no se confunda con un id)
router.get('/mias', async (req, res) => {
    try {
        const resultado = await consultar(
            `${SELECT_PUBLICACION} WHERE p.usuarioId = @usuarioId ORDER BY p.id DESC`,
            { usuarioId: req.usuario.id }
        );
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// GET /api/publicaciones/:id
router.get('/:id', async (req, res) => {
    try {
        const publicacion = await buscarPublicacion(leerId(req.params.id));
        res.status(200).json(publicacion);
    } catch (error) {
        responderError(res, error);
    }
});

// GET /api/publicaciones/:id/solicitudes: solicitudes recibidas (solo propietario o administrador)
router.get('/:id/solicitudes', async (req, res) => {
    try {
        const publicacion = await buscarPublicacion(leerId(req.params.id));
        if (publicacion.usuarioId !== req.usuario.id && req.usuario.rol !== 'ADMINISTRADOR') {
            throw new ErrorNegocio(403, 'Solo el propietario puede ver las solicitudes de su publicación');
        }

        const resultado = await consultar(
            `SELECT s.id, s.publicacionId, s.solicitanteId, s.mensaje, s.fechaSolicitud, s.estado,
                    u.nombre AS solicitanteNombre
             FROM Solicitudes s
             INNER JOIN Usuarios u ON u.id = s.solicitanteId
             WHERE s.publicacionId = @id
             ORDER BY s.id`,
            { id: publicacion.id }
        );
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// POST /api/publicaciones: crea una publicación
// RN02: el propietario es siempre el usuario de la sesión (no se toma del cuerpo de la petición)
router.post('/', async (req, res) => {
    try {
        const titulo = leerTexto(req.body.titulo, 'título', 3, 150);
        const descripcion = leerTexto(req.body.descripcion, 'descripción', 10, 2000);
        const categoria = leerOpcion(req.body.categoria, 'categoría', CATEGORIAS);
        const modalidad = leerOpcion(req.body.modalidad, 'modalidad', MODALIDADES);

        const creada = await consultar(
            `INSERT INTO Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
             OUTPUT INSERTED.id
             VALUES (@titulo, @descripcion, @categoria, @modalidad, @usuarioId)`,
            { titulo, descripcion, categoria, modalidad, usuarioId: req.usuario.id }
        );
        const publicacion = await buscarPublicacion(creada.recordset[0].id);
        res.status(201).json(publicacion);
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/publicaciones/:id: edita una publicación (solo el propietario y solo si está DISPONIBLE)
// RN13: el estado nunca se cambia desde aquí; cambia solo con las reglas de solicitudes y entregas
router.put('/:id', async (req, res) => {
    try {
        const publicacion = await buscarPublicacion(leerId(req.params.id));
        if (publicacion.usuarioId !== req.usuario.id) {
            throw new ErrorNegocio(403, 'Solo el propietario puede editar su publicación');
        }
        if (publicacion.estado !== 'DISPONIBLE') {
            throw new ErrorNegocio(409, `No se puede editar una publicación ${publicacion.estado}`);
        }

        const titulo = leerTexto(req.body.titulo, 'título', 3, 150);
        const descripcion = leerTexto(req.body.descripcion, 'descripción', 10, 2000);
        const categoria = leerOpcion(req.body.categoria, 'categoría', CATEGORIAS);
        const modalidad = leerOpcion(req.body.modalidad, 'modalidad', MODALIDADES);

        await consultar(
            `UPDATE Publicaciones
             SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, modalidad = @modalidad
             WHERE id = @id`,
            { titulo, descripcion, categoria, modalidad, id: publicacion.id }
        );
        res.status(200).json(await buscarPublicacion(publicacion.id));
    } catch (error) {
        responderError(res, error);
    }
});

// DELETE /api/publicaciones/:id: cancela la publicación (no se borra: RN17)
// Solo el propietario o el administrador, y solo si está DISPONIBLE.
// Sus solicitudes pendientes pasan a RECHAZADA.
router.delete('/:id', async (req, res) => {
    try {
        const publicacion = await buscarPublicacion(leerId(req.params.id));
        if (publicacion.usuarioId !== req.usuario.id && req.usuario.rol !== 'ADMINISTRADOR') {
            throw new ErrorNegocio(403, 'Solo el propietario o el administrador pueden cancelar la publicación');
        }
        if (publicacion.estado !== 'DISPONIBLE') {
            throw new ErrorNegocio(409, `No se puede cancelar una publicación ${publicacion.estado}`);
        }

        await enTransaccion(async (transaccion) => {
            await consultar("UPDATE Publicaciones SET estado = 'CANCELADA' WHERE id = @id",
                { id: publicacion.id }, transaccion);
            await consultar(
                "UPDATE Solicitudes SET estado = 'RECHAZADA' WHERE publicacionId = @id AND estado = 'PENDIENTE'",
                { id: publicacion.id }, transaccion);
        });
        res.status(200).json({ mensaje: 'Publicación cancelada correctamente' });
    } catch (error) {
        responderError(res, error);
    }
});

module.exports = router;
