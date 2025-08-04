// useVideoProcessor.ts
import { useRef } from 'react';
import { VideoMetadata, ThumbnailResult, ConvertOptions, SplitOptions } from '../utils/VideoProcessor';

export function useVideoProcessor() {
  const workerRef = useRef<Worker | null>(null);

  if (!workerRef.current) {
    console.log('useVideoProcessor: Creating new Web Worker');
    workerRef.current = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
    
    // Add message listener for debugging
    workerRef.current.onmessage = (e) => {
      console.log('useVideoProcessor: Worker message received:', e.data);
    };
    
    workerRef.current.onerror = (e) => {
      console.error('useVideoProcessor: Worker error:', e);
    };
  }

  function getMetadata(file: File): Promise<VideoMetadata> {
    console.log('useVideoProcessor: getMetadata started for file:', file.name);
    return new Promise((resolve, reject) => {
      const messageHandler = (e: MessageEvent) => {
        console.log('useVideoProcessor: getMetadata message received:', e.data);
        if (e.data.type === 'metadata') {
          console.log('useVideoProcessor: getMetadata completed successfully');
          workerRef.current!.removeEventListener('message', messageHandler);
          resolve(e.data.meta);
        } else if (e.data.type === 'error') {
          console.error('useVideoProcessor: getMetadata failed:', e.data.error);
          workerRef.current!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };
      
      workerRef.current!.addEventListener('message', messageHandler);
      workerRef.current!.postMessage({ type: 'getMetadata', file });
    });
  }

  function generateThumbnail(file: File, timestamp: number): Promise<ThumbnailResult> {
    console.log('useVideoProcessor: generateThumbnail started for file:', file.name, 'at timestamp:', timestamp);
    return new Promise((resolve, reject) => {
      const messageHandler = (e: MessageEvent) => {
        console.log('useVideoProcessor: generateThumbnail message received:', e.data);
        if (e.data.type === 'thumbnail') {
          console.log('useVideoProcessor: generateThumbnail completed successfully');
          workerRef.current!.removeEventListener('message', messageHandler);
          resolve(e.data.thumb);
        } else if (e.data.type === 'error') {
          console.error('useVideoProcessor: generateThumbnail failed:', e.data.error);
          workerRef.current!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };
      
      workerRef.current!.addEventListener('message', messageHandler);
      workerRef.current!.postMessage({ type: 'generateThumbnail', file, timestamp });
    });
  }

  function convertFormat(file: File, options: ConvertOptions): Promise<File> {
    console.log('useVideoProcessor: convertFormat started for file:', file.name, 'to format:', options.format);
    return new Promise((resolve, reject) => {
      const messageHandler = (e: MessageEvent) => {
        console.log('useVideoProcessor: convertFormat message received:', e.data);
        if (e.data.type === 'converted') {
          console.log('useVideoProcessor: convertFormat completed successfully');
          workerRef.current!.removeEventListener('message', messageHandler);
          resolve(e.data.converted);
        } else if (e.data.type === 'error') {
          console.error('useVideoProcessor: convertFormat failed:', e.data.error);
          workerRef.current!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };
      
      workerRef.current!.addEventListener('message', messageHandler);
      workerRef.current!.postMessage({ type: 'convertFormat', file, options });
    });
  }

  function splitVideo(file: File, options: SplitOptions): Promise<File[]> {
    console.log('useVideoProcessor: splitVideo started for file:', file.name, 'with segments:', options.segments.length);
    return new Promise((resolve, reject) => {
      const messageHandler = (e: MessageEvent) => {
        console.log('useVideoProcessor: splitVideo message received:', e.data);
        if (e.data.type === 'segments') {
          console.log('useVideoProcessor: splitVideo completed successfully');
          workerRef.current!.removeEventListener('message', messageHandler);
          resolve(e.data.segments);
        } else if (e.data.type === 'error') {
          console.error('useVideoProcessor: splitVideo failed:', e.data.error);
          workerRef.current!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };
      
      workerRef.current!.addEventListener('message', messageHandler);
      workerRef.current!.postMessage({ type: 'splitVideo', file, options });
    });
  }

  // New process method that handles the complete video processing pipeline
  async function process(file: File): Promise<{ metadata: VideoMetadata; thumbnail: ThumbnailResult }> {
    console.log('useVideoProcessor: process started for file:', file.name);
    
    try {
      // Step 1: Get metadata
      console.log('useVideoProcessor: Step 1 - Getting metadata');
      const metadata = await getMetadata(file);
      console.log('useVideoProcessor: Metadata obtained:', metadata);
      
      // Step 2: Generate thumbnail at midpoint
      console.log('useVideoProcessor: Step 2 - Generating thumbnail');
      const thumbnailTimestamp = Math.floor((metadata.duration || 1) / 2);
      const thumbnail = await generateThumbnail(file, thumbnailTimestamp);
      console.log('useVideoProcessor: Thumbnail generated:', thumbnail);
      
      console.log('useVideoProcessor: process completed successfully');
      return { metadata, thumbnail };
    } catch (error) {
      console.error('useVideoProcessor: process failed:', error);
      throw error;
    }
  }

  return {
    getMetadata,
    generateThumbnail,
    convertFormat,
    splitVideo,
    process,
  };
}
