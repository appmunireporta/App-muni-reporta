// Gestión del mapa Leaflet con vista satelital
const MapMgr = {
  map:     null,
  markers: {},

  init() {
    this.map = L.map("map", {
      center:      APP_CONFIG.mapCenter,
      zoom:        APP_CONFIG.mapZoom,
      zoomControl: false,
      maxZoom:     APP_CONFIG.maxZoom,
      attributionControl: false,
    });

    // Capa satelital ESRI (gratuita, sin API key)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "© Esri" }
    ).addTo(this.map);

    // Capa de etiquetas sobre el satélite
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.85 }
    ).addTo(this.map);

    // Atribución discreta
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addTo(this.map)
      .addAttribution("© Esri · Tiles");

    // Zoom en esquina inferior derecha (deja espacio al FAB)
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    this.map.on("click", e => App.onMapClick(e.latlng));

    return this.map;
  },

  // Crea el icono visual del pin según categoría
  _makeIcon(category) {
    const cfg = CATEGORIES[category] || CATEGORIES.otro;
    return L.divIcon({
      className: "",
      html: `
        <div class="marker-pin" style="background:${cfg.color}">
          <div class="marker-pin-inner">
            <i class="fas ${cfg.icon}"></i>
          </div>
        </div>`,
      iconSize:    [38, 38],
      iconAnchor:  [19, 38],
      popupAnchor: [0, -42],
    });
  },

  addPin(report) {
    if (this.markers[report.id]) return; // ya existe

    const cfg    = CATEGORIES[report.category] || CATEGORIES.otro;
    const marker = L.marker([report.lat, report.lng], {
      icon:       this._makeIcon(report.category),
      riseOnHover: true,
    }).addTo(this.map);

    const shortDesc = report.description.length > 70
      ? report.description.slice(0, 70) + "…"
      : report.description;

    marker.bindPopup(`
      <div class="popup-wrap">
        <div class="popup-cat">
          <i class="fas ${cfg.icon}" style="color:${cfg.color}"></i>
          ${cfg.label}
        </div>
        <div class="popup-desc">${shortDesc || "Sin descripción"}</div>
        <button class="popup-btn" onclick="App.openViewModal('${report.id}')">
          Ver detalles
        </button>
      </div>`, { maxWidth: 240, closeButton: false }
    );

    this.markers[report.id] = marker;
    return marker;
  },

  removePin(id) {
    if (this.markers[id]) {
      this.map.removeLayer(this.markers[id]);
      delete this.markers[id];
    }
  },

  clearAll() {
    Object.values(this.markers).forEach(m => this.map.removeLayer(m));
    this.markers = {};
  },

  flyTo(lat, lng, zoom = 17) {
    this.map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
  },

  setCursor(crosshair) {
    this.map.getContainer().style.cursor = crosshair ? "crosshair" : "";
  },
};
