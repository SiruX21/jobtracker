import React from 'react';
import { FaPlus } from 'react-icons/fa';

function AddApplicationButton({ onOpenModal }) {
  return (
    <div className="text-center animate-fadeIn mb-6">
      <button
        onClick={onOpenModal}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
      >
        <FaPlus className="mr-2 text-sm" />
        Add New Application
      </button>
    </div>
  );
}

export default AddApplicationButton;
