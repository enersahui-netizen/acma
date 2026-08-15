const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos temporal en memoria
let partidas = [];
let llegadas = [];

// Endpoint para recibir datos de PARTIDA
app.post('/api/partida', (req, res) => {
    const registro = req.body;
    console.log("Partida recibida:", registro);
    partidas.push(registro);
    res.status(200).json({ ok: true, mensaje: "Partida registrada" });
});

// Endpoint para recibir datos de LLEGADA
app.post('/api/llegada', (req, res) => {
    const registro = req.body;
    console.log("Llegada recibida:", registro);
    llegadas.push(registro);
    res.status(200).json({ ok: true, mensaje: "Llegada registrada" });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});