// videoProcessor.worker.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ctx: Worker = self as any;
const ffmpeg = new FFmpeg();
let loaded = false;

ctx.onmessage = async (e) => {
  const { type, file, args, timestamps, segments } = e.data;
  try {
    if (!loaded) {
      await ffmpeg.load();
      loaded = true;
    }
    // Helper to write file
    async function writeFile(file: File, name: string) {
      const buffer = await file.arrayBuffer();
      await ffmpeg.writeFile(name, new Uint8Array(buffer));
    }
    if (type === 'metadata') {
      await writeFile(file, 'input.mp4');
      await ffmpeg.ffprobe([
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        'input.mp4',
        '-o', 'output.txt',
      ]);
      const durationData = await ffmpeg.readFile('output.txt');
      let durationStr: string;
      if (typeof durationData === 'string') {
        durationStr = durationData;
      } else {
        durationStr = new TextDecoder('utf-8').decode(durationData);
      }
      const duration = parseFloat(durationStr);
      await ffmpeg.ffprobe([
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate',
        '-of', 'default=noprint_wrappers=1',
        'input.mp4',
        '-o', 'stream.txt',
      ]);
      const streamData = await ffmpeg.readFile('stream.txt');
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
      ctx.postMessage({ type: 'metadata', data: { duration, width, height, framerate } });
    } else if (type === 'thumbnails') {
      await writeFile(file, 'input.mp4');
      const results = [];
      for (const ts of timestamps) {
        const outName = `thumb_${ts}.jpg`;
        await ffmpeg.exec([
          '-ss', ts.toString(),
          '-i', 'input.mp4',
          '-frames:v', '1',
          '-q:v', '2',
          outName
        ]);
        const data = await ffmpeg.readFile(outName);
        const url = URL.createObjectURL(new Blob([data], { type: 'image/jpeg' }));
        results.push({ timestamp: ts, url });
      }
      ctx.postMessage({ type: 'thumbnails', data: results });
    } else if (type === 'convert') {
      await writeFile(file, 'input.mp4');
      await ffmpeg.exec(['-i', 'input.mp4', `output.${args.format}`]);
      const data = await ffmpeg.readFile(`output.${args.format}`);
      const url = URL.createObjectURL(new Blob([data], { type: `video/${args.format}` }));
      ctx.postMessage({ type: 'convert', data: url });
    } else if (type === 'split') {
      await writeFile(file, 'input.mp4');
      const results = [];
      for (const seg of segments) {
        const outName = `segment_${seg.start}_${seg.end}.mp4`;
        await ffmpeg.exec([
          '-ss', seg.start.toString(),
          '-to', seg.end.toString(),
          '-i', 'input.mp4',
          '-c', 'copy',
          outName
        ]);
        const data = await ffmpeg.readFile(outName);
        const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        results.push({ start: seg.start, end: seg.end, url });
      }
      ctx.postMessage({ type: 'split', data: results });
    }
  } catch (err) {
    ctx.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) });
  }
};
