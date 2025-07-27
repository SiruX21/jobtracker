import { API_BASE_URL } from '../config';

// Helper function to generate logo URL using internal API (no token exposure)
const getLogoUrl = (domain) => {
  // Extract company name from domain (remove .com, etc.)
  const companyName = domain.replace(/\.(com|org|net|io|co)$/i, '');
  return `${API_BASE_URL}/api/logos/company/${encodeURIComponent(companyName)}`;
};

const companySuggestions = [
  // FAANG+ Companies
  {
    name: "Google",
    logo: getLogoUrl("google.com"),
    website: "google.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Site Reliability Engineer"]
  },
  {
    name: "Microsoft",
    logo: getLogoUrl("microsoft.com"),
    website: "microsoft.com",
    commonTitles: ["Software Engineer", "Program Manager", "Product Manager", "Data Engineer", "Cloud Solutions Architect"]
  },
  {
    name: "Amazon",
    logo: getLogoUrl("amazon.com"),
    website: "amazon.com",
    commonTitles: ["Software Development Engineer", "Product Manager", "Data Scientist", "Solutions Architect", "Business Analyst"]
  },
  {
    name: "Meta",
    logo: getLogoUrl("meta.com"),
    website: "meta.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Research Scientist", "UX Researcher"]
  },
  {
    name: "Apple",
    logo: getLogoUrl("apple.com"),
    website: "apple.com",
    commonTitles: ["Software Engineer", "Product Manager", "Hardware Engineer", "iOS Developer", "Machine Learning Engineer"]
  },
  {
    name: "Netflix",
    logo: getLogoUrl("netflix.com"),
    website: "netflix.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Content Strategy Manager", "DevOps Engineer"]
  },
  
  // Other Tech Giants
  {
    name: "Tesla",
    logo: getLogoUrl("tesla.com"),
    website: "tesla.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Manufacturing Engineer", "Data Scientist", "Firmware Engineer"]
  },
  {
    name: "Adobe",
    logo: getLogoUrl("adobe.com"),
    website: "adobe.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Creative Technologist", "Marketing Manager"]
  },
  {
    name: "Salesforce",
    logo: getLogoUrl("salesforce.com"),
    website: "salesforce.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Technical Writer"]
  },
  {
    name: "Oracle",
    logo: getLogoUrl("oracle.com"),
    website: "oracle.com",
    commonTitles: ["Software Engineer", "Database Administrator", "Solutions Consultant", "Cloud Architect", "Product Manager"]
  },
  {
    name: "IBM",
    logo: getLogoUrl("ibm.com"),
    website: "ibm.com",
    commonTitles: ["Software Engineer", "Data Scientist", "Cloud Architect", "AI Researcher", "Consultant"]
  },
  {
    name: "Intel",
    logo: getLogoUrl("intel.com"),
    website: "intel.com",
    commonTitles: ["Hardware Engineer", "Software Engineer", "Validation Engineer", "Product Manager", "Research Scientist"]
  },
  {
    name: "NVIDIA",
    logo: getLogoUrl("nvidia.com"),
    website: "nvidia.com",
    commonTitles: ["Software Engineer", "Hardware Engineer", "AI Researcher", "Product Manager", "DevTech Engineer"]
  },
  
  // Social Media & Communication
  {
    name: "Twitter",
    logo: getLogoUrl("twitter.com"),
    website: "twitter.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Site Reliability Engineer"]
  },
  {
    name: "LinkedIn",
    logo: getLogoUrl("linkedin.com"),
    website: "linkedin.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Talent Acquisition", "Marketing Manager"]
  },
  {
    name: "Slack",
    logo: getLogoUrl("slack.com"),
    website: "slack.com",
    commonTitles: ["Software Engineer", "Product Manager", "Customer Success Manager", "UX Designer", "Developer Advocate"]
  },
  {
    name: "Discord",
    logo: getLogoUrl("discord.com"),
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
    logo: getLogoUrl("uber.com"),
    website: "uber.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Growth Marketing Manager"]
  },
  {
    name: "Lyft",
    logo: getLogoUrl("lyft.com"),
    website: "lyft.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Operations Manager", "Marketing Manager"]
  },
  {
    name: "Airbnb",
    logo: getLogoUrl("airbnb.com"),
    website: "airbnb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Community Manager"]
  },
  {
    name: "Booking.com",
    logo: getLogoUrl("booking.com"),
    website: "booking.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Analyst", "UX Designer", "Marketing Manager"]
  },
  
  // Entertainment & Media
  {
    name: "Spotify",
    logo: getLogoUrl("spotify.com"),
    website: "spotify.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Music Editor", "Backend Engineer"]
  },
  {
    name: "TikTok",
    logo: getLogoUrl("tiktok.com"),
    website: "tiktok.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Moderator", "Algorithm Engineer"]
  },
  {
    name: "YouTube",
    logo: getLogoUrl("youtube.com"),
    website: "youtube.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Content Manager", "Creator Success Manager"]
  },
  
  // E-commerce & Fintech
  {
    name: "Shopify",
    logo: getLogoUrl("shopify.com"),
    website: "shopify.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Merchant Success Manager", "Data Analyst"]
  },
  {
    name: "Square",
    logo: getLogoUrl("squareup.com"),
    website: "squareup.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Sales Engineer"]
  },
  {
    name: "PayPal",
    logo: getLogoUrl("paypal.com"),
    website: "paypal.com",
    commonTitles: ["Software Engineer", "Product Manager", "Data Scientist", "Risk Analyst", "Compliance Officer"]
  },
  {
    name: "Stripe",
    logo: getLogoUrl("stripe.com"),
    website: "stripe.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Risk Operations"]
  },
  {
    name: "Coinbase",
    logo: getLogoUrl("coinbase.com"),
    website: "coinbase.com",
    commonTitles: ["Software Engineer", "Product Manager", "Compliance Officer", "Security Engineer", "Quantitative Researcher"]
  },
  
  // Gaming
  {
    name: "Activision Blizzard",
    logo: getLogoUrl("activisionblizzard.com"),
    website: "activisionblizzard.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "QA Engineer"]
  },
  {
    name: "Electronic Arts",
    logo: getLogoUrl("ea.com"),
    website: "ea.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Analyst"]
  },
  {
    name: "Epic Games",
    logo: getLogoUrl("epicgames.com"),
    website: "epicgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Technical Artist", "Product Manager", "DevOps Engineer"]
  },
  {
    name: "Riot Games",
    logo: getLogoUrl("riotgames.com"),
    website: "riotgames.com",
    commonTitles: ["Game Developer", "Software Engineer", "Game Designer", "Product Manager", "Data Scientist"]
  },
  
  // Cloud & Infrastructure
  {
    name: "Snowflake",
    logo: getLogoUrl("snowflake.com"),
    website: "snowflake.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Data Engineer", "Customer Success Engineer"]
  },
  {
    name: "MongoDB",
    logo: getLogoUrl("mongodb.com"),
    website: "mongodb.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Technical Writer", "Developer Advocate"]
  },
  {
    name: "Redis",
    logo: getLogoUrl("redis.com"),
    website: "redis.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Developer Relations", "Technical Writer"]
  },
  {
    name: "Databricks",
    logo: getLogoUrl("databricks.com"),
    website: "databricks.com",
    commonTitles: ["Software Engineer", "Data Engineer", "Product Manager", "Solutions Architect", "Field Engineer"]
  },
  
  // Startups & Unicorns
  {
    name: "Canva",
    logo: getLogoUrl("canva.com"),
    website: "canva.com",
    commonTitles: ["Software Engineer", "Product Manager", "UX Designer", "Marketing Manager", "Data Scientist"]
  },
  {
    name: "Figma",
    logo: getLogoUrl("figma.com"),
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
    logo: getLogoUrl("airtable.com"),
    website: "airtable.com",
    commonTitles: ["Software Engineer", "Product Manager", "Solutions Engineer", "Customer Success Manager", "Data Analyst"]
  },
  
  // Consulting & Traditional Tech
  {
    name: "Deloitte",
    logo: getLogoUrl("deloitte.com"),
    website: "deloitte.com",
    commonTitles: ["Consultant", "Senior Consultant", "Manager", "Technology Analyst", "Business Analyst"]
  },
  {
    name: "Accenture",
    logo: getLogoUrl("accenture.com"),
    website: "accenture.com",
    commonTitles: ["Consultant", "Technology Analyst", "Software Engineer", "Solution Architect", "Project Manager"]
  },
  {
    name: "McKinsey & Company",
    logo: getLogoUrl("mckinsey.com"),
    website: "mckinsey.com",
    commonTitles: ["Business Analyst", "Associate", "Engagement Manager", "Partner", "Specialist"]
  },
  {
    name: "Boston Consulting Group",
    logo: getLogoUrl("bcg.com"),
    website: "bcg.com",
    commonTitles: ["Consultant", "Project Leader", "Principal", "Partner", "Knowledge Analyst"]
  },
  
  // Automotive
  {
    name: "Ford",
    logo: getLogoUrl("ford.com"),
    website: "ford.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Data Scientist", "Autonomous Vehicle Engineer"]
  },
  {
    name: "General Motors",
    logo: getLogoUrl("gm.com"),
    website: "gm.com",
    commonTitles: ["Software Engineer", "Mechanical Engineer", "Product Manager", "Electrical Engineer", "Manufacturing Engineer"]
  },
  {
    name: "BMW",
    logo: getLogoUrl("bmw.com"),
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
  
  // Return fallback for immediate use with environment variable
  const token = import.meta.env.VITE_LOGO_DEV_API_TOKEN || 'pk_X-1ZO13GSgeOoUrIuJ6GMQ';
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9.]/g, '');
  const domain = cleanName.includes('.') ? cleanName : `${cleanName}.com`;
  return `https://img.logo.dev/${domain}?token=${token}`;
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