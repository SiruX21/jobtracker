import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { 
  FaExternalLinkAlt, 
  FaTrash, 
  FaSync, 
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

function LogoManagementView({ darkMode }) {
  const [logoStats, setLogoStats] = useState(null);
  const [logoHealth, setLogoHealth] = useState(null);
  const [logoConfig, setLogoConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New states for additional features
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoValidation, setLogoValidation] = useState(null);
  const [showUrlTester, setShowUrlTester] = useState(false);
  const [showValidationTester, setShowValidationTester] = useState(false);

  useEffect(() => {
    loadLogoData();
  }, []);

  const loadLogoData = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // Load logo cache stats
      try {
        const statsResponse = await axios.get(`${API_BASE_URL}/api/logos/cache/stats`, { headers });
        setLogoStats(statsResponse.data);
      } catch (err) {
        console.warn('Failed to load logo stats:', err);
        if (err.response?.status === 403) {
          setError('Admin access required for logo management');
        }
      }

      // Load logo service health
      try {
        const healthResponse = await axios.get(`${API_BASE_URL}/api/logos/health`, { headers });
        setLogoHealth(healthResponse.data);
      } catch (err) {
        console.warn('Failed to load logo health:', err);
      }

      // Load logo configuration
      try {
        const configResponse = await axios.get(`${API_BASE_URL}/api/logos/config`, { headers });
        setLogoConfig(configResponse.data);
      } catch (err) {
        console.warn('Failed to load logo config:', err);
        if (err.response?.status === 403) {
          setError('Admin access required for logo configuration');
        }
      }

    } catch (error) {
      setError('Failed to load logo management data');
      console.error('Error loading logo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogoCache = async () => {
    if (!window.confirm('Are you sure you want to clear the entire logo cache?')) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/api/logos/cache/clear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('🗑️ Logo cache cleared successfully');
      loadLogoData(); // Reload data
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required to clear logo cache');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error('Failed to clear logo cache');
      }
      console.error('Error clearing logo cache:', error);
    }
  };

  const clearSpecificLogoCache = async (companyName) => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (!window.confirm(`Are you sure you want to clear the logo cache for "${companyName}"?`)) {
      return;
    }

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/api/logos/cache/clear`, 
        { company_name: companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`🗑️ Logo cache cleared for ${companyName}`);
      loadLogoData(); // Reload data
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required to clear logo cache');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error(`Failed to clear logo cache for ${companyName}`);
      }
      console.error('Error clearing specific logo cache:', error);
    }
  };

  const getLogoUrl = async (companyName) => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/logos/url/${encodeURIComponent(companyName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogoUrl(response.data);
      toast.success(`Logo URL retrieved for ${companyName}`);
    } catch (error) {
      if (error.response?.status === 404) {
        setLogoUrl({ error: `Logo not found for ${companyName}`, company_name: companyName });
      } else if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error(`Failed to get logo URL for ${companyName}`);
        console.error('Error getting logo URL:', error);
      }
    }
  };

  const validateLogo = async (companyName) => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/logos/validate/${encodeURIComponent(companyName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogoValidation(response.data);
      toast.success(`Logo validation completed for ${companyName}`);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error(`Failed to validate logo for ${companyName}`);
      }
      console.error('Error validating logo:', error);
    }
  };

  const clearLocalLogoCache = () => {
    // Clear logo cache from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('logo_cache_')) {
        localStorage.removeItem(key);
      }
    });
    toast.success('🗑️ Local logo cache cleared successfully');
  };

  const updateLogoConfig = async (serviceType) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/api/logos/config`, 
        { service_type: serviceType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Logo service updated to: ${serviceType}`);
      loadLogoData(); // Reload data
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required to update logo configuration');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error('Failed to update logo configuration');
      }
      console.error('Error updating logo config:', error);
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <FaCheckCircle className="text-green-500" />;
      case 'degraded':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'unhealthy':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaExternalLinkAlt className="mr-3 text-blue-600" />
          Logo Management
        </h2>
        <button
          onClick={loadLogoData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          {error.includes('Admin access required') && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
              Some logo management features require admin privileges. Contact your administrator for access.
            </p>
          )}
        </div>
      )}

      {/* Logo Service Health */}
      {logoHealth && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {getHealthStatusIcon(logoHealth.status)}
            <span className="ml-2">Service Health</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Status</div>
              <div className={`font-semibold capitalize ${
                logoHealth.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                logoHealth.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {logoHealth.status}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Redis Cache</div>
              <div className={`font-semibold capitalize ${
                logoHealth.redis === 'connected' ? 'text-green-600 dark:text-green-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {logoHealth.redis}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Service</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {logoHealth.service}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logo Cache Statistics */}
      {logoStats ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cache Statistics</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUrlTester(!showUrlTester)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
              >
                <FaExternalLinkAlt className="mr-1" />
                URL Tester
              </button>
              <button
                onClick={() => setShowValidationTester(!showValidationTester)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
              >
                <FaCheckCircle className="mr-1" />
                Validator
              </button>
              <button
                onClick={clearLogoCache}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
              >
                <FaTrash className="mr-1" />
                Clear All Cache
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cache Size</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {logoStats.cache_size ? formatBytes(logoStats.cache_size) : 'N/A'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cached Logos</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {logoStats.cached_count || '0'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {logoStats.hit_rate ? `${(logoStats.hit_rate * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Miss Rate</div>
              <div className="font-semibold text-red-600 dark:text-red-400">
                {logoStats.miss_rate ? `${(logoStats.miss_rate * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Logo URL Tester */}
          {showUrlTester && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Logo URL Tester</h4>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name (e.g., google, microsoft)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && getLogoUrl(companyName)}
                />
                <button
                  onClick={() => getLogoUrl(companyName)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Get URL
                </button>
                <button
                  onClick={() => clearSpecificLogoCache(companyName)}
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Clear Cache
                </button>
              </div>
              
              {logoUrl && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Result for "{logoUrl.company_name}":</div>
                  {logoUrl.error ? (
                    <div className="text-red-600 dark:text-red-400 font-mono text-sm">{logoUrl.error}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">URL:</span>
                        <a 
                          href={`${API_BASE_URL}${logoUrl.logo_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm"
                        >
                          {logoUrl.logo_url}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Content Type:</span>
                        <span className="font-mono text-sm">{logoUrl.content_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cached:</span>
                        <span className={`font-mono text-sm ${logoUrl.cached ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {logoUrl.cached ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Logo Validation Tester */}
          {showValidationTester && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">Logo Validation Tester</h4>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name to validate"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && validateLogo(companyName)}
                />
                <button
                  onClick={() => validateLogo(companyName)}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Validate
                </button>
              </div>
              
              {logoValidation && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Validation for "{logoValidation.company_name}":</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Validated:</span>
                      <span className={`ml-2 font-semibold ${logoValidation.validated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {logoValidation.validated ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cached:</span>
                      <span className={`ml-2 font-semibold ${logoValidation.cached ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {logoValidation.cached ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {logoValidation.logo_url && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Logo URL:</span>
                        <a 
                          href={`${API_BASE_URL}${logoValidation.logo_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm"
                        >
                          {logoValidation.logo_url}
                        </a>
                      </div>
                    )}
                    {logoValidation.content_type && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Content Type:</span>
                        <span className="ml-2 font-mono text-sm">{logoValidation.content_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cache Statistics</h3>
          <div className="text-center py-8">
            <FaExclamationTriangle className="mx-auto text-4xl text-yellow-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Cache statistics are not available. Admin access may be required.
            </p>
          </div>
        </div>
      )}

      {/* Logo Service Configuration */}
      {logoConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Configuration</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Service</div>
              <div className="font-semibold text-gray-900 dark:text-white capitalize">
                {logoConfig.current_service || 'auto'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Available Services</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {['auto', 'logodev', 'clearbit', 'iconhorse', 'favicon'].map((service) => (
                  <button
                    key={service}
                    onClick={() => updateLogoConfig(service)}
                    className={`p-3 rounded border text-left transition-colors ${
                      logoConfig.current_service === service
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium capitalize">{service}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {service === 'auto' && 'Automatic fallback chain'}
                      {service === 'logodev' && 'Logo.dev API'}
                      {service === 'clearbit' && 'Clearbit Logo API'}
                      {service === 'iconhorse' && 'IconHorse service'}
                      {service === 'favicon' && 'Favicon service'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logo Backend Services Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backend Services</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">Clearbit Logo API</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">Primary</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Endpoint: https://logo.clearbit.com/{'{company}'}</div>
              <div>Format: High-quality PNG/SVG logos</div>
              <div>Fallback: Company initials with generated colors</div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">Logo.dev API</span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded">Secondary</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Endpoint: https://img.logo.dev/{'{company}'}.com</div>
              <div>Format: Optimized company logos</div>
              <div>Usage: Fallback when Clearbit fails</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">Favicon Service</span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded">Tertiary</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Endpoint: https://www.google.com/s2/favicons</div>
              <div>Format: Favicon/small icons</div>
              <div>Usage: Last resort fallback</div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Local Cache Management</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Frontend localStorage cache for improved performance
              </p>
            </div>
            <button
              onClick={clearLocalLogoCache}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
            >
              <FaTrash className="mr-1" />
              Clear Local Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogoManagementView;
