
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTrash, FaTimes, FaEye, FaEyeSlash, FaSave, FaEnvelope } from 'react-icons/fa';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';


function SettingsModals({
  // ...existing code...
  showDeleteModal,
  setShowDeleteModal,
  deletePassword,
  setDeletePassword,
  deleteLoading,
  handleDeleteAccount,
  showEmailChangeModal,
  setShowEmailChangeModal,
  newEmail,
  setNewEmail,
  emailChangePassword,
  setEmailChangePassword,
  emailChangeStep,
  setEmailChangeStep,
  emailChangeLoading,
  handleEmailChange,
  user,
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
      <Transition.Root show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transform shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
                <Dialog.Title as="h3" className={`font-bold text-red-600 dark:text-red-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Confirm Account Deletion</Dialog.Title>
                <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>This action cannot be undone. This will permanently delete your account and all your data.</p>
                <p className={`text-gray-700 dark:text-gray-300 mb-4 font-medium ${isMobile ? 'text-sm' : ''}`}>Please enter your password to confirm:</p>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Email Change Modal */}
      <Transition.Root show={showEmailChangeModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowEmailChangeModal(false);
          setEmailChangePassword('');
          setNewEmail('');
          setEmailChangeStep('request');
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transform shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
                <Dialog.Title as="h3" className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Change Email Address</Dialog.Title>
                {emailChangeStep === 'request' && (
                  <>
                    <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                      Enter your new email address and current password to request an email change.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Email
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Password
                        </label>
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
                    </div>
                  </>
                )}
                {emailChangeStep === 'pending' && (
                  <div className="text-center py-4">
                    <div className="text-6xl mb-4">📧</div>
                    <h4 className={`font-medium text-gray-900 dark:text-white mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>Email Change Request Sent</h4>
                    <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>We've sent confirmation links to both your current email ({user?.email}) and your new email ({newEmail}).</p>
                    <p className={`text-gray-600 dark:text-gray-400 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Please check both inboxes and click the confirmation links to complete the email change process.</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className={`text-blue-700 dark:text-blue-300 ${isMobile ? 'text-xs' : 'text-sm'}`}><strong>Note:</strong> You must confirm from both emails within 24 hours, or the request will expire.</p>
                    </div>
                  </div>
                )}
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'} mt-6`}>
                  <button
                    onClick={() => {
                      setShowEmailChangeModal(false);
                      setEmailChangePassword('');
                      setNewEmail('');
                      setEmailChangeStep('request');
                    }}
                    className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeStep === 'pending' ? 'Close' : 'Cancel'}
                  </button>
                  {emailChangeStep === 'request' && (
                    <button
                      onClick={handleEmailChange}
                      disabled={emailChangeLoading || !newEmail.trim() || !emailChangePassword.trim() || newEmail === user?.email}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
                    >
                      {emailChangeLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope className="mr-2" />
                          Request Change
                        </>
                      )}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Password Change Modal */}
      <Transition.Root show={showPasswordChangeModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowPasswordChangeModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transform shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
                <Dialog.Title as="h3" className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Change Password</Dialog.Title>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
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
                    <PasswordStrengthIndicator 
                      password={newPassword}
                      onValidationChange={setPasswordValidation}
                      showRequirements={true}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

export default SettingsModals;
