// Error con código HTTP: se usa para responder 400, 401, 403, 404 o 409 con un mensaje claro
class ErrorNegocio extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

const CATEGORIAS = ['Libros', 'Componentes', 'Calculadoras', 'Accesorios', 'Materiales', 'Otros'];
const MODALIDADES = ['DONACION', 'INTERCAMBIO'];
const ROLES = ['USUARIO', 'ADMINISTRADOR'];
const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO'];

// Convierte el id de la URL o del cuerpo en un número entero positivo
function leerId(valor) {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw new ErrorNegocio(400, 'Identificador inválido');
    }
    return id;
}

// Verifica que el valor sea un texto con el largo permitido y lo devuelve sin espacios sobrantes
function leerTexto(valor, campo, minimo, maximo) {
    const texto = typeof valor === 'string' ? valor.trim() : '';
    if (texto.length < minimo || texto.length > maximo) {
        throw new ErrorNegocio(400, `El campo ${campo} debe tener entre ${minimo} y ${maximo} caracteres`);
    }
    return texto;
}

// Verifica que el valor sea una de las opciones permitidas
function leerOpcion(valor, campo, opciones) {
    if (!opciones.includes(valor)) {
        throw new ErrorNegocio(400, `El campo ${campo} debe ser uno de: ${opciones.join(', ')}`);
    }
    return valor;
}

function leerCorreo(valor) {
    const correo = leerTexto(valor, 'correo', 5, 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        throw new ErrorNegocio(400, 'El correo no tiene un formato válido');
    }
    return correo;
}

// Responde según el tipo de error: los de negocio con su código, los demás como error 500
function responderError(res, error) {
    if (error instanceof ErrorNegocio) {
        return res.status(error.estado).json({ mensaje: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = {
    ErrorNegocio, CATEGORIAS, MODALIDADES, ROLES, ESTADOS_USUARIO,
    leerId, leerTexto, leerOpcion, leerCorreo, responderError
};