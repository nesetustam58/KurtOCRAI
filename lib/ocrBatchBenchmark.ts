import { OcrEvaluationEngine } from './ocrEvaluationEngine';

export interface BenchmarkTestCase {
  id: string;
  dataset: string;
  docType: 'siir' | 'fatura' | 'fis' | 'genel';
  targetText: string;
  syntheticNoiseLevel: number;
}

export interface BenchmarkResult {
  testId: string;
  success: boolean;
  cer: number;
  wer: number;
  detectedErrors: string[];
  executionTimeMs: number;
}

export interface OptimizationLog {
  timestamp: string;
  iteration: number;
  averageCER: number;
  injectedRulesCount: number;
  status: 'optimized' | 'stable' | 'converged';
}

export class OcrBatchBenchmark {
  public static calculateCER(predicted: string, target: string): number {
    if (!target) return predicted ? 1 : 0;
    const lenA = predicted.length;
    const lenB = target.length;
    const matrix: number[][] = Array(lenA + 1).fill(null).map(() => Array(lenB + 1).fill(0));

    for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = predicted[i - 1] === target[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[lenA][lenB] / Math.max(1, lenB);
  }

  // Sentetik OCR Gürültü Enjektörü (Gerçek dünya okuma hatalarını simüle eder)
  public static injectOcrNoise(text: string, noiseRate: number): string {
    return text.split('').map(char => {
      if (Math.random() < noiseRate) {
        if (char === 'O') return '0';
        if (char === 'l' || char === 'I') return '1';
        if (char === 'S') return '5';
        return '_';
      }
      return char;
    }).join('');
  }

  public static executeSelfOptimization(results: BenchmarkResult[], currentIteration: number): OptimizationLog {
    const failedTests = results.filter(r => !r.success);
    const avgCer = results.reduce((acc, curr) => acc + curr.cer, 0) / (results.length || 1);

    let rulesCount = 0;
    try {
      const existingRules = JSON.parse(localStorage.getItem('kurtocr_adaptive_rules') || '[]');
      if (failedTests.length > 0) {
        failedTests.forEach(fail => {
          existingRules.push({
            id: `rule_auto_${Date.now()}_${fail.testId}`,
            iteration: currentIteration,
            errorSignature: fail.detectedErrors,
            createdAt: new Date().toISOString()
          });
        });
        localStorage.setItem('kurtocr_adaptive_rules', JSON.stringify(existingRules));
        rulesCount = existingRules.length;
      }
    } catch (e) {
      console.error("Akademik Optimizasyon Kayıt Hatası:", e);
    }

    return {
      timestamp: new Date().toLocaleTimeString(),
      iteration: currentIteration,
      averageCER: Number(avgCer.toFixed(4)),
      injectedRulesCount: rulesCount,
      status: avgCer < 0.05 ? 'converged' : 'optimized'
    };
  }

  public static async runBatch(
    testCases: BenchmarkTestCase[],
    onProgress: (currentIndex: number, total: number, currentId: string) => void,
    iteration: number = 1
  ): Promise<{ summary: any; results: BenchmarkResult[]; optimizationLog: OptimizationLog }> {
    const results: BenchmarkResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const tStart = Date.now();
      onProgress(i + 1, testCases.length, tc.id);

      // Simüle edilmiş otonom OCR mutasyon ve değerlendirme döngüsü
      const simulatedOcrOutput = this.injectOcrNoise(tc.targetText, tc.syntheticNoiseLevel);
      const evaluation: any = OcrEvaluationEngine.evaluate(simulatedOcrOutput, tc.docType);
      const cleanedTextStr = evaluation.cleanedText || evaluation.text || simulatedOcrOutput;
      
      const cer = this.calculateCER(cleanedTextStr, tc.targetText);

      results.push({
        testId: tc.id,
        success: cer < 0.20,
        cer,
        wer: 0,
        detectedErrors: evaluation.detectedErrors || ['Gürültülü Karakter Sapması'],
        executionTimeMs: Date.now() - tStart
      });
    }

    const totalTime = Date.now() - startTime;
    const avgCer = results.reduce((acc, curr) => acc + curr.cer, 0) / (results.length || 1);
    const successCount = results.filter(r => r.success).length;
    const optimizationLog = this.executeSelfOptimization(results, iteration);

    return {
      summary: {
        totalTests: testCases.length,
        successCount,
        failureCount: testCases.length - successCount,
        averageCER: Number(avgCer.toFixed(4)),
        totalDurationSec: Number((totalTime / 1000).toFixed(2))
      },
      results,
      optimizationLog
    };
  }
}