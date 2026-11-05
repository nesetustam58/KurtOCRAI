import { OcrEvaluationEngine } from "./ocrEvaluationEngine";

function runTests() {
  console.log("=== KurtOCRAI Özerk Test Motoru Doğrulama Başlıyor ===");

  // Test Vakası: Kusurlu Şiir Metni
  const sampleRawText = "IV\n\nTaşta saklandım ben yıllarca taşta\nBu yüzden anlarniyonun ölkem nasıl sert";
  
  const result = OcrEvaluationEngine.evaluate(sampleRawText, 'siir');

  console.log("Belge Tipi:", result.documentType);
  console.log("Ham Metin:", JSON.stringify(result.rawText));
  console.log("Temizlenmiş Metin:", JSON.stringify(result.cleanedText));
  console.log("Güven Skoru:", `%${result.confidenceScore}`);
  console.log("Tespit Edilen Hatalar:", result.detectedErrors);
  console.log("Önerilen Düzeltmeler:", result.suggestedCorrections);

  if (result.cleanedText.includes("anlamıyorsun") && result.cleanedText.includes("öfkem")) {
    console.log("✅ TEST BAŞARILI: Özerk motor kelimeleri başarıyla düzeltti ve skorladı!");
  } else {
    console.error("❌ TEST BAŞARISIZ: Beklenen kelime düzeltmeleri yapılamadı.");
  }
}

runTests();
