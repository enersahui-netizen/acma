const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Crear carpeta de respaldos si no existe
const respaldosDir = path.join(__dirname, 'public', 'respaldos');
if (!fs.existsSync(respaldosDir)) {
    fs.mkdirSync(respaldosDir, { recursive: true });
}

// Servir la carpeta de respaldos como estática
app.use('/respaldos', express.static(respaldosDir));

let partidas = [];
let llegadas = [];

// ================= RUTAS DE PÁGINAS =================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'partida.html')));
app.get('/llegada', (req, res) => res.sendFile(path.join(__dirname, 'public', 'llegada.html')));
app.get('/laptop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'laptop.html')));

// ================= ENDPOINTS API =================
app.post('/api/partida', (req, res) => {
    const { auto, tramo, hora } = req.body;
    partidas.push({ auto, tramo, hora });
    res.json({ ok: true });
});

app.post('/api/llegada', (req, res) => {
    const { auto, tramo, hora } = req.body;
    llegadas.push({ auto, tramo, hora });
    res.json({ ok: true });
});

// Generar y guardar el archivo Excel en el servidor al "Finalizar Tramo"
app.post('/api/guardar-respaldo', (req, res) => {
    const { tipo, tramo, registros } = req.body;

    if (!registros || registros.length === 0) {
        return res.status(400).json({ ok: false, error: "Sin registros para guardar" });
    }

    const fecha = new Date().toISOString().replace(/:/g, '-').slice(0, 16).replace('T', '_');
    const nombreArchivo = `${tipo.toUpperCase()}_${tramo}_${fecha}.xlsx`;
    const rutaArchivo = path.join(respaldosDir, nombreArchivo);

    const datosExcel = registros.map(r => ({
        "Vehículo": r.auto,
        "Tramo": r.tramo,
        "Hora": r.hora,
        "Estado": r.estado
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(wb, rutaArchivo);

    res.json({ ok: true, archivo: nombreArchivo });
});

// Obtener registros en vivo y lista de respaldos Excel
app.get('/api/obtener-datos-vivo', (req, res) => {
    let respaldos = [];
    if (fs.existsSync(respaldosDir)) {
        respaldos = fs.readdirSync(respaldosDir).filter(file => file.endsWith('.xlsx'));
    }
    res.json({ partidas, llegadas, respaldos });
});

// Limpiar memoria del servidor
app.post('/api/limpiar-todo', (req, res) => {
    partidas = [];
    llegadas = [];
    res.json({ ok: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor de carreras corriendo en puerto ${PORT}`));