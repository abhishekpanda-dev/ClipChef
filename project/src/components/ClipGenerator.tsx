// ClipGenerator.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SceneBoundary, adjustScenes } from '../utils/sceneDetection';
import { PLATFORM_PRESETS } from '../types';
import useVideoProcessorWorker from '../hooks/useVideoProcessorWorker';

interface ClipGeneratorProps {
  videoFile: File;
  scenes: SceneBoundary[];
  onClipsGenerated?: (clips: { url: string; aspect: string; start: number; end: number; thumbnail?: string; platform?: string }[]) => void;
}

export const ClipGenerator: React.FC<ClipGeneratorProps> = ({ videoFile, scenes, onClipsGenerated }) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clips, setClips] = useState<{ url: string; aspect: string; start: number; end: number; thumbnail?: string; platform?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [manualTimestamps, setManualTimestamps] = useState<number[]>([]);
  const [selectedScenes] = useState<number[]>(scenes.map(s => s.timestamp));
  const [newTimestamp, setNewTimestamp] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(PLATFORM_PRESETS[0]);
  const workerRef = useRef<Worker | null>(null);
  const [stage, setStage] = useState<string>('Idle');
  const [sceneSensitivity, setSceneSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [detectedScenes, setDetectedScenes] = useState<SceneBoundary[]>(scenes);
  const [sceneThumbnails, setSceneThumbnails] = useState<{ timestamp: number; url: string }[]>([]);
  const { sendToWorker, workerStatus, workerProgress, workerResult, workerErrorMsg, cleanupWorker } = useVideoProcessorWorker(workerRef);

  // Advanced scene detection with sensitivity
  const handleDetectScenes = async () => {
    setStage('Detecting scenes...');
    setProcessing(true);
    setError(null);
    setWorkerError(null);
    setProgress(0);
    const threshold = sceneSensitivity === 'high' ? 0.2 : sceneSensitivity === 'low' ? 0.6 : 0.4;
    sendToWorker({
      type: 'detectScenes',
      file: videoFile,
      options: { threshold, minSceneLength: 2 },
    });
  };

  // Generate thumbnails for each detected scene
  useEffect(() => {
    if (workerResult?.type === 'scenes') {
      setDetectedScenes(workerResult.boundaries);
      setStage('Generating scene thumbnails...');
      // Generate thumbnails for each scene
      const promises = workerResult.boundaries.map((scene: SceneBoundary) =>
        new Promise<{ timestamp: number; url: string }>((resolve) => {
          sendToWorker({ type: 'generateThumbnail', file: videoFile, timestamp: scene.timestamp });
          // Listen for thumbnail result
          const handler = (e: MessageEvent) => {
            if (e.data.type === 'thumbnail' && e.data.thumb.timestamp === scene.timestamp) {
              resolve({ timestamp: scene.timestamp, url: e.data.thumb.url });
              workerRef.current?.removeEventListener('message', handler);
            }
          };
          workerRef.current?.addEventListener('message', handler);
        })
      );
      Promise.all(promises).then(setSceneThumbnails);
    }
  }, [workerResult]);

  // Generate clips for selected platform
  const handleGenerateClips = async () => {
    setStage('Generating clips...');
    setProcessing(true);
    setError(null);
    setWorkerError(null);
    setProgress(0);
    // Merge detected and manual scenes, sort and deduplicate
    const mergedScenes = adjustScenes(
      detectedScenes.filter(s => selectedScenes.includes(s.timestamp)),
      manualTimestamps
    );
    sendToWorker({
      type: 'generateClips',
      file: videoFile,
      scenes: mergedScenes,
      platformPreset: selectedPreset,
      manualTimestamps,
    });
  };

  // Listen for worker progress and results
  useEffect(() => {
    if (workerProgress) setProgress(workerProgress.progress);
    if (workerStatus) setStage(workerStatus.context || 'Processing...');
    if (workerResult?.type === 'clips') {
      setClips(workerResult.clips);
      setProcessing(false);
      setStage('Complete');
      if (onClipsGenerated) onClipsGenerated(workerResult.clips);
      cleanupWorker();
    }
    if (workerErrorMsg) {
      setWorkerError(workerErrorMsg);
      setProcessing(false);
      setStage('Error');
    }
  }, [workerProgress, workerResult, workerErrorMsg, workerStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="font-bold">Processing Stage: {stage}</div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.round(progress * 100)}%` }}></div>
        </div>
        {processing && <div className="text-xs text-gray-500">{Math.round(progress * 100)}% complete</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        {workerError && <div className="text-red-500">Worker Error: {workerError}</div>}
      </div>
      <div className="flex gap-2 items-center">
        <label>Sensitivity:</label>
        <select value={sceneSensitivity} onChange={e => setSceneSensitivity(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-primary ml-2" onClick={handleDetectScenes} disabled={processing}>Detect Scenes</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {sceneThumbnails.map(thumb => (
          <div key={thumb.timestamp} className="flex flex-col items-center">
            <img src={thumb.url} alt={`Scene ${thumb.timestamp}`} className="w-24 h-16 object-cover border" />
            <span className="text-xs">{thumb.timestamp.toFixed(2)}s</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center mt-4">
        <label>Platform Preset:</label>
        <select value={selectedPreset.name} onChange={e => setSelectedPreset(PLATFORM_PRESETS.find(p => p.name === e.target.value) || PLATFORM_PRESETS[0])} className="border rounded px-2 py-1">
          {PLATFORM_PRESETS.map(preset => (
            <option key={preset.name} value={preset.name}>{preset.name}</option>
          ))}
        </select>
        <button className="btn btn-primary ml-2" onClick={handleGenerateClips} disabled={processing}>Generate Clips</button>
      </div>
      <div className="flex flex-wrap gap-4 mt-4">
        {clips.map((clip, idx) => (
          <div key={idx} className="border rounded p-2 w-48">
            <video src={clip.url} controls className="w-full h-32 object-cover" />
            <div className="text-xs">{clip.platform} | {clip.aspect}</div>
            <div className="text-xs">{clip.start.toFixed(2)}s - {clip.end.toFixed(2)}s</div>
            {clip.thumbnail && <img src={clip.thumbnail} alt="Thumbnail" className="w-24 h-16 object-cover mt-1" />}
          </div>
        ))}
      </div>
      {/* Manual scene adjustment UI */}
      <div className="mt-4">
        <div className="font-bold">Manual Scene Boundaries</div>
        <div className="flex gap-2 items-center mt-2">
          <input type="number" value={newTimestamp} onChange={e => setNewTimestamp(e.target.value)} className="border rounded px-2 py-1 w-24" placeholder="Timestamp (s)" />
          <button className="btn btn-secondary" onClick={() => {
            if (newTimestamp && !isNaN(Number(newTimestamp))) {
              setManualTimestamps([...manualTimestamps, Number(newTimestamp)]);
              setNewTimestamp('');
            }
          }}>Add</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {manualTimestamps.map((ts, idx) => (
            <div key={idx} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
              <span>{ts.toFixed(2)}s</span>
              <button className="text-red-500" onClick={() => setManualTimestamps(manualTimestamps.filter(t => t !== ts))}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
