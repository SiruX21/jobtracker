import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from 'react-toastify';
import { debugLog, debugWarn } from './utils/debug';
import { API_BASE_URL } from "./config";
import Header from "./Header";
import { getJobTitleSuggestions } from "./data/companySuggestions";
import { JOB_STATUSES, getStatusColorMap, getStatusNames } from './data/jobStatuses';
import { logoService } from "./services/logoService";
import { FaSearch, FaBuilding, FaCalendar, FaClock, FaThumbsUp, FaTimes, FaCheckCircle } from 'react-icons/fa';

// Import tracker components
import TrackerHeader from "./components/tracker/TrackerHeader";
import CacheStatusBar from "./components/tracker/CacheStatusBar";
import StatsConfiguration from "./components/tracker/StatsConfiguration";
import StatsCards from "./components/tracker/StatsCards";
import AddApplicationButton from "./components/tracker/AddApplicationButton";
import SearchAndFilters from "./components/tracker/SearchAndFilters";
import JobCards from "./components/tracker/JobCards";
import AddJobModal from "./components/tracker/AddJobModal";
import EditJobModal from "./components/tracker/EditJobModal";
import LoadingOverlay from "./components/tracker/LoadingOverlay";
import LoadingScreen from "./components/shared/LoadingScreen";
import SankeyDiagram from "./components/tracker/SankeyDiagram";
import SankeyDiagramButton from "./components/tracker/SankeyDiagramButton";

// Utility functions
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Cache utilities
const CACHE_KEY = 'jobtrack_jobs_cache';
const CACHE_EXPIRY_KEY = 'jobtrack_cache_expiry';
const CACHE_VERSION_KEY = 'jobtrack_cache_version';
const CACHE_DURATION = 5 * 60 * 1000;
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
      
      if (parsedData.version !== CURRENT_CACHE_VERSION) {
        cacheUtils.clear();
        return null;
      }

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
      if (!cacheData) return 0;
      
      const parsedData = JSON.parse(cacheData);
      return Math.floor((Date.now() - parsedData.timestamp) / 1000);
    } catch {
      return 0;
    }
  }
};

function TrackerPage({ darkMode, toggleTheme, isMobile }) {
  const navigate = useNavigate();

  // State variables
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusColorMap, setStatusColorMap] = useState(getStatusColorMap());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date_desc");
  const [newJob, setNewJob] = useState({ 
    company_name: "", 
    job_title: "",
    status: "Applied", 
    application_date: getCurrentDate(),
    location: "",
    job_url: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [cacheStatus, setCacheStatus] = useState({
    isFromCache: false,
    age: 0,
    isValid: false,
    isRefreshing: false
  });
  const [developerMode, setDeveloperMode] = useState(() => {
    const saved = localStorage.getItem('developerMode');
    return saved === 'true';
  });
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [showSankeyDiagram, setShowSankeyDiagram] = useState(false);

  // Available stats configuration
  const availableStats = [
    { id: 'total', label: 'Total Applications', icon: FaBuilding, color: 'blue-500', getValue: () => jobs.length },
    { id: 'thisWeek', label: 'This Week', icon: FaCalendar, color: 'green-500', getValue: () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return jobs.filter(job => new Date(job.application_date) >= weekAgo).length;
    }},
    { id: 'interviews', label: 'Interviews', icon: FaThumbsUp, color: 'purple-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'interview').length },
    { id: 'pending', label: 'Pending', icon: FaClock, color: 'yellow-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'applied').length },
    { id: 'offers', label: 'Offers', icon: FaCheckCircle, color: 'green-600', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'offer').length },
    { id: 'rejected', label: 'Rejected', icon: FaTimes, color: 'red-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'rejected').length },
    { id: 'ghosted', label: 'Ghosted', icon: FaTimes, color: 'gray-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'ghosted').length },
    { id: 'reviewing', label: 'Reviewing', icon: FaSearch, color: 'indigo-500', getValue: () => jobs.filter(job => job.status.toLowerCase() === 'reviewing').length },
    { id: 'thisMonth', label: 'This Month', icon: FaCalendar, color: 'teal-500', getValue: () => {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return jobs.filter(job => new Date(job.application_date) >= monthAgo).length;
    }},
    { id: 'responseRate', label: 'Response Rate', icon: FaThumbsUp, color: 'emerald-500', getValue: () => {
      const responded = jobs.filter(job => !['applied', 'ghosted'].includes(job.status.toLowerCase())).length;
      return jobs.length > 0 ? Math.round((responded / jobs.length) * 100) + '%' : '0%';
    }}
  ];

  // Utility function to convert color to background class
  const getStatColorClass = (color) => {
    return `bg-${color}`;
  };

  // Dashboard filter handler
  const handleDashboardCardClick = (statId) => {
    // If the clicked card is already active, clear all filters
    if (dashboardFilter === statId) {
      setSearchTerm("");
      setCompanyFilter("");
      setStatusFilter("all");
      setDateFilter("all");
      setDashboardFilter(null);
      return;
    }

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

  // Modal management functions
  const openAddModal = () => {
    const defaultStatus = JOB_STATUSES.length > 0 ? 
      JOB_STATUSES.find(s => s.name === "Applied")?.name || JOB_STATUSES[0].name : 
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

  // API functions

  const fetchJobs = async (forceRefresh = false) => {
    try {
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

      setCacheStatus(prev => ({ ...prev, isRefreshing: true }));

      const authToken = Cookies.get("authToken");
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const jobsData = response.data;
      
      // Always replace the entire jobs array with fresh data from server
      // This ensures deleted jobs are removed and new jobs are added
      setJobs(jobsData);
      cacheUtils.set(jobsData);
      
      // Preload logos for all companies
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
      
      debugLog(`Fetched ${jobsData.length} jobs from server${forceRefresh ? ' (force refresh)' : ''}`);
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setCacheStatus(prev => ({ ...prev, isRefreshing: false }));
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      } else {
        toast.error('Failed to fetch jobs from server');
      }
    }
  };

  const refreshJobs = () => {
    fetchJobs(true);
  };

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

  const addOrUpdateJob = async () => {
    if (!newJob.company_name || !newJob.job_title) return;

    setLoading(true);
    try {
      const authToken = Cookies.get("authToken");
      
      if (editingJob) {
        await axios.put(`${API_BASE_URL}/jobs/${editingJob.id}`, newJob, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        const updatedJobs = [...jobs];
        updatedJobs[editingJob.index] = { ...editingJob, ...newJob };
        setJobs(updatedJobs);
        cacheUtils.set(updatedJobs);
        setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
        closeEditModal();
      } else {
        console.log('📤 Sending job data to backend:', newJob);
        const response = await axios.post(`${API_BASE_URL}/jobs`, newJob, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        const newJobs = [...jobs, response.data];
        setJobs(newJobs);
        cacheUtils.set(newJobs);
        setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
        closeAddModal();
      }
    } catch (error) {
      console.error("Error saving job:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (index) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) {
      return;
    }

    setLoading(true);
    const jobToDelete = jobs[index];
    
    try {
      const authToken = Cookies.get("authToken");
      await axios.delete(`${API_BASE_URL}/jobs/${jobToDelete.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const updatedJobs = jobs.filter((_, i) => i !== index);
      setJobs(updatedJobs);
      cacheUtils.set(updatedJobs);
      setCacheStatus(prev => ({ ...prev, isFromCache: false, age: 0 }));
      
      toast.success(`Job application for ${jobToDelete.company_name} - ${jobToDelete.job_title} deleted successfully!`);
      
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job application. Please try again.");
      
      if (error.response?.status === 401) {
        Cookies.remove("authToken");
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort jobs effect
  useEffect(() => {
    let filtered = jobs;

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
          case "thisWeek":
            return diffDays <= 7;
          case "month":
          case "thisMonth":
            return diffDays <= 30;
          case "3months":
            return diffDays <= 90;
          default:
            return true;
        }
      });
    }

    if (dashboardFilter === 'responseRate') {
      filtered = filtered.filter(job => !['applied', 'ghosted'].includes(job.status.toLowerCase()));
    }

    // Sorting
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
        const statusPriority = {
          "offer": 1, "interview": 2, "applied": 3, "reviewing": 4,
          "oa": 5, "rejected": 6, "ghosted": 7
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
        filtered.sort((a, b) => new Date(b.application_date) - new Date(a.application_date));
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, dateFilter, companyFilter, sortBy, dashboardFilter]);

  // Company autocomplete effect
  useEffect(() => {
    const searchCompanies = async () => {
      if (companySearchTerm && companySearchTerm.length >= 2) {
        setSearchLoading(true);
        try {
          const authToken = Cookies.get("authToken");
          const response = await axios.get(`${API_BASE_URL}/api/logos/search`, {
            params: {
              q: companySearchTerm,
              limit: 8
            },
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          // Handle nested results structure
          const apiResults = response.data.results;
          const suggestions = Array.isArray(apiResults) ? apiResults : (apiResults?.results || []);
          
          // Fix logo URLs to be absolute
          const fixedSuggestions = suggestions.map(suggestion => ({
            ...suggestion,
            logo_url: suggestion.logo_url?.startsWith('/') 
              ? `${API_BASE_URL}${suggestion.logo_url}` 
              : suggestion.logo_url
          }));
          
          setAutocompleteSuggestions(fixedSuggestions);
        } catch (error) {
          console.error('Error searching companies via API:', error);
          // Just set empty suggestions if API fails
          setAutocompleteSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setAutocompleteSuggestions([]);
        setSearchLoading(false);
      }
    };

    // Search immediately without debounce for instant suggestions
    searchCompanies();
  }, [companySearchTerm]);

  // Job title autocomplete effect
  useEffect(() => {
    if (jobTitleSearchTerm && jobTitleSearchTerm.length > 0) {
      const suggestions = getJobTitleSuggestions(jobTitleSearchTerm);
      setJobTitleSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
    } else {
      setJobTitleSuggestions([]);
    }
  }, [jobTitleSearchTerm]);

  // Initialize data on mount - always fetch fresh data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Clear any existing cache to ensure fresh data
        cacheUtils.clear();
        setCacheStatus({
          isFromCache: false,
          age: 0,
          isValid: false,
          isRefreshing: false
        });
        
        await fetchJobs(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };
    initializeData();
  }, []);

  // Auto-refresh cache when stale
  useEffect(() => {
    const interval = setInterval(() => {
      if (cacheStatus.isFromCache && !cacheUtils.isValid()) {
        debugLog('Cache expired, refreshing...');
        fetchJobs(true);
      }
    }, 30000);

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
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cacheStatus.isFromCache]);

  // Listen for developer mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('developerMode');
      setDeveloperMode(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      {initialLoading ? (
        <LoadingScreen type="tracker" darkMode={darkMode} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-16 transition-all duration-700 ease-in-out">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          <TrackerHeader />
          
          {developerMode && (
            <CacheStatusBar 
              cacheStatus={cacheStatus}
              onRefresh={refreshJobs}
              onClear={clearCache}
            />
          )}
          
          <StatsConfiguration 
            showStatsConfig={showStatsConfig}
            setShowStatsConfig={setShowStatsConfig}
            selectedStats={selectedStats}
            setSelectedStats={setSelectedStats}
            availableStats={availableStats}
            getStatColorClass={getStatColorClass}
          />
          <SankeyDiagramButton 
              onClick={() => setShowSankeyDiagram(true)}
              disabled={jobs.length === 0}
            />
          <StatsCards 
            selectedStats={selectedStats}
            availableStats={availableStats}
            handleDashboardCardClick={handleDashboardCardClick}
            dashboardFilter={dashboardFilter}
            getStatColorClass={getStatColorClass}
          />
          
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">

            <AddApplicationButton onOpenModal={openAddModal} loading={loading} />
          </div>
          
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
            jobStatuses={JOB_STATUSES}
            filteredJobs={filteredJobs}
            jobs={jobs}
            setDashboardFilter={setDashboardFilter}
          />
          
          <JobCards 
            filteredJobs={filteredJobs}
            jobs={jobs}
            statusColorMap={statusColorMap}
            editJob={openEditModal}
            deleteJob={deleteJob}
            setSearchTerm={setSearchTerm}
            setStatusFilter={setStatusFilter}
            setDateFilter={setDateFilter}
            setCompanyFilter={setCompanyFilter}
            setDashboardFilter={setDashboardFilter}
          />
          
          <AddJobModal 
            isOpen={isAddModalOpen}
            onClose={closeAddModal}
            currentStep={currentStep}
            onNextStep={nextStep}
            onPrevStep={prevStep}
            newJob={newJob}
            setNewJob={setNewJob}
            onSubmit={addOrUpdateJob}
            loading={loading}
            companySearchTerm={companySearchTerm}
            setCompanySearchTerm={setCompanySearchTerm}
            jobTitleSearchTerm={jobTitleSearchTerm}
            setJobTitleSearchTerm={setJobTitleSearchTerm}
            jobTitleSuggestions={jobTitleSuggestions}
            autocompleteSuggestions={autocompleteSuggestions}
            setAutocompleteSuggestions={setAutocompleteSuggestions}
            searchLoading={searchLoading}
            setSearchLoading={setSearchLoading}
            companyLogoLoading={companyLogoLoading}
            autoLogos={autoLogos}
            darkMode={darkMode}
          />
          
          <EditJobModal 
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            newJob={newJob}
            setNewJob={setNewJob}
            editingJob={editingJob}
            jobStatuses={JOB_STATUSES}
            onSubmit={addOrUpdateJob}
            loading={loading}
            darkMode={darkMode}
          />
          
          <LoadingOverlay loading={loading} editingJob={editingJob} />
          
          <SankeyDiagram 
            isOpen={showSankeyDiagram}
            onClose={() => setShowSankeyDiagram(false)}
            darkMode={darkMode}
          />
          
        </div>
      </div>
      )}
    </div>
  );
}

export default TrackerPage;
