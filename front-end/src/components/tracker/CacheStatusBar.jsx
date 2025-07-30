import React from 'react';
import { FaDatabase, FaSpinner, FaSync, FaTimes } from 'react-icons/fa';

function CacheStatusBar({ 
  developerMode, 
  cacheStatus, 
  refreshJobs, 
  clearCache 
}) {
  if (!developerMode) return null;

  return (
    <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FaDatabase className={`text-sm ${cacheStatus.isFromCache ? 'text-green-500' : 'text-blue-500'}`} />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {cacheStatus.isFromCache ? 'Data from cache' : 'Fresh data'}
          </span>
        </div>
        
        {cacheStatus.isFromCache && cacheStatus.age && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.floor(cacheStatus.age / 1000)}s old
          </span>
        )}
        
        {cacheStatus.isRefreshing && (
          <div className="flex items-center space-x-1">
            <FaSpinner className="text-sm text-blue-500 animate-spin" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Refreshing...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={refreshJobs}
          disabled={cacheStatus.isRefreshing}
          className="flex items-center px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition disabled:opacity-50"
        >
          <FaSync className={`mr-1 ${cacheStatus.isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        
        <button
          onClick={clearCache}
          className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaTimes className="mr-1" />
          Clear Cache
        </button>
      </div>
    </div>
  );
}

export default CacheStatusBar;
