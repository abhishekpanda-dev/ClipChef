import React, { useState, useEffect } from 'react';
import { UploadFile } from './FileUpload';
import { XCircle, RefreshCw, X, Image, CheckCircle, Loader2, Clock } from 'lucide-react';

interface UploadQueueItemProps {
  item: UploadFile;
  index: number;
  onRetry: (index: number) => void;
  onCancel: (index: number) => void;
  onProgressUpdate: (index: number, progress: number) => void;
  onStatusUpdate: (index: number, status: UploadFile['status'], error?: string) => void;
}

const UploadQueueItem: React.FC<UploadQueueItemProps> = ({
  item,
  index,
  onRetry,
  onCancel,
  onProgressUpdate,
  onStatusUpdate,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Add log message
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('UploadQueueItem:', logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Listen for status changes and add logs
  useEffect(() => {
    addLog(`Status changed to: ${item.status}`);
    
    if (item.error) {
      addLog(`Error: ${item.error}`);
    }
    
    if (item.processingProgress !== undefined) {
      addLog(`Processing progress: ${item.processingProgress}%`);
    }
  }, [item.status, item.error, item.processingProgress]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return `Processing... ${item.processingProgress || 0}%`;
      case 'queued':
        return 'Queued';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="thumbnail" className="h-12 w-16 object-cover rounded" />
          ) : item.preview ? (
            <img src={item.preview} alt="preview" className="h-12 w-16 object-cover rounded" />
          ) : (
            <Image className="h-12 w-12 text-gray-300" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
              {item.file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(item.file.size)}
            </p>
            {item.metadata && (
              <p className="text-xs text-blue-500 mt-1">
                {`Duration: ${item.metadata.duration}s | ${item.metadata.width}x${item.metadata.height} | FPS: ${item.metadata.framerate}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {(item.status === 'processing' || item.status === 'uploading') && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${item.processingProgress || item.progress || 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Progress</span>
            <span>{item.processingProgress || item.progress || 0}%</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {item.error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{item.error}</p>
        </div>
      )}

      {/* Debug Logs (temporarily shown) */}
      <div className="mb-3">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showLogs ? 'Hide' : 'Show'} Debug Logs ({logs.length})
        </button>
        {showLogs && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {item.status === 'failed' && (
            <button
              onClick={() => {
                addLog('Retry button clicked');
                onRetry(index);
              }}
              className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Retry</span>
            </button>
          )}
        </div>
        <button
          onClick={() => {
            addLog('Cancel button clicked');
            onCancel(index);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UploadQueueItem;