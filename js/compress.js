// Compresión de imágenes usando Canvas API
const Compressor = {

  // Comprime un File/Blob al tamaño y calidad indicados
  compress(source, maxW, maxH, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let objectUrl = null;

      img.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        let { naturalWidth: w, naturalHeight: h } = img;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);

        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled  = true;
        ctx.imageSmoothingQuality  = "high";
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error("toBlob failed")),
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      if (source instanceof Blob) {
        objectUrl = URL.createObjectURL(source);
        img.src   = objectUrl;
      } else {
        img.src = source; // data URL o URL externa
      }
    });
  },

  // Convierte un Blob a data URL (base64)
  toDataURL(blob) {
    return new Promise(resolve => {
      const reader  = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(blob);
    });
  },

  // Formato legible del tamaño en bytes
  formatSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
};
