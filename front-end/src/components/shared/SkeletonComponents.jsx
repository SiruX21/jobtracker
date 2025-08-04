import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SkeletonThemeProvider from './SkeletonThemeProvider';

// Job Card Skeleton Component
export function JobCardSkeleton({ darkMode = false }) {
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <Skeleton height={48} width={48} className="rounded-lg" />
            <div className="flex-1">
              <Skeleton height={20} width={120} className="mb-2" />
              <Skeleton height={16} width={160} />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <Skeleton height={16} />
            <Skeleton height={16} width="75%" />
            <div className="flex gap-2 mt-4">
              <Skeleton height={32} width={80} className="rounded" />
              <Skeleton height={32} width={80} className="rounded" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonThemeProvider>
  );
}

// Table Row Skeleton Component
export function TableRowSkeleton({ columns = 5, darkMode = false }) {
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <tr className="border-t border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }, (_, i) => (
          <td key={i} className="px-6 py-4">
            <Skeleton height={16} width={Math.random() * 60 + 80} />
          </td>
        ))}
      </tr>
    </SkeletonThemeProvider>
  );
}

// Dashboard Card Skeleton Component
export function DashboardCardSkeleton({ darkMode = false }) {
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center">
          <Skeleton height={40} width={40} className="rounded-lg mr-4" />
          <div className="flex-1">
            <Skeleton height={16} width={80} className="mb-2" />
            <Skeleton height={24} width={32} />
          </div>
        </div>
      </div>
    </SkeletonThemeProvider>
  );
}

// Text Skeleton Component (for individual text elements)
export function TextSkeleton({ width = '100%', height = 16, className = '', darkMode = false }) {
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <Skeleton height={height} width={width} className={className} />
    </SkeletonThemeProvider>
  );
}

// Button Skeleton Component
export function ButtonSkeleton({ width = 120, height = 40, darkMode = false }) {
  return (
    <SkeletonThemeProvider darkMode={darkMode}>
      <Skeleton height={height} width={width} className="rounded-lg" />
    </SkeletonThemeProvider>
  );
}

export default {
  JobCardSkeleton,
  TableRowSkeleton,
  DashboardCardSkeleton,
  TextSkeleton,
  ButtonSkeleton
};
