import React, { Fragment } from 'react';
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaCheck } from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';

function SearchAndFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  companyFilter,
  setCompanyFilter,
  jobStatuses,
  filteredJobs,
  jobs,
  setDashboardFilter
}) {
  const sortOptions = [
    { value: 'date_desc', label: '📅 Newest First' },
    { value: 'date_asc', label: '📅 Oldest First' },
    { value: 'company_asc', label: '🏢 Company A-Z' },
    { value: 'company_desc', label: '🏢 Company Z-A' },
    { value: 'status', label: '🎯 Status Priority' },
    { value: 'title_asc', label: '💼 Job Title A-Z' }
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: '3months', label: 'Past 3 Months' }
  ];

  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, positions, locations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (setDashboardFilter) setDashboardFilter(null);
                }}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Sort by:
              </label>
              <Listbox value={sortBy} onChange={setSortBy}>
                <div className="relative">
                  <Listbox.Button className="relative cursor-default rounded-lg bg-white dark:bg-gray-700 px-3 py-2 text-left border border-gray-300 dark:border-gray-600 focus:outline-none hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-100 transition-all duration-300 h-12 text-sm pr-8" style={{ outline: 'none' }}>
                    <span className="block truncate text-gray-900 dark:text-gray-100">
                      {sortOptions.find(option => option.value === sortBy)?.label || '📅 Newest First'}
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
                    <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-300 dark:border-gray-600">
                      {sortOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                              active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
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

            {/* Filter Toggle with integrated Clear */}
            <button
              key={`filters-${showFilters}`}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center h-12 px-4 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 ${showFilters ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              style={{ outline: 'none' }}
            >
              <FaFilter className="mr-2" />
              Filters
              {(statusFilter !== "all" || dateFilter !== "all" || companyFilter) && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[statusFilter !== "all" ? 1 : 0, dateFilter !== "all" ? 1 : 0, companyFilter ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
              {(statusFilter !== "all" || dateFilter !== "all" || companyFilter || searchTerm) && (
                <FaTimes
                  className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("all");
                    setCompanyFilter("");
                    setShowFilters(false);
                    if (setDashboardFilter) setDashboardFilter(null);
                  }}
                  title="Clear all filters"
                />
              )}
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Listbox 
                value={statusFilter} 
                onChange={(value) => {
                  setStatusFilter(value);
                  if (setDashboardFilter) setDashboardFilter(null);
                }}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-3 pl-3 pr-8 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100">
                    <span className="block truncate text-gray-900 dark:text-gray-100">
                      {statusFilter === 'all' 
                        ? 'All Statuses' 
                        : jobStatuses.find(status => status.status_name.toLowerCase() === statusFilter)?.status_name || 'All Statuses'
                      }
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
                    <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-300 dark:border-gray-600">
                      <Listbox.Option
                        value="all"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              All Statuses
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                <FaCheck className="h-3 w-3" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {jobStatuses.map(status => (
                        <Listbox.Option
                          key={status.status_name}
                          value={status.status_name.toLowerCase()}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                              active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {status.status_name}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <Listbox 
                value={dateFilter} 
                onChange={(value) => {
                  setDateFilter(value);
                  if (setDashboardFilter) setDashboardFilter(null);
                }}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-3 pl-3 pr-8 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100">
                    <span className="block truncate text-gray-900 dark:text-gray-100">
                      {dateFilterOptions.find(option => option.value === dateFilter)?.label || 'All Time'}
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
                    <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-300 dark:border-gray-600">
                      {dateFilterOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                              active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  if (setDashboardFilter) setDashboardFilter(null);
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Count and Sort Info */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {filteredJobs.length} of {jobs.length} applications
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>
    </>
  );
}

export default SearchAndFilters;
