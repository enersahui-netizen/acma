# 🔌 ACMA v2.3 - SINCRONIZACIÓN OFFLINE Y RESPALDOS

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### **1. ALMACENAMIENTO LOCAL (Celular sin Internet)**

**Tecnología:** localStorage del navegador

**Que guarda:**
- ✅ Partidas en: `localStorage.partidas_local`
- ✅ Llegadas en: `localStorage.llegadas_local`
- ✅ Datos persisten aunque cierres la app
- ✅ No necesita internet

**Ejemplo:**
```javascript
{
  id: 1787444723425,
  auto: "402",
  tramo: "PE-01",
  hora: "13:00:15.023",
  tipo: "partida",
  enviado: false  // ⏳ Pendiente de sincronizar
}
```

---

### **2. SINCRONIZACIÓN AUTOMÁTICA**

**Cada 5 segundos:**
- ✅ Verifica conexión al servidor
- ✅ Si hay conexión → Sincroniza pendientes
- ✅ Marca como `enviado: true` cuando llega al servidor
- ✅ Si no hay conexión → Espera y reintenta

**Flujo:**
```
┌─────────────────────────────────────┐
│ Usuario registra Auto #402          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Se guarda en localStorage (celular) │
│ enviado: false                      │
└──────────────┬──────────────────────┘
               ↓
       ¿Hay internet?
        ↙         ↘
      SÍ          NO
       ↓          ↓
    ONLINE    Espera conexión
       ↓          ↓
    Sincroniza   Datos en
    con          celular
    servidor     ⏳
       ↓          ↓
    enviado:     (reintenta
    true ✅      cada 5 seg)
```

---

### **3. PÁGINA DE RESPALDOS**

**URL:** `/respaldos`

**Que ofrece:**
- ✅ Exportar datos a CSV
- ✅ Guardar respaldo en servidor
- ✅ Descargar respaldos existentes
- ✅ Ver estado de sincronización
- ✅ Datos pendientes en celular
- ✅ Indicador de conexión online/offline

**Funciones:**

```
1. EXPORTAR A CSV
   └─ Selecciona tramo (o TODOS)
   └─ Presiona: "Exportar a CSV"
   └─ Se descarga en celular
   └─ Se guarda en servidor automáticamente

2. DESCARGAR RESPALDOS
   └─ Muestra lista de respaldos guardados
   └─ Botón "Descargar" para cada uno
   └─ Funciona incluso SIN internet (desde caché)

3. VER SINCRONIZACIÓN
   └─ Partidas pendientes: X
   └─ Llegadas pendientes: X
   └─ Estado: ONLINE / OFFLINE

4. LIMPIAR DATOS
   └─ Borra datos locales del celular
   └─ Útil si queda sin espacio
```

---

## 🔄 FLUJO COMPLETO (CON Y SIN INTERNET)

### **Escenario 1: CON INTERNET**

```
┌─────────────────────────────────┐
│ 1. Abre /partida en celular     │
│ 2. Selecciona PE-01             │
│ 3. Ingresa 402                  │
│ 4. Presiona DAR LARGADA         │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Se guarda en localStorage       │
│ {auto: 402, tramo: PE-01...}   │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Sincronización automática        │
│ (cada 5 segundos)              │
│ → Envía al servidor            │
│ → enviado: true ✅             │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ RESULTADO:                      │
│ ✅ En celular: localStorage     │
│ ✅ En servidor: Base de datos   │
│ ✅ En dashboard: Datos vivos    │
└─────────────────────────────────┘
```

### **Escenario 2: SIN INTERNET**

```
┌─────────────────────────────────┐
│ 1. Abre /partida en celular     │
│ 2. NO hay internet              │
│ 3. Registra Auto #402           │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Se guarda en localStorage       │
│ {auto: 402, tramo: PE-01...}   │
│ enviado: false ⏳               │
│                                 │
│ Estado en celular:              │
│ ⏳ 1 partida pendiente          │
└────────────┬────────────────────┘
             ↓
        Vuelve internet
             ↓
┌─────────────────────────────────┐
│ Sincronización automática       │
│ → Detecta conexión             │
│ → Envía dato pendiente         │
│ → enviado: true ✅             │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ RESULTADO:                      │
│ ✅ Dato llegó al servidor      │
│ ✅ Visible en dashboard        │
│ ✅ Sin perder información      │
└─────────────────────────────────┘
```

### **Escenario 3: EXPORTAR RESPALDO (cualquier conexión)**

```
┌─────────────────────────────────┐
│ 1. Abre /respaldos en celular   │
│ 2. Selecciona tramo PE-01       │
│ 3. Presiona "Exportar a CSV"    │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Se genera CSV con datos:        │
│ Auto, Tramo, Hora Partida,      │
│ Hora Llegada, Tiempos, etc      │
└────────────┬────────────────────┘
             ↓
        ¿Hay internet?
        ↙         ↘
      SÍ          NO
       ↓          ↓
   ONLINE    Genera CSV
       ↓      offline
    Se descarga  ↓
    + Guarda en  Se descarga
    servidor  (desde caché)
       ↓          ↓
    Accesible  Accesible
    en        en celular
    Dashboard solamente
```

---

## 📊 ESTADO DE SINCRONIZACIÓN

En `/respaldos` ves:

```
┌─────────────────────────┐
│ DATOS EN CELULAR        │
├─────────────────────────┤
│ Partidas pendientes: 0  │
│ Llegadas pendientes: 2  │ ← Esperando internet
│ Estado: OFFLINE         │ ← Sin conexión
└─────────────────────────┘
```

Si conecta:

```
┌─────────────────────────┐
│ DATOS EN CELULAR        │
├─────────────────────────┤
│ Partidas pendientes: 0  │
│ Llegadas pendientes: 0  │ ← Todo sincronizado
│ Estado: ONLINE          │ ← Conectado
└─────────────────────────┘
```

---

## 🧪 CASOS DE USO

### **Caso 1: Carrera sin Internet**

```
1. Llegas al rally SIN conexión móvil
2. Abre /partida en celular
3. Registra todos los autos
   └─ Se guardan en localStorage ✅
   └─ Sin perder datos

4. Más tarde conecta a WiFi
5. Datos se sincronizan automáticamente ✅
6. Aparecen en Dashboard en vivo
```

### **Caso 2: Generar Respaldo**

```
1. Abre /respaldos
2. Selecciona "PE-01"
3. Presiona "Exportar a CSV"
   └─ Se descarga en celular ✅
   └─ Se guarda en servidor ✅
   
4. Luego abre Dashboard
   └─ Ve respaldo en RESPALDOS EN SERVIDOR
   └─ Puede descargar desde cualquier dispositivo
```

### **Caso 3: Sincronización Lenta**

```
1. Conecta a Internet lento
2. Registra datos
   └─ Se intenta sincronizar
   └─ Si falla por velocidad → reintenta cada 5 seg
   └─ Cuando mejore conexión → sincroniza todo

3. Puedes ver estado en /respaldos
   └─ X registros pendientes
   └─ Espera a sincronizar
```

---

## 📱 PANTALLA DE RESPALDOS COMPLETA

```
┌──────────────────────────────────────┐
│  💾 RESPALDOS Y EXPORTACIÓN          │
├──────────────────────────────────────┤
│                                      │
│  📥 EXPORTAR A CSV Y GUARDAR        │
│  ┌──────────────────────────────┐   │
│  │ Selecciona Tramo:            │   │
│  │ [Todos los Tramos ▼]         │   │
│  └──────────────────────────────┘   │
│  [📥 EXPORTAR A CSV]                 │
│                                      │
├──────────────────────────────────────┤
│  📂 RESPALDOS EN SERVIDOR            │
│  ┌──────────────────────────────┐   │
│  │ 📄 respaldo-PE-01-2026...csv │   │
│  │ [⬇️ Descargar]               │   │
│  │                              │   │
│  │ 📄 respaldo-TODOS-2026...csv │   │
│  │ [⬇️ Descargar]               │   │
│  └──────────────────────────────┘   │
│                                      │
├──────────────────────────────────────┤
│  📱 DATOS EN CELULAR (Offline)       │
│  Partidas pendientes: 0              │
│  Llegadas pendientes: 0              │
│  Estado: ONLINE ✅                   │
│                                      │
├──────────────────────────────────────┤
│  🗑️  LIMPIAR DATOS                    │
│  [❌ LIMPIAR DATOS LOCALES]           │
└──────────────────────────────────────┘
```

---

## 🔧 INSTALACIÓN v2.3

### Archivos nuevos/actualizados:

```
✅ server.js          (con endpoint /api/exportar-excel-respaldo)
✅ partida.html       (con localStorage mejorado)
✅ llegada.html       (con localStorage mejorado)
✅ respaldos.html     (NUEVA - página de respaldos)
✅ index.html         (con enlace a respaldos)
```

### Pasos:

1. Descarga los 5 archivos
2. Copia en tu carpeta local
3. `git add .`
4. `git commit -m "ACMA v2.3 - Sincronización offline y respaldos"`
5. `git push origin master`
6. Espera 2-3 minutos en Render

---

## 🧪 PRUEBAS

### Test 1: Sin Internet
```
1. Abre DevTools → Network → Offline
2. Abre /partida
3. Registra auto
4. Verifica en /respaldos que aparezca "X pendientes"
5. Vuelve a Online
6. Espera 5 segundos
7. Verifica que sincronizó
```

### Test 2: Exportar CSV
```
1. Abre /respaldos
2. Selecciona PE-01
3. Presiona Exportar
4. Debe descargar CSV
5. Debe aparecer en "Respaldos en Servidor"
```

### Test 3: Descarga Sin Internet
```
1. Exporta un respaldo (online)
2. Desactiva internet
3. Abre /respaldos
4. Intenta descargar respaldo anterior
5. Debe funcionar (desde caché)
```

---

**Versión:** ACMA v2.3
**Características:** Sincronización offline, localStorage, respaldos en servidor
**Estado:** ✅ Listo para producción
