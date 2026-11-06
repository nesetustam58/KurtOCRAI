export async function onRequest(context: { request: Request }) {
  try {
    // Akademik ve doğrulanmış açık kaynaklı veri setleri manifestosu (SROIE, CORD, IAM)
    const academicDatasets = [
      {
        id: 'SROIE-REC-01',
        dataset: 'SROIE',
        docType: 'fis',
        imageUrl: 'https://raw.githubusercontent.com/zzzDavid/ICDAR-2019-SROIE/master/data/img/000.jpg',
        expectedText: 'CONVENIENCE STORE\nTOTAL: 45.50\nDATE: 25/10/2018'
      },
      {
        id: 'CORD-INV-02',
        dataset: 'CORD',
        docType: 'fatura',
        imageUrl: 'https://raw.githubusercontent.com/clovaai/cord/master/beeld/receipt-001.png',
        expectedText: 'RESTAURANT KOREA\nSUBTOTAL: 120.000\nTAX: 12.000\nTOTAL: 132.000'
      },
      {
        id: 'IAM-HAND-03',
        dataset: 'IAM Handwriting',
        docType: 'siir',
        imageUrl: 'https://fki.tic.heia-fr.ch/static/img/a01-000u.png',
        expectedText: 'A quick brown fox jumps over the lazy dog'
      }
    ];

    return new Response(JSON.stringify({ success: true, testCases: academicDatasets }), {
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