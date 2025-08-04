import React, { useState, useRef } from 'react';
import { Upload, File, X, RefreshCw, Image } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

const ACCEPTED_FORMATS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
const MAX_SIZE_MB = 500;

interface UploadFile {
  file: File;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ACCEPTED_FORMATS.includes(ext)) {
      return `Unsupported format: .${ext}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large (max ${MAX_SIZE_MB}MB)`;
    }
    return null;
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) return resolve(undefined);
      const url = URL.createObjectURL(file);
      resolve(url);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    setGlobalError(null);
    const newQueue: UploadFile[] = [];
    for (const file of files) {
      const error = validateFile(file);
      const preview = await generatePreview(file);
      newQueue.push({ file, status: error ? 'failed' : 'queued', progress: 0, error: error ?? undefined, preview });
    }
    setUploadQueue((prev) => [...prev, ...newQueue]);
  };

  const removeFile = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  const retryFile = (index: number) => {
    setUploadQueue(prev => prev.map((item, i) => i === index ? { ...item, status: 'queued', error: undefined } : item));
  };

  const cancelFile = (index: number) => {
    removeFile(index);
  };

  const handleUpload = () => {
    setUploadQueue(prev => prev.map((item) =>
      item.status === 'queued'
        ? { ...item, status: 'uploading', progress: 0 }
        : item
    ));
    // Simulate upload
    uploadQueue.forEach((item, idx) => {
      if (item.status === 'queued') {
        simulateUpload(idx);
      }
    });
  };

  const simulateUpload = (index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      setUploadQueue(prev => prev.map((item, i) =>
        i === index
          ? { ...item, progress: Math.min(progress, 100) }
          : item
      ));
      if (progress >= 100) {
        clearInterval(interval);
        // Randomly fail some uploads for demo
        setUploadQueue(prev => prev.map((item, i) =>
          i === index
            ? Math.random() < 0.85
              ? { ...item, status: 'completed', progress: 100 }
              : { ...item, status: 'failed', error: 'Upload failed. Please retry.' }
            : item
        ));
      }
    }, 400);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop to upload!' : 'Drop your video files here'}
        </h3>
        <p className="text-gray-600 mb-4">
          or click to browse from your computer
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FORMATS.map(f => '.' + f).join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Choose Files
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Supports MP4, MOV, AVI, WebM, MKV (max {MAX_SIZE_MB}MB)
        </p>
        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mt-2">
            {globalError}
          </div>
        )}
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Upload Queue:</h4>
          {uploadQueue.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                {item.preview ? (
                  <img src={item.preview} alt="preview" className="h-10 w-16 object-cover rounded" />
                ) : (
                  <Image className="h-10 w-10 text-gray-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                  {item.error && (
                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {item.status === 'uploading' && (
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'failed' && (
                  <button
                    onClick={() => retryFile(index)}
                    className="text-yellow-500 hover:text-yellow-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => cancelFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            disabled={uploadQueue.every(item => item.status !== 'queued')}
          >
            Start Upload ({uploadQueue.filter(item => item.status === 'queued').length} file{uploadQueue.filter(item => item.status === 'queued').length !== 1 ? 's' : ''})
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;