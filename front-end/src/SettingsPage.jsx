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
  FaSync, FaClock, FaMemory, FaHdd, FaExternalLinkAlt, FaUniversalAccess,
  FaBars, FaEnvelope, FaChevronDown, FaUndo
} from 'react-icons/fa';

function SettingsPage({ darkMode, toggleTheme, isMobile }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Profile settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Email change
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  
  // Password change modal
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  
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

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  // Progressive disclosure states
  const [expandedSections, setExpandedSections] = useState({
    accountInfo: true,
    dangerZone: false,
    notificationSettings: true,
    visualSettings: false,
    cacheInfo: false,
    storageInfo: false,
    systemInfo: false,
    logoServices: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    let feedback = '';

    if (score <= 2) {
      feedback = 'Weak password';
    } else if (score <= 3) {
      feedback = 'Fair password';
    } else if (score <= 4) {
      feedback = 'Good password';
    } else {
      feedback = 'Strong password';
    }

    setPasswordStrength({ score, feedback, requirements });
  };

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

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeletePassword('');
        }
        if (showEmailChangeModal) {
          setShowEmailChangeModal(false);
          setEmailChangePassword('');
        }
        if (showPasswordChangeModal) {
          setShowPasswordChangeModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDeleteModal, showEmailChangeModal, showPasswordChangeModal]);

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
      setShowPasswordChangeModal(false);
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

  const handleEmailChange = async () => {
    if (!emailChangePassword.trim()) {
      toast.error('❌ Please enter your current password to confirm email change');
      return;
    }

    setEmailChangeLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.post(`${API_BASE_URL}/api/auth/initiate-email-change`, {
        current_password: emailChangePassword
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      toast.success('📧 Confirmation email sent to your current email address. Please check your inbox.');
      setEmailChangePassword('');
      setShowEmailChangeModal(false);
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.error || 'Failed to initiate email change'}`);
      setEmailChangePassword('');
    } finally {
      setEmailChangeLoading(false);
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
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'px-2 py-4' : ''}`}>
            {/* Skeleton Header */}
            <div className="mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
              </div>
            </div>
            
            <div className={`${isMobile ? 'block' : 'grid lg:grid-cols-4 gap-8'}`}>
              {/* Skeleton Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
              
              {/* Skeleton Content */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'px-2 py-4' : ''}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`font-bold text-gray-900 dark:text-white mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Settings</h1>
                <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>Manage your account and application preferences</p>
              </div>
              {/* Mobile menu button */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <FaBars className={`text-gray-600 dark:text-gray-400 transition-transform duration-200 ${showMobileSidebar ? 'rotate-90' : 'rotate-0'}`} />
                </button>
              )}
            </div>
          </div>

          <div className={`${isMobile ? 'block' : 'grid lg:grid-cols-4 gap-8'}`}>
            {/* Mobile Sidebar Overlay */}
            {isMobile && showMobileSidebar && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={`lg:col-span-1 ${isMobile ? (showMobileSidebar ? 'block mb-4' : 'hidden') : ''}`}>
              <nav className={`space-y-2 transition-all duration-300 ease-in-out ${isMobile ? `fixed top-20 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 transform ${showMobileSidebar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}` : ''}`}>
                {[
                  { id: 'profile', name: 'Profile & Security', icon: FaUser },
                  { id: 'preferences', name: 'Preferences', icon: FaCog },
                  { id: 'accessibility', name: 'Accessibility', icon: FaUniversalAccess },
                  ...(isAdmin ? [{ id: 'developer', name: 'Developer Tools', icon: FaCode }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (isMobile) setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm border-l-4 border-blue-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
                    } ${isMobile ? 'text-sm' : ''}`}
                  >
                    <tab.icon className="mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className={`lg:col-span-3 ${isMobile ? 'w-full' : ''}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out hover:shadow-xl">
                
                {/* Profile & Security Tab */}
                {activeTab === 'profile' && (
                  <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>Profile & Security</h2>
                    
                    {/* User Info */}
                    {user && (
                      <div className="mb-8">
                        <button
                          onClick={() => toggleSection('accountInfo')}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">Account Information</h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEmailChangeModal(true);
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
                              >
                                Change Email
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPasswordChangeModal(true);
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
                              >
                                Change Password
                              </button>
                            </div>
                            <FaChevronDown className={`transition-transform duration-200 ${expandedSections.accountInfo ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {expandedSections.accountInfo && (
                          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 animate-fadeIn">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email: {user.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Member since: {formatDate(user.created_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete Account - Danger Zone */}
                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('dangerZone')}
                        className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <FaExclamationTriangle className="text-red-600 dark:text-red-400 mr-3" />
                          <h3 className="font-medium text-red-900 dark:text-red-100">Danger Zone</h3>
                        </div>
                        <FaChevronDown className={`transition-transform duration-200 text-red-600 dark:text-red-400 ${expandedSections.dangerZone ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedSections.dangerZone && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-fadeIn">
                          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                            Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
                          </p>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
                          >
                            <FaTrash className="mr-2" />
                            Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>Preferences</h2>
                    
                    <div className="space-y-6">
                      {/* Theme */}
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className={`flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full justify-center' : ''}`}
                        >
                          <FaPalette className="mr-2" />
                          {darkMode ? 'Dark' : 'Light'} Mode
                        </button>
                      </div>

                      {/* Notifications */}
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Enable browser notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={notifications}
                            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
                        </label>
                      </div>

                      {/* Auto Refresh */}
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Auto Refresh</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Automatically refresh job data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
                        </label>
                      </div>

                      {/* Data Retention */}
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900 dark:text-white">Data Retention</h3>
                            <div className="relative group ml-2">
                              <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                Controls how long cached data is kept before being refreshed
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">How long to keep cached data</p>
                        </div>
                        <select
                          value={dataRetention}
                          onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                          className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ease-in-out hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 ${isMobile ? 'w-full' : ''}`}
                        >
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>

                      {/* Export Data */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-3'}`}>
                          <button
                            onClick={exportData}
                            className={`flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
                          >
                            <FaDownload className="mr-2" />
                            Export Data
                          </button>
                          <button
                            onClick={() => {
                              // Reset all preferences to defaults
                              setNotifications(true);
                              setAutoRefresh(true);
                              setDataRetention('30');
                              localStorage.setItem('notifications', 'true');
                              localStorage.setItem('autoRefresh', 'true');
                              localStorage.setItem('dataRetention', '30');
                              toast.success('🔄 Preferences reset to defaults');
                            }}
                            className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
                          >
                            <FaUndo className="mr-2" />
                            Reset to Defaults
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>Accessibility</h2>
                    
                    <div className="space-y-6">
                      {/* Toast Notification Settings */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <FaBell className="mr-2" />
                          Notification Settings
                        </h3>
                        
                        {/* Toast Position */}
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Toast Position</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose where notifications appear on your screen</p>
                          </div>
                          <select
                            value={toastPosition}
                            onChange={(e) => handleSettingChange('toastPosition', e.target.value)}
                            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'w-full' : ''}`}
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
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Toast Theme</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose the color scheme for notifications</p>
                          </div>
                          <select
                            value={toastTheme}
                            onChange={(e) => handleSettingChange('toastTheme', e.target.value)}
                            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'w-full' : ''}`}
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
                                  theme: toastTheme === 'auto' ? (darkMode ? 'dark' : 'light') : toastTheme,
                                  icon: "✨"
                                });
                              }, 100);
                            }}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
                          >
                            <FaBell className="mr-2" />
                            Test Notification
                          </button>
                        </div>
                      </div>

                      {/* Visual Settings */}
                      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => toggleSection('visualSettings')}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <FaPalette className="mr-2" />
                            Visual Accessibility
                          </h3>
                          <FaChevronDown className={`transition-transform duration-200 ${expandedSections.visualSettings ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedSections.visualSettings && (
                          <div className="animate-fadeIn">
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
                                  <div className="grid grid-cols-1 gap-2 text-sm text-blue-700 dark:text-blue-300">
                                    <div className="flex items-center">
                                      <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                                      High contrast dark/light mode support
                                    </div>
                                    <div className="flex items-center">
                                      <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                                      Keyboard navigation support
                                    </div>
                                    <div className="flex items-center">
                                      <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                                      Screen reader compatible
                                    </div>
                                    <div className="flex items-center">
                                      <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                                      Customizable notification positioning
                                    </div>
                                    <div className="flex items-center">
                                      <FaCheckCircle className="mr-2 text-green-600 dark:text-green-400" />
                                      Reduced motion for animations
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Developer Tools Tab - Admin Only */}
                {activeTab === 'developer' && isAdmin && (
                  <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>Developer Tools</h2>
                    
                    <div className="space-y-6">
                      {/* Developer Mode Toggle */}
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Developer Mode</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Enable advanced developer tools and debugging features</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={developerMode}
                            onChange={(e) => handleSettingChange('developerMode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
                        </label>
                      </div>

                      {/* Admin Panel - Admin Only */}
                      {isAdmin ? (
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Access full system administration console</p>
                          </div>
                          <button
                            onClick={() => navigate('/admin')}
                            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
                          >
                            <FaCode className="mr-2" />
                            Open Admin Panel
                          </button>
                        </div>
                      ) : (
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} opacity-50`}>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Admin access required</p>
                          </div>
                          <div className={`px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed ${isMobile ? 'w-full text-center' : ''}`}>
                            Admin Only
                          </div>
                        </div>
                      )}

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
                          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                              <FaDatabase className="mr-2" />
                              Cache Information
                            </h3>
                            <div className={`flex ${isMobile ? 'w-full' : ''} space-x-2`}>
                              <button
                                onClick={loadDeveloperInfo}
                                className={`px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center ${isMobile ? 'flex-1 justify-center' : ''}`}
                              >
                                <FaSync className="inline mr-1" />
                                Refresh
                              </button>
                              <button
                                onClick={clearCache}
                                className={`px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center ${isMobile ? 'flex-1 justify-center' : ''}`}
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
                          
                          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
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
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">API Base URL:</span>
                              <span className="ml-2 font-mono text-blue-600 dark:text-blue-400">{API_BASE_URL}</span>
                            </div>
                          </div>
                        </div>

                        {/* Logo Backend Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                            <FaExternalLinkAlt className="mr-2" />
                            Logo Backend Services
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 text-sm">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white">Clearbit Logo API</span>
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">Primary</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  <div>Endpoint: https://logo.clearbit.com/{'{company}'}</div>
                                  <div>Format: High-quality PNG/SVG logos</div>
                                  <div>Fallback: Company initials with generated colors</div>
                                </div>
                              </div>
                              
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white">Logo.dev API</span>
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded">Secondary</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  <div>Endpoint: https://img.logo.dev/{'{company}'}.com</div>
                                  <div>Format: Optimized company logos</div>
                                  <div>Usage: Fallback when Clearbit fails</div>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white">Favicon Service</span>
                                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded">Tertiary</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  <div>Endpoint: https://www.google.com/s2/favicons</div>
                                  <div>Format: Favicon/small icons</div>
                                  <div>Usage: Last resort fallback</div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">Logo Cache Status</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Logos are cached locally for better performance
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    // Clear logo cache from localStorage
                                    Object.keys(localStorage).forEach(key => {
                                      if (key.startsWith('logo_cache_')) {
                                        localStorage.removeItem(key);
                                      }
                                    });
                                    toast.success('🗑️ Logo cache cleared successfully');
                                  }}
                                  className={`px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center ${isMobile ? 'w-full justify-center' : ''}`}
                                >
                                  <FaTrash className="inline mr-1" />
                                  Clear Logo Cache
                                </button>
                              </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-red-600 dark:text-red-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Confirm Account Deletion
            </h3>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
              This action cannot be undone. This will permanently delete your account and all your data.
            </p>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 font-medium ${isMobile ? 'text-sm' : ''}`}>
              Please enter your password to confirm:
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-red-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword.trim()}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
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

      {/* Email Change Confirmation Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Change Email Address
            </h3>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
              To change your email address, we'll send a confirmation email to your current email address first.
            </p>
            <p className={`text-gray-700 dark:text-gray-300 mb-4 font-medium ${isMobile ? 'text-sm' : ''}`}>
              Please enter your password to confirm:
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={emailChangePassword}
                onChange={(e) => setEmailChangePassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEmailChange();
                  }
                }}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>📧 Process:</strong>
                <br />1. Confirm with your current email
                <br />2. Enter your new email address
                <br />3. Verify your new email
              </p>
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
              <button
                onClick={() => {
                  setShowEmailChangeModal(false);
                  setEmailChangePassword('');
                }}
                className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                disabled={emailChangeLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChange}
                disabled={emailChangeLoading || !emailChangePassword.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
              >
                {emailChangeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Send Confirmation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out animate-fadeIn">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full mx-4 transition-all duration-300 ease-in-out transform scale-100 shadow-2xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <h3 className={`font-bold text-blue-600 dark:text-blue-400 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePasswordStrength(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                  minLength={6}
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 2 ? 'bg-red-500' :
                            passwordStrength.score <= 3 ? 'bg-yellow-500' :
                            passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600 dark:text-red-400' :
                        passwordStrength.score <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                        passwordStrength.score <= 4 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(passwordStrength.requirements).map(([req, met]) => (
                        <div key={req} className={`flex items-center ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <span className="mr-1">{met ? '✓' : '○'}</span>
                          {req === 'length' && '8+ characters'}
                          {req === 'uppercase' && 'Uppercase'}
                          {req === 'lowercase' && 'Lowercase'}
                          {req === 'number' && 'Number'}
                          {req === 'special' && 'Special char'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showPasswords ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                  {showPasswords ? 'Hide' : 'Show'} passwords
                </button>
              </div>

              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChangeModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out transform hover:scale-105 disabled:hover:scale-100 hover:shadow-lg disabled:hover:shadow-none ${isMobile ? 'w-full justify-center' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
