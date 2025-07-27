import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "./config";
import Header from "./Header";
import Select from 'react-select';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaBuilding, FaCalendar, FaMapMarkerAlt, FaSortAmountDown, FaSortAmountUp, FaCog, FaCheckCircle, FaTimes, FaClock, FaThumbsUp, FaSpinner, FaSync, FaDatabase } from 'react-icons/fa';
import companySuggestions, { getCompanyLogoSync, getJobTitleSuggestions } from "./data/companySuggestions";
import { logoService } from "./services/logoService";

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

const statuses = {
  applied: "bg-blue-500",
  reviewing: "bg-yellow-500",
  ghosted: "bg-gray-500",
  oa: "bg-orange-500",
  interview: "bg-green-500",
  offer: "bg-purple-500",
  rejected: "bg-red-500",
};

function TrackerPage({ darkMode, toggleTheme }) {
  const navigate = useNavigate();

  // Verify login state and fetch jobs
  useEffect(() => {
    const authToken = Cookies.get("authToken");
    if (!authToken) {
      navigate("/auth");
    } else {
      fetchJobs();
    }
  }, [navigate]);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // State variables
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
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

  // Modal management functions
  const openAddModal = () => {
    setNewJob({
      company_name: "",
      job_title: "",
      status: "Applied",
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
          case "month":
            return diffDays <= 30;
          case "3months":
            return diffDays <= 90;
          default:
            return true;
        }
      });
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
  }, [jobs, searchTerm, statusFilter, dateFilter, companyFilter, sortBy]);

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
      
    } catch (error) {
      console.error("Error deleting job:", error);
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
          <div className="text-center mb-8 animate-fadeIn">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Job Application Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track your job applications in one place
            </p>
          </div>

          {/* Cache Status Bar */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaDatabase className={`text-sm ${cacheStatus.isFromCache ? 'text-green-500' : 'text-blue-500'}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {cacheStatus.isFromCache ? 'Data from cache' : 'Fresh data'}
                </span>
              </div>
              
              {cacheStatus.isFromCache && cacheStatus.age && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.floor(cacheStatus.age / 1000)}s old
                </span>
              )}
              
              {cacheStatus.isRefreshing && (
                <div className="flex items-center space-x-1">
                  <FaSpinner className="text-sm text-blue-500 animate-spin" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Refreshing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshJobs}
                disabled={cacheStatus.isRefreshing}
                className="flex items-center px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition disabled:opacity-50"
              >
                <FaSync className={`mr-1 ${cacheStatus.isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={clearCache}
                className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <FaTimes className="mr-1" />
                Clear Cache
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
              <button
                onClick={() => setShowStatsConfig(!showStatsConfig)}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <FaCog className="mr-2" />
                Customize Stats
              </button>
            </div>

            {/* Stats Configuration Panel */}
            {showStatsConfig && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Stats to Display (max 4):</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {availableStats.map(stat => {
                    const IconComponent = stat.icon;
                    const isSelected = selectedStats.includes(stat.id);
                    return (
                      <button
                        key={stat.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStats(prev => prev.filter(id => id !== stat.id));
                          } else if (selectedStats.length < 4) {
                            setSelectedStats(prev => [...prev, stat.id]);
                          }
                        }}
                        disabled={!isSelected && selectedStats.length >= 4}
                        className={`flex items-center p-3 rounded-lg text-sm transition ${
                          isSelected 
                            ? `${getStatColorClass(stat.color)} text-white` 
                            : selectedStats.length >= 4 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <IconComponent className="mr-2" />
                        {stat.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select up to 4 statistics to display on your dashboard
                </p>
              </div>
            )}

            <div className={`grid gap-4 ${selectedStats.length === 1 ? 'grid-cols-1' : selectedStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' : selectedStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
              {selectedStats.map(statId => {
                const stat = availableStats.find(s => s.id === statId);
                if (!stat) return null;
                
                const IconComponent = stat.icon;
                const value = stat.getValue();
                
                return (
                  <div key={statId} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 ${getStatColorClass(stat.color)} rounded-full flex items-center justify-center`}>
                          <IconComponent className="text-white text-sm" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Application Button */}
          <div className="text-center mb-8">
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
            >
              <FaPlus className="mr-3 text-xl" />
              Add New Application
            </button>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Click to start tracking a new job application
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies, positions, locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="date_desc">📅 Newest First</option>
                    <option value="date_asc">📅 Oldest First</option>
                    <option value="company_asc">🏢 Company A-Z</option>
                    <option value="company_desc">🏢 Company Z-A</option>
                    <option value="status">🎯 Status Priority</option>
                    <option value="title_asc">💼 Job Title A-Z</option>
                  </select>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaFilter className="mr-2" />
                  Filters
                  {(statusFilter !== "all" || dateFilter !== "all" || companyFilter) && (
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {[statusFilter !== "all" ? 1 : 0, dateFilter !== "all" ? 1 : 0, companyFilter ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="oa">Online Assessment</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="ghosted">Ghosted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="3months">Past 3 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by company..."
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Count and Sort Info */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredJobs.length} of {jobs.length} applications
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            
            {filteredJobs.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by: <span className="font-medium">
                  {sortBy === "date_desc" && "📅 Newest First"}
                  {sortBy === "date_asc" && "📅 Oldest First"}
                  {sortBy === "company_asc" && "🏢 Company A-Z"}
                  {sortBy === "company_desc" && "🏢 Company Z-A"}
                  {sortBy === "status" && "🎯 Status Priority"}
                  {sortBy === "title_asc" && "💼 Job Title A-Z"}
                </span>
              </p>
            )}
          </div>

          {/* Job Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  {jobs.length === 0 ? "No job applications yet. Add one above!" : "No applications match your search criteria."}
                </p>
                {jobs.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setDateFilter("all");
                      setCompanyFilter("");
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              filteredJobs.map((job, index) => (
                <div
                  key={job.id || index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden"
                >
                  {/* Company Logo Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">
                        <img 
                          src={getCompanyLogoSync(job.company_name)} 
                          alt={job.company_name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name)}&background=3b82f6&color=ffffff&size=40&bold=true`;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {job.company_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {job.job_title}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        statuses[job.status.toLowerCase()] || 'bg-gray-500'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="p-4">
                    {job.location && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <FaMapMarkerAlt className="mr-2 text-blue-500" />
                        {job.location}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                      <FaCalendar className="mr-2 text-green-500" />
                      Applied on {new Date(job.application_date).toLocaleDateString()}
                    </div>

                    {job.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {job.notes.length > 100 ? `${job.notes.substring(0, 100)}...` : job.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editJob(jobs.findIndex(j => j.id === job.id))}
                          className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          <FaEdit className="mr-1 text-xs" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteJob(jobs.findIndex(j => j.id === job.id))}
                          className="flex items-center px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <FaTrash className="mr-1 text-xs" />
                          Delete
                        </button>
                      </div>

                      {job.job_url && (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          <FaExternalLinkAlt className="mr-1 text-xs" />
                          View Job
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Application Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Application</h2>
                    <div className="flex items-center mt-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {step}
                          </div>
                          {step < 3 && <div className={`w-8 h-1 ${currentStep > step ? 'bg-blue-500' : 'bg-gray-200'}`}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">
                    <FaTimes size={24} />
                  </button>
                </div>

                {/* Step 1: Company & Position */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company & Position Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name
                      </label>
                      <Select
                        options={getCompanyOptions()}
                        value={getCompanyOptions().find(option => option.value === newJob.company_name)}
                        onChange={(selectedOption) => {
                          const companyName = selectedOption?.isNew 
                            ? selectedOption.value 
                            : selectedOption?.value || '';
                          setNewJob({ ...newJob, company_name: companyName });
                          setCompanySearchTerm("");
                        }}
                        onInputChange={(inputValue) => {
                          setCompanySearchTerm(inputValue);
                          if (inputValue) {
                            setNewJob({ ...newJob, company_name: inputValue });
                          }
                        }}
                        placeholder={searchLoading ? "Searching companies..." : "Start typing company name..."}
                        isClearable
                        isSearchable
                        isLoading={searchLoading}
                        components={{
                          Option: CompanyOption,
                          LoadingMessage: () => (
                            <div className="flex items-center justify-center p-4 text-gray-500">
                              <FaSpinner className="animate-spin mr-2" />
                              Searching companies...
                            </div>
                          ),
                          NoOptionsMessage: ({ inputValue }) => (
                            <div className="p-4 text-center text-gray-500">
                              {inputValue ? `No companies found for "${inputValue}"` : "Start typing to search companies"}
                            </div>
                          )
                        }}
                        styles={{
                          ...customSelectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999, padding: 0 }),
                          menuList: (base) => ({ ...base, padding: 0 })
                        }}
                        menuPortalTarget={document.body}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center">
                            <img 
                              src={option.logo} 
                              alt={option.label}
                              className="w-6 h-6 rounded mr-3"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(option.label)}&background=3b82f6&color=ffffff&size=24&bold=true`;
                              }}
                            />
                            <span>{option.label}</span>
                            {option.isNew && (
                              <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                New
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Title
                      </label>
                      <Select
                        options={getJobTitleOptions()}
                        value={getJobTitleOptions().find(option => option.value === newJob.job_title)}
                        onChange={(selectedOption) => {
                          setNewJob({ ...newJob, job_title: selectedOption?.value || '' });
                          setJobTitleSearchTerm("");
                        }}
                        onInputChange={(inputValue) => {
                          setJobTitleSearchTerm(inputValue);
                        }}
                        placeholder="Select or type job title..."
                        isClearable
                        isSearchable
                        styles={{
                          ...customSelectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        menuPortalTarget={document.body}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center">
                            <span>{option.label}</span>
                            {option.isNew && (
                              <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                New
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={nextStep}
                        disabled={!newJob.company_name || !newJob.job_title}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Application Details */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={newJob.status}
                          onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Interview">Interview</option>
                          <option value="OA">Online Assessment</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Ghosted">Ghosted</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Application Date
                        </label>
                        <input
                          type="date"
                          value={newJob.application_date}
                          onChange={(e) => setNewJob({ ...newJob, application_date: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        placeholder="e.g., San Francisco, CA (Remote)"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job URL <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={newJob.job_url}
                        onChange={(e) => setNewJob({ ...newJob, job_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={prevStep}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Back
                      </button>
                      <button
                        onClick={nextStep}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Notes & Review */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes & Review</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        value={newJob.notes}
                        onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                        placeholder="Any additional notes about this application..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Review Application</h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Company:</strong> {newJob.company_name}</p>
                        <p><strong>Position:</strong> {newJob.job_title}</p>
                        <p><strong>Status:</strong> {newJob.status}</p>
                        <p><strong>Date:</strong> {newJob.application_date}</p>
                        {newJob.location && <p><strong>Location:</strong> {newJob.location}</p>}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={prevStep}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Back
                      </button>
                      <button
                        onClick={addOrUpdateJob}
                        disabled={loading}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center transition-all duration-200"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <FaPlus className="mr-2" />
                            Add Application
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Application Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Application</h2>
                  <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name
                      </label>
                      <Select
                        options={getCompanyOptions()}
                        value={getCompanyOptions().find(option => option.value === newJob.company_name)}
                        onChange={(selectedOption) => {
                          const companyName = selectedOption?.isNew 
                            ? selectedOption.value 
                            : selectedOption?.value || '';
                          setNewJob({ ...newJob, company_name: companyName });
                        }}
                        styles={{
                          ...customSelectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        menuPortalTarget={document.body}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center">
                            <img 
                              src={option.logo} 
                              alt={option.label}
                              className="w-6 h-6 rounded mr-3"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(option.label)}&background=3b82f6&color=ffffff&size=24&bold=true`;
                              }}
                            />
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Title
                      </label>
                      <Select
                        options={getJobTitleOptions()}
                        value={getJobTitleOptions().find(option => option.value === newJob.job_title)}
                        onChange={(selectedOption) => {
                          setNewJob({ ...newJob, job_title: selectedOption?.value || '' });
                          setJobTitleSearchTerm("");
                        }}
                        onInputChange={(inputValue) => {
                          setJobTitleSearchTerm(inputValue);
                        }}
                        placeholder="Select or type job title..."
                        isClearable
                        isSearchable
                        styles={{
                          ...customSelectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        menuPortalTarget={document.body}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center">
                            <span>{option.label}</span>
                            {option.isNew && (
                              <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                New
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={newJob.status}
                        onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Interview">Interview</option>
                        <option value="OA">Online Assessment</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Ghosted">Ghosted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Application Date
                      </label>
                      <input
                        type="date"
                        value={newJob.application_date}
                        onChange={(e) => setNewJob({ ...newJob, application_date: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA (Remote)"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job URL <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={newJob.job_url}
                      onChange={(e) => setNewJob({ ...newJob, job_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={newJob.notes}
                      onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                      placeholder="Any additional notes about this application..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={closeEditModal}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addOrUpdateJob}
                      disabled={loading || !newJob.company_name || !newJob.job_title}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaEdit className="mr-2" />
                          Update Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
              <FaSpinner className="text-4xl text-blue-500 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {editingJob ? "Updating Application..." : "Adding Application..."}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we save your job application
                </p>
              </div>
              <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackerPage;
