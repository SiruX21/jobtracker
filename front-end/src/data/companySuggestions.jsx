const companySuggestions = [
  // FAANG+ Companies
  {
    name: "Google",
    logo: "https://img.logo.dev/google.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "google.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Site Reliability Engineer"]
  },
  {
    name: "Microsoft",
    logo: "https://img.logo.dev/microsoft.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "microsoft.com",
    commonTitles: ["Software Engineer", "Program Manager", "Product Manager", "Data Engineer", "Cloud Solutions Architect"]
  },
  {
    name: "Amazon",
    logo: "https://img.logo.dev/amazon.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "amazon.com",
    commonTitles: ["Software Development Engineer", "Product Manager", "Data Scientist", "Solutions Architect", "Business Analyst"]
  },
  {
    name: "Meta",
    logo: "https://img.logo.dev/meta.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "meta.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Research Scientist", "UX Researcher"]
  },
  {
    name: "Apple",
    logo: "https://img.logo.dev/apple.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "apple.com",
    commonTitles: ["Software Engineer", "Product Manager", "Hardware Engineer", "iOS Developer", "Machine Learning Engineer"]
  },
  {
    name: "Netflix",
    logo: "https://img.logo.dev/netflix.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "netflix.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Content Strategy Manager", "DevOps Engineer"]
  },
  
  // Other Tech Giants
  {
    name: "Tesla",
    logo: "https://img.logo.dev/tesla.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "tesla.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Manufacturing Engineer", "Data Scientist", "Firmware Engineer"]
  },
  {
    name: "Adobe",
    logo: "https://img.logo.dev/adobe.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "adobe.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Creative Technologist", "Marketing Manager"]
  },
  {
    name: "Salesforce",
    logo: "https://img.logo.dev/salesforce.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "salesforce.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Technical Writer"]
  },
  {
    name: "Oracle",
    logo: "https://img.logo.dev/oracle.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "oracle.com",
    commonTitles: ["Software Engineer", "Database Administrator", "Solutions Consultant", "Cloud Architect", "Product Manager"]
  },
  {
    name: "IBM",
    logo: "https://img.logo.dev/ibm.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "ibm.com",
    commonTitles: ["Software Engineer", "Data Scientist", "Cloud Architect", "AI Researcher", "Consultant"]
  },
  {
    name: "Intel",
    logo: "https://img.logo.dev/intel.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "intel.com",
    commonTitles: ["Hardware Engineer", "Software Engineer", "Validation Engineer", "Product Manager", "Research Scientist"]
  },
  {
    name: "NVIDIA",
    logo: "https://img.logo.dev/nvidia.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "nvidia.com",
    commonTitles: ["Software Engineer", "Hardware Engineer", "AI Researcher", "Product Manager", "DevTech Engineer"]
  },
  
  // Social Media & Communication
  {
    name: "Twitter",
    logo: "https://img.logo.dev/twitter.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "twitter.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Site Reliability Engineer"]
  },
  {
    name: "LinkedIn",
    logo: "https://img.logo.dev/linkedin.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "linkedin.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Talent Acquisition", "Marketing Manager"]
  },
  {
    name: "Slack",
    logo: "https://img.logo.dev/slack.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "slack.com",
    commonTitles: ["Software Engineer", "Product Manager", "Customer Success Manager", "UX Designer", "Developer Advocate"]
  },
  {
    name: "Discord",
    logo: "https://img.logo.dev/discord.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "discord.com",
    commonTitles: ["Software Engineer", "Product Manager", "Community Manager", "Data Scientist", "Security Engineer"]
  },
  {
    name: "Zoom",
    logo: "https://img.logo.dev/zoom.us?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "zoom.us",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "DevOps Engineer"]
  },
  
  // Ride-sharing & Travel
  {
    name: "Uber",
    logo: "https://img.logo.dev/uber.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "uber.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Growth Marketing Manager"]
  },
  {
    name: "Lyft",
    logo: "https://img.logo.dev/lyft.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "lyft.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Marketing Manager"]
  },
  {
    name: "Airbnb",
    logo: "https://img.logo.dev/airbnb.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "airbnb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Community Manager"]
  },
  {
    name: "Booking.com",
    logo: "https://img.logo.dev/booking.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "booking.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Analyst", "UX Designer", "Marketing Manager"]
  },
  
  // Entertainment & Media
  {
    name: "Spotify",
    logo: "https://img.logo.dev/spotify.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "spotify.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Music Editor", "Backend Engineer"]
  },
  {
    name: "TikTok",
    logo: "https://img.logo.dev/tiktok.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "tiktok.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Algorithm Engineer"]
  },
  {
    name: "YouTube",
    logo: "https://img.logo.dev/youtube.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "youtube.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Manager", "Creator Success Manager"]
  },
  
  // E-commerce & Fintech
  {
    name: "Shopify",
    logo: "https://img.logo.dev/shopify.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "shopify.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Merchant Success Manager", "Data Analyst"]
  },
  {
    name: "Square",
    logo: "https://img.logo.dev/squareup.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "squareup.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Sales Engineer"]
  },
  {
    name: "PayPal",
    logo: "https://img.logo.dev/paypal.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "paypal.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Compliance Officer"]
  },
  {
    name: "Stripe",
    logo: "https://img.logo.dev/stripe.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "stripe.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Risk Operations"]
  },
  {
    name: "Coinbase",
    logo: "https://img.logo.dev/coinbase.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "coinbase.com",
    commonTitles: ["Software Engineer", "Product Manager", "Compliance Officer", "Security Engineer", "Quantitative Researcher"]
  },
  
  // Gaming
  {
    name: "Activision Blizzard",
    logo: "https://img.logo.dev/activisionblizzard.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "activisionblizzard.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "QA Engineer"]
  },
  {
    name: "Electronic Arts",
    logo: "https://img.logo.dev/ea.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "ea.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Analyst"]
  },
  {
    name: "Epic Games",
    logo: "https://img.logo.dev/epicgames.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "epicgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Technical Artist", "Product Manager", "DevOps Engineer"]
  },
  {
    name: "Riot Games",
    logo: "https://img.logo.dev/riotgames.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "riotgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Scientist"]
  },
  
  // Cloud & Infrastructure
  {
    name: "Snowflake",
    logo: "https://img.logo.dev/snowflake.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "snowflake.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Data Engineer", "Customer Success Engineer"]
  },
  {
    name: "MongoDB",
    logo: "https://img.logo.dev/mongodb.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "mongodb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Technical Writer", "Developer Advocate"]
  },
  {
    name: "Redis",
    logo: "https://img.logo.dev/redis.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "redis.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Technical Writer"]
  },
  {
    name: "Databricks",
    logo: "https://img.logo.dev/databricks.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "databricks.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Solutions Architect", "Field Engineer"]
  },
  
  // Startups & Unicorns
  {
    name: "Canva",
    logo: "https://img.logo.dev/canva.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "canva.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Marketing Manager", "Data Scientist"]
  },
  {
    name: "Figma",
    logo: "https://img.logo.dev/figma.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "figma.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Developer Relations", "Customer Success"]
  },
  {
    name: "Notion",
    logo: "https://img.logo.dev/notion.so?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "notion.so",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Community Manager", "Customer Success"]
  },
  {
    name: "Airtable",
    logo: "https://img.logo.dev/airtable.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "airtable.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Data Analyst"]
  },
  
  // Consulting & Traditional Tech
  {
    name: "Deloitte",
    logo: "https://img.logo.dev/deloitte.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "deloitte.com",
    commonTitles: ["Consultant", "Senior Consultant", "Manager", "Technology Analyst", "Business Analyst"]
  },
  {
    name: "Accenture",
    logo: "https://img.logo.dev/accenture.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "accenture.com",
    commonTitles: ["Consultant", "Technology Analyst", "Software Engineer", "Solution Architect", "Project Manager"]
  },
  {
    name: "McKinsey & Company",
    logo: "https://img.logo.dev/mckinsey.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "mckinsey.com",
    commonTitles: ["Business Analyst", "Associate", "Engagement Manager", "Partner", "Specialist"]
  },
  {
    name: "Boston Consulting Group",
    logo: "https://img.logo.dev/bcg.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "bcg.com",
    commonTitles: ["Consultant", "Project Leader", "Principal", "Partner", "Knowledge Analyst"]
  },
  
  // Automotive
  {
    name: "Ford",
    logo: "https://img.logo.dev/ford.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "ford.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Data Scientist", "Autonomous Vehicle Engineer"]
  },
  {
    name: "General Motors",
    logo: "https://img.logo.dev/gm.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
    website: "gm.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Electrical Engineer", "Manufacturing Engineer"]
  },
  {
    name: "BMW",
    logo: "https://img.logo.dev/bmw.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
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

import { logoService } from '../services/logoService';

// Helper function to get company logo
export const getCompanyLogo = async (companyName) => {
  const company = getCompanyByName(companyName);
  if (company) return company.logo;
  
  // Use cached logo service for dynamic companies
  return await logoService.getCompanyLogo(companyName);
};

// Synchronous helper for immediate use (returns cached or fallback)
export const getCompanyLogoSync = (companyName) => {
  const company = getCompanyByName(companyName);
  if (company) return company.logo;
  
  // Return fallback for immediate use
  return logoService.getFallbackLogo(companyName);
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