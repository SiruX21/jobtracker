import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SkeletonThemeProvider from './SkeletonThemeProvider';

function LoadingScreen({ type = 'general', darkMode = false }) {
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
      case 'admin':
        return {
          title: 'Loading Admin Panel',
          subtitle: 'Fetching system information and administrative data...'
        };
      case 'logout':
        return {
          title: 'Logging Out',
          subtitle: 'Safely signing you out and clearing your session...'
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
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Skeleton Header */}
            <div className="text-center mb-8">
              <Skeleton height={40} width={320} className="mx-auto mb-2" />
              <Skeleton height={16} width={384} className="mx-auto" />
            </div>
            
            {/* Skeleton Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <Skeleton height={40} width={40} className="rounded-lg mr-4" />
                    <div className="flex-1">
                      <Skeleton height={16} width={80} className="mb-2" />
                      <Skeleton height={24} width={32} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Skeleton Add Button */}
            <div className="text-center mb-8">
              <Skeleton height={48} width={192} className="mx-auto rounded-xl" />
            </div>
            
            {/* Skeleton Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <Skeleton height={48} className="flex-1 max-w-md rounded-lg" />
                <div className="flex items-center gap-3">
                  <Skeleton height={48} width={128} className="rounded-lg" />
                  <Skeleton height={48} width={96} className="rounded-lg" />
                </div>
              </div>
            </div>
            
            {/* Skeleton Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton height={48} width={48} className="rounded-lg" />
                      <div className="flex-1">
                        <Skeleton height={20} width={96} className="mb-2" />
                        <Skeleton height={16} width={128} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <Skeleton height={16} />
                      <Skeleton height={16} width="75%" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton height={32} width={64} className="rounded" />
                        <Skeleton height={32} width={64} className="rounded" />
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
      </SkeletonThemeProvider>
    );
  }

  if (type === 'admin') {
    return (
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Skeleton Header */}
            <div className="mb-8">
              <Skeleton height={32} width={192} className="mb-2" />
              <Skeleton height={16} width={256} />
            </div>
            
            {/* Skeleton Navigation Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="py-4 px-6">
                      <Skeleton height={20} width={80} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Skeleton Action Buttons */}
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton height={40} width={128} className="rounded-lg" />
              <Skeleton height={40} width={112} className="rounded-lg" />
              <Skeleton height={40} width={192} className="rounded-lg" />
            </div>
            
            {/* Skeleton System Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <Skeleton height={20} width={20} className="rounded mr-2" />
                      <Skeleton height={24} width={96} />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Skeleton height={16} width={64} className="mb-2" />
                        <Skeleton height={24} width={80} />
                      </div>
                      <div>
                        <Skeleton height={16} width={80} className="mb-2" />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton height={16} width={96} />
                            <Skeleton height={16} width={64} />
                          </div>
                          <div className="flex justify-between">
                            <Skeleton height={16} width={112} />
                            <Skeleton height={16} width={48} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Skeleton Environment Variables Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Skeleton height={20} width={20} className="rounded mr-2" />
                  <Skeleton height={24} width={160} />
                  <Skeleton height={20} width={64} className="ml-2" />
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3">
                          <Skeleton height={16} width={32} />
                        </th>
                        <th className="px-6 py-3">
                          <Skeleton height={16} width={48} />
                        </th>
                        <th className="px-6 py-3">
                          <Skeleton height={16} width={64} />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-6 py-4">
                            <Skeleton height={16} width={96} />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton height={16} width={128} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Skeleton height={16} width={16} />
                              <Skeleton height={16} width={16} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Loading Message */}
            <div className="text-center mt-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
            </div>
          </div>
        </div>
      </SkeletonThemeProvider>
    );
  }

  if (type === 'logout') {
    return (
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-8"></div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
          </div>
        </div>
      </SkeletonThemeProvider>
    );
  }

  if (type === 'settings') {
    return (
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Skeleton Header */}
            <div className="mb-8">
              <Skeleton height={32} width={192} className="mb-2" />
              <Skeleton height={16} width={256} />
            </div>
            
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Skeleton Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height={48} className="rounded-lg" />
                  ))}
                </div>
              </div>
              
              {/* Skeleton Content */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-4">
                    <Skeleton height={24} width={128} />
                    <div className="space-y-3">
                      <Skeleton height={16} />
                      <Skeleton height={16} width="75%" />
                      <Skeleton height={16} width="50%" />
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="space-y-3">
                        <Skeleton height={16} />
                        <Skeleton height={16} width="66%" />
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
      </SkeletonThemeProvider>
    );
  }

  // General loading screen
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-8"></div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{loadingMessage.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{loadingMessage.subtitle}</p>
        </div>
      </div>
    </SkeletonThemeProvider>
  );
}

export { LoadingScreen };
export default LoadingScreen;
