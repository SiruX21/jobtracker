import React, { useState } from 'react';
import { FaTimes, FaEdit, FaSpinner, FaTrash, FaHistory } from 'react-icons/fa';
import StatusHistoryModal from './StatusHistoryModal';

function EditJobModal({ 
  isOpen, 
  onClose, 
  newJob, 
  setNewJob, 
  jobStatuses, 
  onSubmit, 
  loading,
  darkMode,
  onDelete // Add delete handler prop
}) {
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  if (!isOpen) return null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this job application? This action cannot be undone.')) {
      onDelete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Application</h2>
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
                  {newJob.id && (
                    <button
                      onClick={() => setShowStatusHistory(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                      type="button"
                    >
                      <FaHistory className="mr-1" />
                      View History
                    </button>
                  )}
                </div>
                <select
                  value={newJob.status || ''}
                  onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select status</option>
                  {jobStatuses?.map((status) => (
                    <option key={status.id || status.status_name} value={status.status_name}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
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
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center transition-all duration-200"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>

            {/* Cancel and Update Buttons - Right side */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={loading || !newJob.company_name || !newJob.job_title}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center transition-all duration-200"
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
      </div>

      {/* Status History Modal */}
      <StatusHistoryModal
        isOpen={showStatusHistory}
        onClose={() => setShowStatusHistory(false)}
        jobId={newJob.id}
        jobTitle={newJob.job_title}
        companyName={newJob.company_name}
      />
    </div>
  );
}

export default EditJobModal;
