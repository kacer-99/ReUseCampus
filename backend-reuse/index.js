const express = require('express');
const cors = require('cors');
const { conectar } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de comprobación: indica que la API está funcionando
app.get('/', (req, res) => {
    res.status(200).json({ mensaje: 'API de ReUse Campus funcionando' });
});

// Rutas de la API, una por cada entidad
app.use('/api/auth', require('./src/rutas/auth'));
app.use('/api/usuarios', require('./src/rutas/usuarios'));
app.use('/api/publicaciones', require('./src/rutas/publicaciones'));
app.use('/api/solicitudes', require('./src/rutas/solicitudes'));
app.use('/api/entregas', require('./src/rutas/entregas'));

// Cualquier otra dirección: 404
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Primero se conecta a la base de datos y después se enciende el servidor
conectar()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('❌ Error conectando a la base de datos:', error.message);
        console.error('   Revise que SQL Server esté activo y que exista la base ReUseCampus');
        console.error('   (ejecute database/ReUseCampus.sql). Más ayuda en el README.');
        process.exit(1);
    });