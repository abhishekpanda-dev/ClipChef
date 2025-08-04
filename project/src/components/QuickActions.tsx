import React from 'react';
import { Plus, Upload, Library } from 'lucide-react';

const QuickActions: React.FC = () => (
  <div className="col-span-1 flex flex-col space-y-4">
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

export default QuickActions;
