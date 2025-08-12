import React from 'react';
import { FaPlus } from 'react-icons/fa';

function AddApplicationButton({ onOpenModal }) {
  return (
    <div className="text-center animate-fadeIn mb-6">
      <button
        onClick={onOpenModal}
                className={`
          group relative overflow-hidden px-6 py-3 rounded-lg font-semibold text-white
          bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
          transform transition-all duration-300 hover:scale-105 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-100
          dark:focus:ring-offset-gray-800
          ${isLoading ? 'cursor-not-allowed opacity-75' : ''}
        `}
      >
        <FaPlus className="mr-2 text-sm" />
        Add New Application
      </button>
    </div>
  );
}

export default AddApplicationButton;
