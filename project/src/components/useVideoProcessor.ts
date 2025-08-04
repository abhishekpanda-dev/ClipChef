// useVideoProcessor.ts
import { useRef } from 'react';
import { VideoMetadata, ThumbnailResult, SegmentResult } from './VideoProcessor';

export type WorkerRequest =
  | { type: 'metadata'; file: File }
  | { type: 'thumbnails'; file: File; timestamps: number[] }
  | { type: 'convert'; file: File; args: { format: string } }
  | { type: 'split'; file: File; segments: { start: number; end: number }[] };

export type WorkerResponse =
  | { type: 'metadata'; data: VideoMetadata }
  | { type: 'thumbnails'; data: ThumbnailResult[] }
  | { type: 'convert'; data: string }
  | { type: 'split'; data: SegmentResult[] }
  | { type: 'error'; error: string };

export function useVideoProcessor() {
  const workerRef = useRef<Worker | null>(null);

  function initWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./videoProcessor.worker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }

  function process<T = any>(request: WorkerRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      worker.onmessage = (e: MessageEvent) => {
        const res: WorkerResponse = e.data;
        if (res.type === 'error') reject(res.error);
        else resolve((res as any).data);
      };
      worker.postMessage(request);
    });
  }

  return { process };
}
