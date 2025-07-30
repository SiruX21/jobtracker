import React from 'react';

function StatsCards({ 
  selectedStats, 
  availableStats, 
  dashboardFilter, 
  handleDashboardCardClick, 
  getStatColorClass 
}) {
  return (
    <div className={`grid gap-4 ${selectedStats.length === 1 ? 'grid-cols-1' : selectedStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' : selectedStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {selectedStats.map(statId => {
        const stat = availableStats.find(s => s.id === statId);
        if (!stat) return null;
        
        const IconComponent = stat.icon;
        const value = stat.getValue();
        const isActive = dashboardFilter === statId;
        
        // Build className more explicitly to ensure proper re-rendering
        const baseClasses = "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 text-left group cursor-pointer";
        const activeClasses = isActive ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : "";
        const buttonClasses = `${baseClasses} ${activeClasses}`;
        
        return (
          <button
            key={`${statId}-${isActive}`}
            onClick={() => handleDashboardCardClick(statId)}
            className={buttonClasses}
            style={{ focusRingColor: stat.color.replace('-500', '-500') }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 ${getStatColorClass(stat.color)} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="text-white text-lg" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {value}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default StatsCards;
