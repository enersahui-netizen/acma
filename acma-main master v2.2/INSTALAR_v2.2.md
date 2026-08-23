# 🚀 INSTALAR ACMA v2.2 - PASO A PASO

## 📥 ARCHIVOS A DESCARGAR

Descarga estos archivos de `outputs`:

```
✅ server.js (ACTUALIZADO - con validaciones)
✅ partida.html (ACTUALIZADO - con validaciones)
✅ llegada.html (ACTUALIZADO - con validaciones)
✅ VALIDACIONES_v2.2.md (NUEVA DOCUMENTACIÓN)
```

---

## 📁 PASO 1: COPIAR ARCHIVOS A TU CARPETA LOCAL

En tu PC (Windows):

```
D:\SistemaCronometraje\
│
├── server.js ← REEMPLAZAR (nuevo)
│
└── public\
    ├── partida.html ← REEMPLAZAR (nuevo)
    ├── llegada.html ← REEMPLAZAR (nuevo)
    ├── index.html (no cambiar)
    ├── login.html (no cambiar)
    ├── laptop.html (no cambiar)
    ├── reporte.html (no cambiar)
    └── registro-participantes.html (no cambiar)
```

---

## 🔧 PASO 2: SUBIR A GITHUB (PowerShell)

Abre PowerShell como Administrador en tu carpeta:

```powershell
# Ir a tu carpeta del proyecto
cd D:\SistemaCronometraje

# Ver estado de cambios
git status

# Agregar TODOS los cambios
git add .

# Crear commit con mensaje
git commit -m "ACMA v2.2 - Validaciones completas (auto registrado, tramo, duplicados)"

# Subir a GitHub
git push origin master
```

**Esperado:**
```
[master abc123] ACMA v2.2 - Validaciones completas...
 3 files changed, 250 insertions(+), 150 deletions(-)
```

---

## ⏳ PASO 3: ESPERAR A RENDER (2-3 minutos)

Render redeploy automáticamente.

Verificar en:
```
https://acma-baf9.onrender.com/
```

---

## 🧪 PASO 4: PROBAR VALIDACIONES

### **Test 1: Auto no registrado**
1. Abre: `https://acma-baf9.onrender.com/partida`
2. Selecciona: PE-01
3. Ingresa: 999 (no existe)
4. Presiona: 🟢 DAR LARGADA
```
✅ ESPERADO:
   ⚠️ Auto #999 NO ENCONTRADO
   Regístralo en: REGISTRO DE PARTICIPANTES
```

### **Test 2: Sin seleccionar tramo**
1. Abre: `https://acma-baf9.onrender.com/partida`
2. Ingresa: 402
3. NO selecciones tramo
4. Presiona: 🟢 DAR LARGADA
```
✅ ESPERADO:
   Selecciona un tramo
```

### **Test 3: Partida duplicada**
1. Registra participante #402 en `/registro-participantes`
2. Abre: `/partida`
3. Selecciona: PE-01
4. Ingresa: 402
5. Presiona: 🟢 DAR LARGADA
```
✅ Primera vez: PERMITIDO
```

6. Selecciona: PE-01
7. Ingresa: 402 (de nuevo)
8. Presiona: 🟢 DAR LARGADA
```
✅ ESPERADO:
   ⚠️ Auto #402 YA PARTIÓ en tramo PE-01
   No se permiten partidas duplicadas.
   Hora: 13:00:15.023
```

### **Test 4: Llegada sin partida**
1. Abre: `/llegada`
2. Selecciona: PE-01
3. Ingresa: 999 (nunca partió)
4. Presiona: 🛑 REGISTRAR LLEGADA
```
✅ ESPERADO:
   ⚠️ Auto #999 NO PARTIÓ en tramo PE-01
   No puedes registrar llegada sin partida.
```

### **Test 5: Llegada duplicada**
1. Registra: Partida #402 en PE-01 ✅
2. Registra: Llegada #402 en PE-01 ✅
3. Intenta de nuevo:
   - Selecciona: PE-01
   - Ingresa: 402
   - Presiona: 🛑 REGISTRAR LLEGADA
```
✅ ESPERADO:
   ⚠️ Auto #402 YA LLEGÓ en tramo PE-01
   No se permiten llegadas duplicadas.
   Hora: 13:03:42.891
```

---

## ✅ CHECKLIST

- [ ] Descargué los 4 archivos
- [ ] Copié server.js a raíz
- [ ] Copié partida.html a public/
- [ ] Copié llegada.html a public/
- [ ] Ejecuté: `git add .`
- [ ] Ejecuté: `git commit -m "..."`
- [ ] Ejecuté: `git push origin master`
- [ ] Esperé 2-3 minutos
- [ ] Probé Test 1 (auto no registrado)
- [ ] Probé Test 2 (sin tramo)
- [ ] Probé Test 3 (partida duplicada)
- [ ] Probé Test 4 (llegada sin partida)
- [ ] Probé Test 5 (llegada duplicada)
- [ ] ¡Todo funciona! ✅

---

## 🎯 RESUMEN DE CAMBIOS

### server.js
- ✅ Validación de partida duplicada
- ✅ Validación de llegada duplicada
- ✅ Validación de partida requerida (para llegada)
- ✅ Manejo de errores mejorado

### partida.html
- ✅ Selector de tramo (PE-01 a PE-05)
- ✅ Validación de auto registrado
- ✅ Validación de tramo seleccionado
- ✅ Manejo de errores con alertas

### llegada.html
- ✅ Selector de tramo (PE-01 a PE-05)
- ✅ Validación de auto registrado
- ✅ Validación de tramo seleccionado
- ✅ Manejo de errores con alertas

---

## 📊 VALIDACIONES IMPLEMENTADAS

| Validación | Tipo | Nivel |
|---|---|---|
| Auto registrado en BD | Bloqueador | Cliente |
| Tramo seleccionado | Bloqueador | Cliente |
| Partida duplicada | Bloqueador | Servidor |
| Llegada duplicada | Bloqueador | Servidor |
| Partida requerida | Bloqueador | Servidor |

---

## 🆘 SI ALGO NO FUNCIONA

### PowerShell no reconoce git
```powershell
# Verificar que Git esté instalado
git --version

# Si no aparece nada, instalar desde:
# https://git-scm.com/download/win
```

### Error: "working directory is dirty"
```powershell
# Ver qué cambios hay
git status

# Agregar TODO
git add .

# Intentar de nuevo
git commit -m "Mensaje"
git push origin master
```

### Error: "rejected... non-fast-forward"
```powershell
# Traer cambios del servidor
git pull origin master

# Luego hacer push
git push origin master
```

---

**¡Listo! Ahora ejecuta los comandos en PowerShell en tu PC** 🚀
