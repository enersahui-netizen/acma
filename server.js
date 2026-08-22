const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'acma-secret-key-2026';
const DB_PATH = path.join(__dirname, 'acma.db');

// ================= SQLITE DATABASE =================
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Error abriendo BD:", err);
    else {
        console.log("✅ Base de datos SQLite conectada");
        inicializarBD();
    }
});

function inicializarBD() {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rol TEXT DEFAULT 'juez',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auto TEXT UNIQUE NOT NULL,
        piloto TEXT,
        copiloto TEXT,
        categoria TEXT,
        representante TEXT,
        ciudad TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS registros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        auto TEXT NOT NULL,
        tramo TEXT NOT NULL,
        hora TEXT NOT NULL,
        juez TEXT,
        enviado BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tiempos_acumulados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auto TEXT NOT NULL,
        tramo TEXT NOT NULL,
        tiempo_partida TEXT,
        tiempo_llegada TEXT,
        diferencia_ms INTEGER,
        UNIQUE(auto, tramo)
    )`);

    // Crear usuario admin por defecto si no existe
    db.get("SELECT * FROM usuarios WHERE username = 'admin'", (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run("INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)", 
                ['admin', hash, 'director'], (err) => {
                    if (!err) console.log("✅ Usuario admin creado (pass: admin123)");
                });
        }
    });
}

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticación
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ ok: false, error: "Token requerido" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ ok: false, error: "Token inválido" });
        req.usuario = decoded;
        next();
    });
}

// ================= RUTAS DE PÁGINAS =================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/partida', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'partida.html'));
});

app.get('/llegada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'llegada.html'));
});

app.get('/laptop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'laptop.html'));
});

app.get('/reporte', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reporte.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registro-participantes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro-participantes.html'));
});

// ================= ENDPOINTS DE AUTENTICACIÓN =================

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ ok: false, error: "Username y password requeridos" });
    }

    db.get("SELECT * FROM usuarios WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ ok: false, error: "Usuario no encontrado" });
        }

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ ok: false, error: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ id: user.id, username: user.username, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ ok: true, token, rol: user.rol });
    });
});

// Verificar token
app.post('/api/verificar-token', verificarToken, (req, res) => {
    res.json({ ok: true, usuario: req.usuario });
});

// ================= ENDPOINTS API =================

// Registrar Participantes (desde CSV)
app.post('/api/participantes-bulk', (req, res) => {
    const { participantes } = req.body;

    if (!Array.isArray(participantes) || participantes.length === 0) {
        return res.status(400).json({ ok: false, error: "Array de participantes requerido" });
    }

    let registrados = 0;
    let errores = 0;

    participantes.forEach(p => {
        db.run(
            `INSERT OR REPLACE INTO participantes (auto, piloto, copiloto, categoria, representante, ciudad) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [p.auto, p.piloto || '', p.copiloto || '', p.categoria || '', p.representante || '', p.ciudad || ''],
            (err) => {
                if (err) errores++;
                else registrados++;
            }
        );
    });

    setTimeout(() => {
        res.json({ ok: true, mensaje: `Registrados: ${registrados}, Errores: ${errores}` });
    }, 500);
});

// Obtener participante por auto
app.get('/api/participante/:auto', (req, res) => {
    db.get("SELECT * FROM participantes WHERE auto = ?", [req.params.auto], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ ok: false, error: "Participante no encontrado" });
        }
        res.json({ ok: true, participante: row });
    });
});

// Obtener lista de participantes
app.get('/api/participantes', (req, res) => {
    db.all("SELECT * FROM participantes ORDER BY auto", (err, rows) => {
        res.json({ ok: true, participantes: rows || [] });
    });
});

// Limpiar participantes
app.delete('/api/participantes', (req, res) => {
    db.run("DELETE FROM participantes", (err) => {
        if (err) {
            return res.status(500).json({ ok: false, error: "Error al limpiar" });
        }
        res.json({ ok: true, mensaje: "Participantes eliminados" });
    });
});

// Registrar una Partida (VERSIÓN SIMPLIFICADA)
app.post('/api/partida', (req, res) => {
    const { auto, tramo, juez, hora } = req.body;

    if (!auto || !tramo) {
        return res.status(400).json({ ok: false, error: "Auto y tramo requeridos" });
    }

    const horaRegistro = hora || new Date().toLocaleTimeString('es-PE', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');

    // Obtener datos del participante
    db.get("SELECT * FROM participantes WHERE auto = ?", [auto], (err, participante) => {
        db.run(
            `INSERT INTO registros (tipo, auto, tramo, hora, juez) 
             VALUES (?, ?, ?, ?, ?)`,
            ['partida', auto, tramo, horaRegistro, juez || ''],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ ok: false, error: "Error al registrar" });
                }
                
                const registro = { 
                    id: this.lastID, 
                    tipo: 'partida', 
                    auto, 
                    tramo, 
                    hora: horaRegistro, 
                    piloto: participante?.piloto || '-',
                    ciudad: participante?.ciudad || '-'
                };
                notificarClientes({ evento: 'nueva_partida', datos: registro });
                res.json({ ok: true, mensaje: "Partida registrada", id: this.lastID });
            }
        );
    });
});

// Registrar una Llegada (VERSIÓN SIMPLIFICADA)
app.post('/api/llegada', (req, res) => {
    const { auto, tramo, juez, hora } = req.body;

    if (!auto || !tramo) {
        return res.status(400).json({ ok: false, error: "Auto y tramo requeridos" });
    }

    const horaRegistro = hora || new Date().toLocaleTimeString('es-PE', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');

    // Obtener datos del participante
    db.get("SELECT * FROM participantes WHERE auto = ?", [auto], (err, participante) => {
        db.run(
            `INSERT INTO registros (tipo, auto, tramo, hora, juez) 
             VALUES (?, ?, ?, ?, ?)`,
            ['llegada', auto, tramo, horaRegistro, juez || ''],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ ok: false, error: "Error al registrar" });
                }

                const registro = { 
                    id: this.lastID, 
                    tipo: 'llegada', 
                    auto, 
                    tramo, 
                    hora: horaRegistro,
                    piloto: participante?.piloto || '-'
                };
                notificarClientes({ evento: 'nueva_llegada', datos: registro });
                res.json({ ok: true, mensaje: "Llegada registrada", id: this.lastID });
            }
        );
    });
});

// Obtener datos en vivo
app.get('/api/obtener-datos-vivo', (req, res) => {
    db.all("SELECT * FROM registros WHERE tipo = 'partida' ORDER BY created_at DESC LIMIT 100", (err, partidas) => {
        if (err) partidas = [];
        
        db.all("SELECT * FROM registros WHERE tipo = 'llegada' ORDER BY created_at DESC LIMIT 100", (err, llegadas) => {
            if (err) llegadas = [];
            
            res.json({ partidas: partidas || [], llegadas: llegadas || [] });
        });
    });
});

// Obtener datos para reporte
app.get('/api/reporte-datos', (req, res) => {
    const { categoria, ciudad, tramo } = req.query;

    // Primero obtener participantes para datos adicionales
    db.all("SELECT * FROM participantes", (err, participantes) => {
        const mapParticipantes = {};
        if (participantes) {
            participantes.forEach(p => {
                mapParticipantes[p.auto] = p;
            });
        }

        let query = `
            SELECT 
                r1.auto, 
                r1.tramo,
                r1.hora as hora_partida,
                r2.hora as hora_llegada,
                r1.juez
            FROM registros r1
            LEFT JOIN registros r2 ON r1.auto = r2.auto AND r1.tramo = r2.tramo AND r2.tipo = 'llegada'
            WHERE r1.tipo = 'partida'
        `;

        const params = [];

        if (tramo) {
            query += " AND r1.tramo = ?";
            params.push(tramo);
        }

        query += " ORDER BY r1.tramo, r1.auto";

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ ok: false, error: "Error obteniendo datos" });
            }

            // Calcular tiempos y agregar datos del participante
            const datos = rows.map(row => {
                const participante = mapParticipantes[row.auto] || {};
                
                let tiempo_transcurrido = null;
                if (row.hora_partida && row.hora_llegada) {
                    const [hp, mp, sp] = row.hora_partida.split(':');
                    const [hl, ml, sl] = row.hora_llegada.split(':');
                    const msPartida = parseInt(hp) * 3600000 + parseInt(mp) * 60000 + parseFloat(sp) * 1000;
                    const msLlegada = parseInt(hl) * 3600000 + parseInt(ml) * 60000 + parseFloat(sl) * 1000;
                    tiempo_transcurrido = msLlegada - msPartida;
                }

                // Aplicar filtros
                if (categoria && participante.categoria !== categoria) return null;
                if (ciudad && participante.ciudad !== ciudad) return null;

                return {
                    auto: row.auto,
                    categoria: participante.categoria || '-',
                    piloto: participante.piloto || '-',
                    copiloto: participante.copiloto || '-',
                    juez: row.juez || '-',
                    representante: participante.representante || '-',
                    ciudad: participante.ciudad || '-',
                    tramo: row.tramo,
                    hora_partida: row.hora_partida,
                    hora_llegada: row.hora_llegada,
                    tiempo_ms: tiempo_transcurrido
                };
            }).filter(d => d !== null);

            res.json({ ok: true, datos });
        });
    });
});

// Obtener listado de tramos únicos (desde registros)
app.get('/api/tramos', (req, res) => {
    db.all("SELECT DISTINCT tramo FROM registros WHERE tramo IS NOT NULL ORDER BY tramo", (err, rows) => {
        const tramos = rows?.map(r => r.tramo) || [];
        console.log("Tramos encontrados:", tramos);
        res.json({ ok: true, tramos });
    });
});

// Obtener listado de ciudades únicas (desde participantes)
app.get('/api/ciudades', (req, res) => {
    db.all("SELECT DISTINCT ciudad FROM participantes WHERE ciudad IS NOT NULL AND ciudad != '' ORDER BY ciudad", (err, rows) => {
        const ciudades = rows?.map(r => r.ciudad) || [];
        console.log("Ciudades encontradas:", ciudades);
        res.json({ ok: true, ciudades });
    });
});

// Obtener listado de categorías únicas (desde participantes)
app.get('/api/categorias', (req, res) => {
    db.all("SELECT DISTINCT categoria FROM participantes WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria", (err, rows) => {
        const categorias = rows?.map(r => r.categoria) || [];
        console.log("Categorías encontradas:", categorias);
        res.json({ ok: true, categorias });
    });
});

// Guardar respaldo de archivos .xlsx
app.post('/api/guardar-excel-respaldo', (req, res) => {
    const { nombreArchivo, contenidoBase64 } = req.body;

    if (!nombreArchivo || !contenidoBase64) {
        return res.status(400).json({ ok: false, error: "Datos incompletos" });
    }

    const folderPath = path.join(__dirname, 'respaldos');
    
    // Crear carpeta si no existe
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, nombreArchivo);
    
    try {
        // Remover el data URL prefix si existe
        let data = contenidoBase64;
        if (data.includes('base64,')) {
            data = data.split('base64,')[1];
        }
        
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);
        
        console.log(`✅ Respaldo guardado: ${filePath}`);
        res.json({ ok: true, mensaje: "Respaldo guardado correctamente" });
    } catch (err) {
        console.error("Error guardando .xlsx:", err);
        res.status(500).json({ ok: false, error: "Error al guardar: " + err.message });
    }
});

// Obtener lista de respaldos
app.get('/api/lista-respaldos', (req, res) => {
    const folderPath = path.join(__dirname, 'respaldos');
    try {
        if (fs.existsSync(folderPath)) {
            const archivos = fs.readdirSync(folderPath)
                .filter(f => f.endsWith('.xlsx'))
                .sort((a, b) => fs.statSync(path.join(folderPath, b)).mtime - fs.statSync(path.join(folderPath, a)).mtime);
            return res.json({ ok: true, archivos });
        }
        res.json({ ok: true, archivos: [] });
    } catch (err) {
        console.error("Error listando respaldos:", err);
        res.json({ ok: true, archivos: [] });
    }
});

// Descargar respaldo
app.get('/api/descargar-respaldo/:nombre', (req, res) => {
    const ruta = path.join(__dirname, 'respaldos', req.params.nombre);
    if (fs.existsSync(ruta)) {
        res.download(ruta);
    } else {
        res.status(404).send("Archivo no encontrado");
    }
});

// ================= WEBSOCKETS =================
let clientes = [];

wss.on('connection', (ws) => {
    console.log("🔌 Cliente WebSocket conectado");
    clientes.push(ws);

    ws.on('close', () => {
        clientes = clientes.filter(c => c !== ws);
        console.log("❌ Cliente WebSocket desconectado");
    });

    ws.on('error', (err) => {
        console.error("Error WebSocket:", err);
    });
});

function notificarClientes(mensaje) {
    clientes.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(mensaje));
        }
    });
}

// ================= INICIAR SERVIDOR =================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    console.log(`📍 Accede a http://localhost:${PORT}`);
});

module.exports = app;
