import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import { FaHistory, FaClock, FaArrowRight, FaUser } from 'react-icons/fa';

function StatusHistoryModal({ isOpen, onClose, jobId, jobTitle, companyName, darkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      console.log('Fetching status history for job ID:', jobId);
      fetchStatusHistory();
    } else if (isOpen && !jobId) {
      console.log('StatusHistoryModal opened but no jobId provided');
      setError('Job ID is missing. Cannot load status history.');
    }
  }, [isOpen, jobId]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = Cookies.get("authToken");
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      console.log('Making API call to:', `${API_BASE_URL}/status-history/${jobId}`);
      const response = await axios.get(`${API_BASE_URL}/status-history/${jobId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Status history response:', response.data);
      
      // Sort history by date (most recent first)
      const sortedHistory = response.data.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
      setHistory(sortedHistory);
    } catch (error) {
      console.error('Error fetching status history:', error);
      if (error.response?.status === 404) {
        setError('Job not found or access denied');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to load status history. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleClose = () => {
    setHistory([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
            <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700 transform shadow-xl">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaHistory className="mr-3 text-blue-500" />
                  Status History
                </Dialog.Title>
                <Dialog.Description className="text-gray-600 dark:text-gray-400 mt-1">
                  {jobTitle} at {companyName}
                </Dialog.Description>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading history...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button 
                onClick={fetchStatusHistory}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8">
              <FaHistory className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No status history available</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id || `${entry.changed_at}-${index}`} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <FaClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {entry.from_status && (
                            <>
                              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                {entry.from_status}
                              </span>
                              <FaArrowRight className="text-gray-400 text-xs" />
                            </>
                          )}
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                            {entry.to_status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>
                      
                      {entry.changed_by && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <FaUser className="mr-1" />
                          Changed by {entry.changed_by}
                        </div>
                      )}
                      
                      {entry.notes && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p className="whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
        </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default StatusHistoryModal;
