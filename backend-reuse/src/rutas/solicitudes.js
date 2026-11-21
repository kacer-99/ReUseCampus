const express = require('express');
const { consultar, enTransaccion } = require('../db');
const { autenticar, soloAdministrador } = require('../auth');
const { ErrorNegocio, leerId, leerTexto, responderError } = require('../utilidades');

const router = express.Router();

router.use(autenticar);

// Consulta base de una solicitud con datos de la publicación y de las personas involucradas
const SELECT_SOLICITUD = `
    SELECT s.id, s.publicacionId, s.solicitanteId, s.mensaje, s.fechaSolicitud, s.estado,
           p.titulo AS publicacionTitulo, p.estado AS publicacionEstado,
           p.usuarioId AS propietarioId, o.nombre AS propietarioNombre,
           u.nombre AS solicitanteNombre
    FROM Solicitudes s
    INNER JOIN Publicaciones p ON p.id = s.publicacionId
    INNER JOIN Usuarios o ON o.id = p.usuarioId
    INNER JOIN Usuarios u ON u.id = s.solicitanteId`;

async function buscarSolicitud(id, transaccion = null) {
    const resultado = await consultar(`${SELECT_SOLICITUD} WHERE s.id = @id`, { id }, transaccion);
    const solicitud = resultado.recordset[0];
    if (!solicitud) {
        throw new ErrorNegocio(404, 'Solicitud no encontrada');
    }
    return solicitud;
}

// GET /api/solicitudes: todas las solicitudes (solo administrador)
router.get('/', soloAdministrador, async (req, res) => {
    try {
        const resultado = await consultar(`${SELECT_SOLICITUD} ORDER BY s.id DESC`);
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// GET /api/solicitudes/mias: las solicitudes hechas por el usuario con sesión iniciada
router.get('/mias', async (req, res) => {
    try {
        const resultado = await consultar(
            `${SELECT_SOLICITUD} WHERE s.solicitanteId = @usuarioId ORDER BY s.id DESC`,
            { usuarioId: req.usuario.id }
        );
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// POST /api/solicitudes: solicita una publicación
router.post('/', async (req, res) => {
    try {
        const publicacionId = leerId(req.body.publicacionId);
        const mensaje = leerTexto(req.body.mensaje, 'mensaje', 3, 500);

        const creada = await enTransaccion(async (transaccion) => {
            const resultado = await consultar(
                'SELECT id, estado, usuarioId FROM Publicaciones WHERE id = @id',
                { id: publicacionId }, transaccion);
            const publicacion = resultado.recordset[0];
            if (!publicacion) {
                throw new ErrorNegocio(404, 'Publicación no encontrada');
            }

            // RN03: el propietario no puede solicitar su propia publicación
            if (publicacion.usuarioId === req.usuario.id) {
                throw new ErrorNegocio(403, 'No puede solicitar su propia publicación');
            }

            // RN04, RN12 y RN15: solo se solicita una publicación DISPONIBLE
            if (publicacion.estado !== 'DISPONIBLE') {
                throw new ErrorNegocio(409,
                    `La publicación está ${publicacion.estado} y no admite nuevas solicitudes`);
            }

            // RN05: no puede tener dos solicitudes PENDIENTES sobre la misma publicación
            const pendiente = await consultar(
                `SELECT id FROM Solicitudes
                 WHERE publicacionId = @publicacionId AND solicitanteId = @solicitanteId AND estado = 'PENDIENTE'`,
                { publicacionId, solicitanteId: req.usuario.id }, transaccion);
            if (pendiente.recordset.length > 0) {
                throw new ErrorNegocio(409, 'Ya tiene una solicitud pendiente sobre esta publicación');
            }

            // RN06: una publicación DISPONIBLE puede recibir varias solicitudes
            const insertada = await consultar(
                `INSERT INTO Solicitudes (publicacionId, solicitanteId, mensaje)
                 OUTPUT INSERTED.id
                 VALUES (@publicacionId, @solicitanteId, @mensaje)`,
                { publicacionId, solicitanteId: req.usuario.id, mensaje }, transaccion);
            return insertada.recordset[0].id;
        });

        res.status(201).json(await buscarSolicitud(creada));
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/solicitudes/:id/aceptar: el propietario acepta una solicitud
router.put('/:id/aceptar', async (req, res) => {
    try {
        const id = leerId(req.params.id);

        const entregaId = await enTransaccion(async (transaccion) => {
            const solicitud = await buscarSolicitud(id, transaccion);

            // RN07: solo el propietario de la publicación puede aceptar
            if (solicitud.propietarioId !== req.usuario.id) {
                throw new ErrorNegocio(403, 'Solo el propietario de la publicación puede aceptar solicitudes');
            }
            if (solicitud.estado !== 'PENDIENTE') {
                throw new ErrorNegocio(409, `La solicitud está ${solicitud.estado} y no se puede aceptar`);
            }
            if (solicitud.publicacionEstado !== 'DISPONIBLE') {
                throw new ErrorNegocio(409, `La publicación está ${solicitud.publicacionEstado}`);
            }

            // RN08: solo una solicitud puede quedar ACEPTADA para una publicación
            const aceptada = await consultar(
                "SELECT id FROM Solicitudes WHERE publicacionId = @publicacionId AND estado = 'ACEPTADA'",
                { publicacionId: solicitud.publicacionId }, transaccion);
            if (aceptada.recordset.length > 0) {
                throw new ErrorNegocio(409, 'Esta publicación ya tiene una solicitud aceptada');
            }

            // La solicitud pasa a ACEPTADA
            await consultar("UPDATE Solicitudes SET estado = 'ACEPTADA' WHERE id = @id", { id }, transaccion);

            // RN09: la publicación pasa de DISPONIBLE a RESERVADA
            await consultar("UPDATE Publicaciones SET estado = 'RESERVADA' WHERE id = @id",
                { id: solicitud.publicacionId }, transaccion);

            // RN10: las demás solicitudes PENDIENTES pasan a RECHAZADA
            await consultar(
                `UPDATE Solicitudes SET estado = 'RECHAZADA'
                 WHERE publicacionId = @publicacionId AND estado = 'PENDIENTE' AND id <> @id`,
                { publicacionId: solicitud.publicacionId, id }, transaccion);

            // RN11: se genera la Entrega/Intercambio en estado PENDIENTE
            const entrega = await consultar(
                `INSERT INTO Entregas (publicacionId, solicitudId, propietarioId, receptorId)
                 OUTPUT INSERTED.id
                 VALUES (@publicacionId, @solicitudId, @propietarioId, @receptorId)`,
                {
                    publicacionId: solicitud.publicacionId,
                    solicitudId: id,
                    propietarioId: solicitud.propietarioId,
                    receptorId: solicitud.solicitanteId
                }, transaccion);
            return entrega.recordset[0].id;
        });

        res.status(200).json({ mensaje: 'Solicitud aceptada. La publicación quedó RESERVADA.', entregaId });
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/solicitudes/:id/rechazar: el propietario rechaza una solicitud
router.put('/:id/rechazar', async (req, res) => {
    try {
        const solicitud = await buscarSolicitud(leerId(req.params.id));

        // RN07: solo el propietario puede rechazar
        if (solicitud.propietarioId !== req.usuario.id) {
            throw new ErrorNegocio(403, 'Solo el propietario de la publicación puede rechazar solicitudes');
        }
        if (solicitud.estado !== 'PENDIENTE') {
            throw new ErrorNegocio(409, `La solicitud está ${solicitud.estado} y no se puede rechazar`);
        }

        await consultar("UPDATE Solicitudes SET estado = 'RECHAZADA' WHERE id = @id", { id: solicitud.id });
        res.status(200).json({ mensaje: 'Solicitud rechazada correctamente' });
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/solicitudes/:id/cancelar: el solicitante cancela su solicitud
router.put('/:id/cancelar', async (req, res) => {
    try {
        const solicitud = await buscarSolicitud(leerId(req.params.id));

        if (solicitud.solicitanteId !== req.usuario.id) {
            throw new ErrorNegocio(403, 'Solo quien hizo la solicitud puede cancelarla');
        }
        // RN16: solo se puede cancelar mientras esté PENDIENTE
        if (solicitud.estado !== 'PENDIENTE') {
            throw new ErrorNegocio(409, `La solicitud está ${solicitud.estado} y ya no se puede cancelar`);
        }

        await consultar("UPDATE Solicitudes SET estado = 'CANCELADA' WHERE id = @id", { id: solicitud.id });
        res.status(200).json({ mensaje: 'Solicitud cancelada correctamente' });
    } catch (error) {
        responderError(res, error);
    }
});

module.exports = router;