import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import Header from './Header';
import { 
  FaCog, FaUser, FaLock, FaCode, FaDatabase, FaTrash, FaSave, 
  FaEye, FaEyeSlash, FaBell, FaPalette, FaDownload, FaUpload,
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimes,
  FaSync, FaClock, FaMemory, FaHdd, FaExternalLinkAlt, FaUniversalAccess
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
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
  
  // Accessibility settings
  const [toastPosition, setToastPosition] = useState(() => 
    localStorage.getItem('toastPosition') || 'bottom-center'
  );
  const [toastTheme, setToastTheme] = useState(() => 
    localStorage.getItem('toastTheme') || 'auto'
  );
  
  // Developer info
  const [cacheInfo, setCacheInfo] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);

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
      toast.error('Failed to load user profile');
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        console.log('No auth token found for admin check');
        return;
      }

      console.log('Checking admin status with token:', token.substring(0, 20) + '...');
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Admin check successful:', response.status);
      // If we get here without an error, user is admin
      setIsAdmin(true);
    } catch (error) {
      console.log('Admin check failed:', error.response?.status, error.response?.data);
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error('❌ Please enter your password to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { password: deletePassword }
      });

      toast.success('🗑️ Account deleted successfully');
      // Clear all storage and redirect to login
      Cookies.remove('authToken');
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to delete account'}`);
      setDeletePassword('');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case 'developerMode':
        setDeveloperMode(value);
        localStorage.setItem('developerMode', value.toString());
        if (value) {
          loadDeveloperInfo();
          toast.success('🔧 Developer mode enabled - Advanced tools are now available');
        } else {
          toast.info('🔧 Developer mode disabled');
        }
        break;
      case 'notifications':
        setNotifications(value);
        localStorage.setItem('notifications', value.toString());
        toast.success(`🔔 Notifications ${value ? 'enabled' : 'disabled'}`);
        break;
      case 'autoRefresh':
        setAutoRefresh(value);
        localStorage.setItem('autoRefresh', value.toString());
        toast.success(`🔄 Auto refresh ${value ? 'enabled' : 'disabled'}`);
        break;
      case 'dataRetention':
        setDataRetention(value);
        localStorage.setItem('dataRetention', value);
        toast.success(`📅 Data retention set to ${value} days`);
        break;
      case 'toastPosition':
        setToastPosition(value);
        localStorage.setItem('toastPosition', value);
        // Dispatch custom event to notify App.jsx of the change
        window.dispatchEvent(new CustomEvent('toastSettingsChanged', { 
          detail: { position: value, theme: toastTheme } 
        }));
        // Small delay to ensure settings are applied before showing confirmation
        setTimeout(() => {
          toast.success(`📍 Toast position changed to ${value.replace('-', ' ')}`, {
            position: value,
            theme: toastTheme === 'auto' ? (darkMode ? 'dark' : 'light') : toastTheme
          });
        }, 100);
        break;
      case 'toastTheme':
        setToastTheme(value);
        localStorage.setItem('toastTheme', value);
        // Dispatch custom event to notify App.jsx of the change
        window.dispatchEvent(new CustomEvent('toastSettingsChanged', { 
          detail: { position: toastPosition, theme: value } 
        }));
        // Small delay to ensure settings are applied before showing confirmation
        setTimeout(() => {
          toast.success(`🎨 Toast theme changed to ${value}`, {
            position: toastPosition,
            theme: value === 'auto' ? (darkMode ? 'dark' : 'light') : value
          });
        }, 100);
        break;
    }
  };

  const clearCache = () => {
    localStorage.removeItem('jobTracker_jobs_cache');
    localStorage.removeItem('jobTracker_cache_expiry');
    localStorage.removeItem('jobTracker_cache_version');
    loadDeveloperInfo();
    toast.success('🗑️ Cache cleared successfully');
  };

  const exportData = () => {
    const data = {
      settings: {
        developerMode,
        notifications,
        autoRefresh,
        dataRetention,
        toastPosition,
        toastTheme,
        darkMode
      },
      cache: localStorage.getItem('jobTracker_jobs_cache'),
      timestamp: new Date().toISOString()
    };    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('📁 Data exported successfully');
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

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {[
                  { id: 'profile', name: 'Profile & Security', icon: FaUser },
                  { id: 'preferences', name: 'Preferences', icon: FaCog },
                  { id: 'accessibility', name: 'Accessibility', icon: FaUniversalAccess },
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
                      )}

                      {/* Export Data */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={exportData}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <FaDownload className="mr-2" />
                          Export Data
                        </button>
                      </div>

                      {/* Delete Account - Danger Zone */}
                      <div className="pt-4 border-t border-red-200 dark:border-red-800">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">Danger Zone</h3>
                          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                            Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
                          </p>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <FaTrash className="mr-2" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Accessibility</h2>
                    
                    <div className="space-y-6">
                      {/* Toast Notification Settings */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <FaBell className="mr-2" />
                          Notification Settings
                        </h3>
                        
                        {/* Toast Position */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Toast Position</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose where notifications appear on your screen</p>
                          </div>
                          <select
                            value={toastPosition}
                            onChange={(e) => handleSettingChange('toastPosition', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>

                        {/* Toast Theme */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Toast Theme</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose the color scheme for notifications</p>
                          </div>
                          <select
                            value={toastTheme}
                            onChange={(e) => handleSettingChange('toastTheme', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="auto">Auto (follows system theme)</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="colored">Colored</option>
                          </select>
                        </div>

                        {/* Test Toast Button */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              // Apply settings immediately before showing test toast
                              window.dispatchEvent(new CustomEvent('toastSettingsChanged', { 
                                detail: { position: toastPosition, theme: toastTheme } 
                              }));
                              
                              // Small delay to ensure settings are applied
                              setTimeout(() => {
                                toast.success("🎉 This is a test notification!", {
                                  position: toastPosition,
                                  theme: toastTheme === 'auto' ? (darkMode ? 'dark' : 'light') : toastTheme
                                });
                              }, 100);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                          >
                            <FaBell className="mr-2" />
                            Test Notification
                          </button>
                        </div>
                      </div>

                      {/* Visual Settings */}
                      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <FaPalette className="mr-2" />
                          Visual Accessibility
                        </h3>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Additional Accessibility Features
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                These settings help customize the interface for better accessibility and user experience.
                              </p>
                              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  High contrast dark/light mode support
                                </div>
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  Keyboard navigation support
                                </div>
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  Screen reader compatible
                                </div>
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  Customizable notification positioning
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Developer Tools Tab - Admin Only */}
                {activeTab === 'developer' && isAdmin && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Developer Tools</h2>
                    
                    <div className="space-y-6">
                      {/* Developer Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Developer Mode</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Enable advanced developer tools and debugging features</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={developerMode}
                            onChange={(e) => handleSettingChange('developerMode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                    {!developerMode ? (
                      <div className="text-center py-8">
                        <FaCode className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Developer mode is disabled</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Use the toggle above to enable developer tools</p>
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              Confirm Account Deletion
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This action cannot be undone. This will permanently delete your account and all your data.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
              Please enter your password to confirm:
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
