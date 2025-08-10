import React, { Fragment } from 'react';
import { 
  FaBell, 
  FaPalette, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaChevronDown, 
  FaUniversalAccess,
  FaCheck
} from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
import { debugLog } from '../../utils/debug';
import { showToast as importedShowToast, testToastify } from '../../utils/toast';

function AccessibilitySection({ 
  toastPosition, 
  toastTheme, 
  handleSettingChange, 
  expandedSections, 
  toggleSection,
  darkMode,
  showToast,
  isMobile 
}) {
  // Use imported showToast if prop is not provided
  const toast = showToast || importedShowToast;
  
  // Debug: Check if showToast is properly defined
  React.useEffect(() => {
    debugLog('AccessibilitySection toast:', toast);
  }, [toast]);

  const toastPositionOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  const toastThemeOptions = [
    { value: 'auto', label: 'Auto (follows system theme)' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'colored', label: 'Colored' }
  ];

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Accessibility
      </h2>
      
      <div className="space-y-6">
        {/* Toast Notification Settings */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <FaBell className="mr-2" />
            Notification Settings
          </h3>
          
          {/* Toast Position */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Toast Position</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose where notifications appear on your screen</p>
            </div>
            <Listbox
              value={toastPosition}
              onChange={(value) => handleSettingChange('toastPosition', value)}
            >
              <div className="relative w-fit min-w-[8rem]">
                <Listbox.Button className="relative cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white w-full">
                  <span className="block truncate whitespace-nowrap">
                    {toastPositionOptions.find(option => option.value === toastPosition)?.label || 'Top Right'}
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
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-fit min-w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {toastPositionOptions.map((option) => (
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
                            <span className={`block whitespace-nowrap ${selected ? 'font-medium' : 'font-normal'}`}>
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

          {/* Toast Theme */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Toast Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose the color scheme for notifications</p>
            </div>
            <Listbox
              value={toastTheme}
              onChange={(value) => handleSettingChange('toastTheme', value)}
            >
              <div className="relative w-fit min-w-[12rem]">
                <Listbox.Button className="relative cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white w-full">
                  <span className="block truncate whitespace-nowrap">
                    {toastThemeOptions.find(option => option.value === toastTheme)?.label || 'Auto (follows system theme)'}
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
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-fit min-w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {toastThemeOptions.map((option) => (
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
                            <span className={`block whitespace-nowrap ${selected ? 'font-medium' : 'font-normal'}`}>
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

          {/* Test Toast Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                debugLog('Test notification clicked', { toast, position: toastPosition, theme: toastTheme });
                
                // Apply settings immediately before showing test toast
                window.dispatchEvent(new CustomEvent('toastSettingsChanged', { 
                  detail: { position: toastPosition, theme: toastTheme } 
                }));
                
                // Add a small delay to ensure state updates
                setTimeout(() => {
                  debugLog('Showing test toast after delay');
                  
                  // Try both the prop and imported version
                  try {
                    if (showToast && showToast.success) {
                      debugLog('Using showToast prop');
                      showToast.success("🎉 This is a test notification from PROP!");
                    } else {
                      debugLog('Using importedShowToast');
                      importedShowToast.success("🎉 This is a test notification from IMPORT!");
                    }
                  } catch (error) {
                    debugLog('Toast error:', error);
                    // Fallback - try direct import
                    import('../../utils/toast').then(({ showToast: directToast }) => {
                      debugLog('Using direct import');
                      directToast.success("🎉 This is a test notification from DIRECT IMPORT!");
                    });
                  }
                }, 200);
              }}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaBell className="mr-2" />
              Test Notification
            </button>
            
            {/* Direct Toast Test Button */}
            <button
              onClick={() => {
                debugLog('=== COMPREHENSIVE TOAST DEBUG ===');
                
                // Check if ToastContainer exists in DOM
                const toastContainers = document.querySelectorAll('[class*="Toastify"]');
                debugLog('ToastContainer elements found:', toastContainers.length);
                toastContainers.forEach((container, index) => {
                  debugLog(`Container ${index}:`, {
                    className: container.className,
                    style: container.style.cssText,
                    display: window.getComputedStyle(container).display,
                    visibility: window.getComputedStyle(container).visibility,
                    zIndex: window.getComputedStyle(container).zIndex
                  });
                });
                
                // Test direct react-toastify
                debugLog('Testing direct react-toastify...');
                testToastify();
                
                // Test our wrapper
                debugLog('Testing our showToast wrapper...');
                importedShowToast.success("🚀 COMPREHENSIVE TEST!");
              }}
              className={`mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-all duration-200 ease-in-out ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaBell className="mr-2" />
              Debug Toast System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessibilitySection;
