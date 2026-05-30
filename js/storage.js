// Almacenamiento: Firebase (modo producción) o localStorage (modo demo)
const Store = {
  db:        null,
  storageRef:null,
  useLocal:  true,
  _listeners:[],

  init() {
    // Intentar inicializar Firebase si está configurado
    if (!USE_LOCAL_STORAGE && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
      try {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        this.db         = firebase.firestore();
        this.storageRef = firebase.storage().ref();
        this.useLocal   = false;
        console.log("[Store] Firebase activo");
      } catch (err) {
        console.warn("[Store] Firebase falló, usando localStorage:", err);
        this.useLocal = true;
      }
    }

    if (this.useLocal) {
      document.getElementById("demo-banner").classList.remove("hidden");
    }
  },

  // Genera un ID único para cada reporte
  _generateId() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RPT-${ts}-${rand}`;
  },

  // Guarda un reporte con su imagen (si existe)
  async save(data, imageBlob) {
    const id        = this._generateId();
    const timestamp = new Date();
    let   imageUrl  = null;

    if (imageBlob) {
      if (this.useLocal) {
        // Para localStorage usamos un thumbnail pequeño (ahorra espacio)
        const thumb = await Compressor.compress(
          imageBlob,
          APP_CONFIG.thumbWidth,
          APP_CONFIG.thumbHeight,
          APP_CONFIG.thumbQuality
        );
        imageUrl = await Compressor.toDataURL(thumb);
      } else {
        const ref = this.storageRef.child(`reports/${id}/photo.jpg`);
        await ref.put(imageBlob, { contentType: "image/jpeg" });
        imageUrl = await ref.getDownloadURL();
      }
    }

    const report = {
      id,
      ...data,
      imageUrl,
      timestamp:   timestamp.toISOString(),
      timestampMs: timestamp.getTime(),
    };

    if (this.useLocal) {
      const all = this._getLocal();
      all.unshift(report);
      try {
        localStorage.setItem("temuco_reports", JSON.stringify(all));
      } catch {
        // localStorage lleno: eliminar los más antiguos y reintentar
        while (all.length > 20) all.pop();
        localStorage.setItem("temuco_reports", JSON.stringify(all));
      }
    } else {
      await this.db.collection("reports").doc(id).set(report);
    }

    return report;
  },

  // Carga todos los reportes una vez
  async loadAll() {
    if (this.useLocal) return this._getLocal();
    const snap = await this.db
      .collection("reports")
      .orderBy("timestampMs", "desc")
      .limit(300)
      .get();
    return snap.docs.map(d => d.data());
  },

  // Suscripción en tiempo real (Firebase) o carga única (local)
  subscribe(cb) {
    if (this.useLocal) {
      cb(this._getLocal());
      return () => {};
    }
    const unsub = this.db
      .collection("reports")
      .orderBy("timestampMs", "desc")
      .limit(300)
      .onSnapshot(snap => cb(snap.docs.map(d => d.data())));
    return unsub;
  },

  _getLocal() {
    try { return JSON.parse(localStorage.getItem("temuco_reports") || "[]"); }
    catch { return []; }
  },
};
