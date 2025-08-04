// useVideoProcessor.ts
import { useRef } from 'react';
import { VideoMetadata, ThumbnailResult, ConvertOptions, SplitOptions } from '../utils/VideoProcessor';

export function useVideoProcessor() {
  const workerRef = useRef<Worker | null>(null);

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
  }

  function getMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'metadata') resolve(e.data.meta);
        else reject(e.data.error);
      };
      workerRef.current!.postMessage({ type: 'getMetadata', file });
    });
  }

  function generateThumbnail(file: File, timestamp: number): Promise<ThumbnailResult> {
    return new Promise((resolve, reject) => {
      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'thumbnail') resolve(e.data.thumb);
        else reject(e.data.error);
      };
      workerRef.current!.postMessage({ type: 'generateThumbnail', file, timestamp });
    });
  }

  function convertFormat(file: File, options: ConvertOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'converted') resolve(e.data.converted);
        else reject(e.data.error);
      };
      workerRef.current!.postMessage({ type: 'convertFormat', file, options });
    });
  }

  function splitVideo(file: File, options: SplitOptions): Promise<File[]> {
    return new Promise((resolve, reject) => {
      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'segments') resolve(e.data.segments);
        else reject(e.data.error);
      };
      workerRef.current!.postMessage({ type: 'splitVideo', file, options });
    });
  }

  return {
    getMetadata,
    generateThumbnail,
    convertFormat,
    splitVideo,
  };
}
