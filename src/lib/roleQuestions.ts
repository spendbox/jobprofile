const UNIVERSAL_QUESTIONS = [
  'Do you have any questions for the organization?',
  'What does your ideal working environment look like?',
  'How do you prioritize tasks when managing multiple deadlines?',
]

const ROLE_QUESTIONS_MAP: Record<string, string[]> = {
  frontend: [
    'Walk us through your process for optimizing a slow-loading web page.',
    'How do you approach cross-browser and cross-device compatibility issues?',
    'Describe a challenging UI component you built and how you solved it.',
    'How do you stay current with the fast-changing frontend ecosystem?',
    'Tell us about a time you significantly improved a user experience — what was the outcome?',
    'How do you balance pixel-perfect design implementation with development speed?',
    'What\'s your approach to writing maintainable, scalable CSS?',
    'How have you used performance profiling tools to debug a frontend issue?',
  ],
  backend: [
    'Describe how you would design a high-traffic API from scratch.',
    'How do you approach database schema design for a complex feature?',
    'Walk us through how you would debug a slow database query in production.',
    'How do you handle authentication and authorization in your backend services?',
    'Tell us about a system you built that had to scale significantly — what challenges arose?',
    'How do you approach API versioning and backwards compatibility?',
    'What strategies do you use for error handling and resilience in distributed systems?',
    'Describe your approach to writing and maintaining integration tests.',
  ],
  fullstack: [
    'How do you decide where to put logic — client side vs. server side?',
    'Describe a full-stack feature you built end-to-end. What was most challenging?',
    'How do you approach state management across a complex single-page application?',
    'Walk us through your deployment and CI/CD workflow for a recent project.',
    'How do you handle API errors gracefully in both the frontend and backend?',
    'Tell us about a time you had to refactor a significant part of a codebase. What was your approach?',
  ],
  devops: [
    'Describe your experience designing and maintaining CI/CD pipelines.',
    'How do you approach infrastructure as code — what tools and practices do you follow?',
    'Tell us about an incident you managed in production. How did you resolve it?',
    'How do you handle secrets management and security in cloud environments?',
    'What monitoring and alerting strategies do you put in place for production services?',
    'How do you approach reducing cloud costs without sacrificing reliability?',
    'Describe your experience with container orchestration and how you\'ve used it in practice.',
  ],
  mobile: [
    'How do you approach performance optimization on mobile devices?',
    'Describe how you would handle offline functionality in a mobile app.',
    'How do you manage state across complex mobile screens and navigation flows?',
    'Tell us about an app you shipped — what was the hardest technical challenge?',
    'How do you approach writing UI tests for mobile applications?',
    'How do you handle OS update compatibility and deprecation in your mobile projects?',
  ],
  data: [
    'Describe a complex data pipeline you built — what were the main design decisions?',
    'How do you ensure data quality and integrity in your pipelines?',
    'Walk us through how you approach exploratory data analysis on a new dataset.',
    'How do you communicate data insights to non-technical stakeholders?',
    'Tell us about a time you identified a significant business insight from data.',
    'What tools and practices do you use to make your SQL queries performant at scale?',
  ],
  ml: [
    'Walk us through your process for building and deploying a machine learning model.',
    'How do you handle class imbalance or missing data in a training dataset?',
    'Tell us about a model you built that performed unexpectedly — what did you learn?',
    'How do you evaluate whether a model is ready for production?',
    'Describe your experience with MLOps — how do you monitor models after deployment?',
    'How do you approach feature engineering for a new problem?',
  ],
  design: [
    'Walk us through your end-to-end design process for a recent project.',
    'How do you balance user needs with business constraints in your designs?',
    'Tell us about a design decision you pushed back on and why.',
    'How do you approach designing for accessibility?',
    'Describe how you incorporate user feedback into iterative design.',
    'How do you collaborate with engineers to ensure your designs are implemented accurately?',
  ],
  product: [
    'How do you prioritize features when everything feels urgent?',
    'Tell us about a product you launched — what were the key decisions that led to its success or failure?',
    'How do you define success metrics for a new feature?',
    'Describe a time you had to make a difficult trade-off between user needs and technical limitations.',
    'How do you work with engineers and designers to ship a feature on time?',
    'Walk us through how you conduct and use customer discovery in your product process.',
  ],
  marketing: [
    'Tell us about a campaign you ran that exceeded its goals — what drove the success?',
    'How do you approach SEO strategy for a new product or website?',
    'Describe how you measure and iterate on content marketing performance.',
    'How do you align marketing messaging with sales and product teams?',
    'What tools do you rely on to manage and measure your marketing efforts?',
    'Walk us through a time you had to pivot a campaign mid-flight — what happened?',
  ],
  sales: [
    'Walk us through your typical sales process from lead to close.',
    'Tell us about the largest deal you\'ve closed and what made it successful.',
    'How do you handle objections from a potential customer?',
    'Describe how you build and manage your pipeline on a day-to-day basis.',
    'What does your outreach strategy look like for a cold prospect?',
    'How do you stay motivated through long sales cycles or rejection?',
  ],
  support: [
    'Describe how you handle a customer who is frustrated and escalating quickly.',
    'How do you balance handling a high volume of tickets while maintaining quality?',
    'Tell us about a time you turned a very unhappy customer into a satisfied one.',
    'How do you approach learning a complex technical product to support customers?',
    'What\'s your process for escalating an issue you can\'t resolve on your own?',
  ],
  manager: [
    'How do you approach giving difficult feedback to a team member?',
    'Tell us about a time you had to manage a team through significant change or uncertainty.',
    'How do you prioritize and delegate across your team effectively?',
    'Describe how you run one-on-ones — what do you focus on?',
    'How do you identify and develop high-potential team members?',
    'Tell us about a project that didn\'t go to plan — how did you respond?',
  ],
  finance: [
    'Walk us through how you approach building a financial model from scratch.',
    'How do you ensure accuracy and integrity when working with large financial datasets?',
    'Tell us about a financial analysis that led to a significant business decision.',
    'How do you communicate financial insights to non-finance stakeholders?',
    'Describe your experience with budgeting and forecasting processes.',
  ],
  security: [
    'Walk us through how you would perform a security audit of an existing web application.',
    'How do you stay up to date with the latest vulnerabilities and threat vectors?',
    'Tell us about a security incident you investigated or resolved.',
    'How do you approach security by design in software development teams?',
    'Describe your experience with penetration testing — what tools and methodologies do you use?',
  ],
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getSuggestedQuestions(roleTitle: string, existingQuestions: string[] = []): string[] {
  const lower = roleTitle.toLowerCase()
  let pool: string[] = []

  for (const [keyword, questions] of Object.entries(ROLE_QUESTIONS_MAP)) {
    if (lower.includes(keyword)) {
      pool = [...pool, ...questions]
    }
  }

  if (pool.length === 0) {
    pool = [
      'Tell us about a project you\'re most proud of and your specific contribution.',
      'How do you approach learning a new skill or technology quickly?',
      'Describe a time you disagreed with a colleague or manager — how did you handle it?',
      'What does success look like to you in this role after 90 days?',
      'How do you manage your workload when multiple priorities compete for your time?',
    ]
  }

  const shuffled = shuffle(pool)
  const selected = shuffled
    .filter((q) => !existingQuestions.includes(q))
    .slice(0, 4)

  const universals = UNIVERSAL_QUESTIONS.filter((q) => !existingQuestions.includes(q) && !selected.includes(q))

  return [...selected, universals[0]].filter(Boolean) as string[]
}
