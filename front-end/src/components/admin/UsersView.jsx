import React from 'react';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSync,
  FaExclamationTriangle, FaTimes, FaEye, FaCheck, FaUserShield
} from 'react-icons/fa';
import { formatDate } from './utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SkeletonThemeProvider from '../shared/SkeletonThemeProvider';

function UsersView({
  users,
  filteredUsers,
  usersSearch,
  usersFilter,
  usersPagination,
  usersPage,
  loading,
  error,
  setUsersSearch,
  setUsersFilter,
  setUsersPage,
  loadUsers,
  setSelectedUser,
  deleteUser,
  setShowCreateAdmin,
  setError,
  initialLoading = false, // Add initial loading prop
  darkMode = false // Add darkMode prop
}) {
  // Show inline loading skeleton during initial load
  if (initialLoading || (!users.length && loading && !error)) {
    return (
      <SkeletonThemeProvider darkMode={darkMode}>
        <div className="space-y-6">
          {/* Skeleton Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Skeleton height={44} className="flex-1 sm:w-80 rounded-lg" />
              <Skeleton height={44} width={120} className="rounded-lg" />
              <Skeleton height={44} width={100} className="rounded-lg" />
            </div>
            <Skeleton height={44} width={140} className="rounded-full" />
          </div>

          {/* Skeleton Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={40} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={50} />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton height={16} width={40} />
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
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton height={40} width={40} className="rounded-full mr-4" />
                          <div>
                            <Skeleton height={16} width={120} className="mb-1" />
                            <Skeleton height={14} width={160} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={24} width={80} className="rounded-full" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={24} width={60} className="rounded-full" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton height={16} width={100} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Skeleton height={28} width={60} className="rounded-full" />
                          <Skeleton height={28} width={50} className="rounded-full" />
                          <Skeleton height={28} width={65} className="rounded-full" />
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
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Users Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, email..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {usersSearch && (
              <button
                onClick={() => setUsersSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={usersFilter}
              onChange={(e) => setUsersFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button
            onClick={() => {
              setUsersPage(1);
              loadUsers();
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {/* Results Info */}
        {(usersSearch || usersFilter !== 'all') && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredUsers.length > 0 ? (
              <span>
                Showing {filteredUsers.length} of {usersPagination.total || 0} users
                {usersSearch && ` matching "${usersSearch}"`}
                {usersFilter !== 'all' && ` (${usersFilter} filter)`}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                No users found matching your search criteria
              </span>
            )}
          </div>
        )}
        
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="inline-flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm font-medium"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Create Admin
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {usersSearch || usersFilter !== 'all' ? (
                        <div>
                          <FaSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No users found matching your search criteria.</p>
                          <button
                            onClick={() => {
                              setUsersSearch('');
                              setUsersFilter('all');
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div>
                          <FaUsers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No users found.</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <FaUsers className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.email_verified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border border-green-200 dark:border-green-600 shadow-sm">
                        <FaCheck className="w-3 h-3 mr-1.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-600 shadow-sm">
                        <FaExclamationTriangle className="w-3 h-3 mr-1.5" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-600'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-600'
                    }`}>
                      {user.role === 'admin' && <FaUserShield className="w-3 h-3 mr-1.5" />}
                      {user.role === 'user' && <FaUsers className="w-3 h-3 mr-1.5" />}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 dark:border-blue-500 shadow-sm text-xs font-medium rounded-full text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        <FaEye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => setSelectedUser({ ...user, editing: true })}
                        className="inline-flex items-center px-2.5 py-1.5 border border-amber-300 dark:border-amber-500 shadow-sm text-xs font-medium rounded-full text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        <FaEdit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-500 shadow-sm text-xs font-medium rounded-full text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        <FaTrash className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersPagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {usersPagination.page} of {usersPagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUsersPage(usersPage - 1)}
                  disabled={usersPage <= 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setUsersPage(usersPage + 1)}
                  disabled={usersPage >= usersPagination.pages}
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

export default UsersView;
