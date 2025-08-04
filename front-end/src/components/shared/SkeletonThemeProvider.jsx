import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';

function SkeletonThemeProvider({ children, darkMode = false }) {
  const themeProps = darkMode
    ? {
        baseColor: '#374151',  // gray-700
        highlightColor: '#4B5563'  // gray-600
      }
    : {
        baseColor: '#e5e7eb',  // gray-200
        highlightColor: '#f3f4f6'  // gray-100
      };

  return (
    <SkeletonTheme {...themeProps}>
      {children}
    </SkeletonTheme>
  );
}

export default SkeletonThemeProvider;
