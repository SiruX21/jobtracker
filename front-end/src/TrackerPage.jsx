import React, { useState } from "react";
import companySuggestions from "./data/companySuggestions"; // Import the suggestions

const statuses = {
  applied: "bg-blue-500",
  ghosted: "bg-gray-500",
  OA: "bg-orange-500",
  interview: "bg-green-500",
};

function TrackerPage() {
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ company: "", status: "applied", date: getCurrentDate() });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addOrUpdateJob = () => {
    if (newJob.company.trim() === "" || newJob.date.trim() === "") return;

    if (editingIndex !== null) {
      const updatedJobs = [...jobs];
      updatedJobs[editingIndex] = newJob;
      setJobs(updatedJobs);
      setEditingIndex(null);
    } else {
      setJobs([...jobs, newJob]);
    }

    setNewJob({ company: "", status: "applied", date: getCurrentDate() });
    setIsModalOpen(false); // Close the modal after saving
  };

  const editJob = (index) => {
    setNewJob(jobs[index]);
    setEditingIndex(index);
    setIsModalOpen(true); // Open the modal
  };

  const deleteJob = (index) => {
    setJobs(jobs.filter((_, i) => i !== index));
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
            list="company-suggestions"
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <datalist id="company-suggestions">
            {companySuggestions.map((company, index) => (
              <option key={index} value={company} />
            ))}
          </datalist>
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
          <input
            type="date"
            value={newJob.date}
            onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={addOrUpdateJob}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {editingIndex !== null ? "Update Job" : "Add Job"}
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
                <span className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                  Applied on: {job.date}
                </span>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => editJob(index)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteJob(index)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for Editing Job */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 ${
            isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 transform transition-transform duration-300 ${
              isModalOpen ? "scale-100" : "scale-95"
            }`}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Edit Job Application
            </h2>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Company Name"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
              <input
                type="date"
                value={newJob.date}
                onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addOrUpdateJob}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackerPage;