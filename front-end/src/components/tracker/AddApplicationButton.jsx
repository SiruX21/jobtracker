import React from 'react';
import { FaPlus } from 'react-icons/fa';

function AddApplicationButton({ onOpenModal, loading = false }) {
  return (
    <div className="text-center animate-fadeIn mb-6">
      <button
        onClick={onOpenModal}
        disabled={loading}
        className={`
          group relative overflow-hidden px-8 py-4 rounded-lg font-semibold text-lg text-white
          bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
          transform transition-all duration-300 hover:scale-105 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100
          dark:focus:ring-offset-gray-800
          flex items-center justify-center whitespace-nowrap
          ${loading ? 'cursor-not-allowed opacity-75' : ''}
        `}
      >
        <FaPlus className="mr-3 text-base" />
        Add New Application
      </button>
    </div>
  );
}

export default AddApplicationButton;
