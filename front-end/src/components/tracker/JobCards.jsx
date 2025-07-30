import React from 'react';
import { FaMapMarkerAlt, FaCalendar, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { getCompanyLogoSync } from '../../data/companySuggestions';

function JobCards({ 
  filteredJobs, 
  jobs, 
  statusColorMap, 
  editJob, 
  deleteJob, 
  setSearchTerm, 
  setStatusFilter, 
  setDateFilter, 
  setCompanyFilter 
}) {
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Company Logo Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 flex items-center justify-between">
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
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{
                  backgroundColor: statusColorMap[job.status] || '#6b7280'
                }}
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

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-2">
                  <button
                    onClick={() => editJob(job, jobs.findIndex(j => j.id === job.id))}
                    className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <FaEdit className="mr-1 text-xs" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteJob(jobs.findIndex(j => j.id === job.id))}
                    className="flex items-center px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    <FaTrash className="mr-1 text-xs" />
                    Delete
                  </button>
                </div>

                {job.job_url && (
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    <FaExternalLinkAlt className="mr-1 text-xs" />
                    View Job
                  </a>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default JobCards;
