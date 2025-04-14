import React, { useState } from "react";

const statuses = {
  applied: "bg-blue-500",
  ghosted: "bg-gray-500",
  oa: "bg-orange-500",
  interview: "bg-green-500",
};

function TrackerPage() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ company: "", status: "applied" });

  const addJob = () => {
    if (newJob.company.trim() === "") return;
    setJobs([...jobs, newJob]);
    setNewJob({ company: "", status: "applied" });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center pt-20">

      {/* Main Content */}
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Company Name"
            value={newJob.company}
            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <select
            value={newJob.status}
            onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            {Object.keys(statuses).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={addJob}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Add Job
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center col-span-full">
              No job applications yet. Add one above!
            </p>
          ) : (
            jobs.map((job, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md flex flex-col items-center"
              >
                <span className="font-medium text-lg text-gray-800 dark:text-gray-100 mb-2">
                  {job.company}
                </span>
                <span
                  className={`text-white px-3 py-1 rounded-lg text-sm font-semibold ${statuses[job.status]}`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackerPage;