import React, { useRef, useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { fetchCompanySuggestions } from '../../services/companyService';
import { logoService } from '../../services/logoService';
import { debugError, debugLog } from '../../utils/debug';
import { API_BASE_URL } from '../../config';
import { JOB_STATUSES } from '../../data/jobStatuses';

function AddJobModal({ 
  isOpen, 
  onClose, 
  currentStep, 
  onNextStep, 
  onPrevStep, 
  newJob, 
  setNewJob, 
  onSubmit,
  loading,
  companySearchTerm,
  setCompanySearchTerm,
  jobTitleSearchTerm,
  setJobTitleSearchTerm,
  jobTitleSuggestions,
  autocompleteSuggestions,
  setAutocompleteSuggestions,
  searchLoading,
  setSearchLoading,
  companyLogoLoading,
  autoLogos,
  darkMode
}) {
  // Use static job statuses instead of prop
  const jobStatuses = JOB_STATUSES;
  const companyInputRef = useRef(null);
  const jobTitleInputRef = useRef(null);
  const statusInputRef = useRef(null);
  const [companyDropdownPosition, setCompanyDropdownPosition] = useState({});
  const [jobTitleDropdownPosition, setJobTitleDropdownPosition] = useState({});
  const [statusDropdownPosition, setStatusDropdownPosition] = useState({});
  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState(null);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Load company logo when company name changes
  useEffect(() => {
    const loadCompanyLogo = async () => {
      if (newJob.company_name && !selectedCompanyLogo) {
        console.log(`🔄 Loading logo for "${newJob.company_name}" (selectedCompanyLogo is ${selectedCompanyLogo})`);
        try {
          const logoUrl = await logoService.getCompanyLogo(newJob.company_name);
          console.log(`✅ Logo loaded for "${newJob.company_name}":`, logoUrl);
          setSelectedCompanyLogo(logoUrl);
        } catch (error) {
          debugError('Error loading company logo:', error);
          console.log(`❌ Logo loading failed for "${newJob.company_name}":`, error);
          // Set to null so fallback will be used
          setSelectedCompanyLogo(null);
        }
      }
    };

    loadCompanyLogo();
  }, [newJob.company_name, selectedCompanyLogo]);

  // Handle company search
  const handleCompanySearch = async (query) => {
    debugLog('handleCompanySearch called with query:', query);
    
    if (query.length < 2) {
      debugLog('Query too short, clearing suggestions');
      setAutocompleteSuggestions([]);
      return;
    }
    
    debugLog('Starting company search for:', query);
    setSearchLoading(true);
    try {
      const suggestions = await fetchCompanySuggestions(query);
      debugLog('Company suggestions received:', suggestions);
      setAutocompleteSuggestions(suggestions);
    } catch (error) {
      debugError('Error fetching company suggestions:', error);
      setAutocompleteSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Update dropdown positions when suggestions are shown
  useEffect(() => {
    debugLog('Position effect triggered:', {
      hasSearchTerm: !!companySearchTerm,
      searchTermLength: companySearchTerm?.length,
      hasSuggestions: !!autocompleteSuggestions?.length,
      suggestionsCount: autocompleteSuggestions?.length,
      hasInputRef: !!companyInputRef.current
    });
    
    if (companySearchTerm && autocompleteSuggestions?.length > 0 && companyInputRef.current) {
      const updatePosition = () => {
        const rect = companyInputRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 200; // Max height of dropdown
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position dropdown at bottom if there's space, otherwise at top
        const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        const position = {
          top: shouldPositionAbove 
            ? rect.top + window.scrollY - dropdownHeight
            : rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
          maxHeight: shouldPositionAbove ? spaceAbove - 10 : spaceBelow - 10
        };
        
        debugLog('Setting dropdown position:', position);
        setCompanyDropdownPosition(position);
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [companySearchTerm, autocompleteSuggestions]);

  useEffect(() => {
    if (jobTitleSearchTerm && jobTitleSuggestions?.length > 0 && jobTitleInputRef.current) {
      const updatePosition = () => {
        const rect = jobTitleInputRef.current.getBoundingClientRect();
        setJobTitleDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [jobTitleSearchTerm, jobTitleSuggestions]);

  // Update status dropdown position when dropdown is shown
  useEffect(() => {
    if (showStatusDropdown && statusInputRef.current) {
      const updatePosition = () => {
        const rect = statusInputRef.current.getBoundingClientRect();
        setStatusDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showStatusDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside company input and not on company dropdown
      if (companyInputRef.current && !companyInputRef.current.contains(event.target)) {
        const companyDropdown = document.querySelector('[data-company-dropdown]');
        if (!companyDropdown || !companyDropdown.contains(event.target)) {
          // Use a small timeout to allow click handlers to complete first
          setTimeout(() => {
            setCompanySearchTerm("");
          }, 0);
        }
      }
      
      // Check if click is outside job title input and not on job title dropdown
      if (jobTitleInputRef.current && !jobTitleInputRef.current.contains(event.target)) {
        const jobTitleDropdown = document.querySelector('[data-jobtitle-dropdown]');
        if (!jobTitleDropdown || !jobTitleDropdown.contains(event.target)) {
          // Use a small timeout to allow click handlers to complete first
          setTimeout(() => {
            setJobTitleSearchTerm("");
          }, 0);
        }
      }
      
      // Check if click is outside status input and not on status dropdown
      if (statusInputRef.current && !statusInputRef.current.contains(event.target)) {
        const statusDropdown = document.querySelector('[data-status-dropdown]');
        if (!statusDropdown || !statusDropdown.contains(event.target)) {
          // Use a small timeout to allow click handlers to complete first
          setTimeout(() => {
            setShowStatusDropdown(false);
            setStatusSearchTerm("");
          }, 0);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setCompanySearchTerm, setJobTitleSearchTerm]);

  if (!isOpen) return null;

  // Filter status suggestions based on search term
  const filteredStatuses = jobStatuses?.filter(status => 
    status.name.toLowerCase().includes((statusSearchTerm || newJob.status || "").toLowerCase())
  ) || [];

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] relative shadow-xl border border-gray-200 dark:border-gray-700 transform">
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="p-6">
              <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">Add New Application</Dialog.Title>
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={24} />
            </button>
          </div>

          {/* Step 1: Company & Position */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company & Position Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <div className="relative flex items-center space-x-3">
                  {/* Company Logo */}
                  {newJob.company_name && (
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <img 
                        src={selectedCompanyLogo || logoService.getFallbackLogo(newJob.company_name)}
                        alt={newJob.company_name}
                        className="w-full h-full object-cover rounded-lg"
                        style={{ 
                          backgroundColor: 'transparent',
                          objectFit: 'contain',
                          padding: '2px'
                        }}
                        onLoad={() => {
                          console.log(`🖼️ Logo loaded for ${newJob.company_name}:`, selectedCompanyLogo || logoService.getFallbackLogo(newJob.company_name));
                        }}
                        onError={(e) => {
                          console.log(`❌ Logo failed for ${newJob.company_name}:`, e.target.src);
                          e.target.src = logoService.getFallbackLogo(newJob.company_name);
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Company Input */}
                  <div className="flex-1 relative">
                    <input
                      ref={companyInputRef}
                      type="text"
                      value={companySearchTerm !== "" ? companySearchTerm : newJob.company_name || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCompanySearchTerm(value);
                        setNewJob({ ...newJob, company_name: value });
                        
                        // Trigger company search
                        handleCompanySearch(value);
                        
                        // Clear the selected logo when manually typing (not selecting from dropdown)
                        if (value !== newJob.company_name) {
                          setSelectedCompanyLogo(null);
                        }
                      }}
                      onFocus={() => {
                        // When focusing, if there's a selected company and no search term, start searching
                        if (newJob.company_name && companySearchTerm === "") {
                          setCompanySearchTerm(newJob.company_name);
                        }
                      }}
                      onBlur={() => {
                        // When losing focus, handle the search term properly
                        setTimeout(() => {
                          // If user typed something but dropdown is not visible, use what they typed
                          if (companySearchTerm !== "" && (!autocompleteSuggestions || autocompleteSuggestions.length === 0)) {
                            setNewJob(prev => ({ ...prev, company_name: companySearchTerm }));
                            setCompanySearchTerm("");
                          }
                        }, 200); // Longer delay to allow click events to complete
                      }}
                      placeholder="Start typing company name..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title *
                </label>
                <div className="relative">
                  <input
                    ref={jobTitleInputRef}
                    type="text"
                    value={jobTitleSearchTerm !== "" ? jobTitleSearchTerm : newJob.job_title || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setJobTitleSearchTerm(value);
                      setNewJob({ ...newJob, job_title: value });
                    }}
                    onFocus={() => {
                      // When focusing, if there's a selected job title and no search term, start searching
                      if (newJob.job_title && jobTitleSearchTerm === "") {
                        setJobTitleSearchTerm(newJob.job_title);
                      }
                    }}
                    onBlur={() => {
                      // When losing focus, handle the search term properly
                      setTimeout(() => {
                        // If user typed something but dropdown is not visible, use what they typed
                        if (jobTitleSearchTerm !== "" && (!jobTitleSuggestions || jobTitleSuggestions.length === 0)) {
                          setNewJob(prev => ({ ...prev, job_title: jobTitleSearchTerm }));
                          setJobTitleSearchTerm("");
                        }
                      }, 200); // Longer delay to allow click events to complete
                    }}
                    placeholder="Start typing job title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  
                  {/* Job Title Suggestions Dropdown - Remove from here, will be rendered as portal */}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onNextStep}
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
                  <div className="relative">
                    <input
                      ref={statusInputRef}
                      type="text"
                      value={statusSearchTerm !== "" ? statusSearchTerm : newJob.status || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStatusSearchTerm(value);
                        setNewJob({ ...newJob, status: value });
                        setShowStatusDropdown(true);
                      }}
                      onFocus={() => {
                        setShowStatusDropdown(true);
                        // When focusing, if there's a selected status and no search term, start searching
                        if (newJob.status && statusSearchTerm === "") {
                          setStatusSearchTerm(newJob.status);
                        }
                      }}
                      onBlur={() => {
                        // When losing focus, handle the search term properly
                        setTimeout(() => {
                          // If user typed something but dropdown is not visible, use what they typed
                          if (statusSearchTerm !== "" && !showStatusDropdown) {
                            setNewJob(prev => ({ ...prev, status: statusSearchTerm }));
                            setStatusSearchTerm("");
                          }
                        }, 200); // Longer delay to allow click events to complete
                      }}
                      placeholder="Enter or select status..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can type a custom status or select from existing ones
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={newJob.application_date}
                    onChange={(e) => setNewJob({ ...newJob, application_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  placeholder="Enter job location"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job URL
                </label>
                <input
                  type="url"
                  value={newJob.job_url}
                  onChange={(e) => setNewJob({ ...newJob, job_url: e.target.value })}
                  placeholder="Enter job posting URL"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={onPrevStep}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={onNextStep}
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
                  Notes
                </label>
                <textarea
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  placeholder="Add any notes about this application..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Review</h4>
                <div className="flex items-start space-x-4">
                  {/* Company Logo */}
                  {newJob.company_name && (
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <img 
                        src={selectedCompanyLogo || logoService.getFallbackLogo(newJob.company_name)}
                        alt={newJob.company_name}
                        className="w-full h-full object-cover rounded-lg"
                        style={{ 
                          backgroundColor: 'transparent',
                          objectFit: 'contain',
                          padding: '3px'
                        }}
                        onError={(e) => {
                          e.target.src = logoService.getFallbackLogo(newJob.company_name);
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Application Details */}
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 flex-1">
                    <p><strong>Company:</strong> {newJob.company_name}</p>
                    <p><strong>Position:</strong> {newJob.job_title}</p>
                    <p><strong>Status:</strong> {newJob.status}</p>
                    <p><strong>Date:</strong> {newJob.application_date}</p>
                    {newJob.location && <p><strong>Location:</strong> {newJob.location}</p>}
                    {newJob.job_url && <p><strong>URL:</strong> {newJob.job_url}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={onPrevStep}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={onSubmit}
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center transition-all duration-200"
                >
                  {loading && <FaSpinner className="animate-spin mr-2" />}
                  Add Application
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
        </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Company Suggestions Portal */}
      {(() => {
        const shouldShow = companySearchTerm && companySearchTerm.length > 0 && autocompleteSuggestions && autocompleteSuggestions.length > 0 && companyDropdownPosition.top;
        debugLog('Portal render check:', {
          companySearchTerm,
          searchTermLength: companySearchTerm?.length,
          autocompleteSuggestions,
          suggestionsLength: autocompleteSuggestions?.length,
          hasPosition: !!companyDropdownPosition.top,
          shouldShow
        });
        
        return shouldShow ? createPortal(
          <div 
            data-company-dropdown
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-y-auto shadow-2xl"
            style={{
              top: companyDropdownPosition.top,
              left: companyDropdownPosition.left,
              width: companyDropdownPosition.width,
              maxHeight: companyDropdownPosition.maxHeight || 200,
              zIndex: 10000
            }}
          >
            {autocompleteSuggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Update the job with the selected company
                  setNewJob(prev => ({ ...prev, company_name: suggestion.name }));
                  
                  // Store the selected company logo (convert relative URLs to absolute)
                  const logoUrl = suggestion.logo_url?.startsWith('/') 
                    ? `${API_BASE_URL}${suggestion.logo_url}` 
                    : suggestion.logo_url;
                  console.log(`🎯 Setting logo for ${suggestion.name}:`, logoUrl, 'from suggestion:', suggestion.logo_url);
                  setSelectedCompanyLogo(logoUrl);
                  
                  // Clear the search term to close the dropdown
                  setCompanySearchTerm("");
                  
                  // Focus the job title field after company selection
                  setTimeout(() => {
                    if (jobTitleInputRef.current) {
                      jobTitleInputRef.current.focus();
                    }
                  }, 100);
                }}
                className="flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
              >
                {/* Company Logo */}
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center overflow-hidden mr-4 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                  <img 
                    src={suggestion.logo_url?.startsWith('/') ? `${API_BASE_URL}${suggestion.logo_url}` : suggestion.logo_url} 
                    alt={suggestion.name}
                    className="w-full h-full object-cover rounded-lg"
                    style={{ 
                      backgroundColor: 'transparent',
                      objectFit: 'contain',
                      padding: '2px'
                    }}
                    onError={(e) => {
                      e.target.src = logoService.getFallbackLogo(suggestion.name);
                    }}
                  />
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {suggestion.name}
                    </h4>
                    {suggestion.source === 'brandfetch' && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  
                  {suggestion.domain && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {suggestion.domain}
                    </p>
                  )}
                  
                  {suggestion.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1 leading-tight">
                      {suggestion.description}
                    </p>
                  )}
                  
                  {suggestion.industry && (
                    <span className="inline-block text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mt-1">
                      {suggestion.industry}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body
        ) : null;
      })()}

      {/* Job Title Suggestions Portal */}
      {jobTitleSearchTerm && jobTitleSearchTerm.length > 0 && jobTitleSuggestions && jobTitleSuggestions.length > 0 && jobTitleDropdownPosition.top &&
        createPortal(
          <div 
            data-jobtitle-dropdown
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto shadow-2xl"
            style={{
              top: jobTitleDropdownPosition.top + 4,
              left: jobTitleDropdownPosition.left,
              width: jobTitleDropdownPosition.width,
              zIndex: 10001 // Higher than company dropdown
            }}
          >
            {jobTitleSuggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Update the job with the selected title
                  setNewJob(prev => ({ ...prev, job_title: suggestion }));
                  
                  // Clear the search term to close the dropdown
                  setJobTitleSearchTerm("");
                  
                  // Close the dropdown by removing focus from the input
                  if (jobTitleInputRef.current) {
                    jobTitleInputRef.current.blur();
                  }
                }}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
              >
                <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
              </div>
            ))}
          </div>,
          document.body
        )
      }

      {/* Status Suggestions Portal */}
      {showStatusDropdown && statusDropdownPosition.top && filteredStatuses.length > 0 &&
        createPortal(
          <div 
            data-status-dropdown
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto shadow-2xl"
            style={{
              top: statusDropdownPosition.top + 4,
              left: statusDropdownPosition.left,
              width: statusDropdownPosition.width,
              zIndex: 10002 // Higher than other dropdowns
            }}
          >
            {filteredStatuses.map((status, index) => (
              <div
                key={status.id || status.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Update the job with the selected status
                  setNewJob(prev => ({ ...prev, status: status.name }));
                  
                  // Clear the search term and close the dropdown
                  setStatusSearchTerm("");
                  setShowStatusDropdown(false);
                  
                  // Remove focus from the input
                  if (statusInputRef.current) {
                    statusInputRef.current.blur();
                  }
                }}
                className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
              >
                <div 
                  className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: status.color || '#6b7280' }}
                ></div>
                <span className="text-gray-900 dark:text-gray-100">{status.name}</span>
              </div>
            ))}
          </div>,
          document.body
        )
      }
    </>
  );
}

export default AddJobModal;
