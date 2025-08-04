import React from 'react';
import { Clock, Film, Database } from 'lucide-react';

const stats = [
  { label: 'Clips Created', value: 128, icon: <Film className="h-6 w-6 text-blue-600" /> },
  { label: 'Storage Used', value: '2.3 GB', icon: <Database className="h-6 w-6 text-blue-600" /> },
  { label: 'Processing Time', value: '4h 12m', icon: <Clock className="h-6 w-6 text-blue-600" /> },
];

const UsageStats: React.FC = () => (
  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
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

export default UsageStats;
