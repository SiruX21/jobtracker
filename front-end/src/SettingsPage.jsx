import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';
import { debugLog } from './utils/debug';
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
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState('request');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  
  // Password change modal
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  
  // App settings
  const [developerMode, setDeveloperMode] = useState(() => 
    localStorage.getItem('developerMode') === 'true'
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
        autoRefresh,
        dataRetention,
        toastPosition,
        toastTheme,
        darkMode
      },
      cache: localStorage.getItem('jobtrack_jobs_cache'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtrack-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('📁 Data exported successfully');
  };

  // Check authentication and load user data
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const authToken = Cookies.get("authToken");
        if (!authToken) {
          debugLog('No auth token found, redirecting to auth'); // Debug log
          navigate('/auth');
          return;
        }
        debugLog('Auth token found, loading profile'); // Debug log
        setIsAuthenticated(true);
        await loadUserProfile();
        await checkAdminStatus();
      } catch (error) {
        console.error('Error initializing settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeSettings();
  }, [navigate]);

  // Separate effect to load developer info when needed
  useEffect(() => {
    if (developerMode && isAdmin) {
      loadDeveloperInfo();
    }
  }, [developerMode, isAdmin]);

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
          setNewEmail('');
          setEmailChangePassword('');
          setEmailChangeStep('request');
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
      debugLog('Auth token:', authToken); // Debug log
      debugLog('API URL:', `${API_BASE_URL}/auth/profile`); // Debug log
      
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      debugLog('Profile response:', response.data); // Debug log
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
        debugLog('No auth token found for admin check');
        return;
      }

      debugLog('Checking admin status with token:', token.substring(0, 20) + '...');
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      debugLog('Admin check successful:', response.status);
      // If we get here without an error, user is admin
      setIsAdmin(true);
    } catch (error) {
      debugLog('Admin check failed:', error.response?.status, error.response?.data);
      setIsAdmin(false);
    }
  };

  const loadDeveloperInfo = () => {
    // Load cache information
    const jobsCache = localStorage.getItem('jobtrack_jobs_cache');
    const cacheExpiry = localStorage.getItem('jobtrack_cache_expiry');
    
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
      
      if (key.startsWith('jobtrack_') || key === 'darkMode' || key === 'authToken') {
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
      toast.error('Please ensure your password meets all security requirements.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
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

      // Always show success for account deletion regardless of notification setting
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
    if (!newEmail.trim()) {
      toast.error('❌ Please enter a new email address');
      return;
    }
    
    if (!emailChangePassword.trim()) {
      toast.error('❌ Please enter your current password to confirm email change');
      return;
    }

    if (newEmail === user?.email) {
      toast.error('❌ New email must be different from current email');
      return;
    }

    setEmailChangeLoading(true);
    
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.post(`${API_BASE_URL}/api/auth/initiate-email-change`, {
        new_email: newEmail,
        current_password: emailChangePassword
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      toast.success('📧 Confirmation emails sent to both your current and new email addresses. Please check both inboxes.');
      setEmailChangeStep('pending');
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
          toast.success(`📍 Position changed to ${value.replace('-', ' ')}`, {
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
          toast.success(`🎨 Theme changed to ${value}`, {
            position: toastPosition,
            theme: value === 'auto' ? (darkMode ? 'dark' : 'light') : value
          });
        }, 100);
        break;
    }
  };

  const clearCache = () => {
    localStorage.removeItem('jobtrack_jobs_cache');
    localStorage.removeItem('jobtrack_cache_expiry');
    localStorage.removeItem('jobtrack_cache_version');
    loadDeveloperInfo();
    toast.success('🗑️ Cache cleared successfully');
  };

  if (initialLoading) {
    return (
      <>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
        <LoadingScreen type="settings" darkMode={darkMode} />
      </>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
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
                    autoRefresh={autoRefresh}
                    dataRetention={dataRetention}
                    handleSettingChange={handleSettingChange}
                    exportData={exportData}
                    showToast={toast}
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
                    showToast={toast}
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
                    showToast={toast}
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
        loading={loading}
        handlePasswordChange={handlePasswordChange}
        
        isMobile={isMobile}
      />
    </div>
  );
}

export default SettingsPage;
