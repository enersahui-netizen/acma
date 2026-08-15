// ==============================================================================
// CENTRAL DE CÓMPUTOS - SISTEMA DE CRONOMETRAJE PARA RALLY
// Archivo: server.js
// ==============================================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estructuras de datos en memoria
const registrosPartida = {}; // Clave: tramo_auto (ej: "PE01_402")
const registrosLlegada = {}; // Clave: tramo_auto
let resultadosTramos = [];  // Lista de resultados consolidados

// ==============================================================================
// 1. FUNCIONES AUXILIARES DE TIEMPO Y RESPALDO CSV
// ==============================================================================

// Convierte milisegundos a formato HH:MM:SS.mmm
function msATiempoFormateado(duracionMs) {
  if (isNaN(duracionMs) || duracionMs < 0) return "00:00:00.000";

  const ms = Math.floor((duracionMs % 1000));
  const segundos = Math.floor((duracionMs / 1000) % 60);
  const minutos = Math.floor((duracionMs / (1000 * 60)) % 60);
  const horas = Math.floor((duracionMs / (1000 * 60 * 60)));

  const pad = (n, z = 2) => n.toString().padStart(z, '0');
  const padMs = (n) => n.toString().padStart(3, '0');

  return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}.${padMs(ms)}`;
}

// Guarda o actualiza una fila en el archivo CSV local de respaldo
function respaldarEnCSV(resultado) {
  const archivoCSV = 'planilla_carrera.csv';
  
  // Si el archivo no existe, crea el encabezado
  if (!fs.existsSync(archivoCSV)) {
    const encabezado = "Tramo,Auto,Categoria,Hora_Partida,Hora_Llegada,Penalizacion_Seg,Observacion,Tiempo_Bruto,Tiempo_Oficial\n";
    fs.writeFileSync(archivoCSV, encabezado, 'utf8');
  }

  const linea = `"${resultado.tramo_id}","${resultado.auto}","${resultado.categoria}","${resultado.hora_partida}","${resultado.hora_llegada}",${resultado.penalizacion_seg},"${resultado.observacion}","${resultado.tiempo_bruto}","${resultado.tiempo_oficial}"\n`;
  
  fs.appendFile(archivoCSV, linea, 'utf8', (err) => {
    if (err) console.error("❌ Error al guardar en CSV:", err);
    else console.log(`💾 Respaldo CSV actualizado para Auto #${resultado.auto}`);
  });
}

// Lógica de consolidación y procesamiento de tiempos
function procesarTiempoTramo(clave) {
  const partida = registrosPartida[clave];
  const llegada = registrosLlegada[clave];

  if (partida && llegada) {
    // 1. Cálculo de tiempo bruto
    const tiempoBrutoMs = llegada.ms_llegada - partida.ms_partida;
    
    // 2. Penalización convertida a milisegundos
    const penalizacionMs = (llegada.penalizacion_seg || 0) * 1000;
    
    // 3. Tiempo Total Final con Penalización
    const tiempoTotalMs = tiempoBrutoMs + penalizacionMs;

    const resultado = {
      tramo_id: partida.tramo_id,
      auto: partida.auto,
      categoria: partida.categoria || "General",
      hora_partida: partida.hora_partida,
      hora_llegada: llegada.hora_llegada,
      penalizacion_seg: llegada.penalizacion_seg || 0,
      observacion: llegada.observacion || "Sin observaciones",
      tiempo_bruto: msATiempoFormateado(tiempoBrutoMs),
      tiempo_total_ms: tiempoTotalMs,
      tiempo_oficial: msATiempoFormateado(tiempoTotalMs)
    };

    // Actualizar o insertar en el arreglo principal
    const index = resultadosTramos.findIndex(r => r.auto === partida.auto && r.tramo_id === partida.tramo_id);
    if (index >= 0) {
      resultadosTramos[index] = resultado;
    } else {
      resultadosTramos.push(resultado);
    }

    console.log(`\n✅ ¡TIEMPO PROCESADO! Auto #${resultado.auto} (${resultado.categoria}) - Oficial: ${resultado.tiempo_oficial}`);
    
    // Guardar copia de seguridad
    respaldarEnCSV(resultado);
  }
}

// ==============================================================================
// 2. RUTAS DE LA API (ENDPOINTS RECIBIDORES)
// ==============================================================================

// Recepción desde la App del Juez de Partida
app.post('/api/partida', (req, res) => {
  const { tramo_id, auto, categoria, hora_partida, ms_partida } = req.body;

  if (!tramo_id || !auto || !ms_partida) {
    return res.status(400).json({ error: "Faltan datos requeridos de partida" });
  }

  const clave = `${tramo_id}_${auto}`;
  registrosPartida[clave] = {
    tramo_id,
    auto,
    categoria: categoria || "General",
    hora_partida,
    ms_partida: parseInt(ms_partida)
  };

  console.log(`🏁 PARTIDA REGISTRADA -> Auto #${auto} | Tramo: ${tramo_id} | Cat: ${categoria}`);
  
  procesarTiempoTramo(clave);
  res.json({ status: "OK", message: "Partida recibida en central" });
});

// Recepción desde la App del Juez de Llegada
app.post('/api/llegada', (req, res) => {
  const { tramo_id, auto, hora_llegada, ms_llegada, penalizacion_seg, observacion } = req.body;

  if (!tramo_id || !auto || !ms_llegada) {
    return res.status(400).json({ error: "Faltan datos requeridos de llegada" });
  }

  const clave = `${tramo_id}_${auto}`;
  registrosLlegada[clave] = {
    tramo_id,
    auto,
    hora_llegada,
    ms_llegada: parseInt(ms_llegada),
    penalizacion_seg: parseInt(penalizacion_seg) || 0,
    observacion: observacion || ""
  };

  console.log(`🏁 LLEGADA REGISTRADA -> Auto #${auto} | Tramo: ${tramo_id} | Pen: +${penalizacion_seg || 0}s`);

  procesarTiempoTramo(clave);
  res.json({ status: "OK", message: "Llegada recibida en central" });
});

// Consulta general de resultados desde la laptop
app.get('/api/resultados/:tramo_id', (req, res) => {
  const { tramo_id } = req.params;
  const filtrados = resultadosTramos
    .filter(r => r.tramo_id === tramo_id)
    .sort((a, b) => a.tiempo_total_ms - b.tiempo_total_ms);

  res.json(filtrados);
});

// Generar mensaje formateado para WhatsApp
app.get('/api/reporte-whatsapp/:tramo_id', (req, res) => {
  const { tramo_id } = req.params;
  const textoWhatsApp = generarMensajeWhatsApp(tramo_id);

  if (!textoWhatsApp) {
    return res.status(404).json({ error: "No hay tiempos registrados para este tramo." });
  }

  res.json({ reporte: textoWhatsApp });
});

// ==============================================================================
// 3. GENERADOR DE PLANTILLA WHATSAPP POR CATEGORÍAS
// ==============================================================================

function generarMensajeWhatsApp(tramoId) {
  const resultadosTramo = resultadosTramos.filter(r => r.tramo_id === tramoId);
  if (resultadosTramo.length === 0) return null;

  // Agrupar por categoría
  const categorias = {};
  resultadosTramo.forEach(res => {
    if (!categorias[res.categoria]) categorias[res.categoria] = [];
    categorias[res.categoria].push(res);
  });

  let texto = `🏁 *CLASIFICACIÓN OFICIAL POR CATEGORÍAS* 🏁\n`;
  texto += `📍 *TRAMO: ${tramoId}*\n`;
  texto += `-----------------------------------------\n\n`;

  let observacionesGlobales = [];

  for (const [nombreCategoria, pilotos] of Object.entries(categorias)) {
    pilotos.sort((a, b) => a.tiempo_total_ms - b.tiempo_total_ms);

    texto += `🚗 *CATEGORÍA: ${nombreCategoria.toUpperCase()}*\n`;

    pilotos.forEach((res, index) => {
      let medalla = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : `${index + 1}. `;
      let penTxt = res.penalizacion_seg > 0 ? ` *(+${res.penalizacion_seg}s pen.)*` : "";

      texto += `${medalla}*Auto #${res.auto}*\n`;
      texto += `   ⏱️ Tiempo: \`${res.tiempo_oficial}\`${penTxt}\n`;

      if (res.penalizacion_seg > 0 || (res.observacion && res.observacion !== "Sin observaciones")) {
        observacionesGlobales.push(`• Auto #${res.auto}: ${res.penalizacion_seg > 0 ? `+${res.penalizacion_seg}s ` : ""}${res.observacion}`);
      }
    });

    texto += `\n`;
  }

  if (observacionesGlobales.length > 0) {
    texto += `-----------------------------------------\n`;
    texto += `📋 *Notas del Control:*\n`;
    observacionesGlobales.forEach(obs => texto += `${obs}\n`);
    texto += `\n`;
  }

  texto += `-----------------------------------------\n`;
  texto += `💻 *Central de Cómputos:* Tiempos en vivo.`;

  return texto;
}

// ==============================================================================
// 4. INTEGRACIÓN WHATSAPP BOT CON CONSOLA
// ==============================================================================

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('\n📱 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP PARA VINCULAR EL EVENTO:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n🟢 BOT DE WHATSAPP CONECTADO Y LISTO PARA ENVIAR RESULTADOS.');
});

client.initialize();

// Endpoint para enviar reporte directo a un grupo/chat desde la laptop
app.post('/api/enviar-whatsapp', async (req, res) => {
  const { numero_grupo, tramo_id } = req.body; // Ejemplo numero_grupo: "12036301234567890@g.us" o número con código país

  const mensaje = generarMensajeWhatsApp(tramo_id);
  if (!mensaje) {
    return res.status(400).json({ error: "No hay resultados para enviar." });
  }

  try {
    await client.sendMessage(numero_grupo, mensaje);
    res.json({ status: "OK", message: "Reporte enviado a WhatsApp con éxito" });
  } catch (error) {
    console.error("Error al enviar mensaje por WhatsApp:", error);
    res.status(500).json({ error: "No se pudo enviar el mensaje por WhatsApp" });
  }
});

// ==============================================================================
// 5. INICIALIZACIÓN DEL SERVIDOR
// ==============================================================================

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SERVIDOR CENTRAL DE CÓMPUTOS EJECUTÁNDOSE EN:`);
  console.log(`👉 Local: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});