const ROLE_SKILLS_MAP: Record<string, string[]> = {
  frontend: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Vite', 'Redux', 'Figma'],
  backend: ['Node.js', 'PostgreSQL', 'REST API', 'Docker', 'Redis', 'Express', 'Prisma', 'Python', 'AWS'],
  fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Next.js', 'Prisma'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'GitHub Actions', 'Ansible', 'Nginx'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo', 'TypeScript'],
  ios: ['Swift', 'SwiftUI', 'UIKit', 'iOS', 'Xcode', 'Objective-C', 'Core Data'],
  android: ['Kotlin', 'Android', 'Jetpack Compose', 'Java', 'Gradle', 'Firebase'],
  data: ['Python', 'SQL', 'Pandas', 'NumPy', 'Spark', 'BigQuery', 'Tableau', 'Power BI', 'Data Analysis'],
  'data engineer': ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'BigQuery', 'Snowflake', 'Kafka', 'Docker'],
  'data scientist': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'scikit-learn', 'SQL', 'Jupyter', 'Statistics'],
  ml: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'scikit-learn', 'Pandas', 'NumPy'],
  ai: ['Python', 'OpenAI API', 'LangChain', 'Prompt Engineering', 'Machine Learning', 'RAG', 'Vector Databases'],
  design: ['Figma', 'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Adobe XD'],
  'ux': ['Figma', 'UX Design', 'User Research', 'Wireframing', 'Usability Testing', 'Prototyping', 'UI Design'],
  product: ['Product Management', 'Agile', 'Scrum', 'JIRA', 'Figma', 'Data Analysis', 'Notion', 'Roadmapping'],
  security: ['Cybersecurity', 'Penetration Testing', 'OWASP', 'Network Security', 'IAM', 'OAuth', 'Linux'],
  cloud: ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
  qa: ['Testing', 'Selenium', 'Cypress', 'Jest', 'Playwright', 'Postman', 'CI/CD', 'SQL'],
  manager: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Leadership', 'Communication', 'Confluence'],
  'project manager': ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Leadership', 'Notion', 'Confluence'],
  marketing: ['SEO', 'Content Marketing', 'Social Media Marketing', 'Email Marketing', 'Google Analytics', 'Copywriting'],
  sales: ['Salesforce', 'HubSpot', 'Negotiation', 'CRM', 'Communication', 'Customer Support', 'Excel'],
  support: ['Customer Support', 'Zendesk', 'Communication', 'HubSpot', 'Problem Solving', 'Email'],
  'virtual assistant': ['Communication', 'Google Sheets', 'Email', 'Notion', 'Customer Support', 'Excel', 'Calendaring'],
  finance: ['Financial Modeling', 'Excel', 'SQL', 'Power BI', 'Tableau', 'Accounting', 'Python'],
  content: ['Copywriting', 'Content Marketing', 'SEO', 'Social Media Marketing', 'Video Editing', 'Notion'],
  video: ['Video Editing', 'Adobe Premiere', 'After Effects', 'DaVinci Resolve', 'Motion Graphics'],
  graphic: ['Figma', 'Adobe Photoshop', 'Illustrator', 'UI Design', 'Branding', 'Typography'],
  wordpress: ['WordPress', 'PHP', 'CSS', 'HTML', 'SEO', 'WooCommerce', 'JavaScript'],
  react: ['React', 'TypeScript', 'JavaScript', 'Redux', 'React Query', 'CSS', 'HTML', 'Node.js'],
  python: ['Python', 'Django', 'FastAPI', 'Flask', 'PostgreSQL', 'Docker', 'REST API'],
  java: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Maven', 'REST API', 'AWS'],
  php: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'CSS', 'REST API', 'Docker'],
  ruby: ['Ruby', 'Rails', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'JavaScript'],
  golang: ['Go', 'Gin', 'PostgreSQL', 'Docker', 'gRPC', 'REST API', 'Kubernetes'],
  blockchain: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'TypeScript', 'Hardhat'],
  embedded: ['C', 'C++', 'Embedded Systems', 'RTOS', 'Linux', 'Hardware', 'Assembly'],
  recruiter: ['Recruiting', 'LinkedIn', 'ATS', 'Communication', 'Talent Sourcing', 'HR'],
  hr: ['HR', 'Recruiting', 'People Management', 'Communication', 'Excel', 'Workday', 'HRIS'],
  operations: ['Operations', 'Project Management', 'Excel', 'Process Improvement', 'Notion', 'SQL', 'Agile'],
}

export function getSuggestedSkills(roleTitle: string, existingSkills: string[]): string[] {
  if (!roleTitle.trim()) return []
  const lower = roleTitle.toLowerCase()
  const matched = new Set<string>()

  for (const [keyword, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (lower.includes(keyword)) {
      skills.forEach((s) => matched.add(s))
    }
  }

  return Array.from(matched)
    .filter((s) => !existingSkills.includes(s))
    .slice(0, 10)
}
