export interface DocumentClassificationResult {
  docType: 'fis' | 'fatura' | 'kitap' | 'elyazisi';
  confidence: number;
  metadata: {
    aspectRatio: number;
    brightness: number; // 0 - 255
    contrast: number;   // 0 - 255
    estimatedNoiseLevel: number;
  };
  recommendedPipeline: string;
}

export class DocumentClassifier {
  public static async classifyImage(imageDataUrl: string): Promise<DocumentClassificationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = height / (width || 1);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.min(width, 400);
        canvas.height = Math.min(height, 400);

        if (!ctx) {
          resolve(this.getDefaultFallback(aspectRatio));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        let totalBrightness = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
        }

        const avgBrightness = totalBrightness / (pixels.length / 4);

        let varianceSum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          varianceSum += Math.pow(gray - avgBrightness, 2);
        }
        const contrast = Math.sqrt(varianceSum / (pixels.length / 4));

        let docType: 'fis' | 'fatura' | 'kitap' | 'elyazisi' = 'kitap';
        let confidence = 0.85;

        // Karakteristik Oran ve Piksel Dağılım Analizi
        if (aspectRatio >= 1.6) {
          docType = 'fis'; // Dar, uzun dikey yapı (SROIE/CORD benchmark tipi)
          confidence = 0.94;
        } else if (aspectRatio >= 1.2 && aspectRatio < 1.6 && contrast > 55) {
          docType = 'fatura'; // Geniş A4/Tablo formatı (RVL-CDIP tipi)
          confidence = 0.89;
        } else if (contrast < 38) {
          docType = 'elyazisi'; // Düşük kontrast ve serbest hatlı (IAM tipi)
          confidence = 0.82;
        } else {
          docType = 'kitap'; // Standart basılı sayfa / şiir
          confidence = 0.88;
        }

        resolve({
          docType,
          confidence,
          metadata: {
            aspectRatio: Number(aspectRatio.toFixed(2)),
            brightness: Math.round(avgBrightness),
            contrast: Math.round(contrast),
            estimatedNoiseLevel: contrast < 40 ? 0.4 : 0.15
          },
          recommendedPipeline: `${docType.toUpperCase()}_ADAPTIVE_PIPELINE_V1`
        });
      };

      img.onerror = () => resolve(this.getDefaultFallback(1.0));
      img.src = imageDataUrl;
    });
  }

  private static getDefaultFallback(aspectRatio: number): DocumentClassificationResult {
    return {
      docType: aspectRatio > 1.5 ? 'fis' : 'kitap',
      confidence: 0.75,
      metadata: { aspectRatio, brightness: 128, contrast: 50, estimatedNoiseLevel: 0.2 },
      recommendedPipeline: 'DEFAULT_FALLBACK_PIPELINE'
    };
  }
}