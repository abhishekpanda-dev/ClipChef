import { PlatformPreset } from '../types';
import { SceneDetectionResult } from '../utils/sceneDetection';

export interface ClipResult {
  url: string;
  aspect: string;
  start: number;
  end: number;
  thumbnail?: string;
  platform?: string;
  error?: string;
}

export interface ClipGeneratorOptions {
  videoFile: File;
  scenes: SceneDetectionResult[];
  platforms: PlatformPreset[];
  onProgress?: (progress: number, context?: string) => void;
}

export class ClipGeneratorService {
  private worker: Worker | null = null;

  constructor() {}

  generateClips(options: ClipGeneratorOptions): Promise<ClipResult[]> {
    return new Promise((resolve) => {
      this.worker = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
      let results: ClipResult[] = [];
      let total = options.scenes.length * options.platforms.length;
      let completed = 0;
      this.worker.onmessage = async (e: MessageEvent) => {
        const { type, clips, error, progress, context } = e.data;
        if (type === 'progress' && options.onProgress) {
          options.onProgress(progress, context);
        }
        if (type === 'clips') {
          if (!clips || clips.length === 0) {
            // Debug: No clips returned, log error
            console.error('No clips returned from worker for platform:', context);
            results.push({
              url: '',
              aspect: '',
              start: 0,
              end: 0,
              thumbnail: '',
              platform: context || '',
              error: 'No clips generated for this platform.'
            });
            completed++;
          } else {
            results = results.concat(clips);
            completed += clips.length;
          }
          if (options.onProgress) options.onProgress(completed / total, 'Batch clip generation');
          if (completed >= total) {
            this.worker?.terminate();
            resolve(results);
          }
        }
        if (type === 'clipError') {
          // Debug: Clip error from worker
          console.error('Clip generation error:', error);
          results.push({
            url: '',
            aspect: '',
            start: 0,
            end: 0,
            thumbnail: '',
            platform: context || '',
            error: error
          });
          completed++;
          if (options.onProgress) options.onProgress(completed / total, 'Batch clip generation');
          if (completed >= total) {
            this.worker?.terminate();
            resolve(results);
          }
        }
      };
      // For each platform, send a generateClips message
      for (const platform of options.platforms) {
        this.worker.postMessage({
          type: 'generateClips',
          file: options.videoFile,
          scenes: options.scenes,
          platformPreset: platform,
          manualTimestamps: [],
        });
      }
    });
  }
}
