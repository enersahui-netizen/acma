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
// Ruta para exportar e integrar Partidas y Llegadas en un archivo CSV
app.get('/api/descargar-csv', (req, res) => {
    // Encabezados del CSV
    let csv = "Auto,Categoria,Tramo,Hora_Partida,Hora_Llegada,Tiempo_Empleado\n";

    // Recorremos las partidas registradas
    partidas.forEach(p => {
        // Buscamos si existe la llegada correspondiente para este auto en el mismo tramo
        const l = llegadas.find(lleg => lleg.auto === p.auto && lleg.tramo === p.tramo);
        
        const horaPartida = p.hora || "";
        const horaLlegada = l ? l.hora : "";
        
        // Agregar la fila al CSV
        csv += `"${p.auto}","${p.categoria || ''}","${p.tramo}","${horaPartida}","${horaLlegada}"\n`;
    });

    // Configurar encabezados HTTP para forzar la descarga en el navegador
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tiempos_rally.csv');
    res.status(200).send(csv);
});