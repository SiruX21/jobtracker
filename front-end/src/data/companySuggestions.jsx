import { API_BASE_URL } from '../config';
import { debugWarn, debugLog } from '../utils/debug';

// Sync function to get company logo URL
export const getCompanyLogoSync = (companyName) => {
  if (!companyName || typeof companyName !== 'string') {
    debugWarn('getCompanyLogoSync: Invalid company name provided:', companyName);
    return getFallbackLogo(companyName);
  }

  // Use the backend API to serve the logo
  const encodedName = encodeURIComponent(companyName.trim());
  const logoUrl = `${API_BASE_URL}/api/logos/company/${encodedName}`;
  
  debugLog(`🖼️ getCompanyLogoSync: Generated logo URL for "${companyName}": ${logoUrl}`);
  return logoUrl;
};

// Fallback logo generator using UI Avatars
const getFallbackLogo = (companyName) => {
  const name = companyName && typeof companyName === 'string' ? companyName : 'Company';
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=ffffff&size=40&bold=true`;
  debugLog(`🔄 getFallbackLogo: Using fallback for "${name}": ${fallbackUrl}`);
  return fallbackUrl;
};

// Job title suggestions function (if used)
export const getJobTitleSuggestions = (query) => {
  // This should also be fetched from API in the future
  // For now, return empty array since this seems to be used somewhere
  return [];
};

// For backward compatibility - empty array since we now fetch from API
export const companySuggestions = [];

export default companySuggestions;
