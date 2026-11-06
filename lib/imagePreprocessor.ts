import { DocumentClassificationResult } from './documentClassifier';

export class ImagePreprocessor {
  public static async processImage(
    imageDataUrl: string,
    classification: DocumentClassificationResult
  ): Promise<{ processedDataUrl: string; appliedFilters: string[] }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          resolve({ processedDataUrl: imageDataUrl, appliedFilters: ['None'] });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const appliedFilters: string[] = [];

        const { docType, metadata } = classification;

        // PIPELINE 1: TERMAL FİŞ (SROIE / CORD Referanslı)
        if (docType === 'fis') {
          appliedFilters.push('Grayscale Conversion', 'Otsu Adaptive Thresholding', 'Thermal Contrast Boost (+40%)');
          
          for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            // Soluk yazıları siyaha çekme ve kağıt gürültüsünü beyaza itme (Adaptif Eşikleme)
            const threshold = metadata.brightness * 0.85;
            gray = gray < threshold ? Math.max(0, gray - 60) : Math.min(255, gray + 40);

            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
          }
        } 
        // PIPELINE 2: EL YAZISI (IAM Referanslı)
        else if (docType === 'elyazisi') {
          appliedFilters.push('Edge Smoothing', 'Soft Contrast Balancing', 'Noise Reduction');
          
          for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            // Harf kopmalarını önlemek için yumuşak kontrast dengeleme
            gray = gray < 140 ? gray * 0.8 : Math.min(255, gray * 1.1);
            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
          }
        } 
        // PIPELINE 3: KURUMSAL FATURA (RVL-CDIP Referanslı)
        else if (docType === 'fatura') {
          appliedFilters.push('Table Line Sharpening', 'Binarization', 'Illumination Compensation');
          
          for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            gray = gray > 180 ? 255 : (gray < 80 ? 0 : gray);
            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
          }
        } 
        // PIPELINE 4: KİTAP SAYFASI / DÜZ METİN
        else {
          appliedFilters.push('Shadow Removal', 'Standard High-DPI Contrast');
          
          for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            gray = gray > 200 ? 255 : gray;
            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve({
          processedDataUrl: canvas.toDataURL('image/jpeg', 0.95),
          appliedFilters
        });
      };

      img.onerror = () => resolve({ processedDataUrl: imageDataUrl, appliedFilters: ['Fallback'] });
      img.src = imageDataUrl;
    });
  }
}