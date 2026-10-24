export const CATEGORIES = [
  "AI Agents & LLMs", "Lead Generation & Sales", "Marketing & Social Media",
  "Content Creation", "E-commerce", "Customer Support", "Email & Communication",
  "Data & Spreadsheets", "DevOps & IT Operations", "Finance & Accounting",
  "HR & Recruiting", "Productivity & Personal", "Project Management",
  "Documents & PDF", "Real Estate", "Education", "Engineering", "Design",
  "Product", "Healthcare", "Legal", "Travel & Hospitality", "Crypto & Web3",
  "Monitoring & Alerts", "Web Scraping & Research", "Forms & Surveys",
  "Cloud Storage & Files", "Developer Tools & APIs", "Building Blocks", "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
