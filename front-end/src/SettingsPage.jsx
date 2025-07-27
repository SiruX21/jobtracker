import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_BASE_URL } from './config';
import Header from './Header';
import { 
  FaCog, FaUser, FaLock, FaCode, FaDatabase, FaTrash, FaSave, 
  FaEye, FaEyeSlash, FaBell, FaPalette, FaDownload, FaUpload,
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimes,
  FaSync, FaClock, FaMemory, FaHdd, FaImage, FaExternalLinkAlt
} from 'react-icons/fa';

function SettingsPage({ darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Profile settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Account deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // App settings
  const [developerMode, setDeveloperMode] = useState(() => 
    localStorage.getItem('developerMode') === 'true'
  );
  const [notifications, setNotifications] = useState(() => 
    localStorage.getItem('notifications') !== 'false'
  );
  const [autoRefresh, setAutoRefresh] = useState(() => 
    localStorage.getItem('autoRefresh') !== 'false'
  );
  const [dataRetention, setDataRetention] = useState(() => 
    localStorage.getItem('dataRetention') || '30'
  );
  const [logoService, setLogoService] = useState(() => 
    localStorage.getItem('logoService') || 'auto'
  );
  
  // Developer info
  const [cacheInfo, setCacheInfo] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Check authentication and load user data
  useEffect(() => {
    const authToken = Cookies.get("authToken");
    if (!authToken) {
      console.log('No auth token found, redirecting to auth'); // Debug log
      navigate('/auth');
      return;
    }
    console.log('Auth token found, loading profile'); // Debug log
    setIsAuthenticated(true);
    loadUserProfile();
    checkAdminStatus();
    if (developerMode && isAdmin) {
      loadDeveloperInfo();
    }
  }, [navigate, developerMode, isAdmin]);

  const loadUserProfile = async () => {
    try {
      const authToken = Cookies.get("authToken");
      console.log('Auth token:', authToken); // Debug log
      console.log('API URL:', `${API_BASE_URL}/auth/profile`); // Debug log
      
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Profile response:', response.data); // Debug log
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      console.error('Error response:', error.response); // Debug log
      showMessage('Failed to load user profile', 'error');
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If we get here without an error, user is admin
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const loadDeveloperInfo = () => {
    // Load cache information
    const jobsCache = localStorage.getItem('jobTracker_jobs_cache');
    const cacheExpiry = localStorage.getItem('jobTracker_cache_expiry');
    
    let cacheData = null;
    if (jobsCache) {
      try {
        const parsed = JSON.parse(jobsCache);
        cacheData = {
          size: new Blob([jobsCache]).size,
          jobCount: parsed.jobs ? parsed.jobs.length : 0,
          timestamp: parsed.timestamp,
          version: parsed.version,
          expiry: cacheExpiry,
          isExpired: Date.now() > parseInt(cacheExpiry || '0')
        };
      } catch (error) {
        cacheData = { error: 'Invalid cache data' };
      }
    }
    setCacheInfo(cacheData);

    // Load storage information
    let totalSize = 0;
    let itemCount = 0;
    const storageItems = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      totalSize += size;
      itemCount++;
      
      if (key.startsWith('jobTracker_') || key === 'darkMode' || key === 'authToken') {
        storageItems.push({
          key,
          size,
          preview: value.length > 50 ? value.substring(0, 50) + '...' : value
        });
      }
    }
    
    setStorageInfo({
      totalSize,
      itemCount,
      items: storageItems
    });
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

    const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      showMessage('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      } else {
        showMessage(error.response?.data?.message || 'Failed to change password', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('Please type "DELETE" to confirm account deletion', 'error');
      return;
    }
    
    if (!deletePassword) {
      showMessage('Password is required to delete your account', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.delete(
        `${API_BASE_URL}/auth/delete-account`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            password: deletePassword
          }
        }
      );
      
      showMessage('Account deleted successfully. You will be redirected to the login page.', 'success');
      
      // Clear all user data and redirect after a short delay
      setTimeout(() => {
        Cookies.remove("authToken");
        localStorage.clear();
        navigate("/auth");
      }, 2000);
      
    } catch (error) {
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      } else {
        showMessage(error.response?.data?.message || 'Failed to delete account', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case 'developerMode':
        setDeveloperMode(value);
        localStorage.setItem('developerMode', value.toString());
        if (value) loadDeveloperInfo();
        break;
      case 'notifications':
        setNotifications(value);
        localStorage.setItem('notifications', value.toString());
        break;
      case 'autoRefresh':
        setAutoRefresh(value);
        localStorage.setItem('autoRefresh', value.toString());
        break;
      case 'dataRetention':
        setDataRetention(value);
        localStorage.setItem('dataRetention', value);
        break;
      case 'logoService':
        setLogoService(value);
        localStorage.setItem('logoService', value);
        break;
      default:
    }
    showMessage(`${setting} updated`, 'success');
  };

  const clearCache = () => {
    localStorage.removeItem('jobTracker_jobs_cache');
    localStorage.removeItem('jobTracker_cache_expiry');
    localStorage.removeItem('jobTracker_cache_version');
    loadDeveloperInfo();
    showMessage('Cache cleared successfully', 'success');
  };

  const exportData = () => {
    const data = {
      settings: {
        developerMode,
        notifications,
        autoRefresh,
        dataRetention,
        darkMode
      },
      cache: localStorage.getItem('jobTracker_jobs_cache'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Data exported successfully', 'success');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and application preferences</p>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
              message.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
              'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
            }`}>
              {message.type === 'success' && <FaCheckCircle className="mr-2" />}
              {message.type === 'error' && <FaExclamationTriangle className="mr-2" />}
              {message.type === 'info' && <FaInfoCircle className="mr-2" />}
              {message.text}
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {[
                  { id: 'profile', name: 'Profile & Security', icon: FaUser },
                  { id: 'preferences', name: 'Preferences', icon: FaCog },
                  ...(isAdmin ? [{ id: 'developer', name: 'Developer Tools', icon: FaCode }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                
                {/* Profile & Security Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile & Security</h2>
                    
                    {/* User Info */}
                    {user && (
                      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account Information</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email: {user.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Member since: {formatDate(user.created_at)}
                        </p>
                      </div>
                    )}

                    {/* Change Password */}
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Change Password</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {showPasswords ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                          {showPasswords ? 'Hide' : 'Show'} passwords
                        </button>

                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <FaSave className="mr-2" />
                          {loading ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </form>

                    {/* Account Deletion Section */}
                    <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center">
                        <FaExclamationTriangle className="mr-2" />
                        Danger Zone
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Once you delete your account, there is no going back. This action is permanent and will delete all your job applications and data.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTrash className="mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          Delete Account
                        </h2>
                        <button 
                          onClick={() => {
                            setShowDeleteModal(false);
                            setDeletePassword('');
                            setDeleteConfirmText('');
                          }} 
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes size={24} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                            <strong>This action cannot be undone.</strong>
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            This will permanently delete:
                          </p>
                          <ul className="text-sm text-red-600 dark:text-red-400 mt-2 list-disc list-inside">
                            <li>Your account and profile</li>
                            <li>All your job applications</li>
                            <li>All your saved data and preferences</li>
                          </ul>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Type "DELETE" to confirm
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter your password to confirm
                          </label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            onClick={() => {
                              setShowDeleteModal(false);
                              setDeletePassword('');
                              setDeleteConfirmText('');
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading || deleteConfirmText !== 'DELETE' || !deletePassword}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            <FaTrash className="mr-2" />
                            {loading ? 'Deleting...' : 'Delete Account'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preferences</h2>
                    
                    <div className="space-y-6">
                      {/* Theme */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <FaPalette className="mr-2" />
                          {darkMode ? 'Dark' : 'Light'} Mode
                        </button>
                      </div>

                      {/* Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Enable browser notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications}
                            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Auto Refresh */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Auto Refresh</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Automatically refresh job data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Data Retention */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Data Retention</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">How long to keep cached data</p>
                        </div>
                        <select
                          value={dataRetention}
                          onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>

                      {/* Developer Mode - Admin Only */}
                      {/* Admin Panel - Admin Only */}
                      {isAdmin ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Access full system administration console</p>
                          </div>
                          <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                          >
                            <FaCode className="mr-2" />
                            Open Admin Panel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between opacity-50">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Admin access required</p>
                          </div>
                          <div className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed">
                            Admin Only
                          </div>
                        </div>
                      )}                      {/* Export Data */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={exportData}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <FaDownload className="mr-2" />
                          Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Developer Tools Tab - Admin Only */}
                {activeTab === 'developer' && isAdmin && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Developer Tools</h2>
                    
                    <div className="space-y-6">
                      {/* Admin Panel Link */}
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-red-900 dark:text-red-200">Admin Panel</h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              Full system administration and management console
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                          >
                            <FaExternalLinkAlt className="mr-2" />
                            Open Admin Panel
                          </button>
                        </div>
                      </div>

                      {!developerMode ? (
                        <div className="text-center py-8">
                          <FaCode className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 mb-4">Developer mode is disabled</p>
                          <button
                            onClick={() => handleSettingChange('developerMode', true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Enable Developer Mode
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                        {/* Cache Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                              <FaDatabase className="mr-2" />
                              Cache Information
                            </h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={loadDeveloperInfo}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                <FaSync className="inline mr-1" />
                                Refresh
                              </button>
                              <button
                                onClick={clearCache}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                <FaTrash className="inline mr-1" />
                                Clear
                              </button>
                            </div>
                          </div>
                          
                          {cacheInfo ? (
                            cacheInfo.error ? (
                              <p className="text-red-600 dark:text-red-400">{cacheInfo.error}</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                                  <span className="ml-2 font-mono">{formatBytes(cacheInfo.size)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Jobs:</span>
                                  <span className="ml-2 font-mono">{cacheInfo.jobCount}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                                  <span className="ml-2 font-mono">{formatDate(cacheInfo.timestamp)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                                  <span className={`ml-2 font-mono ${cacheInfo.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {formatDate(parseInt(cacheInfo.expiry))}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                  <span className="ml-2 font-mono">{cacheInfo.version}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                  <span className={`ml-2 font-mono ${cacheInfo.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {cacheInfo.isExpired ? 'Expired' : 'Valid'}
                                  </span>
                                </div>
                              </div>
                            )
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400">No cache data found</p>
                          )}
                        </div>

                        {/* Storage Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                            <FaHdd className="mr-2" />
                            Local Storage
                          </h3>
                          
                          {storageInfo && (
                            <div>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
                                  <span className="ml-2 font-mono">{formatBytes(storageInfo.totalSize)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Items:</span>
                                  <span className="ml-2 font-mono">{storageInfo.itemCount}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {storageInfo.items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-xs">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-blue-600 dark:text-blue-400">{item.key}</div>
                                      <div className="text-gray-500 dark:text-gray-400 truncate">{item.preview}</div>
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 ml-2">
                                      {formatBytes(item.size)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                            <FaImage className="mr-2" />
                            Logo Service Configuration
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Logo Service Provider
                              </label>
                              <select
                                value={logoService}
                                onChange={(e) => handleSettingChange('logoService', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="auto">🔄 Auto (Logo.dev → Fallback)</option>
                                <option value="logodev">🏆 Logo.dev Only</option>
                                <option value="clearbit">🔵 Clearbit (Free)</option>
                                <option value="iconhorse">🐴 Icon Horse (Free)</option>
                                <option value="favicon">📄 Google Favicons</option>
                                <option value="fallback">🔧 Free Services Only</option>
                              </select>
                              
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {logoService === 'auto' && (
                                  <div className="flex items-center">
                                    <FaCheckCircle className="text-green-500 mr-1" />
                                    Tries Logo.dev first, falls back to free services if needed
                                  </div>
                                )}
                                {logoService === 'logodev' && (
                                  <div className="flex items-center">
                                    <FaExclamationTriangle className="text-yellow-500 mr-1" />
                                    Requires valid Logo.dev API token, no fallback
                                  </div>
                                )}
                                {(logoService === 'clearbit' || logoService === 'iconhorse' || logoService === 'favicon' || logoService === 'fallback') && (
                                  <div className="flex items-center">
                                    <FaInfoCircle className="text-blue-500 mr-1" />
                                    Uses free services, may have lower quality logos
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Service Status</h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Logo.dev API</span>
                                  <span className="text-yellow-600 dark:text-yellow-400">⚠️ Token Invalid</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Clearbit Free</span>
                                  <span className="text-green-600 dark:text-green-400">✅ Available</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Icon Horse</span>
                                  <span className="text-green-600 dark:text-green-400">✅ Available</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Google Favicons</span>
                                  <span className="text-green-600 dark:text-green-400">✅ Available</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={() => window.open('https://www.logo.dev/', '_blank')}
                                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                <FaExternalLinkAlt className="mr-1" />
                                Get Logo.dev API Token
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                            <FaMemory className="mr-2" />
                            System Information
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                              <div className="font-mono text-xs break-all">{navigator.userAgent}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Screen:</span>
                              <span className="ml-2 font-mono">{screen.width}x{screen.height}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Viewport:</span>
                              <span className="ml-2 font-mono">{window.innerWidth}x{window.innerHeight}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Language:</span>
                              <span className="ml-2 font-mono">{navigator.language}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Online:</span>
                              <span className={`ml-2 font-mono ${navigator.onLine ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {navigator.onLine ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Cookies Enabled:</span>
                              <span className={`ml-2 font-mono ${navigator.cookieEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {navigator.cookieEnabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
