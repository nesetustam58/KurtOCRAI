import { createWorker } from 'tesseract.js';
export async function runKurtOCR(imageSrc:string, lang='tur+eng'){const worker=await createWorker(lang); const {data}=await worker.recognize(imageSrc); await worker.terminate(); return data.text;}
