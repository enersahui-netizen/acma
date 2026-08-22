# 🏁 ACMA - Sistema de Toma de Tiempos Rally v2.0

Sistema profesional para gestión de partidas, llegadas y análisis de tiempos en competencias rally.

## ✨ Cambios en v2.0

### Nuevas Características
- ✅ **Base de datos persistente** (SQLite)
- ✅ **Autenticación segura** con JWT
- ✅ **WebSockets** para actualización en tiempo real
- ✅ **Nuevos campos**: Piloto, Copiloto, Juez, Representante, Ciudad
- ✅ **Reportes avanzados** con tiempos por tramo y acumulados
- ✅ **Filtros dinámicos** por categoría, ciudad, tramo
- ✅ **Dashboard mejorado** con mejor UX/UI
- ✅ **Mejor validación** y manejo de errores

---

## 📋 Requisitos

- **Node.js** 14+ y npm
- **Conexión a internet** (para Render o similar)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

---

## 🚀 Instalación Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```

El servidor estará disponible en `http://localhost:10000`

### 3. Acceder a la aplicación
- **Inicio**: http://localhost:10000
- **Partidas**: http://localhost:10000/partida
- **Llegadas**: http://localhost:10000/llegada
- **Dashboard**: http://localhost:10000/login
  - Usuario: `admin`
  - Contraseña: `admin123`
- **Reportes**: http://localhost:10000/reporte

---

## 🌐 Deployment en Render

### 1. Preparar repositorio Git
```bash
git init
git add .
git commit -m "ACMA v2.0 - Sistema de tiempos"
git remote add origin https://github.com/tu-usuario/acma-tiempos.git
git push -u origin main
```

### 2. Crear proyecto en Render
1. Ir a https://render.com
2. Crear nueva "Web Service"
3. Conectar repositorio Git
4. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free (o superior)

### 3. Configurar variables de entorno (opcional)
```
JWT_SECRET=tu-clave-secreta-aqui
PORT=10000
```

### 4. Desplegar
Render iniciará automáticamente el deployment. Tu URL será algo como:
```
https://acma-tiempos.onrender.com
```

---

## 📱 Uso del Sistema

### 🟢 JUEZ DE PARTIDA
1. Accede a `/partida`
2. Completa **todos** los campos obligatorios:
   - Nº Vehículo
   - Tramo
   - Categoría
   - Juez
   - Piloto
   - Representante
   - Ciudad
3. Haz clic en "🟢 DAR LARGADA"
4. Los datos se sincronizan automáticamente (Online/Offline)
5. Al finalizar el tramo: "📦 FINALIZAR TRAMO"
   - Se descarga Excel localmente
   - Se respalda en servidor

### 🛑 JUEZ DE LLEGADA
1. Accede a `/llegada`
2. Completa **campos críticos**:
   - Nº Vehículo *
   - Tramo *
   - Juez *
   - (Otros datos opcionales)
3. Haz clic en "🛑 REGISTRAR LLEGADA"
4. Hora se captura automáticamente con precisión de milisegundos
5. Finaliza el tramo cuando terminen todos los vehículos

### 💻 DASHBOARD DIRECTOR
1. Accede a `/login`
2. Inicia sesión:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Monitorea en tiempo real:
   - Partidas registradas
   - Llegadas registradas
   - Descarga respaldos Excel
4. Usa filtros para segmentar por:
   - Tramo
   - Ciudad
   - Categoría

### 📊 REPORTES
1. Accede a `/reporte`
2. Selecciona filtros (opcional):
   - Categoría
   - Ciudad
   - Tramo
   - Nº Auto específico
3. Visualiza tres vistas:
   - **Por Tramo**: Ranking en cada tramo
   - **Tiempos Acumulados**: Ranking final
   - **Competidores**: Listado completo
4. Exporta a Excel desde el botón "📥 Exportar a Excel"

---

## 🔐 Seguridad

### Credenciales Predeterminadas
```
Usuario: admin
Contraseña: admin123
```

⚠️ **CAMBIAR INMEDIATAMENTE EN PRODUCCIÓN**

### Para crear nuevos usuarios
1. Accede a la base de datos `acma.db`
2. Inserta en tabla `usuarios`:
```sql
INSERT INTO usuarios (username, password_hash, rol)
VALUES ('juez1', '[bcrypt_hash]', 'juez');
```

### Generar hash de contraseña (Node.js)
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password_aqui', 10);
console.log(hash);
```

---

## 📊 Estructura de Base de Datos

### Tabla: `usuarios`
```
id (INTEGER)
username (TEXT, UNIQUE)
password_hash (TEXT)
rol (TEXT) - 'director' o 'juez'
created_at (DATETIME)
```

### Tabla: `registros`
```
id (INTEGER)
tipo (TEXT) - 'partida' o 'llegada'
auto (TEXT)
tramo (TEXT)
hora (TEXT)
categoria (TEXT)
piloto (TEXT)
copiloto (TEXT)
juez (TEXT)
representante (TEXT)
ciudad (TEXT)
enviado (BOOLEAN)
created_at (DATETIME)
```

---

## 🔧 Troubleshooting

### "No se conecta al servidor"
- Verificar que el servidor esté corriendo: `npm start`
- Revisar URL: http://localhost:10000 (local) o https://acma-tiempos.onrender.com (Render)
- Comprobar firewall/proxy

### "No se sincroniza offline"
- Los datos se guardan en `localStorage` del navegador
- Se sincronizan automáticamente cuando hay conexión
- Revisar consola (F12) para errores

### "Reportes sin datos"
- Asegúrate que hay partidas Y llegadas registradas en el mismo tramo
- El sistema necesita ambas para calcular tiempos
- Filtros pueden estar muy restrictivos

### "Base de datos no se crea"
- SQLite crea `acma.db` automáticamente en primera ejecución
- Verificar permisos de carpeta
- En Render, el archivo se crea en el volumen persistente

---

## 📁 Estructura de Archivos

```
acma-tiempos/
├── server.js              # Servidor Node.js (Express + SQLite + WebSockets)
├── package.json           # Dependencias
├── acma.db                # Base de datos SQLite (se crea automáticamente)
├── respaldos/             # Carpeta de respaldos .xlsx (se crea automáticamente)
├── public/
│   ├── index.html         # Página principal
│   ├── partida.html       # Juez de partida
│   ├── llegada.html       # Juez de llegada
│   ├── laptop.html        # Dashboard director (requiere login)
│   ├── login.html         # Página de autenticación
│   ├── reporte.html       # Reportes y análisis
│   └── README.md          # Esta guía
```

---

## 🚀 Optimizaciones Futuras

- Gráficas interactivas de velocidades
- Sistema de penalizaciones
- Exportación a PDF
- Soporte multi-idioma
- Notificaciones en tiempo real
- QR para escaneo rápido de vehículos
- App móvil nativa

---

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Revisar consola del navegador (F12)
2. Verificar logs del servidor
3. Probar en navegador diferente
4. Limpiar cache: Ctrl+Shift+Supr

---

## 📄 Licencia

ACMA © 2026 - Sistema de Toma de Tiempos

Última actualización: Enero 2026
