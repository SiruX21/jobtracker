import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaSpinner } from 'react-icons/fa';

function LoadingOverlay({ loading, editingJob }) {
  return (
    <Transition.Root show={loading} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
            <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full border border-gray-200 dark:border-gray-700 transform">
              <FaSpinner className="text-4xl text-blue-500 animate-spin" />
              <div className="text-center">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {editingJob ? "Updating Application..." : "Adding Application..."}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we save your job application
                </Dialog.Description>
              </div>
              <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default LoadingOverlay;
