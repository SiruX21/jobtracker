import React from 'react';

function LoadingScreen({ darkMode, isMobile }) {
  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'px-2 py-4' : ''}`}>
          {/* Skeleton Header */}
          <div className="mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
            </div>
          </div>
          
          <div className={`${isMobile ? 'block' : 'grid lg:grid-cols-4 gap-8'}`}>
            {/* Skeleton Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
            
            {/* Skeleton Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
