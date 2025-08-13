import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import { FaChartLine, FaTimes, FaSpinner } from 'react-icons/fa';
import { debugLog, debugError } from '../../utils/debug';

const SankeyDiagram = ({ isOpen, onClose, darkMode }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatusFlowData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = Cookies.get("authToken");
      const response = await axios.get(`${API_BASE_URL}/analytics/status-flow`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const { transitions, initial_statuses } = response.data;
      
      // Process data for Sankey diagram
      const sankeyData = processSankeyData(transitions, initial_statuses);
      setData(sankeyData);
    } catch (error) {
      debugError('Error fetching status flow data:', error);
      setError('Failed to load status flow data');
    } finally {
      setLoading(false);
    }
  };

  const processSankeyData = (transitions, initialStatuses) => {
    debugLog("🔍 Debug: Raw data from API:");
    debugLog("Transitions:", transitions);
    debugLog("Initial statuses:", initialStatuses);
    
    // Get all unique statuses
    const allStatuses = new Set();
    
    // Add initial statuses
    initialStatuses.forEach(item => allStatuses.add(item.status));
    
    // Add transition statuses
    transitions.forEach(t => {
      allStatuses.add(t.from_status);
      allStatuses.add(t.to_status);
    });
    
    const statusList = Array.from(allStatuses);
    const statusToIndex = {};
    statusList.forEach((status, index) => {
      statusToIndex[status] = index;
    });

    debugLog("🔍 Debug: Status mapping:", statusToIndex);

    // Create source, target, and value arrays for Sankey
    const source = [];
    const target = [];
    const value = [];
    const labels = statusList;

    // Add initial status flows (virtual "Start" node)
    const startNodeIndex = statusList.length;
    labels.push("Start");
    
    let totalInitialApplications = 0;
    initialStatuses.forEach(item => {
      source.push(startNodeIndex);
      target.push(statusToIndex[item.status]);
      value.push(item.count);
      totalInitialApplications += item.count;
      debugLog(`🔍 Debug: Start -> ${item.status}: ${item.count} applications`);
    });

    // Add transitions
    let totalTransitions = 0;
    transitions.forEach(t => {
      source.push(statusToIndex[t.from_status]);
      target.push(statusToIndex[t.to_status]);
      value.push(t.count);
      totalTransitions += t.count;
      debugLog(`🔍 Debug: ${t.from_status} -> ${t.to_status}: ${t.count} transitions`);
    });

    debugLog(`🔍 Debug: Total initial applications: ${totalInitialApplications}`);
    debugLog(`🔍 Debug: Total transitions: ${totalTransitions}`);
    debugLog("🔍 Debug: Source array:", source);
    debugLog("🔍 Debug: Target array:", target);
    debugLog("🔍 Debug: Value array:", value);

    // Define colors for different statuses
    const statusColors = {
      'Applied': '#3B82F6',
      'Interview': '#10B981', 
      'Offer': '#8B5CF6',
      'Rejected': '#EF4444',
      'Reviewing': '#F59E0B',
      'OA': '#06B6D4',
      'Ghosted': '#6B7280',
      'Start': '#1F2937'
    };

    const nodeColors = labels.map(label => statusColors[label] || '#9CA3AF');

    return {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 30,
        line: {
          color: darkMode ? "#374151" : "#E5E7EB",
          width: 2
        },
        label: labels,
        color: nodeColors,
        font: {
          size: 12,
          color: darkMode ? "#F3F4F6" : "#1F2937"
        }
      },
      link: {
        source: source,
        target: target,
        value: value,
        color: source.map(() => 'rgba(100, 116, 139, 0.3)') // Semi-transparent links
      }
    };
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatusFlowData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FaChartLine className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold">Job Application Status Flow</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <FaSpinner className="animate-spin text-blue-500" size={24} />
                <span>Loading status flow data...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchStatusFlowData}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {data && !loading && !error && (
            <div>
              <div className="mb-4">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  This diagram shows how your job applications flow between different statuses. 
                  The thickness of each connection represents the number of applications that moved between those statuses.
                  The "Start" node represents initial application submissions.
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Hover over connections to see exact numbers. Use the toolbar to download the chart as an image.
                </div>
              </div>
              
              <div className="h-96 w-full">
                <Plot
                  data={[data]}
                  layout={{
                    title: {
                      text: '',
                      font: { size: 16 }
                    },
                    font: {
                      size: 12,
                      color: darkMode ? '#F3F4F6' : '#1F2937'
                    },
                    paper_bgcolor: darkMode ? '#1F2937' : '#FFFFFF',
                    plot_bgcolor: darkMode ? '#1F2937' : '#FFFFFF',
                    margin: { t: 20, l: 20, r: 20, b: 20 },
                    autosize: true
                  }}
                  config={{
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: [
                      'pan2d',
                      'select2d',
                      'lasso2d',
                      'autoScale2d',
                      'hoverClosestCartesian',
                      'hoverCompareCartesian',
                      'toggleSpikelines'
                    ],
                    toImageButtonOptions: {
                      format: 'png',
                      filename: 'job-status-flow',
                      height: 400,
                      width: 800,
                      scale: 1
                    }
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.node.label.map((label, index) => (
                  label !== 'Start' && (
                    <div key={label} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: data.node.color[index] }}
                      ></div>
                      <span className="text-sm">{label}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SankeyDiagram;
