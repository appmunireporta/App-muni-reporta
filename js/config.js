// =========================================================
//  TEMUCO REPORTA — Configuración
//
//  Para activar Firebase (almacenamiento compartido entre
//  dispositivos), crea un proyecto en:
//  https://console.firebase.google.com
//
//  Luego reemplaza los valores de FIREBASE_CONFIG y
//  cambia USE_LOCAL_STORAGE a false.
// =========================================================

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// true  → guarda en localStorage (solo este dispositivo, sin configuración)
// false → usa Firebase (requiere credenciales válidas arriba)
const USE_LOCAL_STORAGE = true;

// ── Configuración general de la app ──────────────────────
const APP_CONFIG = {
  mapCenter:    [-38.7359, -72.5904], // Temuco, Chile
  mapZoom:      15,
  maxZoom:      19,

  // Compresión de imágenes
  maxImgWidth:  1280,
  maxImgHeight: 960,
  imgQuality:   0.78,   // 0.1–1.0

  // Modo demo: thumbnail muy pequeño para ahorrar localStorage
  thumbWidth:   480,
  thumbHeight:  360,
  thumbQuality: 0.55,
};

// ── Categorías de problemas ───────────────────────────────
const CATEGORIES = {
  pavimento:     { label: "Pavimento",     icon: "fa-road",           color: "#f59e0b" },
  iluminacion:   { label: "Iluminación",   icon: "fa-lightbulb",      color: "#8b5cf6" },
  veredas:       { label: "Veredas",       icon: "fa-person-walking", color: "#0ea5e9" },
  basura:        { label: "Basura",        icon: "fa-trash-can",      color: "#84cc16" },
  "areas-verdes":{ label: "Áreas Verdes",  icon: "fa-tree",           color: "#22c55e" },
  señalizacion:  { label: "Señalización",  icon: "fa-signs-post",     color: "#f97316" },
  alcantarillado:{ label: "Alcantarillado",icon: "fa-water",          color: "#06b6d4" },
  otro:          { label: "Otro",          icon: "fa-circle-question",color: "#6b7280" },
};
