import React, { useState, useEffect } from 'react';
import { FaUser, FaChevronDown, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

function ProfileSection({ 
  user, 
  setUser,
  setShowEmailChangeModal, 
  setShowPasswordChangeModal, 
  setShowDeleteModal,
  isMobile 
}) {
  // Local state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    accountInfo: false,
    dangerZone: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format date utility
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Load user profile
  const loadUserProfile = async () => {
    try {
      const authToken = Cookies.get("authToken");
      if (!authToken) return;
      
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  // Load user profile on component mount
  useEffect(() => {
    if (!user) {
      loadUserProfile();
    }
  }, [user]);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Profile & Security
      </h2>
      
      {/* User Info */}
      {user && (
                <div className="mb-8">
          <div
            onClick={() => toggleSection('accountInfo')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account Information</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmailChangeModal(true);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  Change Email
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasswordChangeModal(true);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  Change Password
                </button>
              </div>
              <FaChevronDown className={`transition-transform duration-200 ${expandedSections.accountInfo ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {expandedSections.accountInfo && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 animate-fadeIn">
              <p className="text-sm text-gray-600 dark:text-gray-400">Email: {user.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member since: {formatDate(user.created_at)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Account - Danger Zone */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('dangerZone')}
          className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400 mr-3" />
            <h3 className="font-medium text-red-900 dark:text-red-100">Danger Zone</h3>
          </div>
          <FaChevronDown className={`transition-transform duration-200 text-red-600 dark:text-red-400 ${expandedSections.dangerZone ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.dangerZone && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-fadeIn">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
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
        )}
      </div>
    </div>
  );
}

export default ProfileSection;
