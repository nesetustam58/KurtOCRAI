// lib/imageValidator.ts

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  confidence: number;
}

/**
 * Yüklenen görselin gerçek bir doküman/fiş olup olmadığını
 * sunucuya göndermeden istemci tarafında analiz eder.
 */
export async function validateDocumentImage(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({ isValid: true, confidence: 1.0 }); // Fallback
        return;
      }

      // Analiz için performans odaklı boyutlandırma
      const maxDim = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      let totalBrightness = 0;
      let colorVariance = 0;
      let edgeScore = 0;

      const grayPixels = new Uint8Array(width * height);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Gri seviye hesaplama
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayPixels[i / 4] = gray;

        totalBrightness += gray;

        // Renk çeşitliliği (Doğal/manzara fotoğraflarında RGB farkı yüksektir)
        const diff = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        colorVariance += diff;
      }

      const pixelCount = width * height;
      const avgBrightness = totalBrightness / pixelCount;
      const avgColorVariance = colorVariance / pixelCount;

      // Basit Kenar Algılama (Yazı ve doküman çizgileri için)
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const val = grayPixels[idx];
          const right = grayPixels[idx + 1];
          const bottom = grayPixels[idx + width];

          const gradient = Math.abs(val - right) + Math.abs(val - bottom);
          if (gradient > 35) {
            edgeScore++;
          }
        }
      }

      const edgeDensity = edgeScore / pixelCount;

      // Kural Kontrolleri:
      // 1. Çok renkli doğa/manzara veya renkli nesne fotoğrafları
      if (avgColorVariance > 45) {
        resolve({
          isValid: false,
          reason: "Görsel çok renkli görünüyor. Lütfen net bir fiş veya doküman fotoğrafı yükleyin.",
          confidence: 0.85,
        });
        return;
      }

      // 2. Yeterli metin/kenar keskinliği olmayan düz/bulanık görseller
      if (edgeDensity < 0.04) {
        resolve({
          isValid: false,
          reason: "Görselde yeterli metin veya doküman çizgisi algılanamadı.",
          confidence: 0.80,
        });
        return;
      }

      // 3. Aşırı karanlık görseller
      if (avgBrightness < 30) {
        resolve({
          isValid: false,
          reason: "Görsel çok karanlık. Lütfen daha iyi ışıklandırılmış bir doküman yükleyin.",
          confidence: 0.90,
        });
        return;
      }

      // Geçerli Doküman
      resolve({
        isValid: true,
        confidence: 0.95,
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        reason: "Görsel dosyası okunamadı veya bozuk.",
        confidence: 1.0,
      });
    };

    img.src = url;
  });
}