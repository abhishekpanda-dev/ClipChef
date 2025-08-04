import React from 'react';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

// Example data, replace with real uploads from state/api
const uploads = [
  {
    id: '1',
    name: 'Podcast Episode 12.mp4',
    thumbnail: '/thumbnails/podcast12.jpg',
    status: 'completed',
    createdAt: '2025-08-03',
    duration: '12:34',
    size: '320MB',
  },
  {
    id: '2',
    name: 'Vlog.mov',
    thumbnail: '/thumbnails/vlog.jpg',
    status: 'processing',
    createdAt: '2025-08-04',
    duration: '08:21',
    size: '210MB',
  },
  {
    id: '3',
    name: 'Tutorial.webm',
    thumbnail: '/thumbnails/tutorial.jpg',
    status: 'failed',
    createdAt: '2025-08-02',
    duration: '15:10',
    size: '410MB',
  },
];

const statusMap: Record<string, React.JSX.Element> = {
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  processing: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  queued: <Clock className="h-5 w-5 text-yellow-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
};

const RecentUploads: React.FC = () => (
  <section>
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Uploads</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload) => (
        <div key={upload.id} className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-4 flex flex-col">
          <img src={upload.thumbnail} alt={upload.name} className="rounded-lg h-40 w-full object-cover mb-3" />
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{upload.name}</span>
            {statusMap[upload.status]}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{upload.createdAt} • {upload.duration} • {upload.size}</div>
          <button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">View Details</button>
        </div>
      ))}
    </div>
  </section>
);

export default RecentUploads;
