import React from 'react';
import { FaChartLine } from 'react-icons/fa';

const SankeyDiagramButton = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
          : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
        }
      `}
      title={disabled ? "No status history available" : "View application status flow diagram"}
    >
      <FaChartLine className={`${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`} />
      <span>Status Flow</span>
    </button>
  );
};

export default SankeyDiagramButton;
