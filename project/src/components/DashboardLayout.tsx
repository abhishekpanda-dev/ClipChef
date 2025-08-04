import React, { useState, useRef, useEffect } from 'react';
import FileUpload, { ACCEPTED_FORMATS, UploadFile } from './FileUpload';
import UploadQueueItem from './UploadQueueItem';
// Toast import should match your actual Toast component signature
// Example: import Toast from './Toast';
import { Menu, ChevronDown, ChevronRight, Plus, Upload, Library, Film, Database, Clock, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useVideoProcessor } from '../hooks/useVideoProcessor';

const navSections = [
  {
    title: 'Main',
    links: [
      { name: 'Dashboard', icon: <Library className="h-5 w-5" />, href: '/dashboard' },
      { name: 'Projects', icon: <Film className="h-5 w-5" />, href: '/projects' },
      { name: 'Library', icon: <Library className="h-5 w-5" />, href: '/library' },
    ],
  },
  {
    title: 'Settings',
    links: [
      { name: 'Account', icon: <Database className="h-5 w-5" />, href: '/account' },
      { name: 'Preferences', icon: <Clock className="h-5 w-5" />, href: '/preferences' },
    ],
  },
];

// stats will be dynamic now

// uploads will be dynamic now

const statusMap: Record<string, React.JSX.Element> = {
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  processing: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  queued: <Clock className="h-5 w-5 text-yellow-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
};

interface QuickActionsProps {
  onUploadClick: () => void;
}
const QuickActions: React.FC<QuickActionsProps> = ({ onUploadClick }) => (
  <div className="flex flex-col space-y-4">
    <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg font-semibold text-lg transition-colors">
      <Plus className="h-5 w-5" />
      <span>New Project</span>
    </button>
    <button
      className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-4 px-4 rounded-lg font-semibold text-lg transition-colors"
      onClick={onUploadClick}
    >
      <Upload className="h-5 w-5" />
      <span>Upload Video</span>
    </button>
    <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-4 px-4 rounded-lg font-semibold text-lg transition-colors">
      <Library className="h-5 w-5" />
      <span>View Library</span>
    </button>
  </div>
);

interface Stat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}
type UsageStatsProps = {
  stats: Stat[];
};
const UsageStats: React.FC<UsageStatsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {stats.map((stat) => (
      <div key={stat.label} className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-6 flex items-center space-x-4">
        <div>{stat.icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
        </div>
      </div>
    ))}
  </div>
);

interface RecentUploadsProps {
  uploads: UploadFile[];
}
const RecentUploads: React.FC<RecentUploadsProps> = ({ uploads }) => (
  <section>
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Uploads</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-4 flex flex-col">
          {upload.preview ? (
            <img src={upload.preview} alt={upload.file.name} className="rounded-lg h-40 w-full object-cover mb-3" />
          ) : (
            <div className="rounded-lg h-40 w-full object-cover mb-3 bg-gray-200 flex items-center justify-center text-gray-400">No Preview</div>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{upload.file.name}</span>
            {statusMap[upload.status]}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{upload.file.size ? `${(upload.file.size / (1024 * 1024)).toFixed(1)}MB` : ''}</div>
          <button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">View Details</button>
        </div>
      ))}
    </div>
  </section>
);

const Sidebar: React.FC<{ onUploadClick: () => void }> = ({ onUploadClick }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 min-h-screen p-6 space-y-8">
      <div className="flex items-center space-x-2 mb-8">
        <Menu className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-blue-600">ClipChef</span>
      </div>
      {navSections.map((section) => (
        <div key={section.title} className="mb-4">
          <button
            className="flex items-center w-full text-left space-x-2 text-gray-700 dark:text-gray-200 font-semibold mb-2 focus:outline-none"
            onClick={() => toggleSection(section.title)}
          >
            {collapsed[section.title] ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{section.title}</span>
          </button>
          {!collapsed[section.title] && (
            <nav className="space-y-2 ml-6">
              {section.links.map((link) => (
                <a key={link.name} href={link.href} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors font-medium">
                  {link.icon}
                  <span>{link.name}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      ))}
      <QuickActions onUploadClick={onUploadClick} />
    </aside>
  );
};

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { process } = useVideoProcessor();
  
  // Dynamic dashboard stats
  const totalProcessingTime = uploads.reduce((sum, item) => sum + (item.metadata?.duration || 0), 0);
  const processingCount = uploads.filter(item => item.status === 'processing').length;
  const storageUsed = uploads.reduce((sum, item) => sum + (item.file.size || 0), 0);
  const stats = [
    { label: 'Clips Created', value: uploads.length, icon: <Film className="h-6 w-6 text-blue-600" /> },
    { label: 'Storage Used', value: `${(storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`, icon: <Database className="h-6 w-6 text-blue-600" /> },
    { label: 'Processing Time', value: `${Math.floor(totalProcessingTime / 60)}m ${Math.round(totalProcessingTime % 60)}s`, icon: <Clock className="h-6 w-6 text-blue-600" /> },
    { label: 'Processing', value: `${processingCount} video${processingCount !== 1 ? 's' : ''}`, icon: <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" /> },
  ];
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Web Worker message listener for debugging
  useEffect(() => {
    const worker = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
      console.log('Dashboard: Web Worker message received:', e.data);
      
      const { type, progress, context, error: workerError } = e.data;
      
      switch (type) {
        case 'start':
          console.log('Dashboard: Processing started for context:', context);
          setProcessing(true);
          setError(null);
          // Update the first processing item to show it's started
          setUploads(prev => prev.map(item => 
            item.status === 'queued' 
              ? { ...item, status: 'processing', processingProgress: 0 }
              : item
          ));
          break;
        case 'progress':
          console.log('Dashboard: Progress update:', progress, 'Context:', context);
          // Update progress for the specific file being processed
          setUploads(prev => prev.map(item => 
            item.status === 'processing' 
              ? { ...item, processingProgress: progress }
              : item
          ));
          break;
        case 'complete':
          console.log('Dashboard: Processing completed for context:', context);
          setProcessing(false);
          setUploads(prev => prev.map(item => 
            item.status === 'processing' 
              ? { ...item, status: 'completed', processingProgress: 100 }
              : item
          ));
          break;
        case 'error':
          console.error('Dashboard: Worker error:', workerError);
          setError(workerError);
          setProcessing(false);
          setUploads(prev => prev.map(item => 
            item.status === 'processing' 
              ? { ...item, status: 'failed', error: workerError }
              : item
          ));
          break;
        default:
          console.log('Dashboard: Unknown message type:', type);
      }
    };

    worker.onerror = (e) => {
      console.error('Dashboard: Web Worker error:', e);
      setError('Web Worker error occurred');
      setProcessing(false);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  // Handler for file selection
  const handleFileUpload = async (files: File[]) => {
    console.log('Dashboard: handleFileUpload called with files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Validate and process files using FileUpload logic
    const newQueue: UploadFile[] = [];
    for (const file of files) {
      console.log('Dashboard: Processing file:', file.name);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !ACCEPTED_FORMATS.includes(ext)) {
        console.error('Dashboard: Unsupported format:', ext);
        setShowToast({ message: `Unsupported format: .${ext}`, type: 'error' });
        continue;
      }
      if (file.size > 500 * 1024 * 1024) {
        console.error('Dashboard: File too large:', file.size);
        setShowToast({ message: `File too large (max 500MB)`, type: 'error' });
        continue;
      }
      
      const preview = file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined;
      const uploadItem = { file, status: 'queued' as const, progress: 0, preview };
      newQueue.push(uploadItem);
      
      console.log('Dashboard: Added file to queue:', uploadItem);
    }
    
    if (newQueue.length > 0) {
      console.log('Dashboard: Adding files to uploads state:', newQueue.length, 'files');
      setUploads(prev => [...prev, ...newQueue]);
      setShowToast({ message: `${newQueue.length} file(s) added to upload queue.`, type: 'success' });
    }
  };

  // Handler for Upload Video button
  const handleUploadButtonClick = () => {
    console.log('Dashboard: Upload button clicked');
    fileInputRef.current?.click();
  };

  // Updated file input onChange handler to ensure proper processing
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Dashboard: File input onChange triggered');
    const files = Array.from(e.target.files || []);
    console.log('Dashboard: Files selected from input:', files.length);
    
    if (files.length > 0) {
      await handleFileUpload(files);
      
      // Process each file with videoProcessor
      for (const file of files) {
        try {
          console.log('Dashboard: Starting video processing for:', file.name);
          setUploads(prev => prev.map(item => 
            item.file === file ? { ...item, status: 'processing', processingProgress: 0 } : item
          ));
          
          // Call videoProcessor.process and await its promise
          const result = await process(file);
          console.log('Dashboard: Video processing completed for:', file.name, result);
          
          setUploads(prev => prev.map(item => 
            item.file === file ? { 
              ...item, 
              status: 'completed', 
              processingProgress: 100,
              metadata: result.metadata,
              thumbnail: result.thumbnail.url
            } : item
          ));
        } catch (error) {
          console.error('Dashboard: Video processing failed for:', file.name, error);
          setUploads(prev => prev.map(item => 
            item.file === file ? { ...item, status: 'failed', error: error instanceof Error ? error.message : String(error) } : item
          ));
        }
      }
    }
    
    // Clear the input
    e.target.value = '';
  };

  // Handler for progress updates
  const handleProgressUpdate = (index: number, progress: number) => {
    console.log('Dashboard: Progress update for index:', index, 'progress:', progress);
    setUploads(prev => prev.map((item, i) => 
      i === index ? { ...item, processingProgress: progress } : item
    ));
  };

  // Handler for status updates
  const handleStatusUpdate = (index: number, status: UploadFile['status'], error?: string) => {
    console.log('Dashboard: Status update for index:', index, 'status:', status, 'error:', error);
    setUploads(prev => prev.map((item, i) => 
      i === index ? { ...item, status, error } : item
    ));
  };

  // Retry and cancel logic
  const handleRetry = (index: number) => {
    console.log('Dashboard: Retry requested for index:', index);
    setUploads(prev => prev.map((item, i) => i === index ? { ...item, status: 'queued', error: undefined, progress: 0 } : item));
  };
  
  const handleCancel = (index: number) => {
    console.log('Dashboard: Cancel requested for index:', index);
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  // Simulate upload progress for demo
  const handleStartUpload = () => {
    uploads.forEach((item, idx) => {
      if (item.status === 'queued') {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          setUploads(prev => prev.map((it, i) =>
            i === idx ? { ...it, progress: Math.min(progress, 100) } : it
          ));
          if (progress >= 100) {
            clearInterval(interval);
            setUploads(prev => prev.map((it, i) =>
              i === idx
                ? Math.random() < 0.85
                  ? { ...it, status: 'completed', progress: 100 }
                  : { ...it, status: 'failed', error: 'Upload failed. Please retry.' }
                : it
            ));
            setShowToast({ message: `Upload ${item.file.name} ${Math.random() < 0.85 ? 'completed' : 'failed'}.`, type: Math.random() < 0.85 ? 'success' : 'error' });
          }
        }, 400);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar onUploadClick={handleUploadButtonClick} />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FORMATS.map(f => '.' + f).join(',')}
        className="hidden"
        onChange={handleFileInputChange}
      />
      <main className="flex-1 flex flex-col p-4 md:p-8 space-y-8">
        <UsageStats stats={stats} />
        <RecentUploads uploads={uploads} />
        {/* Upload Queue UI */}
        {uploads.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Upload Queue:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map((item, index) => (
                <UploadQueueItem
                  key={index}
                  item={item}
                  index={index}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                  onProgressUpdate={handleProgressUpdate}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
            <button
              onClick={handleStartUpload}
              className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${uploads.every(item => item.status !== 'queued') ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              disabled={uploads.every(item => item.status !== 'queued')}
            >
              {uploads.some(item => item.status === 'processing')
                ? 'Processing… Please wait'
                : `Start Upload (${uploads.filter(item => item.status === 'queued').length} file${uploads.filter(item => item.status === 'queued').length !== 1 ? 's' : ''})`}
            </button>
          </div>
        )}
        {/* Replace with your actual Toast usage, or remove if not available */}
        {/* {showToast && <Toast message={showToast.message} type={showToast.type} />} */}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
