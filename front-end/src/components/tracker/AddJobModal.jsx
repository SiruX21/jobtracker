import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

function AddJobModal({ 
  isOpen, 
  onClose, 
  currentStep, 
  onNextStep, 
  onPrevStep, 
  newJob, 
  setNewJob, 
  jobStatuses,
  onSubmit,
  loading,
  companySearchTerm,
  setCompanySearchTerm,
  jobTitleSearchTerm,
  setJobTitleSearchTerm,
  jobTitleSuggestions,
  autocompleteSuggestions,
  searchLoading,
  companyLogoLoading,
  autoLogos,
  darkMode
}) {
  if (!isOpen) return null;

  return (
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
                <div className="relative">
                  <input
                    type="text"
                    value={companySearchTerm || newJob.company_name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCompanySearchTerm(value);
                      setNewJob({ ...newJob, company_name: value });
                    }}
                    placeholder="Start typing company name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  
                  {/* Company Suggestions Dropdown */}
                  {companySearchTerm && autocompleteSuggestions && autocompleteSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setNewJob({ ...newJob, company_name: suggestion.name });
                            setCompanySearchTerm("");
                          }}
                          className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                        >
                          <div className="w-8 h-8 bg-white rounded-md shadow-sm flex items-center justify-center overflow-hidden mr-3">
                            <img 
                              src={suggestion.logo_url} 
                              alt={suggestion.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name)}&background=3b82f6&color=ffffff&size=24&bold=true`;
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-900 dark:text-gray-100 font-medium">{suggestion.name}</div>
                            {suggestion.industry && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.industry}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={jobTitleSearchTerm || newJob.job_title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setJobTitleSearchTerm(value);
                      setNewJob({ ...newJob, job_title: value });
                    }}
                    placeholder="Start typing job title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  
                  {/* Job Title Suggestions Dropdown */}
                  {jobTitleSearchTerm && jobTitleSuggestions && jobTitleSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {jobTitleSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setNewJob({ ...newJob, job_title: suggestion });
                            setJobTitleSearchTerm("");
                          }}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                        >
                          <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <select
                    value={newJob.status}
                    onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {jobStatuses?.map((status) => (
                      <option key={status.id} value={status.status_name}>
                        {status.status_name}
                      </option>
                    ))}
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
                    <div className="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(newJob.company_name)}&background=3b82f6&color=ffffff&size=48&bold=true`}
                        alt={newJob.company_name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newJob.company_name)}&background=6b7280&color=ffffff&size=48&bold=true`;
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
    </div>
  );
}

export default AddJobModal;
