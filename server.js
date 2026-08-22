const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Asegurar carpeta de respaldos
const respaldosDir = path.join(__dirname, 'public', 'respaldos');
if (!fs.existsSync(respaldosDir)) {
    fs.mkdirSync(respaldosDir, { recursive: true });
}

app.use('/respaldos', express.static(respaldosDir));

let partidas = [];
let llegadas = [];

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'partida.html')));
app.get('/llegada', (req, res) => res.sendFile(path.join(__dirname, 'public', 'llegada.html')));
app.get('/laptop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'laptop.html')));

// API PARTIDA
app.post('/api/partida', (req, res) => {
    const { auto, tramo, hora } = req.body;
    const numAuto = String(auto).replace('#', '').trim();
    partidas.unshift({ auto: numAuto, tramo, hora });
    res.json({ ok: true });
});

// API LLEGADA
app.post('/api/llegada', (req, res) => {
    const { auto, tramo, hora } = req.body;
    const numAuto = String(auto).replace('#', '').trim();
    llegadas.unshift({ auto: numAuto, tramo, hora });
    res.json({ ok: true });
});

// GUARDAR EXCEL (.XLSX)
app.post('/api/guardar-respaldo', (req, res) => {
    try {
        const { tipo, tramo, registros } = req.body;

        if (!registros || !Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({ ok: false, error: "No hay datos para guardar" });
        }

        if (!fs.existsSync(respaldosDir)) {
            fs.mkdirSync(respaldosDir, { recursive: true });
        }

        const ahora = new Date();
        const fechaHora = ahora.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const nombreArchivo = `${tipo.toUpperCase()}_${tramo}_${fechaHora}.xlsx`;
        const rutaArchivo = path.join(respaldosDir, nombreArchivo);

        const datosExcel = registros.map(r => ({
            "Vehículo": String(r.auto).replace('#', '').trim(),
            "Tramo": r.tramo || tramo,
            "Hora": r.hora,
            "Estado": r.estado || 'REGISTRADO'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        XLSX.writeFile(wb, rutaArchivo);

        return res.json({ ok: true, archivo: nombreArchivo });
    } catch (err) {
        console.error("Error al guardar Excel:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// OBTENER DATOS Y ARCHIVOS
app.get('/api/obtener-datos-vivo', (req, res) => {
    let respaldos = [];
    try {
        if (fs.existsSync(respaldosDir)) {
            respaldos = fs.readdirSync(respaldosDir)
                .filter(file => file.endsWith('.xlsx'))
                .sort()
                .reverse();
        }
    } catch (e) {
        console.error("Error leyendo respaldos:", e);
    }

    res.json({ partidas, llegadas, respaldos });
});

app.post('/api/limpiar-todo', (req, res) => {
    partidas = [];
    llegadas = [];
    res.json({ ok: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));