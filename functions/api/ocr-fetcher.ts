export async function onRequest(context: { request: Request }) {
  try {
    const academicTextDatasets = [
      {
        id: 'SROIE-TXT-01',
        dataset: 'SROIE Receipts Corpus',
        docType: 'fis',
        targetText: 'CONVENIENCE STORE TOTAL: 45.50 DATE: 25/10/2018',
        syntheticNoiseLevel: 0.15
      },
      {
        id: 'CORD-TXT-02',
        dataset: 'CORD Invoices Corpus',
        docType: 'fatura',
        targetText: 'RESTAURANT KOREA SUBTOTAL: 120.000 TAX: 12.000 TOTAL: 132.000',
        syntheticNoiseLevel: 0.20
      },
      {
        id: 'IAM-TXT-03',
        dataset: 'IAM Handwriting Corpus',
        docType: 'siir',
        targetText: 'A quick brown fox jumps over the lazy dog',
        syntheticNoiseLevel: 0.10
      }
    ];

    return new Response(JSON.stringify({ success: true, testCases: academicTextDatasets }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}