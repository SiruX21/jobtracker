import React, { useState } from 'react';
import { FaExternalLinkAlt, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaTimes, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
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
  darkMode,
  sortBy,
  setSortBy 
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

  const handleSort = (field) => {
    if (sortBy === `${field}_asc`) {
      setSortBy(`${field}_desc`);
    } else if (sortBy === `${field}_desc`) {
      setSortBy("date_desc"); // Reset to default
    } else {
      setSortBy(`${field}_asc`);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy === `${field}_asc`) return <FaSortUp className="ml-1 w-3 h-3" />;
    if (sortBy === `${field}_desc`) return <FaSortDown className="ml-1 w-3 h-3" />;
    return <FaSort className="ml-1 w-3 h-3 opacity-40" />;
  };

  const SortableHeader = ({ field, children, className = "" }) => (
    <div 
      className={`flex items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      {children}
      {getSortIcon(field)}
    </div>
  );

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
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 overflow-hidden">
      {/* Excel-style Table */}
      <table className="w-full border-collapse">
        {/* Table Header - Excel Style */}
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-400 dark:border-gray-500">
            <th className="border-r border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
              <div className="flex items-center text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <div className="w-6 h-6 mr-2"></div>
                <SortableHeader field="company">Company</SortableHeader>
              </div>
            </th>
            <th className="border-r border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <SortableHeader field="title">Position</SortableHeader>
              </div>
            </th>
            <th className="border-r border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <SortableHeader field="status">Status</SortableHeader>
              </div>
            </th>
            <th className="border-r border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <SortableHeader field="location">Location</SortableHeader>
              </div>
            </th>
            <th className="border-r border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <SortableHeader field="date">Applied Date</SortableHeader>
              </div>
            </th>
            <th className="px-3 py-2 text-center">
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Actions
              </div>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {filteredJobs.map((job, index) => (
            <tr 
              key={job.id || index} 
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
            >
              {/* Company */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 align-top">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    {getCompanyLogo(job.company_name)}
                  </div>
                  <EditableCell
                    job={job}
                    field="company_name"
                    value={job.company_name}
                    className="font-medium text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </td>

              {/* Position */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 align-top">
                <EditableCell
                  job={job}
                  field="job_title"
                  value={job.job_title}
                  className="text-sm text-gray-900 dark:text-gray-100"
                />
              </td>

              {/* Status */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 align-top">
                <EditableCell
                  job={job}
                  field="status"
                  value={job.status}
                />
              </td>

              {/* Location */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 align-top">
                <EditableCell
                  job={job}
                  field="location"
                  value={job.location}
                  className="text-sm text-gray-700 dark:text-gray-300"
                />
              </td>

              {/* Applied Date */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 align-top">
                <EditableCell
                  job={job}
                  field="application_date"
                  value={job.application_date}
                  type="date"
                  className="text-sm text-gray-700 dark:text-gray-300"
                />
              </td>

              {/* Actions */}
              <td className="px-3 py-2 align-top">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-gray-750 px-4 py-2 border-t-2 border-gray-300 dark:border-gray-600">
        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Showing {filteredJobs.length} of {jobs.length} applications
        </div>
      </div>
    </div>
  );
};

export default ListView;
