const express = require('express');
const bcrypt = require('bcryptjs');
const { consultar } = require('../db');
const { crearToken } = require('../auth');
const { ErrorNegocio, leerTexto, leerCorreo, responderError } = require('../utilidades');

const router = express.Router();

// POST /api/auth/login: inicia sesión y devuelve el token
router.post('/login', async (req, res) => {
    try {
        const correo = leerCorreo(req.body.correo);
        const password = leerTexto(req.body.password, 'contraseña', 1, 100);

        const resultado = await consultar('SELECT * FROM Usuarios WHERE correo = @correo', { correo });
        const usuario = resultado.recordset[0];

        if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
            throw new ErrorNegocio(401, 'Correo o contraseña incorrectos');
        }
        if (usuario.estado !== 'ACTIVO') {
            throw new ErrorNegocio(403, 'El usuario está inactivo');
        }

        res.status(200).json({
            token: crearToken(usuario),
            usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
        });
    } catch (error) {
        responderError(res, error);
    }
});

// POST /api/auth/registro: crea un usuario con rol USUARIO y lo deja con la sesión iniciada
router.post('/registro', async (req, res) => {
    try {
        const nombre = leerTexto(req.body.nombre, 'nombre', 2, 100);
        const correo = leerCorreo(req.body.correo);
        const password = leerTexto(req.body.password, 'contraseña', 6, 100);

        const existente = await consultar('SELECT id FROM Usuarios WHERE correo = @correo', { correo });
        if (existente.recordset.length > 0) {
            throw new ErrorNegocio(409, 'Ya existe un usuario con ese correo');
        }

        const resultado = await consultar(
            `INSERT INTO Usuarios (nombre, correo, password, rol)
             OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol
             VALUES (@nombre, @correo, @password, 'USUARIO')`,
            { nombre, correo, password: bcrypt.hashSync(password, 10) }
        );
        const usuario = resultado.recordset[0];

        res.status(201).json({ token: crearToken(usuario), usuario });
    } catch (error) {
        responderError(res, error);
    }
});

module.exports = router;