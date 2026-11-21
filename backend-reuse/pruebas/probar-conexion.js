// Prueba rápida de la conexión con SQL Server: npm run probar-conexion
const { conectar, consultar } = require('../src/db');

conectar()
    .then(async () => {
        const usuarios = await consultar('SELECT COUNT(*) AS total FROM Usuarios');
        const publicaciones = await consultar('SELECT COUNT(*) AS total FROM Publicaciones');
        console.log(`   Usuarios: ${usuarios.recordset[0].total} | Publicaciones: ${publicaciones.recordset[0].total}`);
        console.log('✅ La conexión y las tablas funcionan.');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ No se pudo conectar:', error.message);
        process.exit(1);
    });