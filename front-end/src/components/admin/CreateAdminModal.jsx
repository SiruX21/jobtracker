import React from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';

function CreateAdminModal({
  showCreateAdmin,
  setShowCreateAdmin,
  newAdminData,
  setNewAdminData,
  createAdminUser
}) {
  return (
    <Dialog open={showCreateAdmin} onClose={() => setShowCreateAdmin(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              Create Admin User
            </Dialog.Title>
            <button
              onClick={() => setShowCreateAdmin(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={newAdminData.username}
              onChange={(e) => setNewAdminData({ ...newAdminData, username: e.target.value })}
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
              value={newAdminData.email}
              onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={newAdminData.password}
              onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={createAdminUser}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Admin
            </button>
            <button
              onClick={() => setShowCreateAdmin(false)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default CreateAdminModal;
