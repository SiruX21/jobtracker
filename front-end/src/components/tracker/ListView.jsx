import React, { useState, useEffect, useRef } from 'react';
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
  setSortBy,
  statusColorMap = {} // Add statusColorMap prop like JobCards uses
}) => {
  // Default status colors fallback (matching JobCards)
  const getDefaultStatusColor = (status) => {
    const statusColors = {
      'applied': '#3B82F6',
      'reviewing': '#F59E0B', 
      'phone screen': '#06B6D4',
      'interview': '#10B981',
      'technical': '#8B5CF6',
      'oa': '#A855F7',
      'final round': '#EC4899',
      'offer': '#22C55E',
      'accepted': '#059669',
      'rejected': '#EF4444',
      'withdrawn': '#F97316',
      'ghosted': '#6B7280'
    };
    return statusColors[status.toLowerCase()] || '#6b7280';
  };

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

  const StatusDisplay = ({ status, isEditing, onEdit }) => {
    if (isEditing) return null;
    
    return (
      <span 
        className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: statusColorMap[status] || 
                           statusColorMap[status.toLowerCase()] ||
                           statusColorMap[status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] ||
                           getDefaultStatusColor(status)
        }}
        onClick={onEdit}
        title={`Click to edit status: ${status}`}
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

  const StatusDropdown = ({ value, onChange, onSave, onCancel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isOpen]);

    const StatusOption = ({ status, isSelected = false, onClick }) => (
      <div 
        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onClick={onClick}
      >
        <span 
          className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
          style={{
            backgroundColor: statusColorMap[status] || 
                           statusColorMap[status.toLowerCase()] ||
                           statusColorMap[status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] ||
                           getDefaultStatusColor(status)
          }}
        >
          {status}
        </span>
      </div>
    );

    return (
      <div className="flex items-center gap-1" ref={dropdownRef}>
        <div className="relative">
          {/* Custom dropdown button showing current status badge */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white dark:bg-gray-700 border border-blue-500 dark:border-blue-400 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs min-w-32 flex items-center justify-between"
          >
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm"
              style={{
                backgroundColor: statusColorMap[value] || 
                               statusColorMap[value.toLowerCase()] ||
                               statusColorMap[value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()] ||
                               getDefaultStatusColor(value)
              }}
            >
              {value}
            </span>
            <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-500 ml-2"></div>
          </button>

          {/* Custom dropdown menu */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
              {JOB_STATUSES.map(status => (
                <StatusOption
                  key={status.name}
                  status={status.name}
                  isSelected={status.name === value}
                  onClick={() => {
                    onChange(status.name);
                    onSave();
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const EditableCell = ({ job, field, value, type = 'text', className = '' }) => {
    const cellKey = `${job.id}-${field}`;
    const isEditing = editingCell === cellKey;

    if (isEditing) {
      if (field === 'status') {
        return (
          <StatusDropdown
            value={editValue}
            onChange={setEditValue}
            onSave={() => saveEdit(job, field, editValue)}
            onCancel={cancelEdit}
          />
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
        <StatusDisplay 
          status={value} 
          isEditing={isEditing}
          onEdit={() => startEdit(job.id, field, value)}
        />
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border hover:border-blue-300 dark:hover:border-blue-600 rounded px-2 py-1 transition-all duration-150 ${className}`}
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      {/* Excel-style Table with Horizontal Scroll */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          {/* Table Header - Excel Style */}
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="border-r border-gray-200 dark:border-gray-600 px-4 py-3 text-left min-w-[200px]">
                <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="w-6 h-6 mr-3"></div>
                  <SortableHeader field="company">Company</SortableHeader>
                </div>
              </th>
              <th className="border-r border-gray-200 dark:border-gray-600 px-4 py-3 text-left min-w-[180px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <SortableHeader field="title">Position</SortableHeader>
                </div>
              </th>
              <th className="border-r border-gray-200 dark:border-gray-600 px-4 py-3 text-left min-w-[130px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <SortableHeader field="status">Status</SortableHeader>
                </div>
              </th>
              <th className="border-r border-gray-200 dark:border-gray-600 px-4 py-3 text-left min-w-[120px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <SortableHeader field="date">Applied Date</SortableHeader>
                </div>
              </th>
              <th className="border-r border-gray-200 dark:border-gray-600 px-4 py-3 text-left min-w-[150px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <SortableHeader field="location">Location</SortableHeader>
                </div>
              </th>
              <th className="px-4 py-3 text-center min-w-[140px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm hover:border-l-4 hover:border-l-blue-500 dark:hover:border-l-blue-400 transition-all duration-200"
            >
              {/* Company */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-3 align-top">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-3 flex-shrink-0">
                    {getCompanyLogo(job.company_name)}
                  </div>
                  <EditableCell
                    job={job}
                    field="company_name"
                    value={job.company_name}
                    className="font-medium text-gray-900 dark:text-white"
                  />
                </div>
              </td>

              {/* Position */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-3 align-top">
                <EditableCell
                  job={job}
                  field="job_title"
                  value={job.job_title}
                  className="text-gray-900 dark:text-gray-100"
                />
              </td>

              {/* Status */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-3 align-top">
                <EditableCell
                  job={job}
                  field="status"
                  value={job.status}
                  className="text-gray-900 dark:text-gray-100"
                />
              </td>

              {/* Date Applied */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-3 align-top">
                <EditableCell
                  job={job}
                  field="application_date"
                  value={job.application_date}
                  type="date"
                  className="text-gray-900 dark:text-gray-100"
                />
              </td>

              {/* Location */}
              <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-3 align-top">
                <EditableCell
                  job={job}
                  field="location"
                  value={job.location}
                  className="text-gray-700 dark:text-gray-300"
                />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 align-top">
                <div className="flex items-center justify-center space-x-2">
                  {job.job_url && (
                    <button
                      onClick={() => window.open(job.job_url, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
                      title="View Job Posting"
                    >
                      <FaExternalLinkAlt className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => editJob(job, index)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    title="Edit Application"
                  >
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteJob(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Delete Application"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t-2 border-gray-300 dark:border-gray-600">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Showing {filteredJobs.length} of {jobs.length} applications
        </div>
      </div>
    </div>
  );
};

export default ListView;
