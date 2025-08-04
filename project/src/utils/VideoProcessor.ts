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
    console.log('VideoProcessor: Constructor called');
    try {
      this.ffmpeg = new FFmpeg();
      console.log('VideoProcessor: FFmpeg instance created successfully');
    } catch (error) {
      console.error('VideoProcessor: Failed to create FFmpeg instance:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    console.log('VideoProcessor: Loading FFmpeg');
    if (!this.loaded) {
      try {
        await this.ffmpeg.load();
        this.loaded = true;
        console.log('VideoProcessor: FFmpeg loaded successfully');
      } catch (error) {
        console.error('VideoProcessor: Failed to load FFmpeg:', error);
        throw error;
      }
    }
  }

  async writeFile(file: File, name: string): Promise<void> {
    console.log('VideoProcessor: Writing file to FFmpeg:', name, 'size:', file.size);
    await this.load();
    
    try {
      const buffer = await file.arrayBuffer();
      console.log('VideoProcessor: File converted to ArrayBuffer, size:', buffer.byteLength);
      
      await this.ffmpeg.writeFile(name, new Uint8Array(buffer));
      console.log('VideoProcessor: File written to FFmpeg successfully');
    } catch (error) {
      console.error('VideoProcessor: Failed to write file to FFmpeg:', error);
      throw error;
    }
  }

  async getMetadata(file: File): Promise<VideoMetadata> {
    console.log('VideoProcessor: Getting metadata for file:', file.name);
    const name = file.name;
    
    try {
      await this.writeFile(file, name);
      console.log('VideoProcessor: File written, getting duration');
      
      // Get duration
      await this.ffmpeg.ffprobe([
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        name,
        '-o', 'output.txt',
      ]);
      console.log('VideoProcessor: Duration probe completed');
      
      const durationData = await this.ffmpeg.readFile('output.txt');
      let durationStr: string;
      if (typeof durationData === 'string') {
        durationStr = durationData;
      } else {
        durationStr = new TextDecoder('utf-8').decode(durationData);
      }
      const duration = parseFloat(durationStr);
      console.log('VideoProcessor: Duration extracted:', duration);
      
      // Get video stream info
      console.log('VideoProcessor: Getting video stream info');
      await this.ffmpeg.ffprobe([
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate',
        '-of', 'default=noprint_wrappers=1',
        name,
        '-o', 'stream.txt',
      ]);
      console.log('VideoProcessor: Stream probe completed');
      
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
      
      const metadata = { duration, width, height, framerate };
      console.log('VideoProcessor: Metadata extracted successfully:', metadata);
      return metadata;
    } catch (error) {
      console.error('VideoProcessor: Failed to get metadata:', error);
      throw error;
    }
  }

  async generateThumbnail(file: File, timestamp: number): Promise<ThumbnailResult> {
    console.log('VideoProcessor: Generating thumbnail for file:', file.name, 'at timestamp:', timestamp);
    const name = file.name;
    
    try {
      await this.writeFile(file, name);
      const output = `thumb_${timestamp}.jpg`;
      
      console.log('VideoProcessor: Executing thumbnail generation command');
      await this.ffmpeg.exec([
        '-ss', String(timestamp),
        '-i', name,
        '-frames:v', '1',
        '-q:v', '2',
        output
      ]);
      console.log('VideoProcessor: Thumbnail generation command completed');
      
      const data = await this.ffmpeg.readFile(output);
      console.log('VideoProcessor: Thumbnail data read, size:', data instanceof Uint8Array ? data.length : 'string');
      
      const url = URL.createObjectURL(new Blob([data], { type: 'image/jpeg' }));
      const result = { timestamp, url };
      console.log('VideoProcessor: Thumbnail generated successfully:', result);
      return result;
    } catch (error) {
      console.error('VideoProcessor: Failed to generate thumbnail:', error);
      throw error;
    }
  }

  async convertFormat(file: File, options: ConvertOptions): Promise<File> {
    console.log('VideoProcessor: Converting format for file:', file.name, 'to format:', options.format);
    const name = file.name;
    
    try {
      await this.writeFile(file, name);
      const output = `converted.${options.format}`;
      
      console.log('VideoProcessor: Executing format conversion command');
      await this.ffmpeg.exec(['-i', name, output]);
      console.log('VideoProcessor: Format conversion command completed');
      
      const data = await this.ffmpeg.readFile(output);
      console.log('VideoProcessor: Converted file data read, size:', data instanceof Uint8Array ? data.length : 'string');
      
      const convertedFile = new File([data], output, { type: `video/${options.format}` });
      console.log('VideoProcessor: Format conversion completed successfully:', convertedFile.name);
      return convertedFile;
    } catch (error) {
      console.error('VideoProcessor: Failed to convert format:', error);
      throw error;
    }
  }

  async splitVideo(file: File, options: SplitOptions): Promise<File[]> {
    console.log('VideoProcessor: Splitting video for file:', file.name, 'with segments:', options.segments.length);
    const name = file.name;
    
    try {
      await this.writeFile(file, name);
      const results: File[] = [];
      
      for (const [i, seg] of options.segments.entries()) {
        console.log('VideoProcessor: Processing segment', i + 1, 'of', options.segments.length, ':', seg);
        const output = `segment_${i}.mp4`;
        
        console.log('VideoProcessor: Executing split command for segment', i + 1);
        await this.ffmpeg.exec([
          '-i', name,
          '-ss', String(seg.start),
          '-to', String(seg.end),
          '-c', 'copy',
          output
        ]);
        console.log('VideoProcessor: Split command completed for segment', i + 1);
        
        const data = await this.ffmpeg.readFile(output);
        console.log('VideoProcessor: Segment data read, size:', data instanceof Uint8Array ? data.length : 'string');
        
        const segmentFile = new File([data], output, { type: 'video/mp4' });
        results.push(segmentFile);
        
        if (options.onProgress) {
          const progress = (i + 1) / options.segments.length;
          console.log('VideoProcessor: Progress update:', progress);
          options.onProgress(progress);
        }
      }
      
      console.log('VideoProcessor: Video splitting completed successfully, segments:', results.length);
      return results;
    } catch (error) {
      console.error('VideoProcessor: Failed to split video:', error);
      throw error;
    }
  }
}
