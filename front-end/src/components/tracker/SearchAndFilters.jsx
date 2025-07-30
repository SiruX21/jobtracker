import React from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

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
  jobs
}) {
  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, positions, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="date_desc">📅 Newest First</option>
                <option value="date_asc">📅 Oldest First</option>
                <option value="company_asc">🏢 Company A-Z</option>
                <option value="company_desc">🏢 Company Z-A</option>
                <option value="status">🎯 Status Priority</option>
                <option value="title_asc">💼 Job Title A-Z</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FaFilter className="mr-2" />
              Filters
              {(statusFilter !== "all" || dateFilter !== "all" || companyFilter) && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[statusFilter !== "all" ? 1 : 0, dateFilter !== "all" ? 1 : 0, companyFilter ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            
            {/* Clear Filters Button */}
            {(statusFilter !== "all" || dateFilter !== "all" || companyFilter || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                  setCompanyFilter("");
                }}
                className="flex items-center px-3 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                title="Clear all filters"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                {jobStatuses.map(status => (
                  <option key={status.status_name} value={status.status_name.toLowerCase()}>
                    {status.status_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="3months">Past 3 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
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
