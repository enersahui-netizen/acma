const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento temporal en memoria
let partidas = [];
let llegadas = [];

// ================= RUTAS DE PÁGINAS =================

// Ruta Raíz / Index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta Laptop (Dashboard Director de Carrera)
app.get('/laptop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'laptop.html'));
});

// ================= ENDPOINTS API =================

// Registrar una Partida
app.post('/api/partida', (req, res) => {
    partidas.push(req.body);
    console.log("Nueva partida recibida:", req.body);
    res.status(200).json({ ok: true, mensaje: "Partida registrada" });
});

// Registrar una Llegada
app.post('/api/llegada', (req, res) => {
    llegadas.push(req.body);
    console.log("Nueva llegada recibida:", req.body);
    res.status(200).json({ ok: true, mensaje: "Llegada registrada" });
});

// Obtener datos en vivo para la Laptop
app.get('/api/obtener-datos-vivo', (req, res) => {
    res.json({
        partidas: partidas,
        llegadas: llegadas
    });
});

// Guardar respaldo de archivos .xlsx
app.post('/api/guardar-excel-respaldo', (req, res) => {
    const { nombreArchivo, contenidoBase64 } = req.body;

    if (!nombreArchivo || !contenidoBase64) {
        return res.status(400).json({ ok: false, mensaje: "Datos incompletos" });
    }

    const folderPath = path.join(__dirname, 'respaldos');
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    const filePath = path.join(folderPath, nombreArchivo);
    const buffer = Buffer.from(contenidoBase64, 'base64');

    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error("Error guardando el .xlsx:", err);
            return res.status(500).json({ ok: false, mensaje: "Error al guardar el archivo" });
        }
        console.log(`Archivo .xlsx respaldado: ${nombreArchivo}`);
        res.status(200).json({ ok: true, mensaje: "Respaldo .xlsx guardado correctamente" });
    });
});

// Obtener lista de respaldos .xlsx
app.get('/api/lista-respaldos', (req, res) => {
    const folderPath = path.join(__dirname, 'respaldos');
    if (fs.existsSync(folderPath)) {
        const archivos = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx'));
        return res.json(archivos);
    }
    res.json([]);
});

// Descargar un respaldo .xlsx específico
app.get('/api/descargar-respaldo/:nombre', (req, res) => {
    const ruta = path.join(__dirname, 'respaldos', req.params.nombre);
    if (fs.existsSync(ruta)) {
        res.download(ruta);
    } else {
        res.status(404).send("Archivo no encontrado");
    }
});

// Iniciar Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});