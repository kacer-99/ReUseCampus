const jwt = require('jsonwebtoken');
const { consultar } = require('./db');
const { ErrorNegocio, responderError } = require('./utilidades');

const SECRETO = process.env.JWT_SECRET || 'reuse-campus-secreto-academico';

// Crea el token que recibe el usuario al iniciar sesión (dura 8 horas)
function crearToken(usuario) {
    return jwt.sign({ id: usuario.id, rol: usuario.rol }, SECRETO, { expiresIn: '8h' });
}

// Middleware: exige un token válido y deja el usuario en req.usuario
async function autenticar(req, res, next) {
    try {
        const [tipo, token] = (req.headers.authorization || '').split(' ');
        if (tipo !== 'Bearer' || !token) {
            throw new ErrorNegocio(401, 'Debe iniciar sesión');
        }

        let datos;
        try {
            datos = jwt.verify(token, SECRETO);
        } catch (error) {
            throw new ErrorNegocio(401, 'La sesión no es válida o expiró');
        }

        // Se consulta la base para saber si el usuario sigue existiendo y activo
        const resultado = await consultar(
            'SELECT id, nombre, correo, rol, estado FROM Usuarios WHERE id = @id',
            { id: datos.id }
        );
        const usuario = resultado.recordset[0];
        if (!usuario || usuario.estado !== 'ACTIVO') {
            throw new ErrorNegocio(401, 'El usuario no existe o está inactivo');
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        responderError(res, error);
    }
}

// Middleware: solo deja pasar al administrador
function soloAdministrador(req, res, next) {
    if (req.usuario.rol !== 'ADMINISTRADOR') {
        return res.status(403).json({ mensaje: 'Solo el administrador puede realizar esta operación' });
    }
    next();
}

module.exports = { crearToken, autenticar, soloAdministrador };