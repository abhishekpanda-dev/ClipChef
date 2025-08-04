import { FFmpeg } from '@ffmpeg/ffmpeg';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  framerate: number;
}

export interface ThumbnailResult {
  timestamp: number;
  url: string;
}

export interface SegmentResult {
  start: number;
  end: number;
  url: string;
}

export type VideoProcessorProgress = {
  step: string;
  percent: number;
};

export class VideoProcessor {
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(onProgress?: (progress: VideoProcessorProgress) => void) {
    if (!this.loaded) {
      if (onProgress) {
        this.ffmpeg.on('progress', (data: any) => {
          onProgress({ step: 'loading', percent: Math.round((data.ratio || 0) * 100) });
        });
      }
      await this.ffmpeg.load();
      this.loaded = true;
    }
  }

  async writeFile(file: File, name = 'input.mp4') {
    const buffer = await file.arrayBuffer();
    await this.ffmpeg.writeFile(name, new Uint8Array(buffer));
  }

  async getMetadata(file: File): Promise<VideoMetadata> {
    await this.load();
    await this.writeFile(file);
    // Use ffprobe to get duration
    await this.ffmpeg.ffprobe([
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      'input.mp4',
      '-o', 'output.txt',
    ]);
    const durationData = await this.ffmpeg.readFile('output.txt');
    let durationStr: string;
    if (typeof durationData === 'string') {
      durationStr = durationData;
    } else {
      durationStr = new TextDecoder('utf-8').decode(durationData);
    }
    const duration = parseFloat(durationStr);
    // Use ffprobe to get video stream info
    await this.ffmpeg.ffprobe([
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate',
      '-of', 'default=noprint_wrappers=1',
      'input.mp4',
      '-o', 'stream.txt',
    ]);
    const streamData = await this.ffmpeg.readFile('stream.txt');
    let streamInfo: string;
    if (typeof streamData === 'string') {
      streamInfo = streamData;
    } else {
      streamInfo = new TextDecoder('utf-8').decode(streamData);
    }
    let width = 0, height = 0, framerate = 0;
    const widthMatch = streamInfo.match(/width=(\d+)/);
    const heightMatch = streamInfo.match(/height=(\d+)/);
    const frMatch = streamInfo.match(/r_frame_rate=(\d+\/?\d*)/);
    if (widthMatch) width = parseInt(widthMatch[1]);
    if (heightMatch) height = parseInt(heightMatch[1]);
    if (frMatch) {
      const frStr = frMatch[1];
      if (frStr.includes('/')) {
        const [num, den] = frStr.split('/').map(Number);
        framerate = num / den;
      } else {
        framerate = parseFloat(frStr);
      }
    }
    return { duration, width, height, framerate };
  }

  async generateThumbnails(file: File, timestamps: number[]): Promise<ThumbnailResult[]> {
    await this.load();
    await this.writeFile(file);
    const results: ThumbnailResult[] = [];
    for (const ts of timestamps) {
      const outName = `thumb_${ts}.jpg`;
      await this.ffmpeg.exec([
        '-ss', ts.toString(),
        '-i', 'input.mp4',
        '-frames:v', '1',
        '-q:v', '2',
        outName
      ]);
      const data = await this.ffmpeg.readFile(outName);
      const url = URL.createObjectURL(new Blob([data], { type: 'image/jpeg' }));
      results.push({ timestamp: ts, url });
    }
    return results;
  }

  async convertFormat(file: File, format: string): Promise<string> {
    await this.load();
    await this.writeFile(file);
    const outName = `output.${format}`;
    await this.ffmpeg.exec(['-i', 'input.mp4', outName]);
    const data = await this.ffmpeg.readFile(outName);
    return URL.createObjectURL(new Blob([data], { type: `video/${format}` }));
  }

  async splitSegments(file: File, segments: { start: number; end: number }[]): Promise<SegmentResult[]> {
    await this.load();
    await this.writeFile(file);
    const results: SegmentResult[] = [];
    for (const seg of segments) {
      const outName = `segment_${seg.start}_${seg.end}.mp4`;
      await this.ffmpeg.exec([
        '-ss', seg.start.toString(),
        '-to', seg.end.toString(),
        '-i', 'input.mp4',
        '-c', 'copy',
        outName
      ]);
      const data = await this.ffmpeg.readFile(outName);
      const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      results.push({ start: seg.start, end: seg.end, url });
    }
    return results;
  }
}
