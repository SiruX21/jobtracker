import React from 'react';
import { FaPlus } from 'react-icons/fa';

function AddApplicationButton({ onOpenModal }) {
  return (
    <div className="text-center animate-fadeIn">
      <button
        onClick={onOpenModal}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
      >
        <FaPlus className="mr-3 text-xl" />
        Add New Application
      </button>
    </div>
  );
}export default AddApplicationButton;
