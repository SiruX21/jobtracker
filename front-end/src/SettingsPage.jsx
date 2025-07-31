import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import Header from './Header';
import LoadingScreen from './components/shared/LoadingScreen';

// Import modular components
import SettingsHeader from './components/settings/SettingsHeader';
import SettingsSidebar from './components/settings/SettingsSidebar';
import ProfileSection from './components/settings/ProfileSection';
import PreferencesSection from './components/settings/PreferencesSection';
import AccessibilitySection from './components/settings/AccessibilitySection';
import DeveloperSection from './components/settings/DeveloperSection';
import SettingsModals from './components/settings/SettingsModals';

function SettingsPage({ darkMode, toggleTheme }) {
  const navigate = useNavigate();
  
  // Core state
  const [activeTab, setActiveTab] = useState('profile');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Modal states (shared across components)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Email change states
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState('request');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account states
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Accessibility settings
  const [toastPosition, setToastPosition] = useState(() => 
    localStorage.getItem('toastPosition') || 'bottom-center'
  );
  const [toastTheme, setToastTheme] = useState(() => 
    localStorage.getItem('toastTheme') || 'auto'
  );
  const [notifications, setNotifications] = useState(() => 
    localStorage.getItem('notifications') !== 'false'
  );

  // UI state for expandable sections
  const [expandedSections, setExpandedSections] = useState({});

  // Developer settings
  const [developerMode, setDeveloperMode] = useState(() => 
    localStorage.getItem('developerMode') === 'true'
  );
  const [cacheInfo, setCacheInfo] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  // Check authentication and load user data
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const authToken = Cookies.get("authToken");
        if (!authToken) {
          navigate('/auth');
          return;
        }
        setIsAuthenticated(true);
        await checkAdminStatus();
      } catch (error) {
        console.error('Error initializing settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setInitialLoading(false);
      }
    };
    initializeSettings();
  }, [navigate]);

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) return;

      await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Email change handler
  const handleEmailChange = async () => {
    if (!newEmail.trim() || !emailChangePassword.trim()) {
      toast.error('❌ Please enter both new email and password');
      return;
    }

    if (newEmail === user?.email) {
      toast.error('❌ New email must be different from current email');
      return;
    }

    setEmailChangeLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      await axios.post(`${API_BASE_URL}/auth/request-email-change`, {
        newEmail,
        password: emailChangePassword
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setEmailChangeStep('pending');
      toast.success('📧 Email change request sent! Check both your current and new email addresses for confirmation links.');
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to request email change'}`);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  // Password change handler
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
    
    setPasswordLoading(true);
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
      setPasswordLoading(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error('❌ Please enter your password to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { password: deletePassword }
      });

      toast.success('🗑️ Account deleted successfully');
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

  // Export data handler
  const exportData = () => {
    const data = {
      user: user,
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
    toast.success('📁 Data exported successfully');
  };

  // Show toast helper
  const showToast = (type, message) => {
    toast[type](message);
  };

  // Toggle section helper
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle setting changes
  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case 'notifications':
        setNotifications(value);
        localStorage.setItem('notifications', value.toString());
        toast.success(`🔔 Notifications ${value ? 'enabled' : 'disabled'}`);
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
    }
  };

  // Developer info functions
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

  const clearCache = () => {
    localStorage.removeItem('jobTracker_jobs_cache');
    localStorage.removeItem('jobTracker_cache_expiry');
    localStorage.removeItem('jobTracker_cache_version');
    loadDeveloperInfo();
    toast.success('🗑️ Cache cleared successfully');
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

  // Load developer info when developer mode is enabled and user is admin
  useEffect(() => {
    if (developerMode && isAdmin) {
      loadDeveloperInfo();
    }
  }, [developerMode, isAdmin]);

  // Render active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSection
            user={user}
            setUser={setUser}
            setShowEmailChangeModal={setShowEmailChangeModal}
            setShowPasswordChangeModal={setShowPasswordChangeModal}
            setShowDeleteModal={setShowDeleteModal}
            isMobile={isMobile}
          />
        );
      case 'preferences':
        return (
          <PreferencesSection
            toggleTheme={toggleTheme}
            darkMode={darkMode}
            exportData={exportData}
            showToast={showToast}
            isMobile={isMobile}
          />
        );
      case 'accessibility':
        return (
          <AccessibilitySection
            darkMode={darkMode}
            isMobile={isMobile}
            toastPosition={toastPosition}
            toastTheme={toastTheme}
            notifications={notifications}
            handleSettingChange={handleSettingChange}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            showToast={showToast}
          />
        );
      case 'developer':
        return isAdmin ? (
          <DeveloperSection
            isAdmin={isAdmin}
            isMobile={isMobile}
            developerMode={developerMode}
            handleSettingChange={handleSettingChange}
            cacheInfo={cacheInfo}
            storageInfo={storageInfo}
            loadDeveloperInfo={loadDeveloperInfo}
            clearCache={clearCache}
            formatBytes={formatBytes}
            formatDate={formatDate}
            showToast={showToast}
          />
        ) : null;
      default:
        return null;
    }
  };

  if (!isAuthenticated || initialLoading) {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} />
        <LoadingScreen type="settings" />
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <SettingsHeader />
          
          <div className="grid lg:grid-cols-4 gap-8">
            <SettingsSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              isAdmin={isAdmin}
              isMobile={isMobile}
            />
            
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {renderActiveTab()}
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
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        emailChangePassword={emailChangePassword}
        setEmailChangePassword={setEmailChangePassword}
        emailChangeStep={emailChangeStep}
        setEmailChangeStep={setEmailChangeStep}
        emailChangeLoading={emailChangeLoading}
        handleEmailChange={handleEmailChange}
        user={user}
        
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
        loading={passwordLoading}
        handlePasswordChange={handlePasswordChange}
        
        isMobile={isMobile}
      />
    </div>
  );
}

export default SettingsPage;


