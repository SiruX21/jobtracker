/**
 * Company autocomplete service - uses backend API only
 * All external API calls go through the backend server
 */
import { API_BASE_URL } from '../config';

// Fetch company suggestions from your backend (which handles external APIs)
export const fetchCompanySuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const url = `${API_BASE_URL}/api/logos/search?q=${encodeURIComponent(query)}&limit=10`;
    console.log('Fetching company suggestions from:', url);
    
    const response = await fetch(url);
    
    console.log('Company API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Company API response data:', data);
    
    // Transform backend response to match expected format
    console.log('Raw backend data structure:', JSON.stringify(data, null, 2));
    
    // Handle both array response and object with results array
    const responseArray = Array.isArray(data) ? data : (data.results || []);
    console.log('Response array to process:', responseArray);
    
    const results = responseArray.map(company => ({
      name: company.name,
      logo_url: company.logo_url ? `${API_BASE_URL}${company.logo_url}` : `${API_BASE_URL}/api/logos/company/${encodeURIComponent(company.name)}`,
      confidence: company.confidence || 0.8,
      source: company.source || 'backend',
      domain: company.domain || '',
      description: company.description || '',
      industry: company.industry || ''
    }));
    
    console.log('Transformed results:', results);
    
    // If no results from backend, use local fallback
    if (results.length === 0) {
      console.log('No backend results, using local fallback...');
      const fallbackResults = getLocalFallbackSuggestions(query);
      console.log('Fallback results:', fallbackResults);
      return fallbackResults;
    }
    
    return results;
    
  } catch (error) {
    console.error('Company suggestion error:', error);
    
    // Fallback to local popular companies if backend fails
    return getLocalFallbackSuggestions(query);
  }
};

// Local fallback suggestions when backend is unavailable
const getLocalFallbackSuggestions = (query) => {
  const popularCompanies = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Tesla', 'Netflix', 
    'Uber', 'Airbnb', 'Spotify', 'LinkedIn', 'Discord', 'Slack', 'Figma', 
    'Canva', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 
    'PayPal', 'Stripe', 'Shopify', 'GitHub', 'Databricks', 'Snowflake',
    'X (Twitter)', 'YouTube', 'TikTok', 'Instagram', 'WhatsApp', 'Zoom',
    'Coinbase', 'Square', 'DoorDash', 'Lyft', 'Booking.com', 'Expedia',
    'Deloitte', 'Accenture', 'McKinsey & Company', 'Boston Consulting Group',
    'Ford', 'General Motors', 'BMW', 'Toyota', 'Honda', 'Volkswagen'
  ];

  const queryLower = query.toLowerCase();
  const matchingCompanies = popularCompanies
    .filter(company => 
      company.toLowerCase().includes(queryLower)
    )
    .slice(0, 8)
    .map(companyName => ({
      name: companyName,
      logo_url: `${API_BASE_URL}/api/logos/company/${encodeURIComponent(companyName)}`,
      confidence: companyName.toLowerCase().startsWith(queryLower) ? 0.7 : 0.5,
      source: 'local_fallback'
    }));

  return matchingCompanies;
};

// Job title suggestions (static list - these don't need external APIs)
export const getJobTitleSuggestions = (companyName = '', query = '') => {
  const commonTitles = [
    "Software Engineer", "Product Manager", "Data Scientist", "UX Designer", 
    "Marketing Manager", "Business Analyst", "DevOps Engineer", "Full Stack Developer",
    "Frontend Developer", "Backend Developer", "Mobile Developer", "Machine Learning Engineer",
    "Security Engineer", "QA Engineer", "Technical Writer", "Sales Engineer",
    "Customer Success Manager", "Operations Manager", "Project Manager", "Scrum Master",
    "Solutions Architect", "Site Reliability Engineer", "Data Engineer", "Cloud Architect",
    "UI Designer", "Content Manager", "Growth Manager", "Developer Relations",
    "Engineering Manager", "Technical Lead", "Principal Engineer", "Staff Engineer"
  ];

  if (!query || query.length < 2) {
    return commonTitles.slice(0, 10);
  }

  const queryLower = query.toLowerCase();
  const filtered = commonTitles.filter(title => 
    title.toLowerCase().includes(queryLower)
  );

  return filtered.length > 0 ? filtered.slice(0, 10) : commonTitles.slice(0, 5);
};
