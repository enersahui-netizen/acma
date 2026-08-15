const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento en memoria para el evento
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

// 📥 RUTA PARA DESCARGAR EL ARCHIVO CSV
app.get('/api/descargar-csv', (req, res) => {
    // Encabezado con codificación UTF-8 BOM para que Excel abra bien las tildes y caracteres
    let csv = "\uFEFFAuto,Categoria,Tramo,Hora_Partida,Hora_Llegada\n";

    // Unir datos de partida con llegada
    partidas.forEach(p => {
        const l = llegadas.find(lleg => lleg.auto === p.auto && lleg.tramo === p.tramo);
        const horaPartida = p.hora || "";
        const horaLlegada = l ? l.hora : "";
        const categoria = p.categoria || "";

        csv += `"${p.auto}","${categoria}","${p.tramo}","${horaPartida}","${horaLlegada}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=tiempos_rally.csv');
    res.status(200).send(csv);
});

// Ruta raíz que sirve la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
const fs = require('fs');

// Endpoint para guardar respaldos CSV en la nube
app.post('/api/guardar-csv-respaldo', (req, res) => {
    const { nombreArchivo, contenido } = req.body;
    
    if (!nombreArchivo || !contenido) {
        return res.status(400).json({ ok: false, mensaje: "Datos incompletos" });
    }

    // Guarda el archivo en la raíz del servidor
    fs.writeFile(path.join(__dirname, nombreArchivo), contenido, 'utf8', (err) => {
        if (err) {
            console.error("Error guardando el CSV de respaldo:", err);
            return res.status(500).json({ ok: false, mensaje: "Error al guardar el archivo" });
        }
        console.log(`Respaldo guardado exitosamente: ${nombreArchivo}`);
        res.status(200).json({ ok: true, mensaje: "Respaldo CSV guardado" });
    });
});