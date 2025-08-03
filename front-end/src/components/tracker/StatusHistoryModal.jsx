import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import { FaHistory, FaClock, FaArrowRight, FaUser } from 'react-icons/fa';

function StatusHistoryModal({ isOpen, onClose, jobId, jobTitle, companyName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchStatusHistory();
    }
  }, [isOpen, jobId]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.get(`${API_BASE_URL}/status-history/${jobId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching status history:', error);
      setError('Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaHistory className="mr-3 text-blue-500" />
                Status History
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {jobTitle} at {companyName}
              </p>
            </div>
            <button
              onClick={onClose}
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
                <div key={entry.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <FaClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 ml-4 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>
                      
                      {entry.changed_by && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <FaUser className="mr-1" />
                          Changed by {entry.changed_by}
                        </div>
                      )}
                      
                      {entry.notes && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>{entry.notes}</p>
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
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusHistoryModal;
