// Manejo de cámara con getUserMedia
const Camera = {
  stream:      null,
  facingMode:  "environment", // cámara trasera por defecto

  get available() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  async start(videoEl) {
    this.stop(); // detener stream anterior si existe

    const constraints = {
      video: {
        facingMode: { ideal: this.facingMode },
        width:  { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      this.stream       = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = this.stream;
      await videoEl.play();
      return true;
    } catch (err) {
      // Fallback sin restricción de facingMode
      try {
        this.stream       = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoEl.srcObject = this.stream;
        await videoEl.play();
        return true;
      } catch {
        return false;
      }
    }
  },

  flip(videoEl) {
    this.facingMode = this.facingMode === "environment" ? "user" : "environment";
    return this.start(videoEl);
  },

  // Captura el frame actual del video como Blob JPEG
  capture(videoEl) {
    const canvas = document.createElement("canvas");
    canvas.width  = videoEl.videoWidth  || 1280;
    canvas.height = videoEl.videoHeight || 720;

    const ctx = canvas.getContext("2d");

    // Espejo horizontal si es cámara frontal
    if (this.facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    return new Promise(resolve =>
      canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.92)
    );
  },

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },
};
