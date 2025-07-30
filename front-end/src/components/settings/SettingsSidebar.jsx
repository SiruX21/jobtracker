import React from 'react';
import { FaUser, FaCog, FaUniversalAccess, FaCode } from 'react-icons/fa';

function SettingsSidebar({ 
  activeTab, 
  setActiveTab, 
  isAdmin, 
  showMobileSidebar, 
  setShowMobileSidebar, 
  isMobile 
}) {
  const tabs = [
    { id: 'profile', name: 'Profile & Security', icon: FaUser },
    { id: 'preferences', name: 'Preferences', icon: FaCog },
    { id: 'accessibility', name: 'Accessibility', icon: FaUniversalAccess },
    ...(isAdmin ? [{ id: 'developer', name: 'Developer Tools', icon: FaCode }] : [])
  ];

  return (
    <div className={`lg:col-span-1 ${isMobile ? (showMobileSidebar ? 'block mb-4' : 'hidden') : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      <nav className={`space-y-2 transition-all duration-300 ease-in-out ${isMobile ? `fixed top-20 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 transform ${showMobileSidebar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}` : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (isMobile) setShowMobileSidebar(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
              activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm border-l-4 border-blue-500'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
            } ${isMobile ? 'text-sm' : ''}`}
          >
            <tab.icon className="mr-3" />
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default SettingsSidebar;
