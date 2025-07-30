import React from 'react';

function TrackerHeader() {
  return (
    <div className="text-center mb-8 animate-fadeIn">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Job Application Tracker
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Manage and track your job applications in one place
      </p>
    </div>
  );
}

export default TrackerHeader;
