// ProcessingStatus.tsx
import React from 'react';

export type ProcessingStatusType = 'queued' | 'processing' | 'completed' | 'failed';

export interface ProcessingStatusProps {
  status: ProcessingStatusType;
  progress?: number; // 0-1
  error?: string;
  estimatedTime?: string;
  onRetry?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, progress, error, estimatedTime, onRetry }) => {
  let statusText = '';
  let color = '';
  switch (status) {
    case 'queued':
      statusText = 'Queued';
      color = 'text-yellow-500';
      break;
    case 'processing':
      statusText = 'Processing';
      color = 'text-blue-600';
      break;
    case 'completed':
      statusText = 'Completed';
      color = 'text-green-600';
      break;
    case 'failed':
      statusText = 'Failed';
      color = 'text-red-600';
      break;
  }
  return (
    <div className={`flex flex-col space-y-1 ${color}`}>
      <span className="font-semibold">{statusText}</span>
      {status === 'processing' && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(progress ?? 0) * 100}%` }} />
        </div>
      )}
      {estimatedTime && status === 'processing' && (
        <span className="text-xs text-gray-500">Est. time: {estimatedTime}</span>
      )}
      {error && status === 'failed' && (
        <span className="text-xs text-red-500">{error}</span>
      )}
      {status === 'failed' && onRetry && (
        <button className="text-xs text-blue-600 underline" onClick={onRetry}>Retry</button>
      )}
    </div>
  );
};
