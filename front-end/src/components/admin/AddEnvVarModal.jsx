import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';

function AddEnvVarModal({
  showEnvEditor,
  setShowEnvEditor,
  newEnvVar,
  setNewEnvVar,
  addEnvironmentVar
}) {
  return (
    <Transition.Root show={showEnvEditor} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setShowEnvEditor(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4"
          >
            <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 transform shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">Add Environment Variable</Dialog.Title>
          <button
            onClick={() => setShowEnvEditor(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key
            </label>
            <input
              type="text"
              value={newEnvVar.key}
              onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VARIABLE_NAME"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            <textarea
              value={newEnvVar.value}
              onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="variable_value"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={addEnvironmentVar}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Variable
            </button>
            <button
              onClick={() => setShowEnvEditor(false)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
  );
}

export default AddEnvVarModal;
