import React from 'react';
import { FaExternalLinkAlt, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { getStatusColor } from '../../data/jobStatuses';

const ListView = ({ 
  filteredJobs, 
  jobs, 
  editJob, 
  deleteJob, 
  setSearchTerm, 
  setStatusFilter, 
  setDateFilter, 
  setCompanyFilter,
  setDashboardFilter,
  darkMode 
}) => {
  const handleStatusClick = (status) => {
    setSearchTerm("");
    setCompanyFilter("");
    setDateFilter("all");
    setStatusFilter(status.toLowerCase());
    setDashboardFilter(null);
  };

  const handleCompanyClick = (company) => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setCompanyFilter(company);
    setDashboardFilter(null);
  };

  const handleDateClick = (date) => {
    setSearchTerm("");
    setStatusFilter("all");
    setCompanyFilter("");
    setDateFilter("week");
    setDashboardFilter(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${color}`}
        onClick={() => handleStatusClick(status)}
      >
        {status}
      </span>
    );
  };

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {jobs.length === 0 
              ? "Get started by adding your first job application!"
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-750 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Company & Position</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Applied Date</div>
          <div className="col-span-2">Notes</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredJobs.map((job, index) => (
          <div key={job.id || index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Company & Position */}
              <div className="col-span-3">
                <div 
                  className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => handleCompanyClick(job.company_name)}
                >
                  {job.company_name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {job.job_title}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                {getStatusBadge(job.status)}
              </div>

              {/* Location */}
              <div className="col-span-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  {job.location ? (
                    <>
                      <FaMapMarkerAlt className="w-3 h-3 mr-1 text-gray-400" />
                      {job.location}
                    </>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 italic">Not specified</span>
                  )}
                </div>
              </div>

              {/* Applied Date */}
              <div className="col-span-2">
                <div 
                  className="flex items-center text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => handleDateClick(job.application_date)}
                >
                  <FaCalendarAlt className="w-3 h-3 mr-1 text-gray-400" />
                  {formatDate(job.application_date)}
                </div>
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {job.notes ? (
                    <span title={job.notes}>{job.notes}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 italic">No notes</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="flex items-center space-x-2">
                  {job.job_url && (
                    <button
                      onClick={() => window.open(job.job_url, '_blank')}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Job Posting"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => editJob(job, index)}
                    className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Edit Application"
                  >
                    <FaEdit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteJob(index)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete Application"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-750 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredJobs.length} of {jobs.length} applications
        </div>
      </div>
    </div>
  );
};

export default ListView;
