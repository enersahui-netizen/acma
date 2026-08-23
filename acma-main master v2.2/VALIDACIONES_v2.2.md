# 🛡️ ACMA v2.2 - VALIDACIONES COMPLETAS

## ✅ VALIDACIONES IMPLEMENTADAS

### **1. VALIDACIÓN DE AUTO REGISTRADO**

**Donde:** Partida y Llegada

**Que hace:**
- ✅ Verifica que el auto esté registrado en tabla `participantes`
- ✅ Si no existe: Muestra alerta "⚠️ Auto #XXX NO ENCONTRADO"
- ✅ Rechaza el registro y dirige a "REGISTRO DE PARTICIPANTES"

**Ejemplo:**
```
Usuario ingresa: 999
Sistema valida: ¿Existe auto #999 en BD?
Si NO existe:
  ❌ Alerta: "Auto #999 NO ENCONTRADO
             Regístralo en: REGISTRO DE PARTICIPANTES"
  ❌ Se rechaza el registro
  
Si SÍ existe:
  ✅ Se permite continuar
```

---

### **2. VALIDACIÓN DE TRAMO SELECCIONADO**

**Donde:** Partida y Llegada

**Que hace:**
- ✅ Requiere que seleccione un tramo (PE-01 a PE-05)
- ✅ Si no selecciona: Muestra alerta "Selecciona un tramo"
- ✅ Auto-enfoque en select de tramo

**Ejemplo:**
```
Usuario presiona: 🟢 DAR LARGADA
Sin seleccionar tramo
  ❌ Alerta: "Selecciona un tramo"
  ❌ Focus vuelve a selector de tramo

Usuario selecciona: PE-01
Luego presiona: 🟢 DAR LARGADA
  ✅ Se permite continuar
```

---

### **3. VALIDACIÓN DE PARTIDA DUPLICADA**

**Donde:** Endpoint `/api/partida`

**Que hace:**
- ✅ Verifica que NO exista partida previa del mismo auto en el mismo tramo
- ✅ Query: `SELECT FROM registros WHERE auto = ? AND tramo = ? AND tipo = 'partida'`
- ✅ Si existe partida: Rechaza y muestra la hora anterior

**Ejemplo:**
```
Primera vez:
  Auto #402, Tramo PE-01, Hora 13:00:15.023
  ✅ PERMITIDO - Se registra correctamente

Segunda vez (mismo auto, mismo tramo):
  Auto #402, Tramo PE-01, Hora 13:05:42.156
  ❌ RECHAZADO - Alerta:
     "⚠️ Auto #402 YA PARTIÓ en tramo PE-01
      No se permiten partidas duplicadas.
      Hora: 13:00:15.023"
     
  ❌ El registro NO se guarda
  ❌ Se elimina del historial local
```

---

### **4. VALIDACIÓN DE PARTIDA REQUERIDA (para llegada)**

**Donde:** Endpoint `/api/llegada`

**Que hace:**
- ✅ Verifica que EXISTA una partida previa del auto en ese tramo
- ✅ Query: `SELECT FROM registros WHERE auto = ? AND tramo = ? AND tipo = 'partida'`
- ✅ Si NO existe partida: Rechaza la llegada

**Ejemplo:**
```
Intento registrar llegada sin partida:
  Auto #999, Tramo PE-01
  ❌ RECHAZADO - Alerta:
     "⚠️ Auto #999 NO PARTIÓ en tramo PE-01
      No puedes registrar llegada sin partida."

Flujo correcto:
  1. Auto #402 → Partida PE-01 ✅
  2. Auto #402 → Llegada PE-01 ✅
```

---

### **5. VALIDACIÓN DE LLEGADA DUPLICADA**

**Donde:** Endpoint `/api/llegada`

**Que hace:**
- ✅ Verifica que NO exista llegada previa del mismo auto en el mismo tramo
- ✅ Query: `SELECT FROM registros WHERE auto = ? AND tramo = ? AND tipo = 'llegada'`
- ✅ Si existe llegada: Rechaza y muestra la hora anterior

**Ejemplo:**
```
Primera vez:
  Auto #402, Tramo PE-01, Hora 13:03:42.891
  ✅ PERMITIDO - Se registra correctamente

Segunda vez (mismo auto, mismo tramo):
  Auto #402, Tramo PE-01, Hora 13:08:15.234
  ❌ RECHAZADO - Alerta:
     "⚠️ Auto #402 YA LLEGÓ en tramo PE-01
      No se permiten llegadas duplicadas.
      Hora: 13:03:42.891"
     
  ❌ El registro NO se guarda
  ❌ Se elimina del historial local
```

---

## 📊 MATRIZ DE VALIDACIONES

| Validación | Partida | Llegada | Nivel |
|---|---|---|---|
| Auto registrado | ✅ | ✅ | Cliente |
| Tramo seleccionado | ✅ | ✅ | Cliente |
| Partida duplicada | ✅ | - | Servidor |
| Llegada duplicada | - | ✅ | Servidor |
| Partida requerida | - | ✅ | Servidor |

---

## 🔄 FLUJO COMPLETO VALIDADO

```
┌─────────────────────────────────────────┐
│ USUARIO INGRESA EN PARTIDA              │
├─────────────────────────────────────────┤
│ 1. Selecciona TRAMO (PE-01)             │
│    └─ Si no selecciona → ❌ Alerta      │
│                                          │
│ 2. Ingresa Nº AUTO (402)                │
│    └─ Si no existe en BD → ❌ Alerta    │
│                                          │
│ 3. Presiona "🟢 DAR LARGADA"            │
│    └─ Verifica duplicado en servidor    │
│    └─ Si existe → ❌ Alerta + Hora      │
│    └─ Si NO existe → ✅ Registra       │
│       └─ Sincroniza con servidor       │
│       └─ Limpia formulario              │
│       └─ Focus vuelve a input auto      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ USUARIO INGRESA EN LLEGADA              │
├─────────────────────────────────────────┤
│ 1. Selecciona TRAMO (PE-01)             │
│    └─ Si no selecciona → ❌ Alerta      │
│                                          │
│ 2. Ingresa Nº AUTO (402)                │
│    └─ Si no existe en BD → ❌ Alerta    │
│                                          │
│ 3. Presiona "🛑 REGISTRAR LLEGADA"      │
│    └─ Verifica que exista partida       │
│    └─ Si NO existe partida → ❌ Alerta  │
│    └─ Verifica duplicado llegada        │
│    └─ Si existe → ❌ Alerta + Hora      │
│    └─ Si OK → ✅ Registra               │
│       └─ Captura hora automáticamente   │
│       └─ Sincroniza con servidor       │
│       └─ Limpia formulario              │
│       └─ Focus vuelve a input auto      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ DATOS EN DASHBOARD (Tiempo Real)        │
├─────────────────────────────────────────┤
│ Auto #402 - Partida: 13:00:15.023 ✅    │
│ Auto #402 - Llegada:  13:03:42.891 ✅   │
│ Tiempo tramo: 03:27.868                │
└─────────────────────────────────────────┘
```

---

## 🧪 CASOS DE PRUEBA

### **Caso 1: Auto no registrado**
```
1. Abre: /registro-participantes
2. NO carges ningún participante
3. Ve a: /partida
4. Ingresa: 999
5. Presiona: 🟢 DAR LARGADA
✅ Debe mostrar: "Auto #999 NO ENCONTRADO"
```

### **Caso 2: Partida duplicada**
```
1. Registra auto #402
2. En Partida:
   - Selecciona: PE-01
   - Ingresa: 402
   - Presiona: DAR LARGADA ✅
3. Inmediatamente:
   - Selecciona: PE-01
   - Ingresa: 402
   - Presiona: DAR LARGADA
✅ Debe mostrar: "Auto #402 YA PARTIÓ en tramo PE-01"
```

### **Caso 3: Llegada sin partida**
```
1. En Llegada:
   - Selecciona: PE-01
   - Ingresa: 999 (auto sin partida)
   - Presiona: REGISTRAR LLEGADA
✅ Debe mostrar: "Auto #999 NO PARTIÓ en tramo PE-01"
```

### **Caso 4: Llegada duplicada**
```
1. Registra: Partida #402 en PE-01 ✅
2. Registra: Llegada #402 en PE-01 ✅
3. Intenta de nuevo:
   - Selecciona: PE-01
   - Ingresa: 402
   - Presiona: REGISTRAR LLEGADA
✅ Debe mostrar: "Auto #402 YA LLEGÓ en tramo PE-01"
```

### **Caso 5: Sin seleccionar tramo**
```
1. En Partida:
   - NO selecciones tramo
   - Ingresa: 402
   - Presiona: DAR LARGADA
✅ Debe mostrar: "Selecciona un tramo"
```

---

## 🚀 VERSIÓN

**ACMA v2.2 - Validaciones Completas**
- Validación de auto registrado
- Validación de tramo seleccionado
- Validación de partida duplicada
- Validación de llegada duplicada
- Validación de partida requerida

**Fecha:** Agosto 2026
**Estado:** ✅ Listo para producción
