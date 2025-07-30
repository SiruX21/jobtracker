import React from 'react';

function LoadingScreen({ type = 'general' }) {
  const getLoadingMessage = () => {
    switch (type) {
      case 'tracker':
        return {
          title: 'Loading Applications',
          subtitle: 'Fetching your job applications and dashboard data...'
        };
      case 'settings':
        return {
          title: 'Loading Settings',
          subtitle: 'Retrieving your account preferences and configurations...'
        };
      default:
        return {
          title: 'Loading...',
          subtitle: 'Please wait while we load your data'
        };
    }
  };

  const loadingMessage = getLoadingMessage();

  if (type === 'tracker') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Skeleton Header */}
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-80 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-96 mx-auto"></div>
            </div>
          </div>
          
          {/* Skeleton Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse flex items-center">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Skeleton Add Button */}
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl w-48 mx-auto"></div>
            </div>
          </div>
          
          {/* Skeleton Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="animate-pulse">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex-1 max-w-md"></div>
                <div className="flex items-center gap-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg w-32"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg w-24"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Skeleton Job Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 p-4">
                  <div className="animate-pulse flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div>
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="flex gap-2 mt-4">
                      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading Message */}
          <div className="text-center mt-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Skeleton Header */}
          <div className="mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
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
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Message */}
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // General loading screen
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-8"></div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
