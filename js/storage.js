// Almacenamiento: Supabase (modo producción) o localStorage (modo demo)
const Store = {
  client:   null,
  useLocal: true,

  init() {
    if (!USE_LOCAL_STORAGE && SUPABASE_CONFIG.url !== "YOUR_SUPABASE_URL") {
      try {
        this.client  = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.useLocal = false;
        console.log("[Store] Supabase activo");
      } catch (err) {
        console.warn("[Store] Supabase falló, usando localStorage:", err);
        this.useLocal = true;
      }
    }

    if (this.useLocal) {
      document.getElementById("demo-banner").classList.remove("hidden");
    }
  },

  _generateId() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RPT-${ts}-${rand}`;
  },

  async save(data, imageBlob) {
    const id        = this._generateId();
    const timestamp = new Date();
    let   imageUrl  = null;

    if (imageBlob) {
      if (this.useLocal) {
        const thumb = await Compressor.compress(
          imageBlob,
          APP_CONFIG.thumbWidth,
          APP_CONFIG.thumbHeight,
          APP_CONFIG.thumbQuality
        );
        imageUrl = await Compressor.toDataURL(thumb);
      } else {
        const path = `reports/${id}/photo.jpg`;
        const { error } = await this.client.storage
          .from("photos")
          .upload(path, imageBlob, { contentType: "image/jpeg" });
        if (error) throw error;
        const { data: urlData } = this.client.storage.from("photos").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
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
        while (all.length > 20) all.pop();
        localStorage.setItem("temuco_reports", JSON.stringify(all));
      }
    } else {
      const { error } = await this.client.from("reports").insert({
        id:           report.id,
        lat:          report.lat,
        lng:          report.lng,
        category:     report.category,
        description:  report.description,
        image_url:    report.imageUrl,
        timestamp:    report.timestamp,
        timestamp_ms: report.timestampMs,
      });
      if (error) throw error;
    }

    return report;
  },

  async loadAll() {
    if (this.useLocal) return this._getLocal();
    const { data, error } = await this.client
      .from("reports")
      .select("*")
      .order("timestamp_ms", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data.map(this._toReport);
  },

  subscribe(cb) {
    if (this.useLocal) {
      cb(this._getLocal());
      return () => {};
    }

    this.loadAll().then(cb);

    const channel = this.client
      .channel("reports-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, async () => {
        const reports = await this.loadAll();
        cb(reports);
      })
      .subscribe();

    return () => this.client.removeChannel(channel);
  },

  _toReport(row) {
    return {
      id:          row.id,
      lat:         row.lat,
      lng:         row.lng,
      category:    row.category,
      description: row.description,
      imageUrl:    row.image_url,
      timestamp:   row.timestamp,
      timestampMs: row.timestamp_ms,
    };
  },

  _getLocal() {
    try { return JSON.parse(localStorage.getItem("temuco_reports") || "[]"); }
    catch { return []; }
  },
};
