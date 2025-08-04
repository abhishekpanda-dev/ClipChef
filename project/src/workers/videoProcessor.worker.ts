// videoProcessor.worker.ts
import { VideoProcessor, ConvertOptions, SplitOptions, ThumbnailResult, VideoMetadata } from '../utils/VideoProcessor';
import { detectScenes, SceneDetectionOptions, adjustScenes } from '../utils/sceneDetection';

const ctx: Worker = self as any;
let processor: VideoProcessor | null = null;


ctx.onmessage = async (event) => {
  const { type, file, options, timestamp, scenes, platformPreset, manualTimestamps } = event.data;
  if (!processor) processor = new VideoProcessor();

  // Progress callback
  const postProgress = (progress: number, context?: string) => {
    ctx.postMessage({ type: 'progress', progress, context });
  };

  try {
    switch (type) {
      case 'getMetadata': {
        const meta: VideoMetadata = await processor.getMetadata(file);
        ctx.postMessage({ type: 'metadata', meta });
        break;
      }
      case 'generateThumbnail': {
        const thumb: ThumbnailResult = await processor.generateThumbnail(file, timestamp);
        ctx.postMessage({ type: 'thumbnail', thumb });
        break;
      }
      case 'convertFormat': {
        const converted: File = await processor.convertFormat(file, {
          ...(options as ConvertOptions),
          onProgress: (p) => postProgress(p, 'convertFormat'),
        });
        ctx.postMessage({ type: 'converted', converted });
        break;
      }
      case 'splitVideo': {
        const segments: File[] = await processor.splitVideo(file, {
          ...(options as SplitOptions),
          onProgress: (p) => postProgress(p, 'splitVideo'),
        });
        ctx.postMessage({ type: 'segments', segments });
        break;
      }
      case 'detectScenes': {
        // Advanced scene detection
        const boundaries = await detectScenes(processor['ffmpeg'], file, options as SceneDetectionOptions);
        ctx.postMessage({ type: 'scenes', boundaries });
        break;
      }
      case 'generateClips': {
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
            ctx.postMessage({ type: 'clipError', error: `Clip ${i + 1} (${aspect}) failed: ${clipErr instanceof Error ? clipErr.message : String(clipErr)}` });
          }
        }
        ctx.postMessage({ type: 'clips', clips: allClips });
        break;
      }
      default:
        ctx.postMessage({ type: 'error', error: 'Unknown command' });
    }
  } catch (error) {
    ctx.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};
