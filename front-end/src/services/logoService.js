import { API_BASE_URL } from '../config';
import { debugLog } from '../utils/debug';

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
            const logoUrl = logoData.logo_url ? `${API_BASE_URL}${logoData.logo_url}` : null;
            const cacheKey = this.getCacheKey(companyName);
            this.cache.set(cacheKey, logoUrl || this.getFallbackLogo(companyName));
            results[companyName] = logoUrl || this.getFallbackLogo(companyName);
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
   * @returns {Promise<string>} - Logo URL (direct image endpoint)
   */
  async fetchLogoFromAPI(companyName) {
    // Use the direct image endpoint (this triggers caching and returns the image)
    const logoUrl = `${API_BASE_URL}/api/logos/company/${encodeURIComponent(companyName)}`;
    
    // Test if the logo exists by making a HEAD request
    try {
      const response = await fetch(logoUrl, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        // Logo exists, return the direct URL
        return logoUrl;
      } else if (response.status === 404) {
        // Logo not found, return fallback
        return this.getFallbackLogo(companyName);
      } else {
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error checking logo for ${companyName}:`, error);
      return this.getFallbackLogo(companyName);
    }
  }

  /**
   * Generate fallback logo URL
   * @param {string} companyName - Company name
   * @returns {string} - Fallback logo URL (internal API)
   */
  getFallbackLogo(companyName = '') {
    if (!companyName) {
      return '/placeholder-company-logo.png'; // Default placeholder
    }

    // Return internal API URL (no tokens exposed to client)
    return `${API_BASE_URL}/api/logos/company/${encodeURIComponent(companyName)}`;
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
   * Search for companies with autocomplete
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Array of company suggestions
   */
  async searchCompanies(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    
    // Check frontend cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/logos/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        
        // Cache the results for 5 minutes
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
        
        return results;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      
      // Return fallback suggestions
      return this.generateFallbackSuggestions(query, limit);
    }
  }

  /**
   * Generate fallback company suggestions when API is unavailable
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Array} - Array of fallback suggestions
   */
  generateFallbackSuggestions(query, limit = 10) {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Common company patterns
    const patterns = [
      { name: query, suffix: '' },
      { name: query, suffix: ' Inc' },
      { name: query, suffix: ' Corp' },
      { name: query, suffix: ' LLC' },
      { name: query, suffix: ' Technologies' },
      { name: query, suffix: ' Systems' },
      { name: query, suffix: ' Solutions' },
      { name: query, suffix: ' Labs' },
    ];

    for (let i = 0; i < Math.min(patterns.length, limit); i++) {
      const pattern = patterns[i];
      const companyName = pattern.name + pattern.suffix;
      const domain = queryLower.replace(/\s+/g, '') + '.com';
      
      suggestions.push({
        name: companyName,
        domain: domain,
        logo_url: this.getFallbackLogo(companyName),
        description: `Suggested company matching '${query}'`,
        industry: 'Unknown',
        confidence: Math.max(0.9 - (i * 0.1), 0.1),
        isFallback: true
      });
    }

    return suggestions;
  }

  /**
   * Get enhanced company suggestions for autocomplete
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of formatted suggestions for react-select
   */
  async getCompanySuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const results = await this.searchCompanies(query, 8);
      
      return results.map(company => ({
        value: company.name,
        label: company.name,
        logo: company.logo_url,
        domain: company.domain,
        description: company.description,
        industry: company.industry,
        confidence: company.confidence,
        isFallback: company.isFallback || false,
        isNew: false
      }));
    } catch (error) {
      console.error('Error getting company suggestions:', error);
      return [];
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
      debugLog(`Preloaded ${companyNames.length} company logos`);
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
