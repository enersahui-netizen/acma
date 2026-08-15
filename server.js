const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let partidas = [];
let llegadas = [];
let respaldosArchivos = [];

// Endpoint para recibir registros de PARTIDA
app.post('/api/partida', (req, res) => {
    partidas.push(req.body);
    res.status(200).json({ ok: true, mensaje: "Partida registrada" });
});

// Endpoint para recibir registros de LLEGADA
app.post('/api/llegada', (req, res) => {
    llegadas.push(req.body);
    res.status(200).json({ ok: true, mensaje: "Llegada registrada" });
});

// Endpoint para guardar respaldos .xlsx en el servidor
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
        if (!respaldosArchivos.includes(nombreArchivo)) {
            respaldosArchivos.push(nombreArchivo);
        }
        console.log(`Archivo .xlsx respaldado: ${nombreArchivo}`);
        res.status(200).json({ ok: true, mensaje: "Respaldo .xlsx guardado correctamente" });
    });
});

// Ruta para obtener la lista de respaldos recibidos (Para tu laptop)
app.get('/api/lista-respaldos', (req, res) => {
    res.json(respaldosArchivos);
});

// Ruta para descargar un respaldo .xlsx específico desde la laptop
app.get('/api/descargar-respaldo/:nombre', (req, res) => {
    const ruta = path.join(__dirname, 'respaldos', req.params.nombre);
    if (fs.existsSync(ruta)) {
        res.download(ruta);
    } else {
        res.status(404).send("Archivo no encontrado en el servidor");
    }
});

// Vista especial para la Laptop del Director de Carrera
app.get('/laptop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'laptop.html'));
});

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});