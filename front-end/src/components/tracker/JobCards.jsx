import React from 'react';
import { FaMapMarkerAlt, FaCalendar, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { getCompanyLogoSync } from '../../data/companySuggestions';

// Default status colors fallback
const getDefaultStatusColor = (status) => {
  const statusColors = {
    'applied': '#3b82f6',      // blue
    'interview': '#10b981',    // green
    'offer': '#8b5cf6',        // purple
    'rejected': '#ef4444',     // red
    'ghosted': '#6b7280',      // gray
    'reviewing': '#f59e0b',    // amber
    'oa': '#06b6d4',          // cyan
    'pending': '#f59e0b'       // amber
  };
  return statusColors[status.toLowerCase()] || '#6b7280';
};

function JobCards({ 
  filteredJobs, 
  jobs, 
  statusColorMap, 
  editJob, 
  deleteJob, 
  setSearchTerm, 
  setStatusFilter, 
  setDateFilter, 
  setCompanyFilter,
  setDashboardFilter
}) {
  // Debug logging
  console.log('JobCards statusColorMap:', statusColorMap);
  console.log('JobCards received filteredJobs:', filteredJobs.length, 'jobs');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {filteredJobs.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {jobs.length === 0 ? "No job applications yet. Add one above!" : "No applications match your search criteria."}
          </p>
          {jobs.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setCompanyFilter("");
                if (setDashboardFilter) setDashboardFilter(null);
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        filteredJobs.map((job, index) => (
          <div
            key={job.id || index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden animate-fadeIn cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => editJob(job, jobs.findIndex(j => j.id === job.id))}
          >
            {/* Company Logo Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 flex items-center justify-between relative">
              {/* Quick Delete Icon - positioned at top-right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteJob(jobs.findIndex(j => j.id === job.id));
                }}
                className="absolute top-3 right-3 p-2 text-gray-500 dark:text-gray-400 rounded-full hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-70 hover:opacity-100"
                title="Delete application"
              >
                <FaTrash className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">
                  <img 
                    src={getCompanyLogoSync(job.company_name)} 
                    alt={job.company_name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name)}&background=3b82f6&color=ffffff&size=40&bold=true`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {job.company_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {job.job_title}
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                style={{
                  backgroundColor: statusColorMap[job.status] || 
                                   statusColorMap[job.status.toLowerCase()] ||
                                   statusColorMap[job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()] ||
                                   getDefaultStatusColor(job.status)
                }}
                title={`Status: ${job.status}, Color from API: ${statusColorMap[job.status] || 'none'}, Fallback: ${getDefaultStatusColor(job.status)}`}
              >
                {job.status}
              </span>
            </div>

            {/* Job Details */}
            <div className="p-4">
              {job.location && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <FaMapMarkerAlt className="mr-2 text-blue-500" />
                  {job.location}
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                <FaCalendar className="mr-2 text-green-500" />
                Applied on {new Date(job.application_date).toLocaleDateString()}
              </div>

              {job.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {job.notes.length > 100 ? `${job.notes.substring(0, 100)}...` : job.notes}
                  </p>
                </div>
              )}

              {/* View Job Link - if available */}
              {job.job_url && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-full px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    <FaExternalLinkAlt className="mr-2 text-sm" />
                    View Job Posting
                  </a>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default JobCards;
