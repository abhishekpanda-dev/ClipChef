import React, { useState } from 'react';
// Removed unused lucide-react icon imports
import { ProcessingStatus } from './ProcessingStatus';

// Example data, replace with real uploads from state/api
import type { ProcessingStatusType } from './ProcessingStatus';

const initialUploads: Array<{
  id: string;
  name: string;
  thumbnail: string;
  status: ProcessingStatusType;
  createdAt: string;
  duration: string;
  size: string;
  progress: number;
  error: string;
  estimatedTime: string;
  result: null | { url: string; thumbnail: string };
}> = [
  {
    id: '1',
    name: 'Podcast Episode 12.mp4',
    thumbnail: '/thumbnails/podcast12.jpg',
    status: 'completed',
    createdAt: '2025-08-03',
    duration: '12:34',
    size: '320MB',
    progress: 1,
    error: '',
    estimatedTime: '',
    result: { url: '/clips/podcast12.mp4', thumbnail: '/thumbnails/podcast12.jpg' },
  },
  {
    id: '2',
    name: 'Vlog.mov',
    thumbnail: '/thumbnails/vlog.jpg',
    status: 'processing',
    createdAt: '2025-08-04',
    duration: '08:21',
    size: '210MB',
    progress: 0.5,
    error: '',
    estimatedTime: '2m 30s',
    result: null,
  },
  {
    id: '3',
    name: 'Tutorial.webm',
    thumbnail: '/thumbnails/tutorial.jpg',
    status: 'failed',
    createdAt: '2025-08-02',
    duration: '15:10',
    size: '410MB',
    progress: 0.8,
    error: 'Network error',
    estimatedTime: '',
    result: null,
  },
];

// Remove statusMap, use ProcessingStatus instead

const RecentUploads: React.FC = () => {
  const [uploads, setUploads] = useState(initialUploads);

  // Retry handler for failed jobs
  const handleRetry = (id: string) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? { ...upload, status: 'processing', error: '', progress: 0, estimatedTime: '2m 00s' }
        : upload
    ));
    // TODO: Trigger actual retry logic (API call, etc.)
  };

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Uploads</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploads.map((upload) => (
          <div key={upload.id} className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-4 flex flex-col">
            <img src={upload.thumbnail} alt={upload.name} className="rounded-lg h-40 w-full object-cover mb-3" />
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{upload.name}</span>
              <ProcessingStatus
                status={upload.status}
                progress={upload.progress}
                error={upload.error}
                estimatedTime={upload.estimatedTime}
                onRetry={upload.status === 'failed' ? () => handleRetry(upload.id) : undefined}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{upload.createdAt}  {upload.duration}  {upload.size}</div>
            {upload.result && upload.status === 'completed' && (
              <div className="mt-2 flex items-center space-x-2">
                <a href={upload.result.url} download className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Download Clip</a>
                <a href={upload.result.thumbnail} download className="bg-gray-200 text-blue-600 px-2 py-1 rounded text-xs">Download Thumbnail</a>
              </div>
            )}
            <button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">View Details</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentUploads;
