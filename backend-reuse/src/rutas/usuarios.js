const express = require('express');
const bcrypt = require('bcryptjs');
const { consultar } = require('../db');
const { autenticar, soloAdministrador } = require('../auth');
const {
    ErrorNegocio, ROLES, ESTADOS_USUARIO,
    leerId, leerTexto, leerOpcion, leerCorreo, responderError
} = require('../utilidades');

const router = express.Router();

// Todas las rutas de usuarios son solo para el administrador
router.use(autenticar, soloAdministrador);

// GET /api/usuarios: lista de usuarios (sin la contraseña)
router.get('/', async (req, res) => {
    try {
        const resultado = await consultar('SELECT id, nombre, correo, rol, estado FROM Usuarios ORDER BY id');
        res.status(200).json(resultado.recordset);
    } catch (error) {
        responderError(res, error);
    }
});

// POST /api/usuarios: crea un usuario con el rol elegido
router.post('/', async (req, res) => {
    try {
        const nombre = leerTexto(req.body.nombre, 'nombre', 2, 100);
        const correo = leerCorreo(req.body.correo);
        const password = leerTexto(req.body.password, 'contraseña', 6, 100);
        const rol = leerOpcion(req.body.rol, 'rol', ROLES);

        const existente = await consultar('SELECT id FROM Usuarios WHERE correo = @correo', { correo });
        if (existente.recordset.length > 0) {
            throw new ErrorNegocio(409, 'Ya existe un usuario con ese correo');
        }

        const resultado = await consultar(
            `INSERT INTO Usuarios (nombre, correo, password, rol)
             OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado
             VALUES (@nombre, @correo, @password, @rol)`,
            { nombre, correo, password: bcrypt.hashSync(password, 10), rol }
        );
        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        responderError(res, error);
    }
});

// PUT /api/usuarios/:id: modifica nombre, correo, rol y estado (la contraseña es opcional)
router.put('/:id', async (req, res) => {
    try {
        const id = leerId(req.params.id);
        const nombre = leerTexto(req.body.nombre, 'nombre', 2, 100);
        const correo = leerCorreo(req.body.correo);
        const rol = leerOpcion(req.body.rol, 'rol', ROLES);
        const estado = leerOpcion(req.body.estado, 'estado', ESTADOS_USUARIO);

        const actual = await consultar('SELECT id FROM Usuarios WHERE id = @id', { id });
        if (actual.recordset.length === 0) {
            throw new ErrorNegocio(404, 'Usuario no encontrado');
        }
        if (id === req.usuario.id && (rol !== 'ADMINISTRADOR' || estado !== 'ACTIVO')) {
            throw new ErrorNegocio(409, 'No puede quitarse el rol de administrador ni desactivarse a sí mismo');
        }

        const repetido = await consultar('SELECT id FROM Usuarios WHERE correo = @correo AND id <> @id', { correo, id });
        if (repetido.recordset.length > 0) {
            throw new ErrorNegocio(409, 'Ya existe otro usuario con ese correo');
        }

        await consultar(
            'UPDATE Usuarios SET nombre = @nombre, correo = @correo, rol = @rol, estado = @estado WHERE id = @id',
            { nombre, correo, rol, estado, id }
        );
        if (req.body.password) {
            const password = leerTexto(req.body.password, 'contraseña', 6, 100);
            await consultar('UPDATE Usuarios SET password = @password WHERE id = @id', {
                password: bcrypt.hashSync(password, 10), id
            });
        }
        res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        responderError(res, error);
    }
});

// DELETE /api/usuarios/:id: baja lógica (el usuario queda INACTIVO, no se borra: RN17)
router.delete('/:id', async (req, res) => {
    try {
        const id = leerId(req.params.id);
        if (id === req.usuario.id) {
            throw new ErrorNegocio(409, 'No puede desactivar su propio usuario');
        }

        const resultado = await consultar("UPDATE Usuarios SET estado = 'INACTIVO' WHERE id = @id", { id });
        if (resultado.rowsAffected[0] === 0) {
            throw new ErrorNegocio(404, 'Usuario no encontrado');
        }
        res.status(200).json({ mensaje: 'Usuario desactivado correctamente' });
    } catch (error) {
        responderError(res, error);
    }
});

module.exports = router;