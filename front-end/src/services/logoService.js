import { API_BASE_URL } from '../config';

class LogoService {
  constructor() {
    this.cache = new Map(); // Frontend memory cache for frequently used logos
    this.pendingRequests = new Map(); // Prevent duplicate requests
  }

  /**
   * Get company logo with caching
   * @param {string} companyName - Company name
   * @returns {Promise<string>} - Logo URL
   */
  async getCompanyLogo(companyName) {
    if (!companyName) return this.getFallbackLogo();

    // Check frontend memory cache first
    const cacheKey = this.getCacheKey(companyName);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Make API request
    const logoPromise = this.fetchLogoFromAPI(companyName);
    this.pendingRequests.set(cacheKey, logoPromise);

    try {
      const logoUrl = await logoPromise;
      
      // Cache the result
      this.cache.set(cacheKey, logoUrl);
      
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
      
      return logoUrl;
    } catch (error) {
      console.error(`Error fetching logo for ${companyName}:`, error);
      this.pendingRequests.delete(cacheKey);
      
      // Return fallback logo on error
      const fallbackUrl = this.getFallbackLogo(companyName);
      this.cache.set(cacheKey, fallbackUrl);
      return fallbackUrl;
    }
  }

  /**
   * Get multiple company logos in batch
   * @param {string[]} companyNames - Array of company names
   * @returns {Promise<Object>} - Object with company names as keys and logo URLs as values
   */
  async getBatchLogos(companyNames) {
    if (!companyNames || !Array.isArray(companyNames)) {
      return {};
    }

    const results = {};
    const uncachedCompanies = [];

    // Check frontend cache first
    for (const companyName of companyNames) {
      const cacheKey = this.getCacheKey(companyName);
      if (this.cache.has(cacheKey)) {
        results[companyName] = this.cache.get(cacheKey);
      } else {
        uncachedCompanies.push(companyName);
      }
    }

    // Fetch uncached logos
    if (uncachedCompanies.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/logos/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companies: uncachedCompanies }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Cache and merge results
          for (const [companyName, logoData] of Object.entries(data.results)) {
            const logoUrl = logoData.logo_url;
            const cacheKey = this.getCacheKey(companyName);
            this.cache.set(cacheKey, logoUrl);
            results[companyName] = logoUrl;
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching batch logos:', error);
        
        // Use fallback for failed requests
        for (const companyName of uncachedCompanies) {
          if (!results[companyName]) {
            results[companyName] = this.getFallbackLogo(companyName);
          }
        }
      }
    }

    return results;
  }

  /**
   * Fetch logo from backend API
   * @param {string} companyName - Company name
   * @returns {Promise<string>} - Logo URL
   */
  async fetchLogoFromAPI(companyName) {
    const response = await fetch(`${API_BASE_URL}/api/logos/company/${encodeURIComponent(companyName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.logo_url;
    } else if (response.status === 404) {
      // Logo not found, return fallback
      return this.getFallbackLogo(companyName);
    } else {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
  }

  /**
   * Generate fallback logo URL
   * @param {string} companyName - Company name
   * @returns {string} - Fallback logo URL
   */
  getFallbackLogo(companyName = '') {
    if (!companyName) {
      return '/placeholder-company-logo.png'; // Default placeholder
    }

    // Generate logo.dev URL as fallback
    const cleanName = companyName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9.]/g, '');
    
    const domain = cleanName.includes('.') ? cleanName : `${cleanName}.com`;
    return `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`;
  }

  /**
   * Generate cache key for company name
   * @param {string} companyName - Company name
   * @returns {string} - Cache key
   */
  getCacheKey(companyName) {
    return companyName.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Clear frontend cache
   * @param {string} companyName - Optional specific company to clear
   */
  clearCache(companyName = null) {
    if (companyName) {
      const cacheKey = this.getCacheKey(companyName);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Preload logos for common companies
   * @param {string[]} companyNames - Array of company names to preload
   */
  async preloadLogos(companyNames) {
    if (!companyNames || !Array.isArray(companyNames)) return;

    try {
      await this.getBatchLogos(companyNames);
      console.log(`Preloaded ${companyNames.length} company logos`);
    } catch (error) {
      console.error('Error preloading logos:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    return {
      frontendCacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cachedCompanies: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
export const logoService = new LogoService();

// Export helper function for backward compatibility
export const getCompanyLogo = async (companyName) => {
  return logoService.getCompanyLogo(companyName);
};

export default logoService;
