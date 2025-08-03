import React from 'react';
import {
  FaTrash, FaSync, FaPlus, FaDatabase, FaMemory, FaServer, FaCog,
  FaEdit
} from 'react-icons/fa';
import { formatBytes } from './utils';

function SystemView({
  systemInfo,
  environmentVars,
  editingEnvVar,
  loading,
  clearSystemCache,
  loadSystemInfo,
  setShowEnvEditor,
  setEditingEnvVar,
  setEnvironmentVars,
  updateEnvironmentVar,
  deleteEnvironmentVar
}) {
  if (!systemInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSync className="animate-spin w-8 h-8 mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading system information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={clearSystemCache}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaTrash className="mr-2" />
          Clear Cache
        </button>
        <button
          onClick={loadSystemInfo}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button
          onClick={() => setShowEnvEditor(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Environment Variable
        </button>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FaDatabase className="mr-2" />
              Database
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</p>
                <p className="text-lg text-gray-900 dark:text-white">{systemInfo.database.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tables</p>
                <div className="mt-2 space-y-2">
                  {systemInfo.database.tables.map((table) => (
                    <div key={table.name} className="flex justify-between">
                      <span className="text-sm text-gray-900 dark:text-white">{table.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{table.rows} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FaMemory className="mr-2" />
              Cache
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {systemInfo.cache.error ? (
                <p className="text-red-600 dark:text-red-400">{systemInfo.cache.error}</p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cached Logos</p>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {systemInfo.cache.total_cached_logos || 0}
                    </p>
                  </div>
                  {systemInfo.cache.redis_info && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</p>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {formatBytes(systemInfo.cache.redis_info.used_memory)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FaServer className="mr-2" />
              Environment
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Environment</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {systemInfo.environment.environment}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Debug Mode</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {systemInfo.environment.debug ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      {environmentVars && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FaCog className="mr-2" />
              Environment Variables
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                {Object.keys(environmentVars.environment_variables).length} total
              </span>
              {environmentVars.sensitive_count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                  {environmentVars.sensitive_count} hidden
                </span>
              )}
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(environmentVars.environment_variables).map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{key}</span>
                      </td>
                      <td className="px-6 py-4">
                        {editingEnvVar === key ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={value === '***HIDDEN***' ? '' : value}
                              onChange={(e) => setEnvironmentVars({
                                ...environmentVars,
                                environment_variables: {
                                  ...environmentVars.environment_variables,
                                  [key]: e.target.value
                                }
                              })}
                              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={value === '***HIDDEN***' ? 'Enter new value...' : ''}
                            />
                            <button
                              onClick={() => updateEnvironmentVar(key, environmentVars.environment_variables[key])}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEnvVar(null)}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`text-sm ${
                            value === '***HIDDEN***' 
                              ? 'text-yellow-600 dark:text-yellow-400 font-mono' 
                              : 'text-gray-900 dark:text-white'
                          } break-all`}>
                            {value}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingEnvVar !== key && (
                          <>
                            <button
                              onClick={() => setEditingEnvVar(key)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <FaEdit />
                            </button>
                            {!['PATH', 'HOME', 'USER', 'DB_HOST', 'DB_PASSWORD', 'JWT_SECRET_KEY'].includes(key.toUpperCase()) && (
                              <button
                                onClick={() => deleteEnvironmentVar(key)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemView;
