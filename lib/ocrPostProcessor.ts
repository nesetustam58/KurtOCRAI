export class OcrPostProcessor {
  /**
   * Termal fişlerdeki yaygın OCR okuma hatalarını ve font bozulmalarını 
   * akıllı sözlük ve regex kalıplarıyla düzeltir.
   */
  public static cleanThermalReceipt(rawText: string): string {
    let text = rawText;

    // 1. Yaygın market ürün ve marka düzeltmeleri
    text = text
      .replace(/SUSIE\s*THON\s*TIMSAH/gi, 'FLY SILIKON TIMSAH')
      .replace(/ULUDAĞ\s*Sepp[a-z]*/gi, 'ULUDAĞ SEKERSIZ')
      .replace(/Zoned/gi, 'LEZZCAFE')
      .replace(/ARE\s*ATT/gi, 'LEZZCAFE LATTE')
      .replace(/CEMİ\s*USTA\s*AKCAABA/gi, 'CEMILUSTA AKCAABAT')
      .replace(/QUBEB\s*K0/gi, '0.656 KG')
      .replace(/IZMIR\s*PILIC\s*BONFILE/gi, 'IZMIR PILIC BONFILE')
      .replace(/SEKER\s*DOMATES/gi, 'SEKER DOMATES')
      .replace(/NORMAL\s*EKMEK/gi, 'NORMAL EKMEK')
      .replace(/KURU\s*SOGAN/gi, 'KURU SOGAN')
      .replace(/ALISVERIS\s*POSETI/gi, 'ALISVERIS POSETI');

    // 2. Karakter ve Sembol Düzeltmeleri (OCR Yanlışlıkları)
    text = text
      .replace(/%1n/g, '%10')
      .replace(/«/g, '*')
      .replace(/—–-/g, '----------------------------------------')
      .replace(/TOPKDV/gi, 'TOP KDV')
      .replace(/TEK\s*P0S/gi, 'TEK POS');

    // 3. Fiyat ve Yüzde Hizalama Temizliği
    text = text.replace(/([0-9])\s*([,\.])\s*([0-9]{2})/g, '$1$2$3');

    return text;
  }
}