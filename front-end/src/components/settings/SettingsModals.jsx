import React from 'react';
import { FaTrash, FaTimes, FaEye, FaEyeSlash, FaSave, FaEnvelope } from 'react-icons/fa';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';

function SettingsModals({
  // Delete modal props
  showDeleteModal,
  setShowDeleteModal,
  deletePassword,
  setDeletePassword,
  deleteLoading,
  handleDeleteAccount,
  
  // Email change modal props
  showEmailChangeModal,
  setShowEmailChangeModal,
  emailChangePassword,
  setEmailChangePassword,
  emailChangeLoading,
  handleEmailChange,
  
  // Password change modal props
  showPasswordChangeModal,
  setShowPasswordChangeModal,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPasswords,
  setShowPasswords,
  passwordValidation,
  setPasswordValidation,
  loading,
  handlePasswordChange,
  
  isMobile
}) {
  return (
    <>
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-red-600 dark:text-red-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Confirm Account Deletion
            </h3>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
              This action cannot be undone. This will permanently delete your account and all your data.
            </p>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 font-medium ${isMobile ? 'text-sm' : ''}`}>
              Please enter your password to confirm:
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-red-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword.trim()}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Confirmation Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Change Email Address
            </h3>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
              To change your email address, we'll send a confirmation email to your current email address first.
            </p>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 font-medium ${isMobile ? 'text-sm' : ''}`}>
              Please enter your password to confirm:
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={emailChangePassword}
                onChange={(e) => setEmailChangePassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEmailChange();
                  }
                }}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>📧 Process:</strong>
                <br />1. Confirm with your current email
                <br />2. Enter your new email address
                <br />3. Verify your new email
              </p>
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
              <button
                onClick={() => {
                  setShowEmailChangeModal(false);
                  setEmailChangePassword('');
                }}
                className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                disabled={emailChangeLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChange}
                disabled={emailChangeLoading || !emailChangePassword.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
              >
                {emailChangeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Send Confirmation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                  minLength={6}
                />
                
                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator 
                  password={newPassword}
                  onValidationChange={setPasswordValidation}
                  showRequirements={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showPasswords ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                  {showPasswords ? 'Hide' : 'Show'} passwords
                </button>
              </div>

              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChangeModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default SettingsModals;
