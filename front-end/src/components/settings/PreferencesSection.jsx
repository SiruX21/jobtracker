import React, { Fragment } from 'react';
import { FaPalette, FaInfoCircle, FaDownload, FaUndo, FaChevronDown, FaCheck } from 'react-icons/fa';
import { Switch, Listbox, Transition } from '@headlessui/react';

function PreferencesSection({ 
  toggleTheme, 
  darkMode, 
  autoRefresh, 
  dataRetention, 
  handleSettingChange, 
  exportData,
  showToast,
  isMobile 
}) {
  const retentionOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '365', label: '1 year' }
  ];

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Preferences
      </h2>
      
      <div className="space-y-6">

        {/* Auto Refresh */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Auto Refresh</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically refresh job data</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
          </label>
        </div>

        {/* Data Retention */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">Data Retention</h3>
              <div className="relative group ml-2">
                <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Controls how long cached data is kept before being refreshed
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">How long to keep cached data</p>
          </div>
          <Listbox
            value={dataRetention}
            onChange={(value) => handleSettingChange('dataRetention', value)}
          >
            <div className="relative">
              <Listbox.Button className={`relative cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 ease-in-out hover:border-blue-400 ${isMobile ? 'w-full' : ''}`}>
                <span className="block truncate">
                  {retentionOptions.find(option => option.value === dataRetention)?.label || '30 days'}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {retentionOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <FaCheck className="h-3 w-3" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Export Data */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-3'}`}>
            <button
              onClick={exportData}
              className={`flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaDownload className="mr-2" />
              Export Data
            </button>
            <button
              onClick={() => {
                // Reset all preferences to defaults
                handleSettingChange('autoRefresh', true);
                handleSettingChange('dataRetention', '30');
                showToast.success('🔄 Preferences reset to defaults');
              }}
              className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaUndo className="mr-2" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreferencesSection;
