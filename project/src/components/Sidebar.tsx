import React from 'react';
import { Plus, Folder, Upload, Library } from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', icon: <Library className="h-5 w-5" />, href: '/dashboard' },
  { name: 'Projects', icon: <Folder className="h-5 w-5" />, href: '/projects' },
  { name: 'Library', icon: <Library className="h-5 w-5" />, href: '/library' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 min-h-screen p-6 space-y-8">
      <div className="flex items-center space-x-2 mb-8">
        <span className="text-xl font-bold text-blue-600">ClipChef</span>
      </div>
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => (
          <a key={link.name} href={link.href} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors font-medium">
            {link.icon}
            <span>{link.name}</span>
          </a>
        ))}
      </nav>
      <div className="space-y-2">
        <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
          <Plus className="h-5 w-5" />
          <span>New Project</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-lg font-medium transition-colors">
          <Upload className="h-5 w-5" />
          <span>Upload Video</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-lg font-medium transition-colors">
          <Library className="h-5 w-5" />
          <span>View Library</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
