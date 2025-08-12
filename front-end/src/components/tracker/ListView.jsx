import React, { useState } from 'react';
import { FaExternalLinkAlt, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { getStatusColor } from '../../data/jobStatuses';
import { JOB_STATUSES } from '../../data/jobStatuses';

const ListView = ({ 
  filteredJobs, 
  jobs, 
  editJob, 
  updateJobInline,
  deleteJob, 
  setSearchTerm, 
  setStatusFilter, 
  setDateFilter, 
  setCompanyFilter,
  setDashboardFilter,
  darkMode 
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const handleStatusClick = (status) => {
    setSearchTerm("");
    setCompanyFilter("");
    setDateFilter("all");
    setStatusFilter(status.toLowerCase());
    setDashboardFilter(null);
  };

  const handleCompanyClick = (company) => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setCompanyFilter(company);
    setDashboardFilter(null);
  };

  const handleDateClick = (date) => {
    setSearchTerm("");
    setStatusFilter("all");
    setCompanyFilter("");
    setDateFilter("week");
    setDashboardFilter(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${color}`}
        onClick={() => handleStatusClick(status)}
      >
        {status}
      </span>
    );
  };

  const startEdit = (jobId, field, currentValue) => {
    setEditingCell(`${jobId}-${field}`);
    setEditValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (job, field, newValue) => {
    if (newValue === job[field] || saving) return;
    
    setSaving(true);
    try {
      // Create updated job object
      const updatedJob = { ...job, [field]: newValue };
      
      // Find the index in the original jobs array
      const jobIndex = jobs.findIndex(j => j.id === job.id);
      
      // Call the inline update function
      await updateJobInline(updatedJob, jobIndex);
      
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e, job, field) => {
    if (e.key === 'Enter') {
      saveEdit(job, field, editValue);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const getCompanyLogo = (companyName) => {
    if (!companyName) return null;
    
    // Create a simple logo URL based on company name
    const logoUrl = `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
    
    return (
      <img
        src={logoUrl}
        alt={`${companyName} logo`}
        className="w-6 h-6 rounded object-cover bg-gray-100 dark:bg-gray-700"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  };

  const EditableCell = ({ job, field, value, type = 'text', className = '' }) => {
    const cellKey = `${job.id}-${field}`;
    const isEditing = editingCell === cellKey;

    if (isEditing) {
      if (field === 'status') {
        return (
          <div className="flex items-center gap-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(job, field, editValue)}
              className="text-xs bg-white dark:bg-gray-700 border border-blue-500 dark:border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            >
              {JOB_STATUSES.map(status => (
                <option key={status.name} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => saveEdit(job, field, editValue)}
              className="text-green-500 hover:text-green-600"
            >
              <FaCheck className="w-3 h-3" />
            </button>
            <button
              onClick={cancelEdit}
              className="text-red-500 hover:text-red-600"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, job, field)}
            onBlur={() => saveEdit(job, field, editValue)}
            className="text-sm bg-white dark:bg-gray-700 border border-blue-500 dark:border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            autoFocus
          />
        </div>
      );
    }

    if (field === 'status') {
      return (
        <div onClick={() => startEdit(job.id, field, value)}>
          {getStatusBadge(value)}
        </div>
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1 transition-colors ${className}`}
        onClick={() => startEdit(job.id, field, value)}
        title="Click to edit"
      >
        {value || <span className="text-gray-400 dark:text-gray-500 italic">Click to add</span>}
      </div>
    );
  };

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {jobs.length === 0 
              ? "Get started by adding your first job application!"
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-100 dark:bg-gray-750 px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600">
        <div className="grid grid-cols-12 gap-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          <div className="col-span-3 flex items-center">
            <div className="w-6 h-6 mr-2"></div>
            Company & Position
          </div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Applied Date</div>
          <div className="col-span-2">Notes</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredJobs.map((job, index) => (
          <div key={job.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-l-4 border-transparent hover:border-blue-400">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
              {/* Company & Position */}
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-3 flex-shrink-0">
                    {getCompanyLogo(job.company_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <EditableCell
                      job={job}
                      field="company_name"
                      value={job.company_name}
                      className="font-medium text-gray-900 dark:text-white"
                    />
                    <EditableCell
                      job={job}
                      field="job_title"
                      value={job.job_title}
                      className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <EditableCell
                  job={job}
                  field="status"
                  value={job.status}
                />
              </div>

              {/* Location */}
              <div className="col-span-2">
                <EditableCell
                  job={job}
                  field="location"
                  value={job.location}
                  className="text-sm text-gray-600 dark:text-gray-300"
                />
              </div>

              {/* Applied Date */}
              <div className="col-span-2">
                <EditableCell
                  job={job}
                  field="application_date"
                  value={job.application_date}
                  type="date"
                  className="text-sm text-gray-600 dark:text-gray-300"
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <EditableCell
                  job={job}
                  field="notes"
                  value={job.notes}
                  className="text-sm text-gray-600 dark:text-gray-300 truncate"
                />
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="flex items-center justify-center space-x-2">
                  {job.job_url && (
                    <button
                      onClick={() => window.open(job.job_url, '_blank')}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                      title="View Job Posting"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => editJob(job, index)}
                    className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                    title="Edit Application"
                  >
                    <FaEdit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteJob(index)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                    title="Delete Application"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Showing {filteredJobs.length} of {jobs.length} applications
        </div>
      </div>
    </div>
  );
};

export default ListView;
