import React from 'react';
import { FaSearch, FaFilter, FaSync, FaTrash, FaTimes } from 'react-icons/fa';
import { formatDate } from './utils';

function JobsView({
  jobs,
  jobsSearch,
  jobsStatusFilter,
  jobsPagination,
  jobsPage,
  jobStatuses,
  statusColorMap,
  loading,
  setJobsSearch,
  setJobsStatusFilter,
  setJobsPage,
  loadJobs,
  deleteJob,
  getCompanyLogoSync,
  openEditModal
}) {
  return (
    <div className="space-y-6">
      {/* Jobs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, position, user..."
              value={jobsSearch}
              onChange={(e) => setJobsSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {jobsSearch && (
              <button
                onClick={() => setJobsSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={jobsStatusFilter}
              onChange={(e) => setJobsStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
            >
              <option value="">All Status</option>
              {jobStatuses.map(status => (
                <option key={status.status_name} value={status.status_name}>
                  {status.status_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setJobsPage(1);
              loadJobs();
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <FaSync className="animate-spin w-5 h-5 mr-2 text-blue-500" />
                      <span className="text-gray-500 dark:text-gray-400">Loading jobs...</span>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {jobsSearch || jobsStatusFilter ? (
                        <div>
                          <FaSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No jobs found matching your search criteria.</p>
                          <button
                            onClick={() => {
                              setJobsSearch('');
                              setJobsStatusFilter('');
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div>
                          <FaSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No jobs found.</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => openEditModal(job)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">
                            <img 
                              src={getCompanyLogoSync(job.company_name)} 
                              alt={job.company_name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name)}&background=3b82f6&color=ffffff&size=24&bold=true`;
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.company_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {job.position_title}
                          </div>
                          {job.location && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {job.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => openEditModal(job)}
                    >
                      <div className="text-sm text-gray-900 dark:text-white">{job.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{job.email}</div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => openEditModal(job)}
                    >
                      <span 
                        className="px-2 py-1 text-xs rounded text-white"
                        style={{
                          backgroundColor: statusColorMap[job.status] || '#6b7280'
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
                      onClick={() => openEditModal(job)}
                    >
                      {formatDate(job.applied_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {jobsPagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {jobsPagination.page} of {jobsPagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setJobsPage(jobsPage - 1)}
                  disabled={jobsPage <= 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setJobsPage(jobsPage + 1)}
                  disabled={jobsPage >= jobsPagination.pages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobsView;
