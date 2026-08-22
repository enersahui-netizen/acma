const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento dinámico en memoria
let partidas = [];
let llegadas = [];

// ================= RUTAS PARA SERVIR PÁGINAS =================

// Redirige la raíz al control de partida por defecto
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

// Ruta para el control de llegada
app.get('/llegada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'llegada.html'));
});

// Ruta para la pantalla del Director de Carrera
app.get('/laptop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'laptop.html'));
});

// ================= ENDPOINTS API =================

// Registrar una partida
app.post('/api/partida', (req, res) => {
    const { auto, tramo, hora } = req.body;
    partidas.push({ auto, tramo, hora });
    res.json({ ok: true, mensaje: "Partida registrada" });
});

// Registrar una llegada
app.post('/api/llegada', (req, res) => {
    const { auto, tramo, hora } = req.body;
    llegadas.push({ auto, tramo, hora });
    res.json({ ok: true, mensaje: "Llegada registrada" });
});

// Obtener todos los datos para la laptop (panel en vivo)
app.get('/api/obtener-datos-vivo', (req, res) => {
    res.json({ partidas, llegadas });
});

// Limpiar todas las tablas de datos para iniciar un nuevo tramo
app.post('/api/limpiar-todo', (req, res) => {
    partidas = [];
    llegadas = [];
    res.json({ ok: true, mensaje: "Datos limpiados correctamente" });
});

// Servidor escuchando en Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor de carreras corriendo en el puerto ${PORT}`);
});