import React, { useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { FaTimes, FaEdit, FaSpinner, FaTrash, FaHistory, FaChevronDown, FaCheck } from 'react-icons/fa';
import StatusHistoryModal from './StatusHistoryModal';
import { JOB_STATUSES } from '../../data/jobStatuses';

function EditJobModal({ 
  isOpen, 
  onClose, 
  newJob, 
  setNewJob, 
  editingJob,
  onSubmit, 
  loading,
  darkMode,
  onDelete, // Add delete handler prop
  statusColorMap = {} // Add statusColorMap prop
}) {
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  
  // Use JOB_STATUSES instead of prop
  const jobStatuses = JOB_STATUSES;
  
  // Default status colors fallback (matching JobCards)
  const getDefaultStatusColor = (status) => {
    const statusColors = {
      'applied': '#3B82F6',
      'reviewing': '#F59E0B', 
      'phone screen': '#06B6D4',
      'interview': '#10B981',
      'technical': '#8B5CF6',
      'oa': '#A855F7',
      'final round': '#EC4899',
      'offer': '#22C55E',
      'accepted': '#059669',
      'rejected': '#EF4444',
      'withdrawn': '#F97316',
      'ghosted': '#6B7280'
    };
    return statusColors[status.toLowerCase()] || '#6b7280';
  };

  const getStatusColor = (status) => {
    return statusColorMap[status] || 
           statusColorMap[status.toLowerCase()] ||
           statusColorMap[status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] ||
           getDefaultStatusColor(status);
  };

  const StatusBadge = ({ status, className = "" }) => {
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm ${className}`}
        style={{
          backgroundColor: getStatusColor(status)
        }}
      >
        {status}
      </span>
    );
  };

  const StatusDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const StatusOption = ({ status, isSelected = false, onClick }) => (
      <div 
        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onClick={onClick}
      >
        <StatusBadge status={status} />
      </div>
    );

    return (
      <div className="relative">
        {/* Custom dropdown button showing current status badge */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-3 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        >
          <span className="block truncate">
            {value ? (
              <StatusBadge status={value} />
            ) : (
              'Select status'
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FaChevronDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
          </span>
        </button>

        {/* Custom dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div 
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center text-gray-900 dark:text-white"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              Select status
            </div>
            {jobStatuses?.map((status) => (
              <StatusOption
                key={status.id || status.name}
                status={status.name}
                isSelected={status.name === value}
                onClick={() => {
                  onChange(status.name);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const handleCloseStatusHistory = () => {
    setShowStatusHistory(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this job application? This action cannot be undone.')) {
      onDelete();
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
            <Dialog.Panel 
              className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl border border-gray-200 dark:border-gray-700 transform"
            >
              <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">Edit Application</Dialog.Title>
              <button 
                onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              title="Close"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Company Name and Job Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newJob.company_name || ''}
                  onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newJob.job_title || ''}
                  onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter job title"
                />
              </div>
            </div>

            {/* Status and Application Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <button
                    onClick={() => setShowStatusHistory(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                    type="button"
                  >
                    <FaHistory className="mr-1" />
                    View History
                  </button>
                </div>
                <StatusDropdown 
                  value={newJob.status || ''}
                  onChange={(value) => setNewJob({ ...newJob, status: value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Date
                </label>
                <input
                  type="date"
                  value={newJob.application_date || ''}
                  onChange={(e) => setNewJob({ ...newJob, application_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={newJob.location || ''}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="e.g., San Francisco, CA (Remote)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Job URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job URL <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                value={newJob.job_url || ''}
                onChange={(e) => setNewJob({ ...newJob, job_url: e.target.value })}
                placeholder="https://..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={newJob.notes || ''}
                onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                placeholder="Any additional notes about this application..."
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Delete Button - Left side */}
              <button
                onClick={handleDelete}
                className="h-12 bg-red-500 text-white px-6 rounded-lg hover:bg-red-600 flex items-center justify-center transition-all duration-200"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>

              {/* Cancel and Update Buttons - Right side */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="h-12 bg-gray-500 text-white px-6 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={loading || !newJob.company_name || !newJob.job_title}
                  className="h-12 bg-blue-500 text-white px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="mr-2" />
                      Update Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
              </div>
        </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>

      {/* Status History Modal */}
      <StatusHistoryModal
        isOpen={showStatusHistory}
        onClose={handleCloseStatusHistory}
        jobId={editingJob?.id}
        jobTitle={newJob?.job_title}
        companyName={newJob?.company_name}
        darkMode={darkMode}
      />
    </Transition.Root>
  );
}

export default EditJobModal;
