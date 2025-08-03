import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { formatDate } from './utils';

function UserDetailModal({
  selectedUser,
  setSelectedUser,
  updateUser
}) {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {selectedUser.editing ? 'Edit User' : 'User Details'}
          </h3>
          <button
            onClick={() => setSelectedUser(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        {selectedUser.editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={selectedUser.username}
                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailVerified"
                checked={selectedUser.email_verified}
                onChange={(e) => setSelectedUser({ ...selectedUser, email_verified: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="emailVerified" className="text-sm text-gray-700 dark:text-gray-300">
                Email Verified
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => updateUser(selectedUser.id, {
                  username: selectedUser.username,
                  email: selectedUser.email,
                  role: selectedUser.role,
                  email_verified: selectedUser.email_verified
                })}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
              <p className="text-lg text-gray-900 dark:text-white">{selectedUser.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-lg text-gray-900 dark:text-white">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-lg text-gray-900 dark:text-white">{selectedUser.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
              <p className="text-lg text-gray-900 dark:text-white">
                {selectedUser.email_verified ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-lg text-gray-900 dark:text-white">
                {formatDate(selectedUser.created_at)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDetailModal;
