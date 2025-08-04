import React, { useState } from 'react';
import { Menu, ChevronDown, ChevronRight, Plus, Upload, Library, Film, Database, Clock, CheckCircle, Loader2, XCircle } from 'lucide-react';

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

const stats = [
  { label: 'Clips Created', value: 128, icon: <Film className="h-6 w-6 text-blue-600" /> },
  { label: 'Storage Used', value: '2.3 GB', icon: <Database className="h-6 w-6 text-blue-600" /> },
  { label: 'Processing Time', value: '4h 12m', icon: <Clock className="h-6 w-6 text-blue-600" /> },
];

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

const QuickActions = () => (
  <div className="flex flex-col space-y-4">
    <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg font-semibold text-lg transition-colors">
      <Plus className="h-5 w-5" />
      <span>New Project</span>
    </button>
    <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-4 px-4 rounded-lg font-semibold text-lg transition-colors">
      <Upload className="h-5 w-5" />
      <span>Upload Video</span>
    </button>
    <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-4 px-4 rounded-lg font-semibold text-lg transition-colors">
      <Library className="h-5 w-5" />
      <span>View Library</span>
    </button>
  </div>
);

const UsageStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

const RecentUploads = () => (
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

const Sidebar: React.FC = () => {
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
      <QuickActions />
    </aside>
  );
};

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-8 space-y-8">
        <UsageStats />
        <RecentUploads />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
