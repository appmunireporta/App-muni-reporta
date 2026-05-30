// Controlador principal de la aplicación
const App = {
  reports:         [],
  pendingLatlng:   null,
  selectedCat:     "pavimento",
  currentImgBlob:  null,
  addingPin:       false,
  unsubscribe:     null,

  // ── Inicialización ──────────────────────────────────────
  async init() {
    Store.init();
    MapMgr.init();

    this._setupUI();
    this._bindEvents();

    // Suscribirse a reportes (tiempo real si Firebase, o carga única)
    this.unsubscribe = Store.subscribe(reports => {
      MapMgr.clearAll();
      this.reports = reports;
      reports.forEach(r => MapMgr.addPin(r));
      this._refreshPanelStats();
      if (!document.getElementById("reports-panel").classList.contains("hidden")) {
        this._renderList();
      }
    });

    // Mostrar hint si es primer uso
    if (!localStorage.getItem("tr_hint_seen")) {
      setTimeout(() => {
        document.getElementById("map-hint").classList.remove("hidden");
      }, 1200);
    }

    // Ocultar loading
    setTimeout(() => {
      const ov = document.getElementById("loading-overlay");
      ov.classList.add("fade-out");
      setTimeout(() => ov.remove(), 500);
    }, 900);
  },

  // ── Configuración inicial de UI ─────────────────────────
  _setupUI() {
    // Ocultar botón de voltear cámara en desktop
    if (!Camera.available) {
      document.getElementById("btn-open-camera").style.display = "none";
    }
  },

  // ── Binding de eventos ──────────────────────────────────
  _bindEvents() {
    // FAB
    document.getElementById("fab-add").addEventListener("click", () => this._toggleAddPin());

    // Hint
    document.getElementById("close-hint").addEventListener("click", () => {
      document.getElementById("map-hint").classList.add("hidden");
      localStorage.setItem("tr_hint_seen", "1");
    });

    // Banner demo
    document.getElementById("close-demo-banner").addEventListener("click", () => {
      document.getElementById("demo-banner").classList.add("hidden");
    });

    // Modal nuevo reporte
    document.getElementById("close-modal").addEventListener("click", () => this._closeReportModal());
    document.getElementById("modal-report").addEventListener("click", e => {
      if (e.target === document.getElementById("modal-report")) this._closeReportModal();
    });

    // Categorías
    document.querySelectorAll(".cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-btn").forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        this.selectedCat = btn.dataset.cat;
      });
    });

    // Contador caracteres
    document.getElementById("description").addEventListener("input", e => {
      document.getElementById("char-count").textContent = e.target.value.length;
    });

    // Cámara
    document.getElementById("btn-open-camera").addEventListener("click", () => this._startCamera());
    document.getElementById("btn-flip-camera").addEventListener("click", () => {
      Camera.flip(document.getElementById("camera-video"));
    });
    document.getElementById("btn-capture").addEventListener("click", () => this._capturePhoto());
    document.getElementById("btn-stop-camera").addEventListener("click", () => this._stopCamera());

    // Galería
    document.getElementById("btn-gallery").addEventListener("click", () => {
      document.getElementById("file-input").click();
    });
    document.getElementById("file-input").addEventListener("change", e => {
      if (e.target.files[0]) this._handleImageFile(e.target.files[0]);
    });

    // Quitar imagen
    document.getElementById("btn-remove-image").addEventListener("click", () => this._clearImage());

    // Enviar reporte
    document.getElementById("btn-submit").addEventListener("click", () => this._submitReport());

    // Modal ver reporte
    document.getElementById("close-view-modal").addEventListener("click", () => {
      document.getElementById("modal-view").classList.add("hidden");
    });
    document.getElementById("modal-view").addEventListener("click", e => {
      if (e.target === document.getElementById("modal-view")) {
        document.getElementById("modal-view").classList.add("hidden");
      }
    });

    // Panel de reportes
    document.getElementById("btn-reports-list").addEventListener("click", () => this._showPanel());
    document.getElementById("close-reports-panel").addEventListener("click", () => {
      document.getElementById("reports-panel").classList.add("hidden");
    });

    // Mi ubicación
    document.getElementById("btn-my-location").addEventListener("click", () => this._goToMyLocation());

    // Escape
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        this._closeReportModal();
        document.getElementById("modal-view").classList.add("hidden");
        document.getElementById("reports-panel").classList.add("hidden");
        if (this.addingPin) this._toggleAddPin();
      }
    });
  },

  // ── Mapa: click ────────────────────────────────────────
  onMapClick(latlng) {
    if (!this.addingPin) return;
    this._toggleAddPin();
    this._openReportModal(latlng);
  },

  // ── Modo agregar pin ────────────────────────────────────
  _toggleAddPin() {
    this.addingPin = !this.addingPin;
    const fab   = document.getElementById("fab-add");
    const icon  = document.getElementById("fab-icon");
    const label = document.getElementById("fab-label");
    const ind   = document.getElementById("adding-pin-indicator");
    const hint  = document.getElementById("map-hint");

    if (this.addingPin) {
      fab.classList.add("cancel-mode");
      icon.className = "fas fa-times";
      label.textContent = "Cancelar";
      label.classList.add("visible");
      ind.classList.remove("hidden");
      hint.classList.add("hidden");
      MapMgr.setCursor(true);
      this._toast("Toca el mapa donde está el problema", "info");
    } else {
      fab.classList.remove("cancel-mode");
      icon.className = "fas fa-plus";
      label.textContent = "Agregar reporte";
      label.classList.remove("visible");
      ind.classList.add("hidden");
      MapMgr.setCursor(false);
    }
  },

  // ── Modal: nuevo reporte ────────────────────────────────
  _openReportModal(latlng) {
    this.pendingLatlng  = latlng;
    this.currentImgBlob = null;

    document.getElementById("coord-text").textContent =
      `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;

    document.getElementById("description").value = "";
    document.getElementById("char-count").textContent = "0";

    // Reset categoría
    document.querySelectorAll(".cat-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    const first = document.querySelector('[data-cat="pavimento"]');
    first.classList.add("active");
    first.setAttribute("aria-pressed", "true");
    this.selectedCat = "pavimento";

    this._clearImage();
    document.getElementById("modal-report").classList.remove("hidden");

    setTimeout(() => document.getElementById("description").focus(), 350);
  },

  _closeReportModal() {
    this._stopCamera();
    document.getElementById("modal-report").classList.add("hidden");
    this.pendingLatlng = null;
    if (this.addingPin) this._toggleAddPin();
  },

  // ── Cámara ──────────────────────────────────────────────
  async _startCamera() {
    if (!Camera.available) {
      this._toast("Cámara no disponible en este navegador", "error");
      return;
    }

    document.getElementById("camera-section").classList.remove("hidden");
    document.getElementById("image-actions").classList.add("hidden");

    const ok = await Camera.start(document.getElementById("camera-video"));
    if (!ok) {
      document.getElementById("camera-section").classList.add("hidden");
      document.getElementById("image-actions").classList.remove("hidden");
      this._toast("No se pudo acceder a la cámara. Verifica los permisos.", "error");
    }
  },

  async _capturePhoto() {
    const blob = await Camera.capture(document.getElementById("camera-video"));
    this._stopCamera();
    await this._handleImageFile(blob);
  },

  _stopCamera() {
    Camera.stop();
    document.getElementById("camera-section").classList.add("hidden");
    if (!this.currentImgBlob) {
      document.getElementById("image-actions").classList.remove("hidden");
    }
  },

  // ── Imagen ──────────────────────────────────────────────
  async _handleImageFile(file) {
    this._toast("Comprimiendo imagen…", "info");
    try {
      const blob = await Compressor.compress(
        file,
        APP_CONFIG.maxImgWidth,
        APP_CONFIG.maxImgHeight,
        APP_CONFIG.imgQuality
      );

      this.currentImgBlob = blob;
      const url = URL.createObjectURL(blob);

      document.getElementById("image-preview").src = url;
      document.getElementById("image-size-label").textContent =
        `JPEG · ${Compressor.formatSize(blob.size)}`;
      document.getElementById("image-preview-wrap").classList.remove("hidden");
      document.getElementById("image-actions").classList.add("hidden");
    } catch {
      this._toast("Error al procesar la imagen", "error");
    }
  },

  _clearImage() {
    this.currentImgBlob = null;
    const preview = document.getElementById("image-preview");
    if (preview.src) URL.revokeObjectURL(preview.src);
    preview.src = "";
    document.getElementById("image-preview-wrap").classList.add("hidden");
    document.getElementById("image-actions").classList.remove("hidden");
    document.getElementById("camera-section").classList.add("hidden");
    document.getElementById("file-input").value = "";
    Camera.stop();
  },

  // ── Envío del reporte ───────────────────────────────────
  async _submitReport() {
    const desc = document.getElementById("description").value.trim();

    if (!desc && !this.currentImgBlob) {
      this._toast("Agrega una descripción o una foto del problema", "error");
      return;
    }

    if (!this.pendingLatlng) {
      this._toast("Error: no se seleccionó ubicación", "error");
      return;
    }

    const btn = document.getElementById("btn-submit");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando…';

    try {
      const report = await Store.save(
        {
          lat:         this.pendingLatlng.lat,
          lng:         this.pendingLatlng.lng,
          category:    this.selectedCat,
          description: desc || "Sin descripción",
        },
        this.currentImgBlob
      );

      this.reports.unshift(report);
      MapMgr.addPin(report);
      this._closeReportModal();
      this._toast("¡Reporte enviado correctamente!", "success");
      MapMgr.flyTo(report.lat, report.lng);

    } catch (err) {
      console.error("[Submit]", err);
      this._toast("No se pudo enviar el reporte. Intenta de nuevo.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Enviar Reporte</span>';
    }
  },

  // ── Modal: ver reporte ──────────────────────────────────
  openViewModal(id) {
    const r   = this.reports.find(x => x.id === id);
    if (!r) return;

    const cfg = CATEGORIES[r.category] || CATEGORIES.otro;
    MapMgr.map.closePopup();

    document.getElementById("view-title").innerHTML =
      `<i class="fas ${cfg.icon}" style="color:${cfg.color}"></i> ${cfg.label}`;

    const date = new Date(r.timestamp);
    document.getElementById("view-date").textContent =
      date.toLocaleDateString("es-CL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

    document.getElementById("view-coords").textContent =
      `${r.lat.toFixed(6)}, ${r.lng.toFixed(6)}`;

    document.getElementById("view-description").textContent = r.description;
    document.getElementById("view-id").textContent = r.id;

    const imgWrap = document.getElementById("view-img-wrap");
    if (r.imageUrl) {
      document.getElementById("view-img").src = r.imageUrl;
      imgWrap.classList.remove("hidden");
    } else {
      imgWrap.classList.add("hidden");
    }

    document.getElementById("modal-view").classList.remove("hidden");
  },

  // ── Panel de lista ──────────────────────────────────────
  _showPanel() {
    this._renderList();
    document.getElementById("reports-panel").classList.remove("hidden");
  },

  _renderList() {
    const list = document.getElementById("reports-list");

    if (this.reports.length === 0) {
      list.innerHTML = `
        <div class="reports-empty">
          <i class="fas fa-map-marker-alt"></i>
          <p>Aún no hay reportes.<br>¡Sé el primero en reportar<br>un problema en tu barrio!</p>
        </div>`;
      return;
    }

    list.innerHTML = this.reports.map(r => {
      const cfg  = CATEGORIES[r.category] || CATEGORIES.otro;
      const date = new Date(r.timestamp).toLocaleDateString("es-CL", {
        day: "numeric", month: "short", year: "numeric",
      });
      const thumb = r.imageUrl
        ? `<img class="report-card-thumb" src="${r.imageUrl}" alt="Foto" loading="lazy">`
        : "";

      return `
        <div class="report-card" role="listitem" onclick="App._selectFromPanel('${r.id}')">
          <div class="report-card-icon" style="background:${cfg.color}22;color:${cfg.color}">
            <i class="fas ${cfg.icon}"></i>
          </div>
          <div class="report-card-body">
            <div class="report-card-title">${cfg.label}</div>
            <div class="report-card-date">${date}</div>
            <div class="report-card-desc">${r.description || "Sin descripción"}</div>
          </div>
          ${thumb}
        </div>`;
    }).join("");
  },

  _refreshPanelStats() {
    const stats = document.getElementById("panel-stats");
    const total = this.reports.length;
    if (total === 0) { stats.textContent = ""; return; }
    stats.textContent = `${total} reporte${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`;
  },

  _selectFromPanel(id) {
    document.getElementById("reports-panel").classList.add("hidden");
    const r = this.reports.find(x => x.id === id);
    if (!r) return;
    MapMgr.flyTo(r.lat, r.lng);
    setTimeout(() => {
      const m = MapMgr.markers[id];
      if (m) m.openPopup();
    }, 900);
  },

  // ── Geolocalización ─────────────────────────────────────
  _goToMyLocation() {
    if (!navigator.geolocation) {
      this._toast("Geolocalización no disponible", "error");
      return;
    }
    this._toast("Buscando tu ubicación…", "info");
    navigator.geolocation.getCurrentPosition(
      pos => {
        MapMgr.flyTo(pos.coords.latitude, pos.coords.longitude, 17);
        this._toast("¡Ubicación encontrada!", "success");
      },
      () => this._toast("No se pudo obtener la ubicación", "error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  },

  // ── Toast ────────────────────────────────────────────────
  _toast(msg, type = "info") {
    document.querySelectorAll(".toast").forEach(t => t.remove());

    const icons = {
      info:    "fa-circle-info",
      success: "fa-circle-check",
      error:   "fa-circle-exclamation",
    };

    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${msg}`;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3300);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
