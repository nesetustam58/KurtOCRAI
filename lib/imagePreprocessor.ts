import type { DocumentClassificationResult } from './documentClassifier';

/**
 * DOM'a bağımlı olmayan minimal piksel arabelleği arayüzü.
 * Tarayıcıdaki `ImageData` bu arayüzü doğrudan karşılar; böylece çekirdek algoritmalar
 * Web Worker / OffscreenCanvas içinde de değişiklik yapmadan çalışır.
 */
export interface PixelBuffer {
  /** RGBA, satır sıralı (width * height * 4) */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ThermalReceiptOptions {
  // ---- Ölçekleme (yalnızca processImage içinde, Canvas aşamasında uygulanır) ----
  /** Uzun kenar bu değeri aşarsa küçültülür (bellek/performans koruması). */
  maxDimension: number;
  /** Kısa kenar bu değerin altındaysa büyütülür (ince harf çizgilerini korumak için). */
  minShortSide: number;
  /** Maksimum büyütme katsayısı. */
  maxUpscale: number;

  // ---- Aydınlatma / kontrast ----
  /** Elle tutma gölgelerini ve eşitsiz ışığı arka plan kestirimiyle düzeltir. */
  illuminationCorrection: boolean;
  /**
   * Arka plan kestiriminde silinecek en kalın koyu yazı yarıçapı = kısa kenar * oran.
   * Büyütmek kalın başlıkları da siler; fazla büyütmek dar gölge şeritlerini düzeltemez.
   */
  backgroundRadiusRatio: number;
  /** Histogram yüzdelik kırpmasıyla otomatik kontrast germe. */
  autoContrast: boolean;
  /** Her uçtan kırpılacak piksel yüzdesi. */
  contrastClipPercent: number;

  // ---- Gürültü temizliği ----
  denoise: 'none' | 'median' | 'gaussian';
  /** denoise = 'gaussian' iken kullanılan sigma. */
  denoiseSigma: number;

  // ---- Unsharp masking ----
  sharpen: boolean;
  sharpenSigma: number;
  /** 1.0 = %100 keskinleştirme. */
  sharpenAmount: number;
  /** Bu değerin altındaki farklar (gürültü) keskinleştirilmez. */
  sharpenThreshold: number;

  // ---- İkilileştirme (binarization) ----
  /**
   * 'otsu'     : tek global eşik
   * 'adaptive' : Sauvola yerel eşik
   * 'hybrid'   : Sauvola + (Otsu + tolerans) koruması — varsayılan, en dayanıklı mod
   */
  binarization: 'otsu' | 'adaptive' | 'hybrid';
  /** Yerel pencere yarıçapı = kısa kenar * oran. */
  adaptiveRadiusRatio: number;
  /** Sauvola k parametresi (0.2–0.5). Düşük k = daha fazla mürekkep yakalar. */
  sauvolaK: number;
  /** Hybrid modda Otsu eşiğine eklenen tolerans (gri seviye). */
  otsuTolerance: number;

  // ---- Leke / nokta temizliği ----
  removeSpecks: boolean;
  /** Bundan küçük siyah bileşenler silinir. 0 = görüntü boyutuna göre otomatik. */
  minSpeckArea: number;

  // ---- Çıktı ----
  outputType: 'image/png' | 'image/jpeg';
  outputQuality: number;
}

export class ImagePreprocessor {
  public static readonly THERMAL_DEFAULTS: ThermalReceiptOptions = {
    maxDimension: 2400,
    minShortSide: 900,
    maxUpscale: 2.5,

    illuminationCorrection: true,
    backgroundRadiusRatio: 0.015,
    autoContrast: true,
    contrastClipPercent: 0.3,

    denoise: 'median',
    denoiseSigma: 0.8,

    sharpen: true,
    sharpenSigma: 1.2,
    sharpenAmount: 1.5,
    sharpenThreshold: 2,

    binarization: 'hybrid',
    adaptiveRadiusRatio: 0.03,
    sauvolaK: 0.25,
    otsuTolerance: 25,

    removeSpecks: true,
    minSpeckArea: 0,

    outputType: 'image/png',
    outputQuality: 0.95,
  };

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  public static async processImage(
    imageDataUrl: string,
    classification: DocumentClassificationResult,
    thermalOptions: Partial<ThermalReceiptOptions> = {}
  ): Promise<{ processedDataUrl: string; appliedFilters: string[] }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          resolve(ImagePreprocessor.runPipeline(img, imageDataUrl, classification, thermalOptions));
        } catch (error) {
          console.error('[ImagePreprocessor] İşleme hatası, orijinal görsel döndürülüyor:', error);
          resolve({ processedDataUrl: imageDataUrl, appliedFilters: ['Fallback'] });
        }
      };

      img.onerror = () => resolve({ processedDataUrl: imageDataUrl, appliedFilters: ['Fallback'] });
      img.src = imageDataUrl;
    });
  }

  /**
   * Termal fiş pipeline'ı (DOM'dan bağımsız, saf piksel işleme).
   * Sonuç `image.data` içine yerinde (in-place) yazılır; uygulanan filtrelerin listesi döner.
   *
   * Sıra: Gri ton → Gölge/ışık düzeltme → Kontrast germe → Gürültü azaltma
   *       → Unsharp mask → Otsu/Sauvola ikilileştirme → Leke temizliği
   */
  public static processThermalReceipt(
    image: PixelBuffer,
    options: Partial<ThermalReceiptOptions> = {}
  ): string[] {
    const o: ThermalReceiptOptions = { ...ImagePreprocessor.THERMAL_DEFAULTS, ...options };
    const { width: w, height: h, data } = image;
    const n = w * h;
    const applied: string[] = ['Grayscale Conversion'];

    let gray = ImagePreprocessor.toGrayscale(data, n);

    if (o.illuminationCorrection) {
      gray = ImagePreprocessor.normalizeIllumination(gray, w, h, o.backgroundRadiusRatio);
      applied.push('Illumination Normalization (Shadow Removal)');
    }

    if (o.autoContrast && ImagePreprocessor.stretchContrast(gray, o.contrastClipPercent)) {
      applied.push('Auto Contrast Stretch');
    }

    if (o.denoise === 'median') {
      gray = ImagePreprocessor.median3x3(gray, w, h);
      applied.push('Median Noise Reduction (3x3)');
    } else if (o.denoise === 'gaussian') {
      gray = ImagePreprocessor.gaussianBlur(gray, w, h, o.denoiseSigma);
      applied.push(`Gaussian Noise Reduction (σ=${o.denoiseSigma})`);
    }

    if (o.sharpen) {
      gray = ImagePreprocessor.unsharpMask(gray, w, h, o.sharpenSigma, o.sharpenAmount, o.sharpenThreshold);
      applied.push('Unsharp Masking');
    }

    const { ink, label } = ImagePreprocessor.binarize(gray, w, h, o);
    applied.push(label);

    if (o.removeSpecks) {
      const shortSide = Math.min(w, h);
      const minArea =
        o.minSpeckArea > 0
          ? o.minSpeckArea
          : Math.max(2, Math.round(4 * Math.pow(shortSide / 1000, 2)));
      ImagePreprocessor.removeSpecks(ink, w, h, minArea);
      applied.push('Speckle Removal');
    }

    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const v = ink[i] ? 0 : 255;
      data[p] = v;
      data[p + 1] = v;
      data[p + 2] = v;
      data[p + 3] = 255;
    }

    return applied;
  }

  // ===========================================================================
  // CANVAS KATMANI
  // ===========================================================================

  private static runPipeline(
    img: HTMLImageElement,
    originalDataUrl: string,
    classification: DocumentClassificationResult,
    thermalOptions: Partial<ThermalReceiptOptions>
  ): { processedDataUrl: string; appliedFilters: string[] } {
    const { docType } = classification;
    const isThermal = docType === 'fis';
    const opts: ThermalReceiptOptions = { ...ImagePreprocessor.THERMAL_DEFAULTS, ...thermalOptions };

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = isThermal ? ImagePreprocessor.computeScale(srcW, srcH, opts) : 1;
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      return { processedDataUrl: originalDataUrl, appliedFilters: ['None'] };
    }

    // Saydam PNG'lerin siyaha dönmemesi için beyaz zemin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const appliedFilters: string[] = [];

    // PIPELINE 1: TERMAL FİŞ (SROIE / CORD Referanslı)
    if (isThermal) {
      if (scale !== 1) appliedFilters.push(`Rescale (${scale.toFixed(2)}x)`);
      appliedFilters.push(...ImagePreprocessor.processThermalReceipt(imgData, opts));
      ctx.putImageData(imgData, 0, 0);
      return {
        processedDataUrl: canvas.toDataURL(opts.outputType, opts.outputQuality),
        appliedFilters,
      };
    }

    // Diğer belge türleri: mevcut davranış korunmuştur
    ImagePreprocessor.applyLegacyPipeline(docType, imgData.data, appliedFilters);
    ctx.putImageData(imgData, 0, 0);
    return {
      processedDataUrl: canvas.toDataURL('image/jpeg', 0.95),
      appliedFilters,
    };
  }

  private static computeScale(w: number, h: number, o: ThermalReceiptOptions): number {
    const longSide = Math.max(w, h);
    const shortSide = Math.min(w, h);
    if (longSide > o.maxDimension) return o.maxDimension / longSide;
    if (shortSide < o.minShortSide) {
      return Math.min(o.maxUpscale, o.minShortSide / shortSide, o.maxDimension / longSide);
    }
    return 1;
  }

  /** Termal fiş dışındaki belge türleri için mevcut pipeline'lar (davranış değişmedi). */
  private static applyLegacyPipeline(
    docType: string,
    pixels: Uint8ClampedArray,
    appliedFilters: string[]
  ): void {
    // PIPELINE 2: EL YAZISI (IAM Referanslı)
    if (docType === 'elyazisi') {
      appliedFilters.push('Edge Smoothing', 'Soft Contrast Balancing', 'Noise Reduction');
      for (let i = 0; i < pixels.length; i += 4) {
        let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        // Harf kopmalarını önlemek için yumuşak kontrast dengeleme
        gray = gray < 140 ? gray * 0.8 : Math.min(255, gray * 1.1);
        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
      }
      return;
    }

    // PIPELINE 3: KURUMSAL FATURA (RVL-CDIP Referanslı)
    if (docType === 'fatura') {
      appliedFilters.push('Table Line Sharpening', 'Binarization', 'Illumination Compensation');
      for (let i = 0; i < pixels.length; i += 4) {
        let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        gray = gray > 180 ? 255 : gray < 80 ? 0 : gray;
        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
      }
      return;
    }

    // PIPELINE 4: KİTAP SAYFASI / DÜZ METİN
    appliedFilters.push('Shadow Removal', 'Standard High-DPI Contrast');
    for (let i = 0; i < pixels.length; i += 4) {
      let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      gray = gray > 200 ? 255 : gray;
      pixels[i] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
    }
  }

  // ===========================================================================
  // ÇEKİRDEK ALGORİTMALAR (DOM'suz, Float32Array tabanlı)
  // ===========================================================================

  /** RGBA → ITU-R BT.601 gri ton. Yarı saydam pikseller beyaz zemine kompozitlenir. */
  private static toGrayscale(data: Uint8ClampedArray, n: number): Float32Array {
    const gray = new Float32Array(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const g = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
      const a = data[p + 3];
      gray[i] = a === 255 ? g : (g * a) / 255 + 255 - a;
    }
    return gray;
  }

  /**
   * Gölge / eşitsiz aydınlatma düzeltme (kenar koruyan arka plan kestirimi).
   * 1) Görüntü düşük çözünürlüğe blok-maksimum ile indirilir → ince harfler kaybolur, yalnızca kâğıt kalır
   * 2) Düşük çözünürlükte morfolojik KAPAMA (dilation → erosion): kalın koyu yazıyı siler
   *    ama elle gölgenin sert kenarını yumuşatmaz (bulanıklaştırmanın aksine sahte bant üretmez)
   * 3) Bilineer büyütme ile tam çözünürlüklü arka plan haritası elde edilir
   * 4) Orijinal / arka plan * 255 → kâğıt her yerde ~beyaz, mürekkep göreli koyu
   */
  private static normalizeIllumination(
    gray: Float32Array,
    w: number,
    h: number,
    radiusRatio: number
  ): Float32Array {
    const shortSide = Math.min(w, h);
    const f = Math.max(1, Math.round(shortSide / 700)); // blok boyutu
    const lw = Math.ceil(w / f);
    const lh = Math.ceil(h / f);

    // 1) blok-maksimum ile küçült
    const low = new Float32Array(lw * lh);
    for (let ly = 0; ly < lh; ly++) {
      const y0 = ly * f;
      const y1 = Math.min(h, y0 + f);
      for (let lx = 0; lx < lw; lx++) {
        const x0 = lx * f;
        const x1 = Math.min(w, x0 + f);
        let m = 0;
        for (let y = y0; y < y1; y++) {
          const row = y * w;
          for (let x = x0; x < x1; x++) if (gray[row + x] > m) m = gray[row + x];
        }
        low[ly * lw + lx] = m;
      }
    }

    // 2) morfolojik kapama (düşük çözünürlükte, yarıçap tam çözünürlük piksel cinsinden verilir)
    const rc = Math.max(1, Math.round((shortSide * radiusRatio) / f));
    const closed = ImagePreprocessor.morph(ImagePreprocessor.morph(low, lw, lh, rc, true), lw, lh, rc, false);

    // 3) bilineer büyütme
    const x0s = new Int32Array(w);
    const x1s = new Int32Array(w);
    const txs = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const fx = (x + 0.5) / f - 0.5;
      const xi = Math.floor(fx);
      txs[x] = fx - xi;
      x0s[x] = xi < 0 ? 0 : xi > lw - 1 ? lw - 1 : xi;
      x1s[x] = xi + 1 < 0 ? 0 : xi + 1 > lw - 1 ? lw - 1 : xi + 1;
    }

    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const fy = (y + 0.5) / f - 0.5;
      const yi = Math.floor(fy);
      const ty = fy - yi;
      const ra = (yi < 0 ? 0 : yi > lh - 1 ? lh - 1 : yi) * lw;
      const rb = (yi + 1 < 0 ? 0 : yi + 1 > lh - 1 ? lh - 1 : yi + 1) * lw;
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const tx = txs[x];
        const a = closed[ra + x0s[x]];
        const b = closed[ra + x1s[x]];
        const c = closed[rb + x0s[x]];
        const d = closed[rb + x1s[x]];
        const bg = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;

        // 4) bölme ile normalizasyon
        const v = (gray[row + x] * 255) / Math.max(bg, 1);
        out[row + x] = v > 255 ? 255 : v;
      }
    }
    return out;
  }

  /** Yüzdelik kırpmalı kontrast germe. Uygulandıysa true döner. */
  private static stretchContrast(gray: Float32Array, clipPercent: number): boolean {
    const n = gray.length;
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i++) {
      const v = gray[i];
      hist[v <= 0 ? 0 : v >= 255 ? 255 : (v + 0.5) | 0]++;
    }

    const clip = Math.floor((n * clipPercent) / 100);
    let acc = 0;
    let lo = 0;
    for (; lo < 255; lo++) {
      acc += hist[lo];
      if (acc > clip) break;
    }
    acc = 0;
    let hi = 255;
    for (; hi > 0; hi--) {
      acc += hist[hi];
      if (acc > clip) break;
    }

    if (hi - lo < 10) return false; // neredeyse düz görüntü: gürültüyü büyütme

    const k = 255 / (hi - lo);
    for (let i = 0; i < n; i++) {
      const v = (gray[i] - lo) * k;
      gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    return true;
  }

  /** 3x3 medyan filtresi: tuz-biber gürültüsünü kenarları bozmadan temizler. */
  private static median3x3(src: Float32Array, w: number, h: number): Float32Array {
    const out = new Float32Array(w * h);
    const p = new Float32Array(9);

    for (let y = 0; y < h; y++) {
      const r0 = (y > 0 ? y - 1 : 0) * w;
      const r1 = y * w;
      const r2 = (y < h - 1 ? y + 1 : h - 1) * w;
      for (let x = 0; x < w; x++) {
        const xl = x > 0 ? x - 1 : 0;
        const xr = x < w - 1 ? x + 1 : w - 1;
        p[0] = src[r0 + xl];
        p[1] = src[r0 + x];
        p[2] = src[r0 + xr];
        p[3] = src[r1 + xl];
        p[4] = src[r1 + x];
        p[5] = src[r1 + xr];
        p[6] = src[r2 + xl];
        p[7] = src[r2 + x];
        p[8] = src[r2 + xr];
        out[r1 + x] = ImagePreprocessor.median9(p);
      }
    }
    return out;
  }

  /** 9 elemanlı sıralama ağı ile medyan (p dizisini değiştirir). */
  private static median9(p: Float32Array): number {
    const s = ImagePreprocessor.cswap;
    s(p, 1, 2); s(p, 4, 5); s(p, 7, 8);
    s(p, 0, 1); s(p, 3, 4); s(p, 6, 7);
    s(p, 1, 2); s(p, 4, 5); s(p, 7, 8);
    s(p, 0, 3); s(p, 5, 8); s(p, 4, 7);
    s(p, 3, 6); s(p, 1, 4); s(p, 2, 5);
    s(p, 4, 7); s(p, 4, 2); s(p, 6, 4);
    s(p, 4, 2);
    return p[4];
  }

  private static cswap(p: Float32Array, a: number, b: number): void {
    if (p[a] > p[b]) {
      const t = p[a];
      p[a] = p[b];
      p[b] = t;
    }
  }

  /** Unsharp mask: out = orig + amount * (orig - gaussian(orig)), eşik altı farklar atlanır. */
  private static unsharpMask(
    gray: Float32Array,
    w: number,
    h: number,
    sigma: number,
    amount: number,
    threshold: number
  ): Float32Array {
    const blurred = ImagePreprocessor.gaussianBlur(gray, w, h, sigma);
    const out = new Float32Array(gray.length);
    for (let i = 0; i < out.length; i++) {
      const d = gray[i] - blurred[i];
      let v = Math.abs(d) >= threshold ? gray[i] + amount * d : gray[i];
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      out[i] = v;
    }
    return out;
  }

  /** Ayrılabilir (separable) Gauss bulanıklaştırma, kenarlar replike edilir. */
  private static gaussianBlur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
    const radius = Math.max(1, Math.ceil(sigma * 3));
    const kernel = new Float32Array(radius * 2 + 1);
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const v = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel[i + radius] = v;
      sum += v;
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = x + k < 0 ? 0 : x + k > w - 1 ? w - 1 : x + k;
          acc += src[row + xx] * kernel[k + radius];
        }
        tmp[row + x] = acc;
      }
    }

    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const yy = y + k < 0 ? 0 : y + k > h - 1 ? h - 1 : y + k;
          acc += tmp[yy * w + x] * kernel[k + radius];
        }
        out[y * w + x] = acc;
      }
    }
    return out;
  }

  /** O(n) kayan toplamlı kutu bulanıklaştırma (pencere = 2r+1, kenarlar replike). */
  private static boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
    const size = 2 * r + 1;
    const tmp = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[row + (k < 0 ? 0 : k > w - 1 ? w - 1 : k)];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum / size;
        const add = x + r + 1 > w - 1 ? w - 1 : x + r + 1;
        const rem = x - r < 0 ? 0 : x - r;
        sum += src[row + add] - src[row + rem];
      }
    }

    const out = new Float32Array(w * h);
    const col = new Float64Array(w);
    for (let k = -r; k <= r; k++) {
      const base = (k < 0 ? 0 : k > h - 1 ? h - 1 : k) * w;
      for (let x = 0; x < w; x++) col[x] += tmp[base + x];
    }
    for (let y = 0; y < h; y++) {
      const base = y * w;
      for (let x = 0; x < w; x++) out[base + x] = col[x] / size;
      const addRow = (y + r + 1 > h - 1 ? h - 1 : y + r + 1) * w;
      const remRow = (y - r < 0 ? 0 : y - r) * w;
      for (let x = 0; x < w; x++) col[x] += tmp[addRow + x] - tmp[remRow + x];
    }
    return out;
  }

  /** Ayrılabilir gri ton morfolojisi: dilate = true → maksimum filtresi, false → minimum filtresi (erosion). */
  private static morph(src: Float32Array, w: number, h: number, r: number, dilate: boolean): Float32Array {
    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const lo = x - r < 0 ? 0 : x - r;
        const hi = x + r > w - 1 ? w - 1 : x + r;
        let m = src[row + lo];
        for (let k = lo + 1; k <= hi; k++) {
          const v = src[row + k];
          if (dilate ? v > m : v < m) m = v;
        }
        tmp[row + x] = m;
      }
    }

    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const lo = y - r < 0 ? 0 : y - r;
      const hi = y + r > h - 1 ? h - 1 : y + r;
      for (let x = 0; x < w; x++) {
        let m = tmp[lo * w + x];
        for (let k = lo + 1; k <= hi; k++) {
          const v = tmp[k * w + x];
          if (dilate ? v > m : v < m) m = v;
        }
        out[y * w + x] = m;
      }
    }
    return out;
  }

  /** Otsu global eşiği: sınıflar arası varyansı maksimize eden gri seviye (0–255). */
  private static otsuThreshold(gray: Float32Array): number {
    const hist = new Uint32Array(256);
    for (let i = 0; i < gray.length; i++) {
      const v = gray[i];
      hist[v <= 0 ? 0 : v >= 255 ? 255 : (v + 0.5) | 0]++;
    }

    const total = gray.length;
    let sumAll = 0;
    for (let t = 0; t < 256; t++) sumAll += t * hist[t];

    let sumB = 0;
    let wB = 0;
    let best = -1;
    let threshold = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sumAll - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) {
        best = between;
        threshold = t;
      }
    }
    return threshold;
  }

  /**
   * İkilileştirme. Dönen `ink[i] === 1` → siyah (mürekkep), 0 → beyaz (kâğıt).
   * Sauvola: T = mean * (1 + k * (std / 128 - 1)) — silik yazıda ve düşük kontrastta
   * Niblack/Bradley'e göre çok daha kararlıdır; boş kâğıt bölgelerinde sahte leke üretmez.
   */
  private static binarize(
    gray: Float32Array,
    w: number,
    h: number,
    o: ThermalReceiptOptions
  ): { ink: Uint8Array; label: string } {
    const n = w * h;
    const ink = new Uint8Array(n);
    const otsuT = ImagePreprocessor.otsuThreshold(gray);

    if (o.binarization === 'otsu') {
      for (let i = 0; i < n; i++) ink[i] = gray[i] <= otsuT ? 1 : 0;
      return { ink, label: `Otsu Global Thresholding (T=${otsuT})` };
    }

    const radius = Math.max(7, Math.round(Math.min(w, h) * o.adaptiveRadiusRatio));
    const mean = ImagePreprocessor.boxBlur(gray, w, h, radius);
    const squared = new Float32Array(n);
    for (let i = 0; i < n; i++) squared[i] = gray[i] * gray[i];
    const meanSq = ImagePreprocessor.boxBlur(squared, w, h, radius);

    const k = o.sauvolaK;
    const guard = otsuT + o.otsuTolerance;
    const useGuard = o.binarization === 'hybrid';

    for (let i = 0; i < n; i++) {
      const m = mean[i];
      const variance = meanSq[i] - m * m;
      const std = variance > 0 ? Math.sqrt(variance) : 0;
      const localT = m * (1 + k * (std / 128 - 1));
      const v = gray[i];
      ink[i] = v <= localT && (!useGuard || v <= guard) ? 1 : 0;
    }

    return {
      ink,
      label: useGuard
        ? `Hybrid Otsu + Sauvola Adaptive Thresholding (Otsu T=${otsuT})`
        : 'Sauvola Adaptive Thresholding',
    };
  }

  /**
   * Küçük siyah bileşenleri (leke, tek piksel gürültü) siler.
   * 8-bağlantılı BFS; alanı `minArea`'dan küçük bileşenler beyaza çevrilir.
   */
  private static removeSpecks(ink: Uint8Array, w: number, h: number, minArea: number): number {
    const n = w * h;
    const visited = new Uint8Array(n);
    const queue = new Int32Array(n);
    let removedPixels = 0;

    for (let start = 0; start < n; start++) {
      if (!ink[start] || visited[start]) continue;

      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      visited[start] = 1;

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const ni = ny * w + nx;
            if (ink[ni] && !visited[ni]) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
        }
      }

      if (tail < minArea) {
        for (let k = 0; k < tail; k++) ink[queue[k]] = 0;
        removedPixels += tail;
      }
    }
    return removedPixels;
  }
}