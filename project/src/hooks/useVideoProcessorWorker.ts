import { useState, useCallback } from 'react';

interface WorkerProgress {
  progress: number;
  context?: string;
}

interface WorkerStatus {
  context?: string;
}

interface WorkerResult {
  type: string;
  [key: string]: any;
}

export default function useVideoProcessorWorker(workerRef: React.MutableRefObject<Worker | null>) {
  const [workerProgress, setWorkerProgress] = useState<WorkerProgress | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [workerResult, setWorkerResult] = useState<WorkerResult | null>(null);
  const [workerErrorMsg, setWorkerErrorMsg] = useState<string | null>(null);

  const cleanupWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setWorkerProgress(null);
    setWorkerStatus(null);
    setWorkerResult(null);
    setWorkerErrorMsg(null);
  }, [workerRef]);

  const sendToWorker = useCallback((msg: any) => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
      workerRef.current.onmessage = (e: MessageEvent) => {
        const { type, ...rest } = e.data;
        if (type === 'progress') setWorkerProgress(rest);
        else if (type === 'error') setWorkerErrorMsg(rest.error);
        else if (type === 'clipError') setWorkerErrorMsg(rest.error);
        else if (type === 'metadata' || type === 'thumbnail' || type === 'scenes' || type === 'clips' || type === 'segments' || type === 'converted') setWorkerResult({ type, ...rest });
        else setWorkerStatus(rest);
      };
    }
    workerRef.current.postMessage(msg);
  }, [workerRef]);

  return {
    sendToWorker,
    workerProgress,
    workerStatus,
    workerResult,
    workerErrorMsg,
    cleanupWorker,
  };
}
