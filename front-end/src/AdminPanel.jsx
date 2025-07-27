import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';
import Header from './Header';
import { 
  FaUsers, FaBriefcase, FaChartBar, FaCog, FaPlus, FaEdit, FaTrash,
  FaSearch, FaFilter, FaDownload, FaUpload, FaUserShield, FaEye,
  FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaSync,
  FaDatabase, FaMemory, FaServer, FaCloudDownloadAlt
} from 'react-icons/fa';

function AdminPanel({ darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Users data
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({});
  const [usersSearch, setUsersSearch] = useState('');
  
  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPagination, setJobsPagination] = useState({});
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState('');
  
  // System data
  const [systemInfo, setSystemInfo] = useState(null);
  const [environmentVars, setEnvironmentVars] = useState(null);
  const [showEnvEditor, setShowEnvEditor] = useState(false);
  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' });
  const [editingEnvVar, setEditingEnvVar] = useState(null);
  
  // UI states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'jobs') {
      loadJobs();
    } else if (activeTab === 'system') {
      loadSystemInfo();
      loadEnvironmentVars();
    }
  }, [activeTab, usersPage, usersSearch, jobsPage, jobsSearch, jobsStatusFilter]);

  const checkAdminAccess = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        navigate('/auth?redirect=admin');
        return;
      }

      // Try to access admin dashboard to verify admin rights
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoading(false);
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Admin access required');
      } else if (error.response?.status === 401) {
        navigate('/auth?redirect=admin');
      } else {
        setError('Failed to verify admin access');
      }
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
    }
  };

  const loadUsers = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = {
        page: usersPage,
        per_page: 20,
        search: usersSearch
      };
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to load users');
    }
  };

  const loadJobs = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = {
        page: jobsPage,
        per_page: 20,
        search: jobsSearch,
        status: jobsStatusFilter
      };
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setJobs(response.data.jobs);
      setJobsPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to load jobs');
    }
  };

  const loadSystemInfo = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/system/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemInfo(response.data);
    } catch (error) {
      setError('Failed to load system info');
    }
  };

  const loadEnvironmentVars = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/system/environment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnvironmentVars(response.data);
    } catch (error) {
      setError('Failed to load environment variables');
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const token = Cookies.get('authToken');
      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job application?')) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      await axios.delete(`${API_BASE_URL}/api/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadJobs();
    } catch (error) {
      setError('Failed to delete job');
    }
  };

  const createAdminUser = async () => {
    try {
      const token = Cookies.get('authToken');
      await axios.post(`${API_BASE_URL}/api/admin/create-admin`, newAdminData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateAdmin(false);
      setNewAdminData({ username: '', email: '', password: '' });
      loadUsers();
      loadDashboard();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create admin user');
    }
  };

  const clearSystemCache = async () => {
    if (!window.confirm('Are you sure you want to clear all system caches?')) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      await axios.post(`${API_BASE_URL}/api/admin/system/clear-cache`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSystemInfo();
      alert('System cache cleared successfully');
    } catch (error) {
      setError('Failed to clear cache');
    }
  };

  const updateEnvironmentVar = async (key, value) => {
    try {
      const token = Cookies.get('authToken');
      await axios.put(`${API_BASE_URL}/api/admin/system/environment`, 
        { key, value }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadEnvironmentVars();
      setEditingEnvVar(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update environment variable');
    }
  };

  const deleteEnvironmentVar = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the environment variable "${key}"?`)) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      await axios.delete(`${API_BASE_URL}/api/admin/system/environment/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadEnvironmentVars();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete environment variable');
    }
  };

  const addEnvironmentVar = async () => {
    if (!newEnvVar.key || !newEnvVar.value) {
      setError('Both key and value are required');
      return;
    }

    try {
      const token = Cookies.get('authToken');
      await axios.put(`${API_BASE_URL}/api/admin/system/environment`, 
        newEnvVar, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadEnvironmentVars();
      setNewEnvVar({ key: '', value: '' });
      setShowEnvEditor(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add environment variable');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData && !users.length && !jobs.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUserShield className="mr-3 text-red-600" />
                Admin Panel
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage users, job applications, and system settings
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to App
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3" />
              <div>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 text-sm mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: FaChartBar },
              { id: 'users', name: 'Users', icon: FaUsers },
              { id: 'jobs', name: 'Jobs', icon: FaBriefcase },
              { id: 'system', name: 'System', icon: FaCog }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaUsers className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {dashboardData.statistics.users.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {dashboardData.statistics.users.verified}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaBriefcase className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Applications</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {dashboardData.statistics.jobs.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaUserShield className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {dashboardData.statistics.users.admins}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Users</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recent_activity.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.role === 'admin' && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                              Admin
                            </span>
                          )}
                          {user.email_verified ? (
                            <FaCheck className="text-green-500" />
                          ) : (
                            <FaTimes className="text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Job Applications</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recent_activity.jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{job.company_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{job.position_title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">by {job.username}</p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            job.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            job.status === 'interview' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            job.status === 'offered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setUsersPage(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaSync className="mr-2" />
                  Refresh
                </button>
              </div>
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaPlus className="mr-2" />
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
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.email_verified ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => setSelectedUser({ ...user, editing: true })}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
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
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Jobs Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobsSearch}
                    onChange={(e) => setJobsSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={jobsStatusFilter}
                  onChange={(e) => setJobsStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => setJobsPage(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaSync className="mr-2" />
                  Refresh
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
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{job.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{job.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            job.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            job.status === 'interview' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            job.status === 'offered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            job.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                    ))}
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
        )}

        {/* System Tab */}
        {activeTab === 'system' && systemInfo && (
          <div className="space-y-6">
            {/* System Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={clearSystemCache}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <FaTrash className="mr-2" />
                Clear Cache
              </button>
              <button
                onClick={loadSystemInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaSync className="mr-2" />
                Refresh
              </button>
              <button
                onClick={() => setShowEnvEditor(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Environment Variable
              </button>
            </div>

            {/* System Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <FaDatabase className="mr-2" />
                    Database
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</p>
                      <p className="text-lg text-gray-900 dark:text-white">{systemInfo.database.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tables</p>
                      <div className="mt-2 space-y-2">
                        {systemInfo.database.tables.map((table) => (
                          <div key={table.name} className="flex justify-between">
                            <span className="text-sm text-gray-900 dark:text-white">{table.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{table.rows} rows</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <FaMemory className="mr-2" />
                    Cache
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {systemInfo.cache.error ? (
                      <p className="text-red-600 dark:text-red-400">{systemInfo.cache.error}</p>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cached Logos</p>
                          <p className="text-lg text-gray-900 dark:text-white">
                            {systemInfo.cache.total_cached_logos || 0}
                          </p>
                        </div>
                        {systemInfo.cache.redis_info && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</p>
                            <p className="text-lg text-gray-900 dark:text-white">
                              {formatBytes(systemInfo.cache.redis_info.used_memory)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Environment Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <FaServer className="mr-2" />
                    Environment
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Environment</p>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {systemInfo.environment.environment}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Debug Mode</p>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {systemInfo.environment.debug ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            {environmentVars && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <FaCog className="mr-2" />
                    Environment Variables
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      {Object.keys(environmentVars.environment_variables).length} total
                    </span>
                    {environmentVars.sensitive_count > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                        {environmentVars.sensitive_count} hidden
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Key
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(environmentVars.environment_variables).map(([key, value]) => (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{key}</span>
                            </td>
                            <td className="px-6 py-4">
                              {editingEnvVar === key ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={value === '***HIDDEN***' ? '' : value}
                                    onChange={(e) => setEnvironmentVars({
                                      ...environmentVars,
                                      environment_variables: {
                                        ...environmentVars.environment_variables,
                                        [key]: e.target.value
                                      }
                                    })}
                                    className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={value === '***HIDDEN***' ? 'Enter new value...' : ''}
                                  />
                                  <button
                                    onClick={() => updateEnvironmentVar(key, environmentVars.environment_variables[key])}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingEnvVar(null)}
                                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className={`text-sm ${
                                  value === '***HIDDEN***' 
                                    ? 'text-yellow-600 dark:text-yellow-400 font-mono' 
                                    : 'text-gray-900 dark:text-white'
                                } break-all`}>
                                  {value}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {editingEnvVar !== key && (
                                <>
                                  <button
                                    onClick={() => setEditingEnvVar(key)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <FaEdit />
                                  </button>
                                  {!['PATH', 'HOME', 'USER', 'DB_HOST', 'DB_PASSWORD', 'JWT_SECRET_KEY'].includes(key.toUpperCase()) && (
                                    <button
                                      onClick={() => deleteEnvironmentVar(key)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedUser.editing ? 'Edit User' : 'User Details'}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>

              {selectedUser.editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailVerified"
                      checked={selectedUser.email_verified}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email_verified: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="emailVerified" className="text-sm text-gray-700 dark:text-gray-300">
                      Email Verified
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateUser(selectedUser.id, {
                        username: selectedUser.username,
                        email: selectedUser.email,
                        role: selectedUser.role,
                        email_verified: selectedUser.email_verified
                      })}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                    <p className="text-lg text-gray-900 dark:text-white">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {selectedUser.email_verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {formatDate(selectedUser.created_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Admin User</h3>
                <button
                  onClick={() => setShowCreateAdmin(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newAdminData.username}
                    onChange={(e) => setNewAdminData({ ...newAdminData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAdminData.email}
                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={createAdminUser}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Admin
                  </button>
                  <button
                    onClick={() => setShowCreateAdmin(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Add Environment Variable Modal */}
        {showEnvEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Environment Variable</h3>
                <button
                  onClick={() => setShowEnvEditor(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={newEnvVar.key}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VARIABLE_NAME"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value
                  </label>
                  <textarea
                    value={newEnvVar.value}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="variable_value"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={addEnvironmentVar}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Variable
                  </button>
                  <button
                    onClick={() => setShowEnvEditor(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
