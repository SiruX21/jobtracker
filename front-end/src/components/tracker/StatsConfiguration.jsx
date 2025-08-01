import React from 'react';
import { FaCog } from 'react-icons/fa';

function StatsConfiguration({ 
  showStatsConfig, 
  setShowStatsConfig, 
  availableStats, 
  selectedStats, 
  setSelectedStats, 
  getStatColorClass 
}) {
  return (
    <div className="relative mb-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
        <button
          onClick={() => setShowStatsConfig(!showStatsConfig)}
          className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaCog className="mr-2" />
          Customize Stats
        </button>
      </div>

      {/* Stats Configuration Panel */}
      {showStatsConfig && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Stats to Display (max 4):</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {availableStats.map(stat => {
              const IconComponent = stat.icon;
              const isSelected = selectedStats.includes(stat.id);
              return (
                <button
                  key={stat.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedStats(prev => prev.filter(id => id !== stat.id));
                    } else if (selectedStats.length < 4) {
                      setSelectedStats(prev => [...prev, stat.id]);
                    }
                  }}
                  disabled={!isSelected && selectedStats.length >= 4}
                  className={`flex items-center p-3 rounded-lg text-sm transition ${
                    isSelected 
                      ? `${getStatColorClass(stat.color)} text-white` 
                      : selectedStats.length >= 4 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="mr-2" />
                  {stat.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Select up to 4 statistics to display on your dashboard
          </p>
        </div>
      )}
    </div>
  );
}

export default StatsConfiguration;
