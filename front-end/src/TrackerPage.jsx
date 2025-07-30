import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_BASE_URL } from "./config";
import Header from "./Header";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaBuilding, FaCalendar, FaMapMarkerAlt, FaSortAmountDown, FaSortAmountUp, FaCog, FaCheckCircle, FaTimes, FaClock, FaThumbsUp, FaSpinner, FaSync, FaDatabase } from 'react-icons/fa';
import companySuggestions, { getCompanyLogoSync, getJobTitleSuggestions } from "./data/companySuggestions";
import { logoService } from "./services/logoService";

// Import tracker components
import TrackerHeader from './components/tracker/TrackerHeader';
import CacheStatusBar from './components/tracker/CacheStatusBar';
import StatsConfiguration from './components/tracker/StatsConfiguration';
import StatsCards from './components/tracker/StatsCards';
import AddApplicationButton from './components/tracker/AddApplicationButton';
import SearchAndFilters from './components/tracker/SearchAndFilters';
import JobCards from './components/tracker/JobCards';
import AddJobModal from './components/tracker/AddJobModal';
import EditJobModal from './components/tracker/EditJobModal';
import LoadingOverlay from './components/tracker/LoadingOverlay';

// Utility function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Cache utilities
const CACHE_KEY = 'jobTracker_jobs_cache';
const CACHE_EXPIRY_KEY = 'jobTracker_cache_expiry';
const CACHE_VERSION_KEY = 'jobTracker_cache_version';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CURRENT_CACHE_VERSION = '1.0';

const cacheUtils = {
  set: (data) => {
    const cacheData = {
      jobs: data,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  },

  get: () => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
      const currentTime = Date.now();

      if (!cacheData || !expiryTime) {
        return null;
      }

      const parsedData = JSON.parse(cacheData);
      
      // Check cache version
      if (parsedData.version !== CURRENT_CACHE_VERSION) {
        cacheUtils.clear();
        return null;
      }

      // Check if cache has expired
      if (currentTime > parseInt(expiryTime)) {
        cacheUtils.clear();
        return null;
      }

      return parsedData.jobs;
    } catch (error) {
      console.error('Error reading from cache:', error);
      cacheUtils.clear();
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    localStorage.removeItem(CACHE_VERSION_KEY);
  },

  isValid: () => {
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    const cacheData = localStorage.getItem(CACHE_KEY);
    
    if (!expiryTime || !cacheData) {
      return false;
    }

    try {
      const parsedData = JSON.parse(cacheData);
      return parsedData.version === CURRENT_CACHE_VERSION && Date.now() < parseInt(expiryTime);
    } catch {
      return false;
    }
  },

  getAge: () => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return null;
      
      const parsedData = JSON.parse(cacheData);
      return Date.now() - parsedData.timestamp;
    } catch {
      return null;
    }
  }
};

// Custom option component for company autocomplete
const CompanyOption = ({ data, innerRef, innerProps, isFocused, isSelected }) => {
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`flex items-center p-3 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
        isFocused ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
      } ${isSelected ? 'bg-blue-100 dark:bg-blue-800/30' : ''}`}
    >
      {/* Company Logo */}
      <div className="flex-shrink-0 w-8 h-8 mr-3">
        <img
          src={data.logo || logoService.getFallbackLogo(data.label)}
          alt={data.label}
          className="w-full h-full object-contain rounded"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.label)}&background=3b82f6&color=ffffff&size=32&bold=true`;
          }}
        />
      </div>
      
      {/* Company Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {data.label}
          </span>
          
          {/* Badges */}
          {data.isNew && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              New
            </span>
          )}
          
          {data.isAutocomplete && !data.isFallback && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              Suggested
            </span>
          )}
          
          {data.isLoading && (
            <FaSpinner className="animate-spin text-blue-500" size={12} />
          )}
        </div>
        
        {/* Description and Domain */}
        {(data.description || data.domain) && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data.domain && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mr-2">
                {data.domain}
              </span>
            )}
            {data.description && data.description !== `Suggested company matching '${data.label}'` && (
              <span className="truncate">{data.description}</span>
            )}
          </div>
        )}
        
        {/* Industry and Confidence */}
        {(data.industry || data.confidence) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            {data.industry && data.industry !== 'Unknown' && (
              <span>{data.industry}</span>
            )}
            {data.confidence && data.confidence < 1 && (
              <span className="ml-auto">
                {Math.round(data.confidence * 100)}% match
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function TrackerPage({ darkMode, toggleTheme }) {
  const navigate = useNavigate();

  // State variables
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [jobStatuses, setJobStatuses] = useState([]);
  const [statusColorMap, setStatusColorMap] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, date_asc, company_asc, company_desc, status
  const [newJob, setNewJob] = useState({ 
    company_name: "", 
    job_title: "",
    status: "Applied", 
    application_date: getCurrentDate(),
    location: "",
    job_url: "",
    notes: ""
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companySuggestionsList, setCompanySuggestionsList] = useState([]);
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [jobTitleSearchTerm, setJobTitleSearchTerm] = useState("");
  const [companyLogoLoading, setCompanyLogoLoading] = useState("");
  const [autoLogos, setAutoLogos] = useState({});
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showStatsConfig, setShowStatsConfig] = useState(false);
  const [selectedStats, setSelectedStats] = useState(() => {
    const saved = localStorage.getItem('selectedStats');
    return saved ? JSON.parse(saved) : ['total', 'thisWeek', 'interviews', 'pending'];
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingJob, setEditingJob] = useState(null);
  
  // Cache-related state
  const [cacheStatus, setCacheStatus] = useState({
    isFromCache: false,
    age: 0,
    isValid: false,
    isRefreshing: false
  });

  // Developer mode state
  const [developerMode, setDeveloperMode] = useState(() => {
    const saved = localStorage.getItem('developerMode');
    return saved === 'true';
  });

  // Dashboard filter state
  const [dashboardFilter, setDashboardFilter] = useState(null);

  // Handle dashboard card clicks for filtering
  const handleDashboardCardClick = (statId) => {
    // Reset other filters when clicking dashboard card
    setSearchTerm("");
    setCompanyFilter("");
    
    switch (statId) {
      case 'total':
        setStatusFilter("all");
        setDateFilter("all");
        setDashboardFilter(null);
        break;
      case 'thisWeek':
        setStatusFilter("all");
        setDateFilter("thisWeek");
        setDashboardFilter('thisWeek');
        break;
      case 'thisMonth':
        setStatusFilter("all");
        setDateFilter("thisMonth");
        setDashboardFilter('thisMonth');
        break;
      case 'interviews':
        setStatusFilter("interview");
        setDateFilter("all");
        setDashboardFilter('interviews');
        break;
      case 'pending':
        setStatusFilter("applied");
        setDateFilter("all");
        setDashboardFilter('pending');
        break;
      case 'offers':
        setStatusFilter("offer");
        setDateFilter("all");
        setDashboardFilter('offers');
        break;
      case 'rejected':
        setStatusFilter("rejected");
        setDateFilter("all");
        setDashboardFilter('rejected');
        break;
      case 'ghosted':
        setStatusFilter("ghosted");
        setDateFilter("all");
        setDashboardFilter('ghosted');
        break;
      case 'reviewing':
        setStatusFilter("reviewing");
        setDateFilter("all");
        setDashboardFilter('reviewing');
        break;
      case 'responseRate':
        // Filter to show jobs that responded (not applied or ghosted)
        setStatusFilter("all");
        setDateFilter("all");
        setDashboardFilter('responseRate');
        break;
      default:
        setStatusFilter("all");
        setDateFilter("all");
        setDashboardFilter(null);
    }
  };

  // Auto-refresh cache when it becomes stale
  useEffect(() => {
    const interval = setInterval(() => {
      if (cacheStatus.isFromCache && !cacheUtils.isValid()) {
        console.log('Cache expired, refreshing...');
        fetchJobs(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [cacheStatus.isFromCache]);

  // Update cache status periodically
  useEffect(() => {
    if (cacheStatus.isFromCache) {
      const interval = setInterval(() => {
        setCacheStatus(prev => ({
          ...prev,
          age: cacheUtils.getAge(),
          isValid: cacheUtils.isValid()
        }));
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [cacheStatus.isFromCache]);

  // Listen for developer mode changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('developerMode');
      setDeveloperMode(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Modal management functions
  const openAddModal = () => {
    const defaultStatus = jobStatuses.length > 0 ? 
      jobStatuses.find(s => s.status_name === "Applied")?.status_name || jobStatuses[0].status_name : 
      "Applied";
      
    setNewJob({
      company_name: "",
      job_title: "",
      status: defaultStatus,
      application_date: getCurrentDate(),
      location: "",
      job_url: "",
      notes: ""
    });
    setCurrentStep(1);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCurrentStep(1);
    setCompanySearchTerm("");
    setJobTitleSearchTerm("");
  };

  const openEditModal = (job, index) => {
    setEditingJob({ ...job, index });
    setNewJob({
      company_name: job.company_name,
      job_title: job.job_title,
      status: job.status,
      application_date: job.application_date,
      location: job.location || "",
      job_url: job.job_url || "",
      notes: job.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingJob(null);
    setJobTitleSearchTerm("");
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Color mapping for stats to ensure Tailwind classes are properly included
  const getStatColorClass = (colorKey) => {
    const colorMap = {
      'blue-500': 'bg-blue-500',
      'green-500': 'bg-green-500',
      'orange-500': 'bg-orange-500',
      'purple-500': 'bg-purple-500',
      'emerald-500': 'bg-emerald-500',
      'red-500': 'bg-red-500',
      'gray-500': 'bg-gray-500',
      'yellow-500': 'bg-yellow-500',
      'indigo-500': 'bg-indigo-500',
      'teal-500': 'bg-teal-500',
      'pink-500': 'bg-pink-500',
      'cyan-500': 'bg-cyan-500',
      'lime-500': 'bg-lime-500',
      'amber-500': 'bg-amber-500',
      'violet-500': 'bg-violet-500',
      'rose-500': 'bg-rose-500',
      'slate-500': 'bg-slate-500'
    };
    return colorMap[colorKey] || 'bg-blue-500';
  };

  // Available stat options
  const availableStats = [
    { id: 'total', label: 'Total Applications', icon: FaBuilding, color: 'blue-500', getValue: () => jobs.length },
    { id: 'thisWeek', label: 'This Week', icon: FaCalendar, color: 'green-500', getValue: () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return jobs.filter(job => new Date(job.application_date) >= weekAgo).length;
    }},
    { id: 'interviews', label: 'Interviews', icon: FaSearch, color: 'orange-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'interview').length },
    { id: 'pending', label: 'Pending', icon: FaClock, color: 'purple-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'applied').length },
    { id: 'offers', label: 'Offers', icon: FaThumbsUp, color: 'emerald-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'offer').length },
    { id: 'rejected', label: 'Rejected', icon: FaTimes, color: 'red-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'rejected').length },
    { id: 'ghosted', label: 'Ghosted', icon: FaTimes, color: 'gray-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'ghosted').length },
    { id: 'reviewing', label: 'Reviewing', icon: FaSearch, color: 'yellow-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'reviewing').length },
    { id: 'thisMonth', label: 'This Month', icon: FaCalendar, color: 'indigo-500', getValue: () => {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return jobs.filter(job => new Date(job.application_date) >= monthAgo).length;
    }},
    { id: 'responseRate', label: 'Response Rate', icon: FaCheckCircle, color: 'teal-500', getValue: () => {
      const responded = jobs.filter(job => !['applied', 'ghosted'].includes(job.status.toLowerCase())).length;
      return jobs.length > 0 ? Math.round((responded / jobs.length) * 100) + '%' : '0%';
    }}
  ];

  // Filter and sort jobs
  useEffect(() => {
    let filtered = jobs;

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (companyFilter) {
      filtered = filtered.filter(job => 
        job.company_name.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.application_date);
        const diffTime = Math.abs(now - jobDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "week":
            return diffDays <= 7;
          case "thisWeek":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          case "thisMonth":
            return diffDays <= 30;
          case "3months":
            return diffDays <= 90;
          default:
            return true;
        }
      });
    }

    // Apply dashboard-specific filters
    if (dashboardFilter === 'responseRate') {
      // Filter to show only jobs that responded (not applied or ghosted)
      filtered = filtered.filter(job => !['applied', 'ghosted'].includes(job.status.toLowerCase()));
    }

    // Apply sorting
    switch (sortBy) {
      case "date_desc":
        filtered.sort((a, b) => new Date(b.application_date) - new Date(a.application_date));
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.application_date) - new Date(b.application_date));
        break;
      case "company_asc":
        filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
        break;
      case "company_desc":
        filtered.sort((a, b) => b.company_name.localeCompare(a.company_name));
        break;
      case "status":
        // Sort by status priority: Offer > Interview > Applied > Reviewing > OA > Rejected > Ghosted
        const statusPriority = {
          "offer": 1,
          "interview": 2,
          "applied": 3,
          "reviewing": 4,
          "oa": 5,
          "rejected": 6,
          "ghosted": 7
        };
        filtered.sort((a, b) => {
          const aPriority = statusPriority[a.status.toLowerCase()] || 8;
          const bPriority = statusPriority[b.status.toLowerCase()] || 8;
          return aPriority - bPriority;
        });
        break;
      case "title_asc":
        filtered.sort((a, b) => a.job_title.localeCompare(b.job_title));
        break;
      default:
        // Default to date descending
        filtered.sort((a, b) => new Date(b.application_date) - new Date(a.application_date));
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, dateFilter, companyFilter, sortBy, dashboardFilter]);

  // Update job title suggestions when company changes
  useEffect(() => {
    if (newJob.company_name) {
      const suggestions = getJobTitleSuggestions(newJob.company_name);
      // Get unique job titles from existing jobs for the same company
      const existingTitles = [...new Set(jobs
        .filter(job => job.company_name.toLowerCase() === newJob.company_name.toLowerCase())
        .map(job => job.job_title)
        .filter(Boolean)
      )];
      
      // Combine predefined suggestions with user's existing job titles
      const allTitles = [...new Set([...suggestions, ...existingTitles])];
      setJobTitleSuggestions(allTitles.map(title => ({ value: title, label: title })));
    } else {
      // Show common job titles from all user's existing jobs
      const uniqueTitles = [...new Set(jobs.map(job => job.job_title).filter(Boolean))];
      setJobTitleSuggestions(uniqueTitles.map(title => ({ value: title, label: title })));
    }
  }, [newJob.company_name, jobs]);

  // Auto-load company logo with faster 300ms delay
  useEffect(() => {
    if (companySearchTerm && companySearchTerm.length > 1) {
      setCompanyLogoLoading(companySearchTerm);
      
      const timer = setTimeout(async () => {
        // Check if the company isn't already in suggestions
        const existingCompany = companySuggestions.find(c => 
          c.name.toLowerCase() === companySearchTerm.toLowerCase()
        );
        
        if (!existingCompany) {
          try {
            const logoUrl = await logoService.getCompanyLogo(companySearchTerm);
            setAutoLogos(prev => ({
              ...prev,
              [companySearchTerm]: logoUrl
            }));
          } catch (error) {
            console.error('Error fetching logo:', error);
            // Use fallback
            const logoUrl = logoService.getFallbackLogo(companySearchTerm);
            setAutoLogos(prev => ({
              ...prev,
              [companySearchTerm]: logoUrl
            }));
          }
        }
        setCompanyLogoLoading("");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [companySearchTerm]);

  // Auto-complete company search
  useEffect(() => {
    if (companySearchTerm && companySearchTerm.length >= 2) {
      setSearchLoading(true);
      
      const searchTimer = setTimeout(async () => {
        try {
          const suggestions = await logoService.getCompanySuggestions(companySearchTerm);
          setAutocompleteSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching autocomplete suggestions:', error);
          setAutocompleteSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300);

      return () => {
        clearTimeout(searchTimer);
        setSearchLoading(false);
      };
    } else {
      setAutocompleteSuggestions([]);
      setSearchLoading(false);
    }
  }, [companySearchTerm]);

  // Prepare company options for react-select with dynamic search
  useEffect(() => {
    // Get unique companies from existing jobs
    const uniqueCompaniesFromJobs = [...new Set(jobs.map(job => job.company_name).filter(Boolean))];
    
    // Combine predefined companies with user's existing companies
    const allCompanies = [...companySuggestions];
    
    // Add companies from user's job history that aren't in predefined list
    uniqueCompaniesFromJobs.forEach(companyName => {
      if (!companySuggestions.find(c => c.name.toLowerCase() === companyName.toLowerCase())) {
        allCompanies.push({
          name: companyName,
          logo: logoService.getFallbackLogo(companyName),
          website: `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Marketing Manager"]
        });
      }
    });

    const companyOptions = allCompanies.map(company => ({
      value: company.name,
      label: company.name,
      logo: company.logo || logoService.getFallbackLogo(company.name)
    }));

    setCompanySuggestionsList(companyOptions);
  }, [jobs]);

  // Initial data loading when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchJobStatuses();
      await fetchJobs();
    };
    
    initializeData();
  }, []); // Empty dependency array for component mount only

  // Enhanced company search with dynamic options and auto logos
  const getCompanyOptions = () => {
    let options = [...companySuggestionsList];
    
    // Add autocomplete suggestions
    if (autocompleteSuggestions.length > 0) {
      const autocompleteOptions = autocompleteSuggestions.map(suggestion => ({
        ...suggestion,
        isAutocomplete: true
      }));
      options = [...autocompleteOptions, ...options];
    }
    
    // If user is typing and no exact match exists, add option to create new company
    if (companySearchTerm && companySearchTerm.length > 1) {
      const exactMatch = options.find(option => 
        option.label.toLowerCase() === companySearchTerm.toLowerCase()
      );
      
      if (!exactMatch) {
        const logoUrl = autoLogos[companySearchTerm] || logoService.getFallbackLogo(companySearchTerm);
        const newCompanyOption = {
          value: companySearchTerm,
          label: companySearchTerm,
          logo: logoUrl,
          isNew: true,
          isLoading: companyLogoLoading === companySearchTerm
        };
        options = [newCompanyOption, ...options];
      }
    }
    
    // Remove duplicates based on company name
    const uniqueOptions = options.filter((option, index, self) => 
      index === self.findIndex(o => o.label.toLowerCase() === option.label.toLowerCase())
    );
    
    return uniqueOptions;
  };

  // Enhanced job title search with dynamic options
  const getJobTitleOptions = () => {
    let options = [...jobTitleSuggestions];
    
    // If user is typing and no exact match exists, add option to create new job title
    if (jobTitleSearchTerm && jobTitleSearchTerm.length > 1) {
      const exactMatch = options.find(option => 
        option.label.toLowerCase() === jobTitleSearchTerm.toLowerCase()
      );
      
      if (!exactMatch) {
        const newJobTitleOption = {
          value: jobTitleSearchTerm,
          label: jobTitleSearchTerm,
          isNew: true
        };
        options = [newJobTitleOption, ...options];
      }
    }
    
    return options;
  };

  // Fetch job statuses from backend
  const fetchJobStatuses = async () => {
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.get(`${API_BASE_URL}/job-statuses`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      // Handle both array response and object with statuses property
      const statuses = Array.isArray(response.data) ? response.data : response.data.statuses;
      
      // Ensure statuses is an array
      if (Array.isArray(statuses)) {
        setJobStatuses(statuses);
        
        // Create color mapping
        const colorMap = {};
        statuses.forEach(status => {
          colorMap[status.status_name] = status.color_code;
        });
        setStatusColorMap(colorMap);
      } else {
        console.error("Job statuses response is not an array:", response.data);
        // Set default statuses if backend fails
        const defaultStatuses = [
          { status_name: "Applied", color_code: "#3B82F6" },
          { status_name: "Interview", color_code: "#10B981" },
          { status_name: "Offered", color_code: "#8B5CF6" },
          { status_name: "Rejected", color_code: "#EF4444" },
          { status_name: "Ghosted", color_code: "#6B7280" }
        ];
        setJobStatuses(defaultStatuses);
        
        const colorMap = {};
        defaultStatuses.forEach(status => {
          colorMap[status.status_name] = status.color_code;
        });
        setStatusColorMap(colorMap);
      }
      
    } catch (error) {
      console.error("Error fetching job statuses:", error);
      
      // Set default statuses on error
      const defaultStatuses = [
        { status_name: "Applied", color_code: "#3B82F6" },
        { status_name: "Interview", color_code: "#10B981" },
        { status_name: "Offered", color_code: "#8B5CF6" },
        { status_name: "Rejected", color_code: "#EF4444" },
        { status_name: "Ghosted", color_code: "#6B7280" }
      ];
      setJobStatuses(defaultStatuses);
      
      const colorMap = {};
      defaultStatuses.forEach(status => {
        colorMap[status.status_name] = status.color_code;
      });
      setStatusColorMap(colorMap);
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    }
  };

  // Create a new status
  const createStatus = async (statusName) => {
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.post(`${API_BASE_URL}/job-statuses`, {
        status_name: statusName
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      // Add the new status to the local state
      const newStatus = response.data;
      setJobStatuses(prev => [...prev, newStatus]);
      setStatusColorMap(prev => ({
        ...prev,
        [newStatus.status_name]: newStatus.color_code
      }));
      
      return newStatus;
    } catch (error) {
      console.error("Error creating status:", error);
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
      throw error;
    }
  };

  // Get status options for select dropdown
  const getStatusOptions = () => {
    return jobStatuses.map(status => ({
      value: status.status_name,
      label: status.status_name,
      color: status.color_code
    }));
  };

  // Fetch jobs from backend with caching
  const fetchJobs = async (forceRefresh = false) => {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedJobs = cacheUtils.get();
        if (cachedJobs) {
          setJobs(cachedJobs);
          setCacheStatus({
            isFromCache: true,
            age: cacheUtils.getAge(),
            isValid: cacheUtils.isValid(),
            isRefreshing: false
          });
          return;
        }
      }

      // Set refreshing status
      setCacheStatus(prev => ({ ...prev, isRefreshing: true }));

      const authToken = Cookies.get("authToken");
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      const jobsData = response.data;
      setJobs(jobsData);
      
      // Cache the fresh data
      cacheUtils.set(jobsData);
      
      // Preload logos for all companies in background
      const companyNames = [...new Set(jobsData.map(job => job.company_name).filter(Boolean))];
      if (companyNames.length > 0) {
        logoService.preloadLogos(companyNames);
      }
      
      setCacheStatus({
        isFromCache: false,
        age: 0,
        isValid: true,
        isRefreshing: false
      });
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setCacheStatus(prev => ({ ...prev, isRefreshing: false }));
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    }
  };

  // Force refresh function
  const refreshJobs = () => {
    fetchJobs(true);
  };

  // Clear cache function
  const clearCache = () => {
    cacheUtils.clear();
    setCacheStatus({
      isFromCache: false,
      age: 0,
      isValid: false,
      isRefreshing: false
    });
    fetchJobs(true);
  };

  // Add or update job
  const addOrUpdateJob = async () => {
    if (!newJob.company_name || !newJob.job_title) return;

    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      
      if (editingJob) {
        // Update existing job
        await axios.put(`${API_BASE_URL}/jobs/${editingJob.id}`, newJob, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        const updatedJobs = [...jobs];
        updatedJobs[editingJob.index] = { ...editingJob, ...newJob };
        setJobs(updatedJobs);
        
        // Update cache with new data
        cacheUtils.set(updatedJobs);
        setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
        
        closeEditModal();
      } else {
        // Add new job
        const response = await axios.post(`${API_BASE_URL}/jobs`, newJob, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        const newJobs = [...jobs, response.data];
        setJobs(newJobs);
        
        // Update cache with new data
        cacheUtils.set(newJobs);
        setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
        
        closeAddModal();
      }
    } catch (error) {
      console.error("Error saving job:", error);
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit job
  const editJob = (index) => {
    const job = jobs[index];
    openEditModal(job, index);
  };

  // Delete job
  const deleteJob = async (index) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) {
      return;
    }

    setLoading(true);
    const jobToDelete = jobs[index];
    
    try {
      const authToken = Cookies.get("authToken");
      await axios.delete(`${API_BASE_URL}/jobs/${jobToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      const updatedJobs = jobs.filter((_, i) => i !== index);
      setJobs(updatedJobs);
      
      // Update cache with remaining jobs
      cacheUtils.set(updatedJobs);
      setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
      
      // Show success toast notification
      toast.success(`Job application for ${jobToDelete.company_name} - ${jobToDelete.job_title} deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (error) {
      console.error("Error deleting job:", error);
      
      // Show error toast notification
      toast.error("Failed to delete job application. Please try again.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      backgroundColor: darkMode ? '#374151' : 'white',
      borderColor: state.isFocused ? '#3b82f6' : (darkMode ? '#4b5563' : '#d1d5db'),
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : null,
      color: darkMode ? '#f9fafb' : '#374151',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#374151' : 'white',
      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
      boxShadow: darkMode 
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#374151' : 'white',
      padding: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
          ? (darkMode ? '#4b5563' : '#eff6ff')
          : (darkMode ? '#374151' : 'white'),
      color: state.isSelected ? '#ffffff' : (darkMode ? '#f9fafb' : '#374151'),
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : (darkMode ? '#4b5563' : '#eff6ff'),
        color: state.isSelected ? '#ffffff' : (darkMode ? '#f9fafb' : '#374151'),
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#f9fafb' : '#374151',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#9ca3af' : '#6b7280',
    }),
    input: (provided) => ({
      ...provided,
      color: darkMode ? '#f9fafb' : '#374151',
    }),
    valueContainer: (provided) => ({
      ...provided,
      color: darkMode ? '#f9fafb' : '#374151',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: darkMode ? '#9ca3af' : '#6b7280',
      '&:hover': {
        color: darkMode ? '#d1d5db' : '#374151',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: darkMode ? '#9ca3af' : '#6b7280',
      '&:hover': {
        color: darkMode ? '#d1d5db' : '#374151',
      },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#4b5563' : '#d1d5db',
    }),
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 transition-all duration-700 ease-in-out">
        
        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <TrackerHeader />

          {/* Cache Status Bar - Developer Mode Only */}
          <CacheStatusBar 
            developerMode={developerMode}
            cacheStatus={cacheStatus}
            refreshJobs={refreshJobs}
            clearCache={clearCache}
          />

          {/* Stats Configuration and Cards */}
          <StatsConfiguration 
            showStatsConfig={showStatsConfig}
            setShowStatsConfig={setShowStatsConfig}
            availableStats={availableStats}
            selectedStats={selectedStats}
            setSelectedStats={setSelectedStats}
            getStatColorClass={getStatColorClass}
          />

          <StatsCards 
            selectedStats={selectedStats}
            availableStats={availableStats}
            dashboardFilter={dashboardFilter}
            handleDashboardCardClick={handleDashboardCardClick}
            getStatColorClass={getStatColorClass}
          />

          {/* Add Application Button */}
          <AddApplicationButton openAddModal={openAddModal} />

          {/* Search and Filters */}
          <SearchAndFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            jobStatuses={jobStatuses}
            filteredJobs={filteredJobs}
            jobs={jobs}
          />

          {/* Job Cards Grid */}
          <JobCards 
            filteredJobs={filteredJobs}
            jobs={jobs}
            statusColorMap={statusColorMap}
            editJob={editJob}
            deleteJob={deleteJob}
            setSearchTerm={setSearchTerm}
            setStatusFilter={setStatusFilter}
            setDateFilter={setDateFilter}
            setCompanyFilter={setCompanyFilter}
          />
        </div>

        {/* Add Application Modal */}
        <AddJobModal 
          isAddModalOpen={isAddModalOpen}
          closeAddModal={closeAddModal}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          newJob={newJob}
          setNewJob={setNewJob}
          nextStep={nextStep}
          prevStep={prevStep}
          getCompanyOptions={getCompanyOptions}
          getJobTitleOptions={getJobTitleOptions}
          getStatusOptions={getStatusOptions}
          customSelectStyles={customSelectStyles}
          CompanyOption={CompanyOption}
          searchLoading={searchLoading}
          setCompanySearchTerm={setCompanySearchTerm}
          setJobTitleSearchTerm={setJobTitleSearchTerm}
          jobTitleSearchTerm={jobTitleSearchTerm}
          createStatus={createStatus}
          fetchJobStatuses={fetchJobStatuses}
          addOrUpdateJob={addOrUpdateJob}
          loading={loading}
        />

        {/* Edit Application Modal */}
        <EditJobModal 
          isEditModalOpen={isEditModalOpen}
          closeEditModal={closeEditModal}
          newJob={newJob}
          setNewJob={setNewJob}
          getCompanyOptions={getCompanyOptions}
          getJobTitleOptions={getJobTitleOptions}
          getStatusOptions={getStatusOptions}
          customSelectStyles={customSelectStyles}
          setJobTitleSearchTerm={setJobTitleSearchTerm}
          jobTitleSearchTerm={jobTitleSearchTerm}
          createStatus={createStatus}
          fetchJobStatuses={fetchJobStatuses}
          addOrUpdateJob={addOrUpdateJob}
          loading={loading}
        />

        {/* Loading Overlay */}
        <LoadingOverlay loading={loading} editingJob={editingJob} />
      </div>
    </div>
  );
}

export default TrackerPage;
