// videoProcessor.worker.ts
import { VideoProcessor, ConvertOptions, SplitOptions, ThumbnailResult, VideoMetadata } from '../utils/VideoProcessor';
import { detectScenes, SceneDetectionOptions, adjustScenes } from '../utils/sceneDetection';

const ctx: Worker = self as any;
let processor: VideoProcessor | null = null;

ctx.onmessage = async (event) => {
  const { type, file, options, timestamp, scenes, platformPreset, manualTimestamps } = event.data;
  
  console.log('Worker: Message received:', type, 'for file:', file?.name);
  
  if (!processor) {
    console.log('Worker: Initializing VideoProcessor');
    try {
      processor = new VideoProcessor();
      console.log('Worker: VideoProcessor initialized successfully');
    } catch (error) {
      console.error('Worker: Failed to initialize VideoProcessor:', error);
      ctx.postMessage({ type: 'error', error: `Failed to initialize VideoProcessor: ${error instanceof Error ? error.message : String(error)}` });
      return;
    }
  }

  // Progress callback
  const postProgress = (progress: number, context?: string) => {
    console.log('Worker: Progress update:', progress, 'Context:', context);
    ctx.postMessage({ type: 'progress', progress, context });
  };

  // Start callback
  const postStart = (context?: string) => {
    console.log('Worker: Processing started for context:', context);
    ctx.postMessage({ type: 'start', context });
  };

  // Complete callback
  const postComplete = (context?: string) => {
    console.log('Worker: Processing completed for context:', context);
    ctx.postMessage({ type: 'complete', context });
  };

  // Error callback
  const postError = (error: string, context?: string) => {
    console.error('Worker: Error occurred:', error, 'Context:', context);
    ctx.postMessage({ type: 'error', error, context });
  };

  try {
    switch (type) {
      case 'getMetadata': {
        postStart('getMetadata');
        console.log('Worker: Starting metadata extraction for:', file.name);
        
        try {
          const meta: VideoMetadata = await processor.getMetadata(file);
          console.log('Worker: Metadata extraction completed:', meta);
          ctx.postMessage({ type: 'metadata', meta });
          postComplete('getMetadata');
        } catch (error) {
          const errorMsg = `Metadata extraction failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'getMetadata');
          throw error;
        }
        break;
      }
      case 'generateThumbnail': {
        postStart('generateThumbnail');
        console.log('Worker: Starting thumbnail generation for:', file.name, 'at timestamp:', timestamp);
        
        try {
          const thumb: ThumbnailResult = await processor.generateThumbnail(file, timestamp);
          console.log('Worker: Thumbnail generation completed:', thumb);
          ctx.postMessage({ type: 'thumbnail', thumb });
          postComplete('generateThumbnail');
        } catch (error) {
          const errorMsg = `Thumbnail generation failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'generateThumbnail');
          throw error;
        }
        break;
      }
      case 'convertFormat': {
        postStart('convertFormat');
        console.log('Worker: Starting format conversion for:', file.name, 'to format:', options?.format);
        
        try {
          const converted: File = await processor.convertFormat(file, {
            ...(options as ConvertOptions),
            onProgress: (p) => postProgress(p, 'convertFormat'),
          });
          console.log('Worker: Format conversion completed:', converted.name);
          ctx.postMessage({ type: 'converted', converted });
          postComplete('convertFormat');
        } catch (error) {
          const errorMsg = `Format conversion failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'convertFormat');
          throw error;
        }
        break;
      }
      case 'splitVideo': {
        postStart('splitVideo');
        console.log('Worker: Starting video splitting for:', file.name, 'with segments:', options?.segments?.length);
        
        try {
          const segments: File[] = await processor.splitVideo(file, {
            ...(options as SplitOptions),
            onProgress: (p) => postProgress(p, 'splitVideo'),
          });
          console.log('Worker: Video splitting completed, segments:', segments.length);
          ctx.postMessage({ type: 'segments', segments });
          postComplete('splitVideo');
        } catch (error) {
          const errorMsg = `Video splitting failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'splitVideo');
          throw error;
        }
        break;
      }
      case 'detectScenes': {
        postStart('detectScenes');
        console.log('Worker: Starting scene detection for:', file.name);
        
        try {
          // Advanced scene detection
          const boundaries = await detectScenes(processor['ffmpeg'], file, options as SceneDetectionOptions);
          console.log('Worker: Scene detection completed, boundaries:', boundaries.length);
          ctx.postMessage({ type: 'scenes', boundaries });
          postComplete('detectScenes');
        } catch (error) {
          const errorMsg = `Scene detection failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'detectScenes');
          throw error;
        }
        break;
      }
      case 'generateClips': {
        postStart('generateClips');
        console.log('Worker: Starting clip generation for:', file.name);
        
        try {
          // Batch clip generation for platform presets
          // scenes: array of SceneBoundary, platformPreset: { aspect, scale, name }, manualTimestamps: number[]
          const mergedScenes = adjustScenes(scenes, manualTimestamps).map(s => s.timestamp);
          const boundaries = mergedScenes
            .map((ts, i, arr) => {
              const start = ts;
              const end = arr[i + 1] ? arr[i + 1] : null;
              return { start, end };
            })
            .filter(b => b.end !== null)
            .map(b => ({ start: b.start, end: b.end as number }));
          
          let allClips: { url: string; aspect: string; start: number; end: number; thumbnail?: string; platform?: string }[] = [];
          const { aspect, scale, name: platform } = platformPreset;
          
          for (const [i, seg] of boundaries.entries()) {
            try {
              console.log('Worker: Processing clip', i + 1, 'of', boundaries.length);
              
              // Split video segment
              const segmentFiles = await processor.splitVideo(file, {
                segments: [{ start: seg.start, end: seg.end }],
                onProgress: (p) => postProgress((i + p) / boundaries.length, 'generateClips'),
              });
              const url = URL.createObjectURL(segmentFiles[0]);
              
              // Generate thumbnail
              const thumbResult = await processor.generateThumbnail(file, seg.start);
              const thumbnail = thumbResult.url;
              
              allClips.push({ url, aspect, start: seg.start, end: seg.end, thumbnail, platform });
              postProgress((i + 1) / boundaries.length, 'generateClips');
            } catch (clipErr) {
              const errorMsg = `Clip ${i + 1} (${aspect}) failed: ${clipErr instanceof Error ? clipErr.message : String(clipErr)}`;
              console.error('Worker:', errorMsg);
              ctx.postMessage({ type: 'clipError', error: errorMsg });
            }
          }
          
          console.log('Worker: Clip generation completed, clips:', allClips.length);
          ctx.postMessage({ type: 'clips', clips: allClips });
          postComplete('generateClips');
        } catch (error) {
          const errorMsg = `Clip generation failed: ${error instanceof Error ? error.message : String(error)}`;
          postError(errorMsg, 'generateClips');
          throw error;
        }
        break;
      }
      default:
        const errorMsg = `Unknown command: ${type}`;
        console.error('Worker:', errorMsg);
        postError(errorMsg);
    }
  } catch (error) {
    const errorMsg = `Worker error: ${error instanceof Error ? error.message : String(error)}`;
    console.error('Worker: Unhandled error:', error);
    postError(errorMsg);
  }
};
