import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import Header from './Header';
import { getCompanyLogoSync } from './data/companySuggestions';
import { 
  FaUsers, FaBriefcase, FaChartBar, FaCog, FaExclamationTriangle, FaUserShield, FaExternalLinkAlt
} from 'react-icons/fa';
import LoadingScreen from './components/shared/LoadingScreen';

// Import new admin components
import DashboardView from './components/admin/DashboardView';
import UsersView from './components/admin/UsersView';
import JobsView from './components/admin/JobsView';
import SystemView from './components/admin/SystemView';
import LogoManagementView from './components/admin/LogoManagementView';
import UserDetailModal from './components/admin/UserDetailModal';
import CreateAdminModal from './components/admin/CreateAdminModal';
import AddEnvVarModal from './components/admin/AddEnvVarModal';

// Import tracker components for job editing
import EditJobModal from './components/tracker/EditJobModal';

// Component to render company logos with fallback
function AdminPanel({ darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardFilter, setDashboardFilter] = useState('all'); // 'all', 'users', 'verified', 'jobs', 'admins'
  
  // Users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({});
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilter, setUsersFilter] = useState('all'); // 'all', 'verified', 'unverified', 'admin', 'user'
  
  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPagination, setJobsPagination] = useState({});
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState('');
  
  // Job statuses data
  const [jobStatuses, setJobStatuses] = useState([]);
  const [statusColorMap, setStatusColorMap] = useState({});
  
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
  
  // Edit Job Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [newJob, setNewJob] = useState({
    company_name: '',
    job_title: '',
    status: '',
    application_date: '',
    location: '',
    job_url: '',
    notes: ''
  });

  useEffect(() => {
    checkAdminAccess();
    fetchJobStatuses();
  }, []);

  // Debounced search effect for users
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (activeTab === 'users') {
        setUsersPage(1); // Reset to first page when searching
        loadUsers();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [usersSearch]);

  // Client-side filtering effect for additional filtering
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users];
      
      // Apply additional filters that weren't handled by backend search
      if (usersFilter !== 'all') {
        filtered = filtered.filter(user => {
          switch (usersFilter) {
            case 'verified':
              return user.email_verified === true;
            case 'unverified':
              return user.email_verified === false;
            case 'admin':
              return user.role === 'admin';
            case 'user':
              return user.role === 'user';
            default:
              return true;
          }
        });
      }
      
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [users, usersFilter]);

  // Reset page when filter changes
  useEffect(() => {
    if (usersFilter !== 'all') {
      setUsersPage(1);
    }
  }, [usersFilter]);

  // Debounced search effect for jobs  
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (activeTab === 'jobs') {
        setJobsPage(1); // Reset to first page when searching
        loadJobs();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [jobsSearch, jobsStatusFilter]);

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
  }, [activeTab, usersPage, jobsPage]);

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
      setLoading(true);
      const token = Cookies.get('authToken');
      const params = {
        page: usersPage,
        per_page: 20,
        search: usersSearch.trim()
      };
      
      console.log('Loading users with params:', params); // Debug log
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      console.log('Users response:', response.data); // Debug log
      
      setUsers(response.data.users || []);
      setUsersPagination(response.data.pagination || {});
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users: ' + (error.response?.data?.message || error.message));
      setUsers([]);
      setUsersPagination({});
    } finally {
      setLoading(false);
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

  const fetchJobStatuses = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/job-statuses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle both array response and object with statuses property
      const statuses = Array.isArray(response.data) ? response.data : response.data.statuses;
      
      // Ensure statuses is an array
      if (Array.isArray(statuses)) {
        setJobStatuses(statuses);
        
        // Create color mapping
        const colorMap = {};
        statuses.forEach(status => {
          colorMap[status.status_name] = status.color_code;
        });
        setStatusColorMap(colorMap);
      } else {
        console.error("Job statuses response is not an array:", response.data);
        // Set default statuses if backend fails
        const defaultStatuses = [
          { status_name: "Applied", color_code: "#3B82F6" },
          { status_name: "Interview", color_code: "#10B981" },
          { status_name: "Offered", color_code: "#8B5CF6" },
          { status_name: "Rejected", color_code: "#EF4444" },
          { status_name: "Ghosted", color_code: "#6B7280" }
        ];
        setJobStatuses(defaultStatuses);
        
        const colorMap = {};
        defaultStatuses.forEach(status => {
          colorMap[status.status_name] = status.color_code;
        });
        setStatusColorMap(colorMap);
      }
      
    } catch (error) {
      console.error("Error fetching job statuses:", error);
      
      // Set default statuses on error
      const defaultStatuses = [
        { status_name: "Applied", color_code: "#3B82F6" },
        { status_name: "Interview", color_code: "#10B981" },
        { status_name: "Offered", color_code: "#8B5CF6" },
        { status_name: "Rejected", color_code: "#EF4444" },
        { status_name: "Ghosted", color_code: "#6B7280" }
      ];
      setJobStatuses(defaultStatuses);
      
      const colorMap = {};
      defaultStatuses.forEach(status => {
        colorMap[status.status_name] = status.color_code;
      });
      setStatusColorMap(colorMap);
      
      setError('Failed to load job statuses');
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
      
      // Find the job to get details for the toast message
      const jobToDelete = jobs.find(job => job.id === jobId);
      
      await axios.delete(`${API_BASE_URL}/api/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadJobs();
      
      // Show success toast notification
      toast.success(`Job application for ${jobToDelete?.company_name || 'Unknown Company'} - ${jobToDelete?.position_title || 'Unknown Position'} deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (error) {
      console.error('Error deleting job:', error);
      
      // Show error toast notification
      toast.error('Failed to delete job application. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setError('Failed to delete job');
    }
  };

  // Helper function to format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Edit Job Modal functions
  const openEditModal = (job) => {
    setEditingJob({ ...job });
    setNewJob({
      id: job.id,
      company_name: job.company_name,
      job_title: job.position_title, // Note: admin API uses position_title, tracker uses job_title
      status: job.status,
      application_date: formatDateForInput(job.applied_date), // Format date properly
      location: job.location || "",
      job_url: job.job_url || "",
      notes: job.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingJob(null);
    setNewJob({
      company_name: '',
      job_title: '',
      status: '',
      application_date: '',
      location: '',
      job_url: '',
      notes: ''
    });
  };

  const updateJob = async () => {
    if (!newJob.company_name || !newJob.job_title) return;

    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      
      // Use the regular jobs API endpoint, not the admin endpoint
      // Convert field names back to what the API expects
      const jobData = {
        company_name: newJob.company_name,
        job_title: newJob.job_title, // Use job_title for regular API
        status: newJob.status,
        application_date: newJob.application_date, // Use application_date for regular API
        location: newJob.location,
        job_url: newJob.job_url,
        notes: newJob.notes
      };
      
      await axios.put(`${API_BASE_URL}/jobs/${editingJob.id}`, jobData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      closeEditModal();
      loadJobs(); // Reload the jobs list
      
      toast.success(`Job application for ${newJob.company_name} - ${newJob.job_title} updated successfully!`);
      
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job application. Please try again.");
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJobFromModal = async () => {
    if (editingJob) {
      await deleteJob(editingJob.id);
      closeEditModal();
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
      toast.success('🗑️ System cache cleared successfully');
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

  const handleDashboardCardClick = (filterType) => {
    setDashboardFilter(filterType);
    
    // Navigate to appropriate tab with filters
    switch(filterType) {
      case 'users':
        setActiveTab('users');
        setUsersSearch('');
        break;
      case 'verified':
        setActiveTab('users');
        setUsersSearch('status:verified');
        break;
      case 'unverified':
        setActiveTab('users');
        setUsersSearch('verified:false');
        break;
      case 'admins':
        setActiveTab('users');
        setUsersSearch('role:admin');
        break;
      case 'jobs':
        setActiveTab('jobs');
        setJobsSearch('');
        setJobsStatusFilter('');
        break;
      default:
        // Stay on dashboard
        break;
    }
  };

  if (loading) {
    return <LoadingScreen type="admin" darkMode={darkMode} />;
  }

  if (error && !dashboardData && !users.length && !jobs.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin')}
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
            </div>
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-1">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: FaChartBar },
                { id: 'users', name: 'Users', icon: FaUsers },
                { id: 'jobs', name: 'Jobs', icon: FaBriefcase },
                { id: 'logos', name: 'Logos', icon: FaExternalLinkAlt },
                { id: 'system', name: 'System', icon: FaCog }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-center text-sm font-medium rounded-t-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className={`w-5 h-5 transition-colors ${
                      activeTab === tab.id 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardView
            dashboardData={dashboardData}
            handleDashboardCardClick={handleDashboardCardClick}
            setSelectedUser={setSelectedUser}
            statusColorMap={statusColorMap}
            getCompanyLogoSync={getCompanyLogoSync}
            openEditModal={openEditModal}
            loading={loading}
            darkMode={darkMode}
          />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <UsersView
            users={users}
            filteredUsers={filteredUsers}
            usersSearch={usersSearch}
            usersFilter={usersFilter}
            usersPagination={usersPagination}
            usersPage={usersPage}
            loading={loading}
            error={error}
            setUsersSearch={setUsersSearch}
            setUsersFilter={setUsersFilter}
            setUsersPage={setUsersPage}
            loadUsers={loadUsers}
            setSelectedUser={setSelectedUser}
            deleteUser={deleteUser}
            setShowCreateAdmin={setShowCreateAdmin}
            setError={setError}
            initialLoading={loading && !users.length}
            darkMode={darkMode}
          />
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <JobsView
            jobs={jobs}
            jobsSearch={jobsSearch}
            jobsStatusFilter={jobsStatusFilter}
            jobsPagination={jobsPagination}
            jobsPage={jobsPage}
            jobStatuses={jobStatuses}
            statusColorMap={statusColorMap}
            loading={loading}
            setJobsSearch={setJobsSearch}
            setJobsStatusFilter={setJobsStatusFilter}
            setJobsPage={setJobsPage}
            loadJobs={loadJobs}
            deleteJob={deleteJob}
            getCompanyLogoSync={getCompanyLogoSync}
            openEditModal={openEditModal}
            initialLoading={loading && !jobs}
            darkMode={darkMode}
          />
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <SystemView
            systemInfo={systemInfo}
            environmentVars={environmentVars}
            editingEnvVar={editingEnvVar}
            loading={loading}
            clearSystemCache={clearSystemCache}
            loadSystemInfo={loadSystemInfo}
            setShowEnvEditor={setShowEnvEditor}
            setEditingEnvVar={setEditingEnvVar}
            setEnvironmentVars={setEnvironmentVars}
            updateEnvironmentVar={updateEnvironmentVar}
            deleteEnvironmentVar={deleteEnvironmentVar}
            initialLoading={loading && !systemInfo}
            darkMode={darkMode}
          />
        )}

        {/* Logos Tab */}
        {activeTab === 'logos' && (
          <LogoManagementView
            darkMode={darkMode}
            initialLoading={loading}
          />
        )}

        {/* Modals */}
        <UserDetailModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          updateUser={updateUser}
          loading={loading}
        />

        <CreateAdminModal
          showCreateAdmin={showCreateAdmin}
          setShowCreateAdmin={setShowCreateAdmin}
          newAdminData={newAdminData}
          setNewAdminData={setNewAdminData}
          createAdminUser={createAdminUser}
        />

        <AddEnvVarModal
          showEnvEditor={showEnvEditor}
          setShowEnvEditor={setShowEnvEditor}
          newEnvVar={newEnvVar}
          setNewEnvVar={setNewEnvVar}
          addEnvironmentVar={addEnvironmentVar}
        />

        <EditJobModal 
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          newJob={newJob}
          setNewJob={setNewJob}
          jobStatuses={jobStatuses}
          onSubmit={updateJob}
          loading={loading}
          darkMode={darkMode}
          onDelete={handleDeleteJobFromModal}
        />
      </div>
    </div>
  );
}

export default AdminPanel;
