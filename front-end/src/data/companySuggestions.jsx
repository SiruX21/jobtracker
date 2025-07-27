const companySuggestions = [
  // FAANG+ Companies
  {
    name: "Google",
    logo: "https://logo.clearbit.com/google.com",
    website: "google.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Site Reliability Engineer"]
  },
  {
    name: "Microsoft",
    logo: "https://logo.clearbit.com/microsoft.com",
    website: "microsoft.com",
    commonTitles: ["Software Engineer", "Program Manager", "Product Manager", "Data Engineer", "Cloud Solutions Architect"]
  },
  {
    name: "Amazon",
    logo: "https://logo.clearbit.com/amazon.com",
    website: "amazon.com",
    commonTitles: ["Software Development Engineer", "Product Manager", "Data Scientist", "Solutions Architect", "Business Analyst"]
  },
  {
    name: "Meta",
    logo: "https://logo.clearbit.com/meta.com",
    website: "meta.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Research Scientist", "UX Researcher"]
  },
  {
    name: "Apple",
    logo: "https://logo.clearbit.com/apple.com",
    website: "apple.com",
    commonTitles: ["Software Engineer", "Product Manager", "Hardware Engineer", "iOS Developer", "Machine Learning Engineer"]
  },
  {
    name: "Netflix",
    logo: "https://logo.clearbit.com/netflix.com",
    website: "netflix.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Content Strategy Manager", "DevOps Engineer"]
  },
  
  // Other Tech Giants
  {
    name: "Tesla",
    logo: "https://logo.clearbit.com/tesla.com",
    website: "tesla.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Manufacturing Engineer", "Data Scientist", "Firmware Engineer"]
  },
  {
    name: "Adobe",
    logo: "https://logo.clearbit.com/adobe.com",
    website: "adobe.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Creative Technologist", "Marketing Manager"]
  },
  {
    name: "Salesforce",
    logo: "https://logo.clearbit.com/salesforce.com",
    website: "salesforce.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Technical Writer"]
  },
  {
    name: "Oracle",
    logo: "https://logo.clearbit.com/oracle.com",
    website: "oracle.com",
    commonTitles: ["Software Engineer", "Database Administrator", "Solutions Consultant", "Cloud Architect", "Product Manager"]
  },
  {
    name: "IBM",
    logo: "https://logo.clearbit.com/ibm.com",
    website: "ibm.com",
    commonTitles: ["Software Engineer", "Data Scientist", "Cloud Architect", "AI Researcher", "Consultant"]
  },
  {
    name: "Intel",
    logo: "https://logo.clearbit.com/intel.com",
    website: "intel.com",
    commonTitles: ["Hardware Engineer", "Software Engineer", "Validation Engineer", "Product Manager", "Research Scientist"]
  },
  {
    name: "NVIDIA",
    logo: "https://logo.clearbit.com/nvidia.com",
    website: "nvidia.com",
    commonTitles: ["Software Engineer", "Hardware Engineer", "AI Researcher", "Product Manager", "DevTech Engineer"]
  },
  
  // Social Media & Communication
  {
    name: "Twitter",
    logo: "https://logo.clearbit.com/twitter.com",
    website: "twitter.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Site Reliability Engineer"]
  },
  {
    name: "LinkedIn",
    logo: "https://logo.clearbit.com/linkedin.com",
    website: "linkedin.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Talent Acquisition", "Marketing Manager"]
  },
  {
    name: "Slack",
    logo: "https://logo.clearbit.com/slack.com",
    website: "slack.com",
    commonTitles: ["Software Engineer", "Product Manager", "Customer Success Manager", "UX Designer", "Developer Advocate"]
  },
  {
    name: "Discord",
    logo: "https://logo.clearbit.com/discord.com",
    website: "discord.com",
    commonTitles: ["Software Engineer", "Product Manager", "Community Manager", "Data Scientist", "Security Engineer"]
  },
  {
    name: "Zoom",
    logo: "https://logo.clearbit.com/zoom.us",
    website: "zoom.us",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "DevOps Engineer"]
  },
  
  // Ride-sharing & Travel
  {
    name: "Uber",
    logo: "https://logo.clearbit.com/uber.com",
    website: "uber.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Growth Marketing Manager"]
  },
  {
    name: "Lyft",
    logo: "https://logo.clearbit.com/lyft.com",
    website: "lyft.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Marketing Manager"]
  },
  {
    name: "Airbnb",
    logo: "https://logo.clearbit.com/airbnb.com",
    website: "airbnb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Community Manager"]
  },
  {
    name: "Booking.com",
    logo: "https://logo.clearbit.com/booking.com",
    website: "booking.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Analyst", "UX Designer", "Marketing Manager"]
  },
  
  // Entertainment & Media
  {
    name: "Spotify",
    logo: "https://logo.clearbit.com/spotify.com",
    website: "spotify.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Music Editor", "Backend Engineer"]
  },
  {
    name: "TikTok",
    logo: "https://logo.clearbit.com/tiktok.com",
    website: "tiktok.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Algorithm Engineer"]
  },
  {
    name: "YouTube",
    logo: "https://logo.clearbit.com/youtube.com",
    website: "youtube.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Manager", "Creator Success Manager"]
  },
  
  // E-commerce & Fintech
  {
    name: "Shopify",
    logo: "https://logo.clearbit.com/shopify.com",
    website: "shopify.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Merchant Success Manager", "Data Analyst"]
  },
  {
    name: "Square",
    logo: "https://logo.clearbit.com/squareup.com",
    website: "squareup.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Sales Engineer"]
  },
  {
    name: "PayPal",
    logo: "https://logo.clearbit.com/paypal.com",
    website: "paypal.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Compliance Officer"]
  },
  {
    name: "Stripe",
    logo: "https://logo.clearbit.com/stripe.com",
    website: "stripe.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Risk Operations"]
  },
  {
    name: "Coinbase",
    logo: "https://logo.clearbit.com/coinbase.com",
    website: "coinbase.com",
    commonTitles: ["Software Engineer", "Product Manager", "Compliance Officer", "Security Engineer", "Quantitative Researcher"]
  },
  
  // Gaming
  {
    name: "Activision Blizzard",
    logo: "https://logo.clearbit.com/activisionblizzard.com",
    website: "activisionblizzard.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "QA Engineer"]
  },
  {
    name: "Electronic Arts",
    logo: "https://logo.clearbit.com/ea.com",
    website: "ea.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Analyst"]
  },
  {
    name: "Epic Games",
    logo: "https://logo.clearbit.com/epicgames.com",
    website: "epicgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Technical Artist", "Product Manager", "DevOps Engineer"]
  },
  {
    name: "Riot Games",
    logo: "https://logo.clearbit.com/riotgames.com",
    website: "riotgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Scientist"]
  },
  
  // Cloud & Infrastructure
  {
    name: "Snowflake",
    logo: "https://logo.clearbit.com/snowflake.com",
    website: "snowflake.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Data Engineer", "Customer Success Engineer"]
  },
  {
    name: "MongoDB",
    logo: "https://logo.clearbit.com/mongodb.com",
    website: "mongodb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Technical Writer", "Developer Advocate"]
  },
  {
    name: "Redis",
    logo: "https://logo.clearbit.com/redis.com",
    website: "redis.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Technical Writer"]
  },
  {
    name: "Databricks",
    logo: "https://logo.clearbit.com/databricks.com",
    website: "databricks.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Solutions Architect", "Field Engineer"]
  },
  
  // Startups & Unicorns
  {
    name: "Canva",
    logo: "https://logo.clearbit.com/canva.com",
    website: "canva.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Marketing Manager", "Data Scientist"]
  },
  {
    name: "Figma",
    logo: "https://logo.clearbit.com/figma.com",
    website: "figma.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Developer Relations", "Customer Success"]
  },
  {
    name: "Notion",
    logo: "https://logo.clearbit.com/notion.so",
    website: "notion.so",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Community Manager", "Customer Success"]
  },
  {
    name: "Airtable",
    logo: "https://logo.clearbit.com/airtable.com",
    website: "airtable.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Data Analyst"]
  },
  
  // Consulting & Traditional Tech
  {
    name: "Deloitte",
    logo: "https://logo.clearbit.com/deloitte.com",
    website: "deloitte.com",
    commonTitles: ["Consultant", "Senior Consultant", "Manager", "Technology Analyst", "Business Analyst"]
  },
  {
    name: "Accenture",
    logo: "https://logo.clearbit.com/accenture.com",
    website: "accenture.com",
    commonTitles: ["Consultant", "Technology Analyst", "Software Engineer", "Solution Architect", "Project Manager"]
  },
  {
    name: "McKinsey & Company",
    logo: "https://logo.clearbit.com/mckinsey.com",
    website: "mckinsey.com",
    commonTitles: ["Business Analyst", "Associate", "Engagement Manager", "Partner", "Specialist"]
  },
  {
    name: "Boston Consulting Group",
    logo: "https://logo.clearbit.com/bcg.com",
    website: "bcg.com",
    commonTitles: ["Consultant", "Project Leader", "Principal", "Partner", "Knowledge Analyst"]
  },
  
  // Automotive
  {
    name: "Ford",
    logo: "https://logo.clearbit.com/ford.com",
    website: "ford.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Data Scientist", "Autonomous Vehicle Engineer"]
  },
  {
    name: "General Motors",
    logo: "https://logo.clearbit.com/gm.com",
    website: "gm.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Electrical Engineer", "Manufacturing Engineer"]
  },
  {
    name: "BMW",
    logo: "https://logo.clearbit.com/bmw.com",
    website: "bmw.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "UX Designer", "Innovation Manager"]
  }
];

// Helper function to get company by name
export const getCompanyByName = (name) => {
  return companySuggestions.find(company => 
    company.name.toLowerCase() === name.toLowerCase()
  );
};

// Helper function to get company logo
export const getCompanyLogo = (companyName) => {
  const company = getCompanyByName(companyName);
  if (company) return company.logo;
  
  // Generate logo URL for any company name
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `https://logo.clearbit.com/${cleanName}.com`;
};

// Helper function to get job title suggestions for a company
export const getJobTitleSuggestions = (companyName) => {
  const company = getCompanyByName(companyName);
  return company ? company.commonTitles : [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
    "Marketing Manager",
    "Business Analyst",
    "DevOps Engineer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Mobile Developer",
    "Machine Learning Engineer",
    "Security Engineer",
    "QA Engineer",
    "Technical Writer",
    "Sales Engineer",
    "Customer Success Manager",
    "Operations Manager",
    "Project Manager",
    "Scrum Master"
  ];
};

export default companySuggestions;