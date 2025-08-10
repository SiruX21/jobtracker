import React, { Fragment } from 'react';
import { FaSearch, FaFilter, FaSync, FaTrash, FaTimes, FaChevronDown, FaCheck } from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
import { formatDate } from './utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SkeletonThemeProvider from '../shared/SkeletonThemeProvider';

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
  openEditModal,
  initialLoading = false, // Add initial loading prop
  darkMode = false // Add darkMode prop
}) {
  // Show inline loading skeleton during initial load or when no jobs data
  if (initialLoading || (!jobs && loading) || !jobs) {
    return (
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="space-y-6">
          {/* Skeleton Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Skeleton height={44} className="flex-1 sm:w-80 rounded-lg" />
              <Skeleton height={44} width={160} className="rounded-lg" />
            </div>
            <Skeleton height={40} width={100} className="rounded-lg" />
          </div>

          {/* Skeleton Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton height={24} width={120} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={70} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={60} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={40} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={50} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={60} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={60} />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton height={32} width={32} className="rounded mr-3" />
                          <Skeleton height={16} width={120} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={16} width={140} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={16} width={80} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={24} width={70} className="rounded" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={16} width={90} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Skeleton height={16} width={16} />
                          <Skeleton height={16} width={16} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SkeletonThemeProvider>
    );
  }
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
            <Listbox value={jobsStatusFilter} onChange={setJobsStatusFilter}>
              <div className="relative">
                <Listbox.Button className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none relative cursor-default text-left w-full">
                  <span className="block truncate">
                    {jobsStatusFilter === '' ? 'All Status' : jobStatuses.find(status => status.status_name === jobsStatusFilter)?.status_name || 'All Status'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FaChevronDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Listbox.Option
                      value=""
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            All Status
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <FaCheck className="h-3 w-3" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                    {jobStatuses.map(status => (
                      <Listbox.Option
                        key={status.status_name}
                        value={status.status_name}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {status.status_name}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <FaCheck className="h-3 w-3" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
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
              {jobs.length === 0 ? (
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
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img 
                              src={getCompanyLogoSync(job.company_name)} 
                              alt={job.company_name}
                              className="w-full h-full object-cover rounded-lg"
                              style={{ 
                                backgroundColor: 'transparent',
                                objectFit: 'contain',
                                padding: '1px'
                              }}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name)}&background=3b82f6&color=ffffff&size=32&bold=true`;
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
