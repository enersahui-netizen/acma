const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middlewares necesarios para recibir datos y habilitar solicitudes cruzadas
app.use(cors());
app.use(express.json());

// Servir automáticamente todos los archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal: Redirige automáticamente a la pantalla del Juez de Partida
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

// Configuración del puerto para Render (usa process.env.PORT si existe, o 3000 localmente)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Cronometraje activo en el puerto ${PORT}`);
});