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

// Ruta absoluta en /tmp para asegurar permisos de escritura en Render/Android hosting
const respaldosDir = path.join(__dirname, 'public', 'respaldos');

if (!fs.existsSync(respaldosDir)) {
    fs.mkdirSync(respaldosDir, { recursive: true });
}

app.use('/respaldos', express.static(respaldosDir));

let partidas = [];
let llegadas = [];

// Rutas estáticas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'partida.html')));
app.get('/llegada', (req, res) => res.sendFile(path.join(__dirname, 'public', 'llegada.html')));
app.get('/laptop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'laptop.html')));

// Registrar partida
app.post('/api/partida', (req, res) => {
    const { auto, tramo, hora } = req.body;
    if (!auto || !tramo) return res.status(400).json({ ok: false, error: "Datos incompletos" });
    
    // Evita duplicar el símbolo #
    const numAuto = String(auto).replace('#', '');
    partidas.unshift({ auto: numAuto, tramo, hora });
    res.json({ ok: true });
});

// Registrar llegada
app.post('/api/llegada', (req, res) => {
    const { auto, tramo, hora } = req.body;
    if (!auto || !tramo) return res.status(400).json({ ok: false, error: "Datos incompletos" });

    const numAuto = String(auto).replace('#', '');
    llegadas.unshift({ auto: numAuto, tramo, hora });
    res.json({ ok: true });
});

// Guardar respaldo Excel desde Android
app.post('/api/guardar-respaldo', (req, res) => {
    try {
        const { tipo, tramo, registros } = req.body;

        if (!registros || !Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({ ok: false, error: "No hay registros recibidos" });
        }

        const ahora = new Date();
        const timestamp = ahora.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const nombreArchivo = `${tipo.toUpperCase()}_${tramo}_${timestamp}.xlsx`;
        const rutaArchivo = path.join(respaldosDir, nombreArchivo);

        const datosExcel = registros.map(r => ({
            "Vehículo": String(r.auto).replace('#', ''),
            "Tramo": r.tramo || tramo,
            "Hora": r.hora,
            "Estado": r.estado || 'REGISTRADO'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Tiempos");
        XLSX.writeFile(wb, rutaArchivo);

        console.log(`[Excel Creado]: ${nombreArchivo}`);
        return res.json({ ok: true, archivo: nombreArchivo });
    } catch (err) {
        console.error("Error generando Excel:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// Consultar datos para Laptop Dashboard
app.get('/api/obtener-datos-vivo', (req, res) => {
    let respaldos = [];
    try {
        if (fs.existsSync(respaldosDir)) {
            respaldos = fs.readdirSync(respaldosDir)
                .filter(f => f.endsWith('.xlsx'))
                .sort()
                .reverse();
        }
    } catch (e) {
        console.error("Error leyendo respaldos:", e);
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