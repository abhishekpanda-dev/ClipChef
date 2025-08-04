// VideoProcessor.ts
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

export interface ConvertOptions {
  format: string;
  onProgress?: (progress: number) => void;
}

export interface SplitOptions {
  segments: Array<{ start: number; end: number }>;
  onProgress?: (progress: number) => void;
}

export class VideoProcessor {
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(): Promise<void> {
    if (!this.loaded) {
      await this.ffmpeg.load();
      this.loaded = true;
    }
  }

  async writeFile(file: File, name: string): Promise<void> {
    await this.load();
    const buffer = await file.arrayBuffer();
    await this.ffmpeg.writeFile(name, new Uint8Array(buffer));
  }

  async getMetadata(file: File): Promise<VideoMetadata> {
    const name = file.name;
    await this.writeFile(file, name);
    // Get duration
    await this.ffmpeg.ffprobe([
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      name,
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
    // Get video stream info
    await this.ffmpeg.ffprobe([
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate',
      '-of', 'default=noprint_wrappers=1',
      name,
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

  async generateThumbnail(file: File, timestamp: number): Promise<ThumbnailResult> {
    const name = file.name;
    await this.writeFile(file, name);
    const output = `thumb_${timestamp}.jpg`;
    await this.ffmpeg.exec([
      '-ss', String(timestamp),
      '-i', name,
      '-frames:v', '1',
      '-q:v', '2',
      output
    ]);
    const data = await this.ffmpeg.readFile(output);
    const url = URL.createObjectURL(new Blob([data], { type: 'image/jpeg' }));
    return { timestamp, url };
  }

  async convertFormat(file: File, options: ConvertOptions): Promise<File> {
    const name = file.name;
    await this.writeFile(file, name);
    const output = `converted.${options.format}`;
    await this.ffmpeg.exec(['-i', name, output]);
    const data = await this.ffmpeg.readFile(output);
    return new File([data], output, { type: `video/${options.format}` });
  }

  async splitVideo(file: File, options: SplitOptions): Promise<File[]> {
    const name = file.name;
    await this.writeFile(file, name);
    const results: File[] = [];
    for (const [i, seg] of options.segments.entries()) {
      const output = `segment_${i}.mp4`;
      await this.ffmpeg.exec([
        '-i', name,
        '-ss', String(seg.start),
        '-to', String(seg.end),
        '-c', 'copy',
        output
      ]);
      const data = await this.ffmpeg.readFile(output);
      results.push(new File([data], output, { type: 'video/mp4' }));
      if (options.onProgress) options.onProgress((i + 1) / options.segments.length);
    }
    return results;
  }
}
