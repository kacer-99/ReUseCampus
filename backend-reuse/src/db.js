// Conexión a SQL Server.
// Modo "windows" (por defecto): Autenticación de Windows con el driver msnodesqlv8 (sin usuario, clave ni puerto).
// Modo "sql": usuario y clave de SQL Server por TCP/IP. Se activa con la variable DB_AUTH=sql.
const modo = (process.env.DB_AUTH || 'windows').toLowerCase();
const baseDatos = process.env.DB_NAME || 'ReUseCampus';

let sql;
if (modo === 'windows') {
    try {
        sql = require('mssql/msnodesqlv8');
    } catch (error) {
        console.error('❌ No se pudo cargar el driver msnodesqlv8 (Autenticación de Windows).');
        console.error('   Ejecute "npm install" otra vez o use usuario y clave: DB_AUTH=sql (ver README).');
        process.exit(1);
    }
} else {
    sql = require('mssql');
}

// Drivers ODBC que se prueban, en orden, hasta encontrar uno instalado en el equipo
const DRIVERS_ODBC = process.env.DB_ODBC_DRIVER
    ? [process.env.DB_ODBC_DRIVER]
    : ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 'SQL Server Native Client 11.0', 'SQL Server'];

function cadenaWindows(driver, servidor) {
    const moderno = driver.startsWith('ODBC Driver');
    return `Driver={${driver}};Server=${servidor};Database=${baseDatos};Trusted_Connection=Yes;` +
        (moderno ? 'Encrypt=no;TrustServerCertificate=yes;' : '');
}

let pool = null;

async function conectar() {
    if (modo === 'windows') {
        const servidor = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
        let ultimoError;
        for (const driver of DRIVERS_ODBC) {
            try {
                const candidato = new sql.ConnectionPool({
                    connectionString: cadenaWindows(driver, servidor),
                    driver: 'msnodesqlv8',
                    server: servidor,
                    database: baseDatos
                });
                await candidato.connect();
                pool = candidato;
                console.log(`✅ Conectado a SQL Server (Autenticación de Windows, driver "${driver}")`);
                return pool;
            } catch (error) {
                ultimoError = error;
            }
        }
        throw ultimoError;
    }

    const configuracion = {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || 'alumnos',
        server: process.env.DB_SERVER || 'localhost',
        database: baseDatos,
        options: {
            encrypt: process.env.DB_ENCRYPT !== 'false',
            trustServerCertificate: true,
            // Permite conectar con servidores SQL Server antiguos desde Node con OpenSSL 3
            cryptoCredentialsDetails: { minVersion: 'TLSv1' }
        }
    };
    if (process.env.DB_INSTANCE) {
        configuracion.options.instanceName = process.env.DB_INSTANCE;
    } else {
        configuracion.port = Number(process.env.DB_PORT) || 1433;
    }
    pool = new sql.ConnectionPool(configuracion);
    await pool.connect();
    console.log('✅ Conectado a SQL Server (usuario y clave)');
    return pool;
}

function obtenerPool() {
    if (!pool) throw new Error('La conexión con la base de datos no está lista');
    return pool;
}

// Ejecuta una consulta con parámetros con nombre (@id, @correo...).
// Los datos viajan aparte del texto SQL: así se evita la inyección SQL.
function consultar(texto, parametros = {}, transaccion = null) {
    const peticion = transaccion ? new sql.Request(transaccion) : obtenerPool().request();
    for (const [nombre, valor] of Object.entries(parametros)) {
        peticion.input(nombre, valor);
    }
    return peticion.query(texto);
}

// Ejecuta varias consultas como una sola operación: o se guardan todas o no se guarda ninguna.
async function enTransaccion(trabajo) {
    const transaccion = new sql.Transaction(obtenerPool());
    await transaccion.begin();
    try {
        const resultado = await trabajo(transaccion);
        await transaccion.commit();
        return resultado;
    } catch (error) {
        try { await transaccion.rollback(); } catch (errorRollback) { /* ya estaba cerrada */ }
        throw error;
    }
}

module.exports = { sql, conectar, obtenerPool, consultar, enTransaccion };