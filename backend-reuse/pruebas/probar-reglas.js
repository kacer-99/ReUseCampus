// Prueba las reglas de negocio llamando a la API real: npm run probar-reglas
// Requisito: el servidor debe estar encendido (npm start) y la base creada con database/ReUseCampus.sql.
// Ojo: la prueba crea datos de ejemplo (publicaciones, solicitudes y dos usuarios) en la base.
const URL_API = process.env.API_URL || 'http://localhost:3000/api';

// Sufijo único para que la prueba se pueda repetir sin chocar con correos ya creados
const sufijo = Date.now();

let correctas = 0;
let falladas = 0;

async function llamar(metodo, ruta, token, cuerpo) {
    const respuesta = await fetch(URL_API + ruta, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    let datos = null;
    try { datos = await respuesta.json(); } catch (e) { /* sin cuerpo */ }
    return { estado: respuesta.status, datos };
}

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        correctas++;
        console.log(`  ✅ ${nombre}`);
    } else {
        falladas++;
        console.log(`  ❌ ${nombre}  ${detalle ? '-> ' + detalle : ''}`);
    }
}

function esperar(nombre, respuesta, estadoEsperado) {
    verificar(`${nombre} (HTTP ${estadoEsperado})`, respuesta.estado === estadoEsperado,
        `se obtuvo ${respuesta.estado} ${JSON.stringify(respuesta.datos)}`);
}

async function entrar(correo, clave) {
    const r = await llamar('POST', '/auth/login', null, { correo, password: clave });
    return r.datos && r.datos.token;
}

async function main() {
    console.log('\n== Autenticación ==');
    const mala = await llamar('POST', '/auth/login', null, { correo: 'ana@reuse.cl', password: 'incorrecta' });
    esperar('Login con clave incorrecta', mala, 401);
    const tokenAna = await entrar('ana@reuse.cl', 'Clave123');
    const tokenLuis = await entrar('luis@reuse.cl', 'Clave123');
    const tokenMarta = await entrar('marta@reuse.cl', 'Clave123');
    const tokenAdmin = await entrar('admin@reuse.cl', 'Admin123');
    verificar('Login correcto de los 4 usuarios de prueba', tokenAna && tokenLuis && tokenMarta && tokenAdmin);
    esperar('Listar publicaciones sin sesión', await llamar('GET', '/publicaciones'), 401);
    esperar('Token falso', await llamar('GET', '/publicaciones', 'token-falso'), 401);

    console.log('\n== Roles ==');
    esperar('Usuario común no ve el listado de usuarios', await llamar('GET', '/usuarios', tokenAna), 403);
    esperar('Administrador sí ve el listado de usuarios', await llamar('GET', '/usuarios', tokenAdmin), 200);

    console.log('\n== Publicaciones (CRUD y validación) ==');
    const invalida = await llamar('POST', '/publicaciones', tokenAna, { titulo: 'a' });
    esperar('Crear publicación con datos inválidos', invalida, 400);
    const creada = await llamar('POST', '/publicaciones', tokenAna, {
        titulo: 'Texto de Física', descripcion: 'Libro de física universitaria, buen estado.',
        categoria: 'Libros', modalidad: 'DONACION'
    });
    esperar('Crear publicación válida', creada, 201);
    const pub = creada.datos;
    verificar('La publicación nace DISPONIBLE', pub.estado === 'DISPONIBLE');
    verificar('El propietario es el usuario con sesión (RN02)', pub.propietarioNombre === 'Ana Torres');
    esperar('Publicación inexistente', await llamar('GET', '/publicaciones/99999', tokenAna), 404);
    esperar('Id inválido', await llamar('GET', '/publicaciones/abc', tokenAna), 400);
    esperar('Otro usuario no puede editar', await llamar('PUT', `/publicaciones/${pub.id}`, tokenLuis, {
        titulo: 'Hackeado', descripcion: 'Intento de edición ajena.', categoria: 'Libros', modalidad: 'DONACION'
    }), 403);
    const editada = await llamar('PUT', `/publicaciones/${pub.id}`, tokenAna, {
        titulo: 'Texto de Física II', descripcion: 'Libro de física universitaria, buen estado.',
        categoria: 'Libros', modalidad: 'DONACION', estado: 'ENTREGADA'
    });
    esperar('El propietario edita su publicación', editada, 200);
    verificar('Editar NO permite cambiar el estado (RN13)', editada.datos && editada.datos.estado === 'DISPONIBLE');

    console.log('\n== Solicitudes ==');
    esperar('Propietario solicita su propia publicación (RN03)',
        await llamar('POST', '/solicitudes', tokenAna, { publicacionId: pub.id, mensaje: 'Lo quiero' }), 403);
    esperar('Solicitud con mensaje inválido',
        await llamar('POST', '/solicitudes', tokenLuis, { publicacionId: pub.id, mensaje: '' }), 400);
    esperar('Solicitar publicación inexistente',
        await llamar('POST', '/solicitudes', tokenLuis, { publicacionId: 99999, mensaje: 'Hola' }), 404);
    const solLuis = await llamar('POST', '/solicitudes', tokenLuis, { publicacionId: pub.id, mensaje: 'Me sirve para el ramo' });
    esperar('Luis solicita (RN06 varias solicitudes)', solLuis, 201);
    esperar('Solicitud duplicada pendiente (RN05)',
        await llamar('POST', '/solicitudes', tokenLuis, { publicacionId: pub.id, mensaje: 'Otra vez' }), 409);
    const solMarta = await llamar('POST', '/solicitudes', tokenMarta, { publicacionId: pub.id, mensaje: 'Yo también lo necesito' });
    esperar('Marta solicita la misma publicación', solMarta, 201);
    esperar('Solo el propietario ve las solicitudes recibidas',
        await llamar('GET', `/publicaciones/${pub.id}/solicitudes`, tokenLuis), 403);
    const recibidas = await llamar('GET', `/publicaciones/${pub.id}/solicitudes`, tokenAna);
    verificar('El propietario ve 2 solicitudes', recibidas.datos && recibidas.datos.length === 2);
    esperar('Cancelar solicitud ajena', await llamar('PUT', `/solicitudes/${solLuis.datos.id}/cancelar`, tokenMarta), 403);

    console.log('\n== Aceptar solicitud (RN07 a RN11) ==');
    esperar('Quien no es propietario no puede aceptar (RN07)',
        await llamar('PUT', `/solicitudes/${solLuis.datos.id}/aceptar`, tokenMarta), 403);
    esperar('Solicitud inexistente', await llamar('PUT', '/solicitudes/99999/aceptar', tokenAna), 404);
    const aceptada = await llamar('PUT', `/solicitudes/${solLuis.datos.id}/aceptar`, tokenAna);
    esperar('El propietario acepta la solicitud de Luis', aceptada, 200);
    const despues = await llamar('GET', `/publicaciones/${pub.id}`, tokenAna);
    verificar('La publicación quedó RESERVADA (RN09)', despues.datos.estado === 'RESERVADA');
    const sols = await llamar('GET', `/publicaciones/${pub.id}/solicitudes`, tokenAna);
    const estados = {};
    sols.datos.forEach(s => { estados[s.solicitanteNombre] = s.estado; });
    verificar('Luis quedó ACEPTADA', estados['Luis Soto'] === 'ACEPTADA');
    verificar('Marta quedó RECHAZADA automáticamente (RN10)', estados['Marta Rojas'] === 'RECHAZADA');
    const entregasLuis = await llamar('GET', '/entregas/mias', tokenLuis);
    const entrega = entregasLuis.datos.find(e => e.publicacionId === pub.id);
    verificar('Se creó la Entrega PENDIENTE (RN11)', entrega && entrega.estado === 'PENDIENTE');
    esperar('Aceptar otra vez la misma solicitud', await llamar('PUT', `/solicitudes/${solLuis.datos.id}/aceptar`, tokenAna), 409);
    esperar('Aceptar la solicitud ya rechazada (RN08)', await llamar('PUT', `/solicitudes/${solMarta.datos.id}/aceptar`, tokenAna), 409);
    esperar('Solicitar una publicación RESERVADA (RN04)',
        await llamar('POST', '/solicitudes', tokenMarta, { publicacionId: pub.id, mensaje: 'Aún así' }), 409);
    esperar('Editar una publicación RESERVADA', await llamar('PUT', `/publicaciones/${pub.id}`, tokenAna, {
        titulo: 'Cambio', descripcion: 'Intento de edición tardía.', categoria: 'Libros', modalidad: 'DONACION'
    }), 409);
    esperar('Cancelar una publicación RESERVADA', await llamar('DELETE', `/publicaciones/${pub.id}`, tokenAna), 409);
    esperar('Cancelar solicitud ya ACEPTADA (RN16)',
        await llamar('PUT', `/solicitudes/${solLuis.datos.id}/cancelar`, tokenLuis), 409);

    console.log('\n== Confirmar entrega (RN13 y RN14) ==');
    esperar('El receptor no puede confirmar', await llamar('PUT', `/entregas/${entrega.id}/confirmar`, tokenLuis), 403);
    esperar('Entrega inexistente', await llamar('PUT', '/entregas/99999/confirmar', tokenAna), 404);
    esperar('El propietario confirma la entrega', await llamar('PUT', `/entregas/${entrega.id}/confirmar`, tokenAna), 200);
    const final = await llamar('GET', `/publicaciones/${pub.id}`, tokenAna);
    verificar('La publicación quedó ENTREGADA', final.datos.estado === 'ENTREGADA');
    const entregasAna = await llamar('GET', '/entregas/mias', tokenAna);
    const completada = entregasAna.datos.find(e => e.id === entrega.id);
    verificar('La entrega quedó COMPLETADA con fecha', completada.estado === 'COMPLETADA' && completada.fechaEntrega);
    esperar('Confirmar dos veces', await llamar('PUT', `/entregas/${entrega.id}/confirmar`, tokenAna), 409);
    esperar('Solicitar una publicación ENTREGADA',
        await llamar('POST', '/solicitudes', tokenMarta, { publicacionId: pub.id, mensaje: 'Tarde' }), 409);

    console.log('\n== Rechazar, cancelar y publicación cancelada ==');
    const otra = await llamar('POST', '/publicaciones', tokenLuis, {
        titulo: 'Mouse inalámbrico', descripcion: 'Mouse usado, funciona perfecto.',
        categoria: 'Accesorios', modalidad: 'INTERCAMBIO'
    });
    const s1 = await llamar('POST', '/solicitudes', tokenAna, { publicacionId: otra.datos.id, mensaje: 'Lo cambio por otro' });
    const s2 = await llamar('POST', '/solicitudes', tokenMarta, { publicacionId: otra.datos.id, mensaje: 'Me interesa' });
    esperar('Solo el propietario rechaza', await llamar('PUT', `/solicitudes/${s1.datos.id}/rechazar`, tokenMarta), 403);
    esperar('El propietario rechaza una solicitud', await llamar('PUT', `/solicitudes/${s1.datos.id}/rechazar`, tokenLuis), 200);
    esperar('Rechazar una ya rechazada', await llamar('PUT', `/solicitudes/${s1.datos.id}/rechazar`, tokenLuis), 409);
    esperar('El solicitante cancela su solicitud pendiente (RN16)',
        await llamar('PUT', `/solicitudes/${s2.datos.id}/cancelar`, tokenMarta), 200);
    const s3 = await llamar('POST', '/solicitudes', tokenAna, { publicacionId: otra.datos.id, mensaje: 'Reintento' });
    esperar('Puede volver a solicitar tras una solicitud RECHAZADA/CANCELADA', s3, 201);
    esperar('Otro usuario no cancela la publicación', await llamar('DELETE', `/publicaciones/${otra.datos.id}`, tokenMarta), 403);
    esperar('El propietario cancela la publicación (sin borrar, RN17)',
        await llamar('DELETE', `/publicaciones/${otra.datos.id}`, tokenLuis), 200);
    const cancelada = await llamar('GET', `/publicaciones/${otra.datos.id}`, tokenLuis);
    verificar('La publicación sigue existiendo como CANCELADA', cancelada.datos.estado === 'CANCELADA');
    const s3despues = await llamar('GET', '/solicitudes/mias', tokenAna);
    verificar('Sus solicitudes pendientes pasaron a RECHAZADA',
        s3despues.datos.find(s => s.id === s3.datos.id).estado === 'RECHAZADA');
    esperar('Solicitar una publicación CANCELADA',
        await llamar('POST', '/solicitudes', tokenMarta, { publicacionId: otra.datos.id, mensaje: 'Hola' }), 409);

    console.log('\n== Administración de usuarios ==');
    const nuevo = await llamar('POST', '/usuarios', tokenAdmin, {
        nombre: 'Pedro Prueba', correo: `pedro${sufijo}@reuse.cl`, password: 'Clave123', rol: 'USUARIO'
    });
    esperar('El administrador crea un usuario', nuevo, 201);
    esperar('Correo repetido', await llamar('POST', '/usuarios', tokenAdmin, {
        nombre: 'Otro Pedro', correo: `pedro${sufijo}@reuse.cl`, password: 'Clave123', rol: 'USUARIO'
    }), 409);
    esperar('Desactivar usuario', await llamar('DELETE', `/usuarios/${nuevo.datos.id}`, tokenAdmin), 200);
    const loginInactivo = await llamar('POST', '/auth/login', null, { correo: `pedro${sufijo}@reuse.cl`, password: 'Clave123' });
    esperar('Un usuario inactivo no puede entrar', loginInactivo, 403);
    const reg = await llamar('POST', '/auth/registro', null, { nombre: 'Rosa Nueva', correo: `rosa${sufijo}@reuse.cl`, password: 'Clave123' });
    esperar('Registro público de usuario', reg, 201);
    verificar('El registro entrega token y rol USUARIO', reg.datos && reg.datos.token && reg.datos.usuario.rol === 'USUARIO');

    console.log(`\nResultado: ${correctas} correctas, ${falladas} falladas`);
    process.exit(falladas === 0 ? 0 : 1);
}

main().catch(error => {
    console.error('No se pudo ejecutar la prueba. ¿Está encendido el servidor?', error.message);
    process.exit(1);
});