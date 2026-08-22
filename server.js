const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Definir carpeta de respaldos en public
const respaldosDir = path.join(__dirname, 'public', 'respaldos');

// Asegurar que la carpeta se cree correctamente
try {
    if (!fs.existsSync(respaldosDir)) {
        fs.mkdirSync(respaldosDir, { recursive: true });
    }
} catch (err) {
    console.error("Error creando directorio de respaldos:", err);
}

app.use('/respaldos', express.static(respaldosDir));

let partidas = [];
let llegadas = [];

// Rutas estáticas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'partida.html')));
app.get('/llegada', (req, res) => res.sendFile(path.join(__dirname, 'public', 'llegada.html')));
app.get('/laptop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'laptop.html')));

// API Partida
app.post('/api/partida', (req, res) => {
    try {
        const { auto, tramo, hora } = req.body;
        const numAuto = String(auto).replace('#', '').trim();
        partidas.unshift({ auto: numAuto, tramo, hora });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// API Llegada
app.post('/api/llegada', (req, res) => {
    try {
        const { auto, tramo, hora } = req.body;
        const numAuto = String(auto).replace('#', '').trim();
        llegadas.unshift({ auto: numAuto, tramo, hora });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// API Guardar Respaldo Excel
app.post('/api/guardar-respaldo', (req, res) => {
    try {
        const { tipo, tramo, registros } = req.body;

        if (!registros || !Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({ ok: false, error: "No hay registros recibidos" });
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
        
        // Escribir archivo en disco
        XLSX.writeFile(wb, rutaArchivo);

        console.log(`[RESPALDO CREADO]: ${nombreArchivo}`);
        return res.json({ ok: true, archivo: nombreArchivo });
    } catch (err) {
        console.error("Error al guardar el archivo Excel:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// API Obtener Datos en Vivo para Laptop
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
        console.error("Error al leer la carpeta de respaldos:", e);
    }

    res.json({ partidas, llegadas, respaldos });
});

// Resetear memoria
app.post('/api/limpiar-todo', (req, res) => {
    partidas = [];
    llegadas = [];
    res.json({ ok: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));