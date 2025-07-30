import React from 'react';
import { 
  FaBell, 
  FaPalette, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaChevronDown, 
  FaUniversalAccess 
} from 'react-icons/fa';
import { showToast } from '../../utils/toast';

function AccessibilitySection({ 
  toastPosition, 
  toastTheme, 
  handleSettingChange, 
  expandedSections, 
  toggleSection,
  darkMode,
  notifications,
  showToast,
  isMobile 
}) {
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
            <select
              value={toastPosition}
              onChange={(e) => handleSettingChange('toastPosition', e.target.value)}
              className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'w-full' : ''}`}
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          {/* Toast Theme */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Toast Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose the color scheme for notifications</p>
            </div>
            <select
              value={toastTheme}
              onChange={(e) => handleSettingChange('toastTheme', e.target.value)}
              className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'w-full' : ''}`}
            >
              <option value="auto">Auto (follows system theme)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="colored">Colored</option>
            </select>
          </div>

          {/* Test Toast Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (!notifications) {
                  // Show a special message when notifications are disabled
                  alert('Notifications are currently disabled. Enable notifications in the Preferences tab to see the test notification.');
                  return;
                }
                
                // Apply settings immediately before showing test toast
                window.dispatchEvent(new CustomEvent('toastSettingsChanged', { 
                  detail: { position: toastPosition, theme: toastTheme } 
                }));
                
                // Small delay to ensure settings are applied
                setTimeout(() => {
                  showToast.success("🎉 This is a test notification!", {
                    position: toastPosition,
                    theme: toastTheme === 'auto' ? (darkMode ? 'dark' : 'light') : toastTheme,
                    icon: "✨"
                  });
                }, 100);
              }}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaBell className="mr-2" />
              Test Notification
            </button>
          </div>
        </div>

        {/* Visual Settings */}
        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('visualSettings')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <FaPalette className="mr-2" />
              Visual Accessibility
            </h3>
            <FaChevronDown className={`transition-transform duration-200 ${expandedSections.visualSettings ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.visualSettings && (
            <div className="animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Additional Accessibility Features
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      These settings help customize the interface for better accessibility and user experience.
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                        High contrast dark/light mode support
                      </div>
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                        Keyboard navigation support
                      </div>
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                        Screen reader compatible
                      </div>
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                        Customizable notification positioning
                      </div>
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                        Reduced motion for animations
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccessibilitySection;
