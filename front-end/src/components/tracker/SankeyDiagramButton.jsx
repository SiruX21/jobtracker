import React from 'react';
import { FaChartLine } from 'react-icons/fa';

const SankeyDiagramButton = ({ onClick, disabled = false }) => {
  return (
    <div className="text-center animate-fadeIn mb-6">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          group relative overflow-hidden px-6 py-3 rounded-lg font-semibold text-white
          transform transition-all duration-300 hover:scale-105 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100
          dark:focus:ring-offset-gray-800
          ${disabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-purple-500'
          }
        `}
        title={disabled ? "No status history available" : "View application status flow diagram"}
      >
        <FaChartLine className={`mr-2 text-sm ${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`} />
        Status Flow
      </button>
    </div>
  );
};

export default SankeyDiagramButton;
