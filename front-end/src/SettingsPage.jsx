import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { showToast, showCriticalToast } from './utils/toast';
import { API_BASE_URL } from './config';
import Header from './Header';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';

// Import refactored components
import ProfileSection from './components/settings/ProfileSection';
import PreferencesSection from './components/settings/PreferencesSection';
import AccessibilitySection from './components/settings/AccessibilitySection';
import DeveloperSection from './components/settings/DeveloperSection';
import SettingsModals from './components/settings/SettingsModals';
import SettingsHeader from './components/settings/SettingsHeader';
import SettingsSidebar from './components/settings/SettingsSidebar';
import LoadingScreen from './components/shared/LoadingScreen';

function SettingsPage({ darkMode, toggleTheme, isMobile }) {
  const navigate = useNavigate();
  
  // State management
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

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState(null);

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

  // Utility functions
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Conditional toast helper - only show if notifications are enabled
  const localShowToast = (type, message, options = {}) => {
    if (notifications) {
      if (type === 'success') {
        showToast.success(message, options);
      } else if (type === 'error') {
        showToast.error(message, options);
      } else if (type === 'info') {
        showToast.info(message, options);
      } else if (type === 'warning') {
        showToast.warning(message, options);
      }
    }
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
    localShowToast('success', '📁 Data exported successfully');
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

    // Handle header mobile menu opening - close settings mobile sidebar
    const handleHeaderMobileMenuOpened = () => {
      setShowMobileSidebar(false);
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('headerMobileMenuOpened', handleHeaderMobileMenuOpened);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('headerMobileMenuOpened', handleHeaderMobileMenuOpened);
    };
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
      localShowToast('error', 'Failed to load user profile');
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
    
    if (!passwordValidation || !passwordValidation.valid) {
      localShowToast('error', 'Please ensure your password meets all security requirements.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      localShowToast('error', 'New passwords do not match');
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
      localShowToast('success', 'Password changed successfully');
    } catch (error) {
      localShowToast('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      localShowToast('error', '❌ Please enter your password to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { password: deletePassword }
      });

      // Always show success for account deletion regardless of notification setting
      showCriticalToast.success('🗑️ Account deleted successfully');
      // Clear all storage and redirect to login
      Cookies.remove('authToken');
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      localShowToast('error', `❌ ${error.response?.data?.message || 'Failed to delete account'}`);
      setDeletePassword('');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailChangePassword.trim()) {
      localShowToast('error', '❌ Please enter your current password to confirm email change');
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

      localShowToast('success', '📧 Confirmation email sent to your current email address. Please check your inbox.');
      setEmailChangePassword('');
      setShowEmailChangeModal(false);
    } catch (error) {
      localShowToast('error', `❌ ${error.response?.data?.error || 'Failed to initiate email change'}`);
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
          localShowToast('success', '🔧 Developer mode enabled - Advanced tools are now available');
        } else {
          localShowToast('info', '🔧 Developer mode disabled');
        }
        break;
      case 'notifications':
        setNotifications(value);
        localStorage.setItem('notifications', value.toString());
        // Dispatch event to notify App.jsx of the change
        window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
        // Always show this toast regardless of setting since it's about the setting itself
        if (value) {
          showToast.success(`🔔 Notifications enabled`);
        } else {
          showToast.info(`🔔 Notifications disabled`);
        }
        break;
      case 'autoRefresh':
        setAutoRefresh(value);
        localStorage.setItem('autoRefresh', value.toString());
        localShowToast('success', `🔄 Auto refresh ${value ? 'enabled' : 'disabled'}`);
        break;
      case 'dataRetention':
        setDataRetention(value);
        localStorage.setItem('dataRetention', value);
        localShowToast('success', `📅 Data retention set to ${value} days`);
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
          localShowToast('success', `📍 Toast position changed to ${value.replace('-', ' ')}`, {
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
          localShowToast('success', `🎨 Toast theme changed to ${value}`, {
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
    localShowToast('success', '🗑️ Cache cleared successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
        <LoadingScreen type="settings" />
      </>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'px-2 py-4' : ''}`}>
          
          <SettingsHeader 
            showMobileSidebar={showMobileSidebar}
            setShowMobileSidebar={setShowMobileSidebar}
            isMobile={isMobile}
          />

          <div className={`${isMobile ? 'block' : 'grid lg:grid-cols-4 gap-8'}`}>
            
            <SettingsSidebar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isAdmin={isAdmin}
              showMobileSidebar={showMobileSidebar}
              setShowMobileSidebar={setShowMobileSidebar}
              isMobile={isMobile}
            />

            {/* Main Content */}
            <div className={`lg:col-span-3 ${isMobile ? 'w-full' : ''}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out hover:shadow-xl">
                
                {/* Profile & Security Tab */}
                {activeTab === 'profile' && (
                  <ProfileSection
                    user={user}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    setShowEmailChangeModal={setShowEmailChangeModal}
                    setShowPasswordChangeModal={setShowPasswordChangeModal}
                    setShowDeleteModal={setShowDeleteModal}
                    formatDate={formatDate}
                    isMobile={isMobile}
                  />
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <PreferencesSection
                    toggleTheme={toggleTheme}
                    darkMode={darkMode}
                    notifications={notifications}
                    autoRefresh={autoRefresh}
                    dataRetention={dataRetention}
                    handleSettingChange={handleSettingChange}
                    exportData={exportData}
                    showToast={showToast}
                    isMobile={isMobile}
                  />
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <AccessibilitySection
                    toastPosition={toastPosition}
                    toastTheme={toastTheme}
                    handleSettingChange={handleSettingChange}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    darkMode={darkMode}
                    notifications={notifications}
                    showToast={showToast}
                    isMobile={isMobile}
                  />
                )}

                {/* Developer Tools Tab - Admin Only */}
                {activeTab === 'developer' && isAdmin && (
                  <DeveloperSection
                    isAdmin={isAdmin}
                    developerMode={developerMode}
                    handleSettingChange={handleSettingChange}
                    cacheInfo={cacheInfo}
                    storageInfo={storageInfo}
                    loadDeveloperInfo={loadDeveloperInfo}
                    clearCache={clearCache}
                    formatBytes={formatBytes}
                    formatDate={formatDate}
                    showToast={showToast}
                    isMobile={isMobile}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModals
        // Delete modal props
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deletePassword={deletePassword}
        setDeletePassword={setDeletePassword}
        deleteLoading={deleteLoading}
        handleDeleteAccount={handleDeleteAccount}
        
        // Email change modal props
        showEmailChangeModal={showEmailChangeModal}
        setShowEmailChangeModal={setShowEmailChangeModal}
        emailChangePassword={emailChangePassword}
        setEmailChangePassword={setEmailChangePassword}
        emailChangeLoading={emailChangeLoading}
        handleEmailChange={handleEmailChange}
        
        // Password change modal props
        showPasswordChangeModal={showPasswordChangeModal}
        setShowPasswordChangeModal={setShowPasswordChangeModal}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPasswords={showPasswords}
        setShowPasswords={setShowPasswords}
        passwordValidation={passwordValidation}
        setPasswordValidation={setPasswordValidation}
        loading={loading}
        handlePasswordChange={handlePasswordChange}
        
        isMobile={isMobile}
      />
    </div>
  );
}

export default SettingsPage;
