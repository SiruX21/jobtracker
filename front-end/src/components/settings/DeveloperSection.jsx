import React from 'react';
import { 
  FaCode, 
  FaDatabase, 
  FaHdd, 
  FaMemory, 
  FaExternalLinkAlt, 
  FaSync, 
  FaTrash 
} from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

function DeveloperSection({ 
  isAdmin,
  developerMode, 
  handleSettingChange, 
  cacheInfo, 
  storageInfo, 
  loadDeveloperInfo, 
  clearCache, 
  formatBytes, 
  formatDate,
  showToast,
  isMobile 
}) {
  const navigate = useNavigate();

  const clearLogoCache = () => {
    // Clear logo cache from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('logo_cache_')) {
        localStorage.removeItem(key);
      }
    });
    showToast.success('🗑️ Logo cache cleared successfully');
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Developer Tools
      </h2>
      
      <div className="space-y-6">
        {/* Developer Mode Toggle */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Developer Mode</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enable advanced developer tools and debugging features</p>
          </div>
          <Switch
            checked={developerMode}
            onChange={(checked) => handleSettingChange('developerMode', checked)}
            className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 data-[checked]:bg-blue-600 dark:bg-gray-700 dark:data-[checked]:bg-blue-600"
          >
            <span className="sr-only">Enable developer mode</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                developerMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </Switch>
        </div>

        {/* Admin Panel - Admin Only */}
        {isAdmin ? (
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access full system administration console</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaCode className="mr-2" />
              Open Admin Panel
            </button>
          </div>
        ) : (
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} opacity-50`}>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admin access required</p>
            </div>
            <div className={`px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed ${isMobile ? 'w-full text-center' : ''}`}>
              Admin Only
            </div>
          </div>
        )}

        {!developerMode ? (
          <div className="text-center py-8">
            <FaCode className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Developer mode is disabled</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Use the toggle above to enable developer tools</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Test Notifications */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Test Notifications</h3>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-4 gap-3'}`}>
                <button
                  onClick={() => showToast.success('✅ Success notification test!')}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Success
                </button>
                <button
                  onClick={() => showToast.error('❌ Error notification test!')}
                  className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Error
                </button>
                <button
                  onClick={() => showToast.warning('⚠️ Warning notification test!')}
                  className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Warning
                </button>
                <button
                  onClick={() => showToast.info('ℹ️ Info notification test!')}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Info
                </button>
              </div>
            </div>

            {/* Cache Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <FaDatabase className="mr-2" />
                  Cache Information
                </h3>
                <div className={`flex ${isMobile ? 'w-full' : ''} space-x-2`}>
                  <button
                    onClick={loadDeveloperInfo}
                    className={`px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center ${isMobile ? 'flex-1 justify-center' : ''}`}
                  >
                    <FaSync className="inline mr-1" />
                    Refresh
                  </button>
                  <button
                    onClick={clearCache}
                    className={`px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center ${isMobile ? 'flex-1 justify-center' : ''}`}
                  >
                    <FaTrash className="inline mr-1" />
                    Clear
                  </button>
                </div>
              </div>
              
              {cacheInfo ? (
                cacheInfo.error ? (
                  <p className="text-red-600 dark:text-red-400">{cacheInfo.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="ml-2 font-mono">{formatBytes(cacheInfo.size)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Jobs:</span>
                      <span className="ml-2 font-mono">{cacheInfo.jobCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="ml-2 font-mono">{formatDate(cacheInfo.timestamp)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                      <span className={`ml-2 font-mono ${cacheInfo.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatDate(parseInt(cacheInfo.expiry))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Version:</span>
                      <span className="ml-2 font-mono">{cacheInfo.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`ml-2 font-mono ${cacheInfo.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {cacheInfo.isExpired ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No cache data found</p>
              )}
            </div>

            {/* Storage Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FaHdd className="mr-2" />
                Local Storage
              </h3>
              
              {storageInfo && (
                <div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
                      <span className="ml-2 font-mono">{formatBytes(storageInfo.totalSize)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Items:</span>
                      <span className="ml-2 font-mono">{storageInfo.itemCount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {storageInfo.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-blue-600 dark:text-blue-400">{item.key}</div>
                          <div className="text-gray-500 dark:text-gray-400 truncate">{item.preview}</div>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 ml-2">
                          {formatBytes(item.size)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* System Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FaMemory className="mr-2" />
                System Information
              </h3>
              
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                  <div className="font-mono text-xs break-all">{navigator.userAgent}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Screen:</span>
                  <span className="ml-2 font-mono">{screen.width}x{screen.height}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Viewport:</span>
                  <span className="ml-2 font-mono">{window.innerWidth}x{window.innerHeight}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Language:</span>
                  <span className="ml-2 font-mono">{navigator.language}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Online:</span>
                  <span className={`ml-2 font-mono ${navigator.onLine ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {navigator.onLine ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cookies Enabled:</span>
                  <span className={`ml-2 font-mono ${navigator.cookieEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {navigator.cookieEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Logo Cache Status</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Logos are cached locally for better performance
                    </p>
                  </div>
                  <button
                    onClick={clearLogoCache}
                    className={`px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center ${isMobile ? 'w-full justify-center' : ''}`}
                  >
                    <FaTrash className="inline mr-1" />
                    Clear Logo Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeveloperSection;
