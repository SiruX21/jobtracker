import React from 'react';
import { FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

function AddJobModal({ 
  isAddModalOpen, 
  closeAddModal, 
  currentStep, 
  setCurrentStep, 
  newJob, 
  setNewJob, 
  nextStep, 
  prevStep, 
  getCompanyOptions, 
  getJobTitleOptions, 
  getStatusOptions, 
  customSelectStyles, 
  CompanyOption, 
  searchLoading, 
  setCompanySearchTerm, 
  setJobTitleSearchTerm, 
  jobTitleSearchTerm, 
  createStatus, 
  fetchJobStatuses, 
  addOrUpdateJob, 
  loading 
}) {
  if (!isAddModalOpen) return null;

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
                  <CreatableSelect
                    value={getStatusOptions().find(option => option.value === newJob.status)}
                    onChange={async (selectedOption, actionMeta) => {
                      if (!selectedOption) {
                        setNewJob({ ...newJob, status: '' });
                        return;
                      }
                      
                      if (actionMeta.action === 'create-option') {
                        try {
                          const newStatus = await createStatus(selectedOption.value);
                          setNewJob({ ...newJob, status: newStatus.status_name });
                        } catch (error) {
                          console.error("Failed to create status:", error);
                          if (error.response?.status === 409) {
                            setNewJob({ ...newJob, status: selectedOption.value });
                            await fetchJobStatuses();
                          } else {
                            setNewJob({ ...newJob, status: selectedOption.value });
                          }
                        }
                      } else {
                        setNewJob({ ...newJob, status: selectedOption.value });
                      }
                    }}
                    options={getStatusOptions()}
                    placeholder="Select or create a status..."
                    isClearable
                    isSearchable
                    formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                    styles={{
                      ...customSelectStyles,
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused 
                          ? (state.data.color ? `${state.data.color}20` : base.backgroundColor)
                          : base.backgroundColor,
                        borderLeft: state.data.color ? `4px solid ${state.data.color}` : 'none',
                        paddingLeft: state.data.color ? '12px' : base.paddingLeft
                      })
                    }}
                    menuPortalTarget={document.body}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    formatOptionLabel={(option) => (
                      <div className="flex items-center">
                        {option.color && (
                          <div 
                            className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                            style={{ backgroundColor: option.color }}
                          ></div>
                        )}
                        <span>{option.label}</span>
                      </div>
                    )}
                  />
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
  );
}

export default AddJobModal;
