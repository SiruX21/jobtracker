// Common job application statuses with predefined colors
export const JOB_STATUSES = [
  {
    id: 'applied',
    name: 'Applied',
    color: '#3B82F6', // Blue
    description: 'Application submitted'
  },
  {
    id: 'reviewing',
    name: 'Reviewing',
    color: '#F59E0B', // Amber
    description: 'Application under review'
  },
  {
    id: 'phone_screen',
    name: 'Phone Screen',
    color: '#06B6D4', // Cyan
    description: 'Initial phone screening'
  },
  {
    id: 'interview',
    name: 'Interview',
    color: '#10B981', // Emerald
    description: 'In interview process'
  },
  {
    id: 'technical',
    name: 'Technical',
    color: '#8B5CF6', // Violet
    description: 'Technical assessment or coding challenge'
  },
  {
    id: 'final_round',
    name: 'Final Round',
    color: '#EC4899', // Pink
    description: 'Final interview round'
  },
  {
    id: 'offer',
    name: 'Offer',
    color: '#22C55E', // Green
    description: 'Job offer received'
  },
  {
    id: 'accepted',
    name: 'Accepted',
    color: '#059669', // Dark Green
    description: 'Offer accepted'
  },
  {
    id: 'rejected',
    name: 'Rejected',
    color: '#EF4444', // Red
    description: 'Application rejected'
  },
  {
    id: 'withdrawn',
    name: 'Withdrawn',
    color: '#F97316', // Orange
    description: 'Application withdrawn by candidate'
  },
  {
    id: 'ghosted',
    name: 'Ghosted',
    color: '#6B7280', // Gray
    description: 'No response from employer'
  }
];

// Helper functions
export const getStatusById = (id) => {
  return JOB_STATUSES.find(status => status.id === id);
};

export const getStatusByName = (name) => {
  return JOB_STATUSES.find(status => 
    status.name.toLowerCase() === name.toLowerCase()
  );
};

export const getStatusColor = (statusName) => {
  const status = getStatusByName(statusName);
  return status ? status.color : '#6B7280'; // Default to gray if not found
};

export const getStatusColorMap = () => {
  const colorMap = {};
  JOB_STATUSES.forEach(status => {
    colorMap[status.name] = status.color;
  });
  return colorMap;
};

export const getStatusNames = () => {
  return JOB_STATUSES.map(status => status.name);
};

export default JOB_STATUSES;
