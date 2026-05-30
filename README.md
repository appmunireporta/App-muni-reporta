# Temuco Reporta 🏙️

Aplicación web para reportar problemas de infraestructura urbana en Temuco,
directamente al mapa satelital de la ciudad.

## Características

- 🗺️ Mapa satelital centrado en Temuco (ESRI, sin costo ni API key)
- 📍 Toca el mapa para agregar un pin de reporte
- 📷 Toma foto directamente desde la cámara del teléfono
- 🗜️ Compresión automática de imágenes (ahorra datos móviles)
- 📋 8 categorías de problemas urbanos
- 📌 Cada reporte se asocia a coordenadas GPS exactas y un ID único
- 📱 Diseño optimizado para teléfonos móviles
- 🔄 Modo demo local (sin configuración) + modo Firebase (compartido)

---

## Publicar en GitHub Pages (modo demo)

1. Crea un repositorio en GitHub (puede ser público o privado con Pages activado)
2. Sube todos los archivos de este proyecto
3. Ve a **Settings → Pages → Source → Deploy from a branch → main / root**
4. En 1-2 minutos tendrás la URL: `https://TU_USUARIO.github.io/TU_REPO/`

En modo demo los reportes se guardan en el navegador de cada persona (localStorage).
Para que todos los reportes sean visibles entre dispositivos, configura Firebase (ver abajo).

---

## Activar Firebase (modo producción)

Esto permite que los reportes sean compartidos entre todos los usuarios y
la municipalidad pueda verlos desde cualquier dispositivo.

### 1. Crear proyecto Firebase

1. Ir a https://console.firebase.google.com
2. Clic en **Agregar proyecto** → sigue el asistente
3. Desactiva Google Analytics si no lo necesitas

### 2. Activar Firestore

1. En el menú izquierdo: **Firestore Database → Crear base de datos**
2. Elige **Modo de producción**
3. Selecciona la región más cercana (ej: `us-east1` o `southamerica-east1`)

### 3. Activar Firebase Storage

1. En el menú izquierdo: **Storage → Comenzar**
2. Acepta las reglas predeterminadas

### 4. Configurar reglas de seguridad

En **Firestore → Reglas**, pega esto (permite escritura pública, lectura pública):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow read:  if true;
      allow write: if true;  // cambiar a autenticación cuando sea necesario
    }
  }
}
```

En **Storage → Reglas**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{allPaths=**} {
      allow read:  if true;
      allow write: if request.resource.size < 5 * 1024 * 1024;  // max 5 MB
    }
  }
}
```

### 5. Obtener credenciales

1. Ve a **Configuración del proyecto** (ícono ⚙️) → **General**
2. En "Tus apps", clic en `</>` (Web)
3. Registra la app, copia el objeto `firebaseConfig`

### 6. Pegar credenciales en el código

Abre `js/config.js` y reemplaza `FIREBASE_CONFIG` con tus datos:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIza...",
  authDomain:        "mi-proyecto.firebaseapp.com",
  projectId:         "mi-proyecto",
  storageBucket:     "mi-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};

const USE_LOCAL_STORAGE = false;  // ← cambiar a false
```

7. Guarda, sube los cambios a GitHub y GitHub Pages se actualizará automáticamente.

---

## Estructura de archivos

```
├── index.html          Página principal
├── css/
│   └── style.css       Estilos (mobile-first)
├── js/
│   ├── config.js       Configuración Firebase y app
│   ├── compress.js     Compresión de imágenes (Canvas API)
│   ├── camera.js       Acceso a cámara (getUserMedia)
│   ├── storage.js      Almacenamiento (Firebase o localStorage)
│   ├── map.js          Mapa Leaflet con satélite ESRI
│   └── app.js          Controlador principal
└── README.md
```

## Estructura de un reporte en la base de datos

```json
{
  "id":          "RPT-M5K2A3-X7Q1",
  "lat":         -38.739012,
  "lng":         -72.593847,
  "category":    "pavimento",
  "description": "Bache profundo, calle sin iluminación",
  "imageUrl":    "https://...",
  "timestamp":   "2025-06-15T14:30:00.000Z",
  "timestampMs": 1718462200000
}
```

## Categorías disponibles

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `pavimento` | Pavimento | Baches, grietas, calzada deteriorada |
| `iluminacion` | Iluminación | Postes sin luz, alumbrado deficiente |
| `veredas` | Veredas | Aceras dañadas, rampas obstruidas |
| `basura` | Basura | Micro basurales, contenedores llenos |
| `areas-verdes` | Áreas Verdes | Plazas descuidadas, árboles caídos |
| `señalizacion` | Señalización | Señales dañadas o faltantes |
| `alcantarillado` | Alcantarillado | Tapas rotas, desborde de aguas |
| `otro` | Otro | Cualquier otro problema |

---

*Desarrollado para la comunidad de Temuco, Chile.*
