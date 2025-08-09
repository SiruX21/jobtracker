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
  setDashboardFilter,
  compact = true
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

  // size presets
  const H = compact ? 'h-9' : 'h-12';
  const PX = compact ? 'px-3' : 'px-4';
  const PL_SEARCH = compact ? 'pl-8' : 'pl-10';
  const PR_SEARCH = compact ? 'pr-3' : 'pr-4';
  const LABEL_TXT = compact ? 'text-xs' : 'text-sm';
  const PANEL_P = compact ? 'p-3' : 'p-4';
  const ROW_GAP = compact ? 'gap-3' : 'gap-4';
  const BTN_TEXT = 'text-sm';
  const MIN_W = compact ? 'min-w-[120px]' : 'min-w-[140px]';
  const BADGE_P = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const OPTION_PY = compact ? 'py-1.5' : 'py-2';
  const INPUT_P = compact ? 'py-2.5' : 'p-3';
  const ICON = 'h-4 w-4';

  return (
    <Transition
      appear
      show={true}
      as="div"
      enter="transition-opacity duration-500"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${PANEL_P} mb-4`}
    >
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between ${ROW_GAP}`}>
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${ICON}`} />
            <input
              type="text"
              placeholder="Search companies, positions, locations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (setDashboardFilter) setDashboardFilter(null);
              }}
              className={`w-full ${H} ${PL_SEARCH} ${PR_SEARCH} border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-gray-100 ${BTN_TEXT}`}
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className={`${LABEL_TXT} font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap`}>
              Sort by:
            </label>
            <Listbox value={sortBy} onChange={setSortBy}>
              <div className="relative">
                <Listbox.Button
                  className={`relative cursor-default rounded-lg bg-white dark:bg-gray-700 ${PX} text-left
                              border border-gray-300 dark:border-gray-600 focus:outline-none
                              hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-100
                              transition-all duration-300 ${H} ${BTN_TEXT} ${MIN_W}`}
                  style={{ outline: 'none' }}
                >
                  <span className="block truncate text-gray-900 dark:text-gray-100 pr-6">
                    {sortOptions.find(o => o.value === sortBy)?.label || '📅 Newest First'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <FaChevronDown className={`${ICON} text-gray-400`} aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options
                    className={`absolute left-0 z-50 mt-1 max-h-60 overflow-auto
                                rounded-lg bg-white dark:bg-gray-700 py-1 ${BTN_TEXT} shadow-lg ring-1 ring-black ring-opacity-5
                                focus:outline-none border border-gray-300 dark:border-gray-600 ${MIN_W}`}
                  >
                    {sortOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none ${OPTION_PY} pl-3 pr-9 whitespace-nowrap ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100'
                              : 'text-gray-900 dark:text-gray-100'
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
                                <FaCheck className={`${ICON}`} aria-hidden="true" />
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

          {/* Filter Toggle with Badge */}
          <button
            key={`filters-${showFilters}`}
            className={`flex items-center ${H} ${PX} border border-gray-300 dark:border-gray-600
                        bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg
                        hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 ${BTN_TEXT}
                        ${showFilters ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
            style={{ outline: 'none' }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className={`mr-2 ${ICON}`} />
            Filters
            {(statusFilter !== 'all' || dateFilter !== 'all' || companyFilter) && (
              <span className={`ml-2 bg-blue-500 text-white text-xs rounded-full ${BADGE_P}`}>
                {[statusFilter !== 'all' ? 1 : 0, dateFilter !== 'all' ? 1 : 0, companyFilter ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
            {(statusFilter !== 'all' || dateFilter !== 'all' || companyFilter || searchTerm) && (
              <span
                onClick={e => {
                  e.stopPropagation();
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setCompanyFilter('');
                  setShowFilters(false);
                  if (setDashboardFilter) setDashboardFilter(null);
                }}
                className={`ml-2 flex items-center cursor-pointer border border-red-300 dark:border-red-600
                            bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg
                            hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}
                title="Clear all filters"
                style={{ outline: 'none' }}
              >
                <FaTimes className={`${ICON}`} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div>
            <label className={`block ${LABEL_TXT} font-medium text-gray-700 dark:text-gray-300 mb-2`}>Status</label>
            <Listbox
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                if (setDashboardFilter) setDashboardFilter(null);
              }}
            >
              <div className="relative">
                <Listbox.Button
                  className={`relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 ${INPUT_P}
                              pl-3 pr-12 text-left border border-gray-300 dark:border-gray-600 focus:outline-none
                              focus:ring-2 focus:ring-blue-500 dark:text-gray-100`}
                >
                  <span className="block truncate text-gray-900 dark:text-gray-100 pr-2">
                    {statusFilter === 'all'
                      ? 'All Statuses'
                      : jobStatuses.find(s => s.status_name.toLowerCase() === statusFilter)?.status_name || 'All Statuses'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <FaChevronDown className={`${ICON} text-gray-400`} aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-300 dark:border-gray-600"
                  >
                    <Listbox.Option
                      value="all"
                      className={({ active }) =>
                        `relative cursor-default select-none ${OPTION_PY} pl-3 pr-9 ${
                          active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>All Statuses</span>
                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                              <FaCheck className={`${ICON}`} aria-hidden="true" />
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
                          `relative cursor-default select-none ${OPTION_PY} pl-3 pr-9 ${
                            active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{status.status_name}</span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                <FaCheck className={`${ICON}`} aria-hidden="true" />
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
            <label className={`block ${LABEL_TXT} font-medium text-gray-700 dark:text-gray-300 mb-2`}>Date Range</label>
            <Listbox
              value={dateFilter}
              onChange={(value) => {
                setDateFilter(value);
                if (setDashboardFilter) setDashboardFilter(null);
              }}
            >
              <div className="relative">
                <Listbox.Button
                  className={`relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 ${INPUT_P}
                              pl-3 pr-12 text-left border border-gray-300 dark:border-gray-600 focus:outline-none
                              focus:ring-2 focus:ring-blue-500 dark:text-gray-100`}
                >
                  <span className="block truncate text-gray-900 dark:text-gray-100 pr-2">
                    {dateFilterOptions.find(option => option.value === dateFilter)?.label || 'All Time'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <FaChevronDown className={`${ICON} text-gray-400`} aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-300 dark:border-gray-600"
                  >
                    {dateFilterOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none ${OPTION_PY} pl-3 pr-9 ${
                            active ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                <FaCheck className={`${ICON}`} aria-hidden="true" />
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
            <label className={`block ${LABEL_TXT} font-medium text-gray-700 dark:text-gray-300 mb-2`}>Company</label>
            <input
              type="text"
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                if (setDashboardFilter) setDashboardFilter(null);
              }}
              className={`w-full ${INPUT_P} border border-gray-300 dark:border-gray-600 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100`}
            />
          </div>
        </div>
      )}

      {/* Results Count and Sort Info */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Showing {filteredJobs.length} of {jobs.length} applications
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>
    </Transition>
  );
}

export default SearchAndFilters;
