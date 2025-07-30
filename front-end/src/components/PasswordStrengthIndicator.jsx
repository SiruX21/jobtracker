import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const PasswordStrengthIndicator = ({ 
  password, 
  onValidationChange = () => {}, 
  showRequirements = true,
  className = ''
}) => {
  const [validation, setValidation] = useState({
    valid: false,
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    },
    errors: []
  });

  const [isValidating, setIsValidating] = useState(false);

  // Local validation for immediate feedback
  const validatePasswordLocally = (pwd) => {
    if (!pwd) {
      return {
        valid: false,
        score: 0,
        feedback: '',
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false
        },
        errors: []
      };
    }

    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    let feedback = '';

    if (score <= 2) {
      feedback = 'Weak password';
    } else if (score <= 3) {
      feedback = 'Fair password';
    } else if (score <= 4) {
      feedback = 'Good password';
    } else {
      feedback = 'Strong password';
    }

    const minRequirementsMet = (
      requirements.length && 
      requirements.lowercase && 
      (requirements.uppercase || requirements.number || requirements.special)
    );

    return {
      valid: minRequirementsMet,
      score,
      feedback,
      requirements,
      errors: []
    };
  };

  // Backend validation for final verification
  const validatePasswordOnBackend = async (pwd) => {
    if (!pwd) return;
    
    setIsValidating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/validate-password`, {
        password: pwd
      });
      
      if (response.data.details) {
        setValidation(response.data.details);
        onValidationChange(response.data.details);
      }
    } catch (error) {
      console.error('Password validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    // Immediate local validation for UX
    const localValidation = validatePasswordLocally(password);
    setValidation(localValidation);
    onValidationChange(localValidation);

    // Debounced backend validation
    const timeoutId = setTimeout(() => {
      if (password) {
        validatePasswordOnBackend(password);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  if (!password) {
    return null;
  }

  const getColorClasses = () => {
    if (validation.score <= 2) return 'bg-red-500 text-red-600 dark:text-red-400';
    if (validation.score <= 3) return 'bg-yellow-500 text-yellow-600 dark:text-yellow-400';
    if (validation.score <= 4) return 'bg-blue-500 text-blue-600 dark:text-blue-400';
    return 'bg-green-500 text-green-600 dark:text-green-400';
  };

  const getTextColorClasses = () => {
    if (validation.score <= 2) return 'text-red-600 dark:text-red-400';
    if (validation.score <= 3) return 'text-yellow-600 dark:text-yellow-400';
    if (validation.score <= 4) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getColorClasses()}`}
            style={{ width: `${(validation.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${getTextColorClasses()}`}>
          {validation.feedback}
          {isValidating && (
            <span className="ml-1 inline-block animate-spin">⟳</span>
          )}
        </span>
      </div>
      
      {showRequirements && validation.requirements && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(validation.requirements).map(([req, met]) => (
            <div 
              key={req} 
              className={`flex items-center transition-colors duration-200 ${
                met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="mr-1">{met ? '✓' : '○'}</span>
              {req === 'length' && '8+ characters'}
              {req === 'uppercase' && 'Uppercase'}
              {req === 'lowercase' && 'Lowercase'}
              {req === 'number' && 'Number'}
              {req === 'special' && 'Special char'}
            </div>
          ))}
        </div>
      )}
      
      {validation.errors && validation.errors.length > 0 && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          {validation.errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
