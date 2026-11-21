const express = require('express');
const { consultar, enTransaccion } = require('../db');
const { autenticar, soloAdministrador } = require('../auth');
const { ErrorNegocio, leerId, responderError } = require('../utilidades');

const router = express.Router();

router.use(autenticar);

// Consulta base de una entrega con el título de la publicación y los nombres de las personas
const SELECT_ENTREGA = `
    SELECT e.id, e.publicacionId, e.solicitudId, e.propietarioId, e.receptorId,
           e.fechaAcuerdo, e.fechaEntrega, e.estado,
           p.titulo AS publicacionTitulo, p.estado AS publicacionEstado,
           o.nombre AS propietarioNombre, r.nombre AS receptorNombre
    FROM Entregas e
    INNER JOIN Publicaciones p ON p.id = e.publicacionId
    INNER JOIN Usuarios o ON o.id = e.propietarioId
    INNER JOIN Usuarios r ON r.id = e.receptorId`;

// GET /api/entregas: todas las entregas (solo administrador)
router.get('/', soloAdministrador, async (req, res) => {
    try {
        const resultado = await consultar(`${SELECT_ENTREGA} ORDER BY e.id DESC`);
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// GET /api/entregas/mias: entregas donde el usuario es propietario o receptor
router.get('/mias', async (req, res) => {
    try {
        const resultado = await consultar(
            `${SELECT_ENTREGA}
             WHERE e.propietarioId = @usuarioId OR e.receptorId = @usuarioId
             ORDER BY e.id DESC`,
            { usuarioId: req.usuario.id }
        );
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/entregas/:id/confirmar: el propietario confirma que entregó el artículo
router.put('/:id/confirmar', async (req, res) => {
    try {
        const id = leerId(req.params.id);

        await enTransaccion(async (transaccion) => {
            const resultado = await consultar(`${SELECT_ENTREGA} WHERE e.id = @id`, { id }, transaccion);
            const entrega = resultado.recordset[0];
            if (!entrega) {
                throw new ErrorNegocio(404, 'Entrega no encontrada');
            }
            if (entrega.propietarioId !== req.usuario.id) {
                throw new ErrorNegocio(403, 'Solo el propietario puede confirmar la entrega');
            }
            if (entrega.estado !== 'PENDIENTE') {
                throw new ErrorNegocio(409, 'La entrega ya fue confirmada');
            }
            // RN13: solo una publicación RESERVADA puede pasar a ENTREGADA
            if (entrega.publicacionEstado !== 'RESERVADA') {
                throw new ErrorNegocio(409, `La publicación está ${entrega.publicacionEstado} y no se puede entregar`);
            }

            await consultar(
                "UPDATE Entregas SET estado = 'COMPLETADA', fechaEntrega = GETDATE() WHERE id = @id",
                { id }, transaccion);

            // RN14: al completar la entrega, la publicación pasa a ENTREGADA
            await consultar("UPDATE Publicaciones SET estado = 'ENTREGADA' WHERE id = @id",
                { id: entrega.publicacionId }, transaccion);
        });

        res.status(200).json({ mensaje: 'Entrega confirmada. La publicación quedó ENTREGADA.' });
    } catch (error) {
        responderError(res, error);
    }
});

module.exports = router;