import React from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';

function ProfileSection({ 
  user, 
  setUser,
  setShowEmailChangeModal, 
  setShowPasswordChangeModal, 
  setShowDeleteModal,
  isMobile 
}) {
  // Format date utility
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Profile & Security
      </h2>
      
      {/* Account Information */}
      {user && (
        <div className="mb-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Member since:</span> {formatDate(user.created_at)}
              </p>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-4'}`}>
              <button
                onClick={() => setShowEmailChangeModal(true)}
                className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full' : ''}`}
              >
                Change Email
              </button>
              <button
                onClick={() => setShowPasswordChangeModal(true)}
                className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full' : ''}`}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-3">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400 mr-3" />
            <h3 className="font-medium text-red-900 dark:text-red-100">Danger Zone</h3>
          </div>
          
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
          </p>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
          >
            <FaTrash className="mr-2" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
