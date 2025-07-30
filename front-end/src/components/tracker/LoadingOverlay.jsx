import React from 'react';
import { FaSpinner } from 'react-icons/fa';

function LoadingOverlay({ loading, editingJob }) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {editingJob ? "Updating Application..." : "Adding Application..."}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we save your job application
          </p>
        </div>
        <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
