const ROLE_SKILLS_MAP: Record<string, string[]> = {
  // ── Frontend / Web ──────────────────────────────────────────────────────────
  frontend: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Vite', 'Redux', 'Figma'],
  web: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Vite', 'REST API', 'Git'],
  react: ['React', 'TypeScript', 'JavaScript', 'Redux', 'React Query', 'CSS', 'HTML', 'Node.js'],
  vue: ['Vue.js', 'Nuxt.js', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Pinia', 'Vite'],
  angular: ['Angular', 'TypeScript', 'JavaScript', 'RxJS', 'HTML', 'CSS', 'Node.js'],
  ui: ['Figma', 'React', 'TypeScript', 'CSS', 'Tailwind CSS', 'HTML', 'JavaScript', 'UI Design', 'Accessibility'],
  'ui developer': ['React', 'TypeScript', 'CSS', 'HTML', 'Figma', 'Tailwind CSS', 'Accessibility', 'JavaScript'],

  // ── Backend / Server ────────────────────────────────────────────────────────
  backend: ['Node.js', 'PostgreSQL', 'REST API', 'Docker', 'Redis', 'Express', 'Prisma', 'Python', 'AWS'],
  server: ['Node.js', 'Python', 'REST API', 'Docker', 'PostgreSQL', 'Redis', 'AWS', 'Linux', 'Nginx'],
  api: ['REST API', 'GraphQL', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'OpenAPI', 'Authentication', 'AWS'],
  node: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'JavaScript', 'TypeScript', 'Docker', 'Redis'],
  python: ['Python', 'Django', 'FastAPI', 'Flask', 'PostgreSQL', 'Docker', 'REST API'],
  java: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Maven', 'REST API', 'AWS'],
  php: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'CSS', 'REST API', 'Docker'],
  ruby: ['Ruby', 'Rails', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'JavaScript'],
  golang: ['Go', 'Gin', 'PostgreSQL', 'Docker', 'gRPC', 'REST API', 'Kubernetes'],
  go: ['Go', 'Gin', 'PostgreSQL', 'Docker', 'gRPC', 'REST API', 'Kubernetes'],
  rust: ['Rust', 'WebAssembly', 'Systems Programming', 'Concurrency', 'Docker', 'CLI Tools'],
  scala: ['Scala', 'Spark', 'Kafka', 'Hadoop', 'Akka', 'REST API', 'PostgreSQL'],
  dotnet: ['.NET', 'C#', 'ASP.NET', 'SQL Server', 'Azure', 'REST API', 'Docker'],
  csharp: ['C#', '.NET', 'ASP.NET', 'SQL Server', 'Azure', 'REST API', 'Entity Framework'],
  laravel: ['PHP', 'Laravel', 'MySQL', 'REST API', 'JavaScript', 'Docker', 'Redis'],
  django: ['Python', 'Django', 'PostgreSQL', 'REST API', 'Docker', 'Celery', 'Redis'],

  // ── Full Stack ──────────────────────────────────────────────────────────────
  fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Next.js', 'Prisma'],
  'full stack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Next.js', 'Prisma'],
  'full-stack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Next.js', 'Prisma'],

  // ── Mobile ──────────────────────────────────────────────────────────────────
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo', 'TypeScript'],
  ios: ['Swift', 'SwiftUI', 'UIKit', 'iOS', 'Xcode', 'Objective-C', 'Core Data'],
  android: ['Kotlin', 'Android', 'Jetpack Compose', 'Java', 'Gradle', 'Firebase'],
  flutter: ['Flutter', 'Dart', 'iOS', 'Android', 'Firebase', 'REST API', 'Riverpod'],
  swift: ['Swift', 'SwiftUI', 'iOS', 'UIKit', 'Xcode', 'Core Data', 'Combine'],
  kotlin: ['Kotlin', 'Android', 'Jetpack Compose', 'Gradle', 'Firebase', 'Coroutines'],

  // ── Software / General Engineering ─────────────────────────────────────────
  software: ['Python', 'JavaScript', 'TypeScript', 'Git', 'REST API', 'Docker', 'SQL', 'Agile', 'CI/CD'],
  engineer: ['Python', 'JavaScript', 'TypeScript', 'Git', 'REST API', 'Docker', 'SQL', 'Linux', 'Problem Solving'],
  developer: ['JavaScript', 'Python', 'TypeScript', 'Git', 'REST API', 'SQL', 'HTML', 'CSS', 'Docker'],
  dev: ['JavaScript', 'TypeScript', 'Git', 'REST API', 'SQL', 'Docker', 'HTML', 'CSS', 'Linux'],
  programmer: ['Python', 'JavaScript', 'TypeScript', 'Git', 'Algorithms', 'Data Structures', 'SQL', 'REST API'],
  coding: ['Python', 'JavaScript', 'TypeScript', 'Git', 'Algorithms', 'REST API', 'SQL'],
  wordpress: ['WordPress', 'PHP', 'CSS', 'HTML', 'SEO', 'WooCommerce', 'JavaScript'],
  shopify: ['Shopify', 'Liquid', 'HTML', 'CSS', 'JavaScript', 'E-commerce', 'Shopify Apps'],
  ecommerce: ['Shopify', 'WooCommerce', 'E-commerce', 'Google Analytics', 'SEO', 'Email Marketing', 'JavaScript'],
  embedded: ['C', 'C++', 'Embedded Systems', 'RTOS', 'Linux', 'Hardware', 'Assembly'],
  firmware: ['C', 'C++', 'Embedded Systems', 'RTOS', 'Microcontrollers', 'Hardware', 'Assembly'],
  blockchain: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'TypeScript', 'Hardhat'],
  web3: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'TypeScript', 'DeFi', 'Hardhat'],
  game: ['Unity', 'Unreal Engine', 'C#', 'C++', '3D Modelling', 'Game Design', 'Physics Simulation'],

  // ── DevOps / Cloud / Infrastructure ────────────────────────────────────────
  devops: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'GitHub Actions', 'Ansible', 'Nginx'],
  cloud: ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
  infrastructure: ['Terraform', 'AWS', 'Kubernetes', 'Docker', 'Linux', 'Ansible', 'CI/CD', 'Nginx', 'Monitoring'],
  platform: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Helm'],
  sre: ['Linux', 'Kubernetes', 'Docker', 'Monitoring', 'AWS', 'Python', 'CI/CD', 'Incident Management'],
  sysadmin: ['Linux', 'Windows Server', 'Bash', 'Networking', 'Firewall', 'Active Directory', 'Docker', 'Monitoring'],
  'system admin': ['Linux', 'Windows Server', 'Bash', 'Networking', 'Active Directory', 'Docker', 'Monitoring'],
  network: ['Networking', 'TCP/IP', 'Cisco', 'Firewalls', 'VPN', 'Linux', 'Monitoring', 'DNS', 'Load Balancing'],
  architect: ['AWS', 'System Design', 'Microservices', 'Docker', 'Kubernetes', 'REST API', 'Distributed Systems', 'SQL', 'NoSQL'],

  // ── Database ────────────────────────────────────────────────────────────────
  database: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Database Design', 'Query Optimisation', 'Indexing'],
  dba: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Database Design', 'Query Optimisation', 'Backup & Recovery', 'Performance Tuning'],

  // ── Data / AI / ML ──────────────────────────────────────────────────────────
  data: ['Python', 'SQL', 'Pandas', 'NumPy', 'Spark', 'BigQuery', 'Tableau', 'Power BI', 'Data Analysis'],
  'data engineer': ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'BigQuery', 'Snowflake', 'Kafka', 'Docker'],
  'data scientist': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'scikit-learn', 'SQL', 'Jupyter', 'Statistics'],
  'data analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Google Analytics', 'Data Analysis', 'Statistics'],
  analyst: ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'Data Analysis', 'Reporting', 'Statistics', 'Google Analytics'],
  ml: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'scikit-learn', 'Pandas', 'NumPy'],
  'machine learning': ['Python', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Deep Learning', 'MLOps', 'Pandas', 'NumPy'],
  ai: ['Python', 'OpenAI API', 'LangChain', 'Prompt Engineering', 'Machine Learning', 'RAG', 'Vector Databases'],
  'artificial intelligence': ['Python', 'OpenAI API', 'LangChain', 'Machine Learning', 'RAG', 'Vector Databases', 'NLP'],
  nlp: ['Python', 'NLP', 'Transformers', 'BERT', 'LangChain', 'Hugging Face', 'TensorFlow', 'PyTorch'],
  llm: ['Python', 'LangChain', 'OpenAI API', 'RAG', 'Prompt Engineering', 'Vector Databases', 'Fine-tuning'],
  bi: ['Power BI', 'Tableau', 'SQL', 'Excel', 'DAX', 'Data Modelling', 'Reporting', 'Google Analytics'],
  'business intelligence': ['Power BI', 'Tableau', 'SQL', 'Excel', 'DAX', 'Data Modelling', 'Reporting'],

  // ── Design / UX ─────────────────────────────────────────────────────────────
  design: ['Figma', 'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Adobe XD'],
  ux: ['Figma', 'UX Design', 'User Research', 'Wireframing', 'Usability Testing', 'Prototyping', 'UI Design'],
  'ux designer': ['Figma', 'UX Design', 'User Research', 'Wireframing', 'Usability Testing', 'Prototyping'],
  'ui designer': ['Figma', 'UI Design', 'Design Systems', 'Prototyping', 'Adobe XD', 'Typography', 'Branding'],
  'product designer': ['Figma', 'UI Design', 'UX Design', 'User Research', 'Prototyping', 'Design Systems', 'Wireframing'],
  graphic: ['Figma', 'Adobe Photoshop', 'Illustrator', 'UI Design', 'Branding', 'Typography'],
  creative: ['Figma', 'Adobe Photoshop', 'Illustrator', 'Branding', 'Typography', 'Canva', 'Motion Graphics'],
  brand: ['Branding', 'Adobe Illustrator', 'Figma', 'Typography', 'Adobe Photoshop', 'Design Systems', 'Canva'],
  motion: ['After Effects', 'Premiere Pro', 'Motion Graphics', 'DaVinci Resolve', 'Cinema 4D', 'Animation'],

  // ── Product / Project Management ────────────────────────────────────────────
  product: ['Product Management', 'Agile', 'Scrum', 'JIRA', 'Figma', 'Data Analysis', 'Notion', 'Roadmapping'],
  manager: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Leadership', 'Communication', 'Confluence'],
  'project manager': ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Leadership', 'Notion', 'Confluence'],
  'product manager': ['Product Management', 'Agile', 'JIRA', 'Figma', 'Analytics', 'Roadmapping', 'Stakeholder Management'],
  scrum: ['Scrum', 'Agile', 'JIRA', 'Confluence', 'Sprint Planning', 'Retrospectives', 'Stakeholder Management'],
  agile: ['Agile', 'Scrum', 'JIRA', 'Kanban', 'Sprint Planning', 'Confluence', 'Project Management'],

  // ── Security ─────────────────────────────────────────────────────────────────
  security: ['Cybersecurity', 'Penetration Testing', 'OWASP', 'Network Security', 'IAM', 'OAuth', 'Linux'],
  cyber: ['Cybersecurity', 'Penetration Testing', 'OWASP', 'Network Security', 'SIEM', 'Incident Response', 'IAM'],
  pentesting: ['Penetration Testing', 'OWASP', 'Metasploit', 'Burp Suite', 'Linux', 'Network Security', 'Python'],

  // ── QA / Testing ────────────────────────────────────────────────────────────
  qa: ['Testing', 'Selenium', 'Cypress', 'Jest', 'Playwright', 'Postman', 'CI/CD', 'SQL'],
  test: ['Cypress', 'Jest', 'Selenium', 'Playwright', 'Postman', 'JUnit', 'QA', 'API Testing', 'CI/CD'],
  automation: ['Selenium', 'Cypress', 'Playwright', 'Python', 'CI/CD', 'Java', 'REST Assured', 'Jest'],

  // ── Marketing / Growth ──────────────────────────────────────────────────────
  marketing: ['SEO', 'Content Marketing', 'Social Media Marketing', 'Email Marketing', 'Google Analytics', 'Copywriting'],
  growth: ['Growth Hacking', 'A/B Testing', 'Google Analytics', 'SEO', 'Email Marketing', 'Conversion Optimisation'],
  seo: ['SEO', 'Google Search Console', 'Ahrefs', 'Semrush', 'Content Marketing', 'Link Building', 'Google Analytics'],
  social: ['Social Media Marketing', 'Content Creation', 'Instagram', 'LinkedIn', 'TikTok', 'Canva', 'Analytics'],
  'social media': ['Social Media Marketing', 'Content Creation', 'Instagram', 'LinkedIn', 'TikTok', 'Canva', 'Analytics'],
  digital: ['Digital Marketing', 'SEO', 'Google Ads', 'Social Media Marketing', 'Email Marketing', 'Analytics'],
  'email marketing': ['Email Marketing', 'Mailchimp', 'HubSpot', 'A/B Testing', 'Automation', 'Copywriting', 'Analytics'],
  paid: ['Google Ads', 'Facebook Ads', 'PPC', 'A/B Testing', 'Analytics', 'Conversion Optimisation', 'LinkedIn Ads'],
  ppc: ['Google Ads', 'Facebook Ads', 'PPC', 'A/B Testing', 'Analytics', 'Conversion Optimisation', 'Bid Management'],

  // ── Content / Writing ───────────────────────────────────────────────────────
  content: ['Copywriting', 'Content Marketing', 'SEO', 'Social Media Marketing', 'Video Editing', 'Notion'],
  writer: ['Copywriting', 'SEO Writing', 'Content Marketing', 'Blog Writing', 'Research', 'Proofreading', 'Notion'],
  copywriter: ['Copywriting', 'SEO Writing', 'Email Marketing', 'Content Marketing', 'Brand Messaging', 'Research'],
  'content writer': ['Copywriting', 'SEO Writing', 'Blog Writing', 'Social Media', 'Research', 'Proofreading'],
  editor: ['Editing', 'Proofreading', 'SEO Writing', 'Copywriting', 'Research', 'CMS', 'Notion'],
  journalist: ['Writing', 'Research', 'Interviewing', 'Editing', 'SEO Writing', 'CMS', 'Social Media'],
  technical: ['Technical Writing', 'API Documentation', 'Markdown', 'Git', 'Confluence', 'Docusaurus', 'Notion'],

  // ── Video / Media ───────────────────────────────────────────────────────────
  video: ['Video Editing', 'Adobe Premiere', 'After Effects', 'DaVinci Resolve', 'Motion Graphics'],
  film: ['Video Editing', 'Adobe Premiere', 'After Effects', 'DaVinci Resolve', 'Colour Grading', 'Cinematography'],
  podcast: ['Audio Editing', 'Adobe Audition', 'GarageBand', 'Audacity', 'Video Editing', 'Notion'],
  animation: ['After Effects', 'Blender', 'Cinema 4D', 'Motion Graphics', 'Illustration', 'Figma'],
  '3d': ['Blender', 'Cinema 4D', '3D Modelling', 'Maya', 'Rendering', 'Animation', 'Texturing'],

  // ── Sales / CRM ─────────────────────────────────────────────────────────────
  sales: ['Salesforce', 'HubSpot', 'Negotiation', 'CRM', 'Communication', 'Customer Support', 'Excel'],
  account: ['Account Management', 'Salesforce', 'HubSpot', 'CRM', 'Client Relations', 'Communication', 'Excel'],
  business: ['Business Development', 'Sales', 'CRM', 'Negotiation', 'Market Research', 'Excel', 'Presentations'],
  'business development': ['Business Development', 'Sales', 'CRM', 'HubSpot', 'Negotiation', 'Market Research'],
  revenue: ['Salesforce', 'HubSpot', 'Revenue Operations', 'CRM', 'Excel', 'Analytics', 'B2B Sales'],
  'customer success': ['Customer Success', 'Zendesk', 'HubSpot', 'CRM', 'Communication', 'Onboarding', 'Retention'],
  support: ['Customer Support', 'Zendesk', 'Communication', 'HubSpot', 'Problem Solving', 'Email'],

  // ── Finance / Accounting ────────────────────────────────────────────────────
  finance: ['Financial Modelling', 'Excel', 'SQL', 'Power BI', 'Tableau', 'Accounting', 'Python'],
  financial: ['Financial Modelling', 'Excel', 'Accounting', 'Financial Reporting', 'SQL', 'Power BI', 'Budgeting'],
  accountant: ['Accounting', 'Excel', 'QuickBooks', 'Xero', 'Financial Reporting', 'Tax', 'Budgeting'],
  accounting: ['Accounting', 'Excel', 'QuickBooks', 'Xero', 'Financial Reporting', 'Tax', 'Budgeting'],
  bookkeeper: ['Bookkeeping', 'QuickBooks', 'Xero', 'Excel', 'Accounts Payable', 'Accounts Receivable', 'Reconciliation'],
  auditor: ['Auditing', 'Excel', 'Accounting', 'Risk Assessment', 'Compliance', 'Financial Reporting', 'SQL'],
  'financial analyst': ['Financial Modelling', 'Excel', 'SQL', 'Power BI', 'Forecasting', 'Budgeting', 'Valuation'],

  // ── HR / Recruiting ──────────────────────────────────────────────────────────
  recruiter: ['Recruiting', 'LinkedIn', 'ATS', 'Communication', 'Talent Sourcing', 'HR'],
  hr: ['HR', 'Recruiting', 'People Management', 'Communication', 'Excel', 'Workday', 'HRIS'],
  talent: ['Talent Acquisition', 'LinkedIn', 'ATS', 'Interviewing', 'Employer Branding', 'HR', 'Communication'],
  'talent acquisition': ['Talent Acquisition', 'LinkedIn', 'ATS', 'Sourcing', 'Interviewing', 'Employer Branding'],
  'human resources': ['HR', 'Recruiting', 'People Management', 'HRIS', 'Workday', 'Compliance', 'Communication'],
  'people operations': ['HR', 'People Management', 'HRIS', 'Onboarding', 'Culture', 'Compliance', 'Communication'],

  // ── Operations / Admin ──────────────────────────────────────────────────────
  operations: ['Operations', 'Project Management', 'Excel', 'Process Improvement', 'Notion', 'SQL', 'Agile'],
  'virtual assistant': ['Communication', 'Google Sheets', 'Email', 'Notion', 'Customer Support', 'Excel', 'Calendaring'],
  va: ['Communication', 'Google Sheets', 'Email Management', 'Notion', 'Calendar Management', 'Excel', 'Research'],
  admin: ['Administration', 'Microsoft Office', 'Communication', 'Scheduling', 'Email Management', 'Data Entry', 'Excel'],
  executive: ['Leadership', 'Strategy', 'Communication', 'Project Management', 'Excel', 'Presentations', 'Stakeholder Management'],
  ceo: ['Leadership', 'Strategy', 'Communication', 'P&L Management', 'Fundraising', 'Stakeholder Management', 'Vision Setting'],
  cto: ['Technology Strategy', 'System Architecture', 'Leadership', 'Team Management', 'Agile', 'Cloud', 'Product Development'],
  cfo: ['Financial Modelling', 'Excel', 'Accounting', 'Fundraising', 'Risk Management', 'Compliance', 'Strategic Finance'],
  founder: ['Entrepreneurship', 'Product Development', 'Fundraising', 'Leadership', 'Sales', 'Communication', 'Strategy'],

  // ── Education / Training ────────────────────────────────────────────────────
  teacher: ['Teaching', 'Curriculum Development', 'Communication', 'Presentations', 'E-learning', 'Assessment'],
  trainer: ['Training', 'Facilitation', 'Curriculum Development', 'Presentations', 'Communication', 'E-learning'],
  instructor: ['Training', 'Facilitation', 'Curriculum Development', 'Communication', 'Presentations', 'LMS'],
  tutor: ['Teaching', 'Communication', 'Mentoring', 'Subject Matter Expertise', 'Curriculum Development'],

  // ── Legal / Compliance ──────────────────────────────────────────────────────
  lawyer: ['Legal Research', 'Contract Drafting', 'Compliance', 'Negotiation', 'Microsoft Word', 'Communication'],
  legal: ['Legal Research', 'Contract Review', 'Compliance', 'Negotiation', 'Communication', 'Microsoft Office'],
  compliance: ['Compliance', 'Risk Management', 'Policy Development', 'Auditing', 'Communication', 'Excel'],
  paralegal: ['Legal Research', 'Contract Review', 'Document Management', 'Communication', 'Microsoft Office'],

  // ── Healthcare ──────────────────────────────────────────────────────────────
  doctor: ['Clinical Medicine', 'Patient Care', 'EMR', 'Communication', 'Diagnosis', 'Research'],
  nurse: ['Patient Care', 'Clinical Assessment', 'EMR', 'Communication', 'Medication Administration'],
  medical: ['Clinical Knowledge', 'Patient Care', 'EMR', 'Communication', 'Healthcare Systems'],
  health: ['Healthcare', 'Patient Care', 'Research', 'Data Analysis', 'Communication', 'Medical Terminology'],
  pharmacist: ['Pharmacology', 'Drug Dispensing', 'Patient Counselling', 'Clinical Knowledge', 'Compliance'],

  // ── Supply Chain / Logistics ────────────────────────────────────────────────
  logistics: ['Supply Chain', 'Logistics', 'Excel', 'ERP', 'Inventory Management', 'Communication', 'SAP'],
  'supply chain': ['Supply Chain Management', 'Logistics', 'ERP', 'SAP', 'Inventory', 'Excel', 'Procurement'],
  procurement: ['Procurement', 'Negotiation', 'Supplier Management', 'ERP', 'Excel', 'Contract Management'],
  warehouse: ['Inventory Management', 'Warehouse Management', 'ERP', 'Excel', 'Logistics', 'Process Improvement'],
}

const GENERAL_SKILLS = [
  'Communication', 'Problem Solving', 'Microsoft Office', 'Excel',
  'Project Management', 'Leadership', 'Teamwork', 'Presentation',
  'Time Management', 'Critical Thinking', 'Research', 'Data Analysis',
]

export function getSuggestedSkills(roleTitle: string, existingSkills: string[]): string[] {
  if (!roleTitle.trim()) return []
  const lower = roleTitle.toLowerCase()
  const matched = new Set<string>()

  // First pass: exact multi-word phrase matches (highest priority)
  for (const [keyword, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (keyword.includes(' ') && lower.includes(keyword)) {
      skills.forEach((s) => matched.add(s))
    }
  }

  // Second pass: single-word keyword matches
  for (const [keyword, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (!keyword.includes(' ') && lower.includes(keyword)) {
      skills.forEach((s) => matched.add(s))
    }
  }

  const results = Array.from(matched).filter((s) => !existingSkills.includes(s))

  // If nothing matched, return general professional skills as a fallback
  if (results.length === 0) {
    return GENERAL_SKILLS.filter((s) => !existingSkills.includes(s)).slice(0, 10)
  }

  return results.slice(0, 12)
}
