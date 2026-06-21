// lib/intelligence/universalTaxonomy.js
// ForgeTomorrow Universal Professional Intelligence Taxonomy
// Single source of truth for capability intelligence across WHY, search, coaching, recruiter explanations, and future tools.
// Capability-first. Not job-title-first.

export const UNIVERSAL_CAPABILITIES = [
  {
    "id": "executive_leadership",
    "domain": "executive_strategy",
    "tier": "A",
    "label": "Executive leadership",
    "seekerLabel": "executive leadership and organizational ownership",
    "aliases": [
      "executive leader",
      "ceo",
      "chief executive officer",
      "founder",
      "general manager",
      "business leader"
    ],
    "patterns": [
      "executive leadership",
      "founder",
      "ceo",
      "general manager",
      "company strategy",
      "organizational leadership",
      "board",
      "investor",
      "p&l",
      "profit and loss",
      "business model",
      "strategic planning",
      "market positioning"
    ]
  },
  {
    "id": "business_strategy",
    "domain": "executive_strategy",
    "tier": "A",
    "label": "Business strategy",
    "seekerLabel": "business strategy and market positioning experience",
    "aliases": [
      "strategy leader",
      "business strategist",
      "chief of staff",
      "strategy manager"
    ],
    "patterns": [
      "business strategy",
      "go-to-market",
      "market strategy",
      "competitive positioning",
      "roadmap",
      "operating model",
      "growth strategy",
      "strategic initiatives",
      "business case",
      "market analysis"
    ]
  },
  {
    "id": "people_leadership",
    "domain": "leadership",
    "tier": "A",
    "label": "People leadership",
    "seekerLabel": "people leadership and team management experience",
    "aliases": [
      "manager",
      "team lead",
      "supervisor",
      "director",
      "people manager"
    ],
    "patterns": [
      "managed team",
      "managed teams",
      "direct reports",
      "team leadership",
      "supervised",
      "coached team",
      "mentored",
      "performance management",
      "workforce planning",
      "staffing",
      "hiring",
      "employee development"
    ]
  },
  {
    "id": "project_management",
    "domain": "project_program_management",
    "tier": "A",
    "label": "Project management",
    "seekerLabel": "project and delivery ownership",
    "aliases": [
      "project manager",
      "program manager",
      "delivery manager",
      "implementation manager",
      "project coordinator",
      "scrum master"
    ],
    "patterns": [
      "project management",
      "program management",
      "managed projects",
      "project delivery",
      "delivery management",
      "implementation",
      "timeline",
      "milestones",
      "budget",
      "scope",
      "risk management",
      "issue management",
      "stakeholder management",
      "pmp",
      "prince2",
      "agile",
      "scrum",
      "kanban",
      "jira"
    ]
  },
  {
    "id": "program_portfolio_management",
    "domain": "project_program_management",
    "tier": "A",
    "label": "Program / portfolio management",
    "seekerLabel": "program or portfolio-level delivery ownership",
    "aliases": [
      "program manager",
      "portfolio manager",
      "pmo manager",
      "enterprise program manager"
    ],
    "patterns": [
      "program management",
      "portfolio management",
      "pmo",
      "enterprise program",
      "multi-project",
      "project portfolio",
      "governance cadence",
      "steering committee",
      "executive reporting",
      "dependency management"
    ]
  },
  {
    "id": "product_management",
    "domain": "product",
    "tier": "A",
    "label": "Product management",
    "seekerLabel": "product ownership and roadmap experience",
    "aliases": [
      "product manager",
      "product owner",
      "technical product manager",
      "platform product manager"
    ],
    "patterns": [
      "product management",
      "product owner",
      "product roadmap",
      "user stories",
      "requirements gathering",
      "backlog",
      "prioritization",
      "product strategy",
      "mvp",
      "feature development",
      "release planning",
      "user research"
    ]
  },
  {
    "id": "change_management",
    "domain": "project_program_management",
    "tier": "B",
    "label": "Change management",
    "seekerLabel": "change management and adoption experience",
    "aliases": [
      "change manager",
      "organizational change",
      "transformation lead"
    ],
    "patterns": [
      "change management",
      "organizational change",
      "transformation",
      "adoption planning",
      "communications plan",
      "training rollout",
      "stakeholder adoption",
      "process transformation"
    ]
  },
  {
    "id": "cloud_infrastructure",
    "domain": "technology",
    "tier": "A",
    "label": "Cloud infrastructure",
    "seekerLabel": "cloud infrastructure experience",
    "aliases": [
      "cloud engineer",
      "azure engineer",
      "aws engineer",
      "gcp engineer",
      "infrastructure engineer",
      "cloud architect"
    ],
    "patterns": [
      "azure",
      "aws",
      "gcp",
      "cloud infrastructure",
      "cloud migration",
      "iaas",
      "paas",
      "serverless",
      "cloud architecture",
      "multi-cloud",
      "terraform",
      "kubernetes",
      "docker",
      "devops",
      "ci/cd",
      "infrastructure as code"
    ]
  },
  {
    "id": "systems_administration",
    "domain": "technology",
    "tier": "A",
    "label": "Systems administration",
    "seekerLabel": "systems administration experience",
    "aliases": [
      "systems administrator",
      "system administrator",
      "windows administrator",
      "linux administrator"
    ],
    "patterns": [
      "systems administration",
      "system administrator",
      "windows server",
      "linux",
      "server administration",
      "patching",
      "backup",
      "disaster recovery",
      "powershell",
      "bash",
      "vmware",
      "hyper-v"
    ]
  },
  {
    "id": "endpoint_management",
    "domain": "technology_support",
    "tier": "A",
    "label": "Endpoint / device management",
    "seekerLabel": "endpoint and device management experience",
    "aliases": [
      "endpoint engineer",
      "euc engineer",
      "device management",
      "mdm administrator"
    ],
    "patterns": [
      "endpoint management",
      "intune",
      "jamf",
      "sccm",
      "mecm",
      "mdm",
      "mobile device management",
      "workspace one",
      "autopilot",
      "device compliance",
      "endpoint support",
      "euc",
      "end user computing"
    ]
  },
  {
    "id": "identity_access_management",
    "domain": "security",
    "tier": "A",
    "label": "Identity & access management",
    "seekerLabel": "identity and access management experience",
    "aliases": [
      "iam analyst",
      "identity engineer",
      "access management",
      "active directory administrator"
    ],
    "patterns": [
      "active directory",
      "azure ad",
      "entra",
      "okta",
      "iam",
      "identity management",
      "access management",
      "sso",
      "scim",
      "mfa",
      "rbac",
      "privileged access",
      "user provisioning"
    ]
  },
  {
    "id": "networking_infrastructure",
    "domain": "technology",
    "tier": "A",
    "label": "Networking & infrastructure",
    "seekerLabel": "network and infrastructure experience",
    "aliases": [
      "network engineer",
      "network administrator",
      "infrastructure engineer",
      "telecommunications engineer"
    ],
    "patterns": [
      "networking",
      "network infrastructure",
      "tcp/ip",
      "dns",
      "dhcp",
      "vpn",
      "firewall",
      "switching",
      "routing",
      "cisco",
      "meraki",
      "fortinet",
      "palo alto",
      "wan",
      "lan",
      "sd-wan",
      "telecommunications",
      "telephony"
    ]
  },
  {
    "id": "desktop_technical_support",
    "domain": "technology_support",
    "tier": "A",
    "label": "Desktop / technical support",
    "seekerLabel": "desktop and technical support experience",
    "aliases": [
      "desktop technician",
      "desktop support",
      "deskside support",
      "help desk",
      "service desk",
      "technical support",
      "endpoint support"
    ],
    "patterns": [
      "desktop support",
      "desktop technician",
      "deskside support",
      "technical support",
      "help desk",
      "service desk",
      "tier ii",
      "tier 2",
      "tier iii",
      "ticketing",
      "servicenow",
      "remedy",
      "easyvista",
      "windows support",
      "hardware troubleshooting",
      "software troubleshooting"
    ]
  },
  {
    "id": "it_service_management",
    "domain": "technology_support",
    "tier": "B",
    "label": "IT service management",
    "seekerLabel": "IT service management experience",
    "aliases": [
      "itsm analyst",
      "service delivery analyst",
      "incident manager",
      "problem manager"
    ],
    "patterns": [
      "itil",
      "itsm",
      "incident management",
      "problem management",
      "change advisory board",
      "cab",
      "service request",
      "knowledge base",
      "sla",
      "service level agreement",
      "service delivery"
    ]
  },
  {
    "id": "cybersecurity_operations",
    "domain": "security_risk",
    "tier": "A",
    "label": "Cybersecurity operations",
    "seekerLabel": "cybersecurity operations experience",
    "aliases": [
      "security analyst",
      "soc analyst",
      "security engineer",
      "cybersecurity analyst"
    ],
    "patterns": [
      "cybersecurity",
      "security operations",
      "soc",
      "siem",
      "splunk",
      "sentinel",
      "incident response",
      "threat detection",
      "threat hunting",
      "vulnerability management",
      "edr",
      "crowdstrike",
      "defender",
      "zero trust"
    ]
  },
  {
    "id": "governance_risk_compliance",
    "domain": "security_risk",
    "tier": "A",
    "label": "Governance, risk & compliance",
    "seekerLabel": "governance, risk, and compliance experience",
    "aliases": [
      "grc analyst",
      "risk analyst",
      "compliance analyst",
      "security compliance"
    ],
    "patterns": [
      "grc",
      "governance",
      "risk management",
      "compliance",
      "audit",
      "soc2",
      "iso 27001",
      "nist",
      "pci",
      "hipaa",
      "policy",
      "control testing",
      "risk assessment",
      "regulatory"
    ]
  },
  {
    "id": "business_continuity",
    "domain": "security_risk",
    "tier": "B",
    "label": "Business continuity / disaster recovery",
    "seekerLabel": "business continuity and disaster recovery experience",
    "aliases": [
      "business continuity analyst",
      "disaster recovery coordinator",
      "bcp analyst"
    ],
    "patterns": [
      "business continuity",
      "disaster recovery",
      "bcp",
      "drp",
      "continuity planning",
      "recovery plan",
      "contingency planning",
      "resilience"
    ]
  },
  {
    "id": "software_engineering",
    "domain": "software_engineering",
    "tier": "A",
    "label": "Software engineering",
    "seekerLabel": "software engineering experience",
    "aliases": [
      "software engineer",
      "software developer",
      "full stack developer",
      "backend developer",
      "frontend developer",
      "web developer"
    ],
    "patterns": [
      "software engineering",
      "software development",
      "full stack",
      "frontend",
      "backend",
      "react",
      "next.js",
      "node.js",
      "typescript",
      "javascript",
      "python",
      "java",
      "c#",
      ".net",
      "api development",
      "microservices",
      "git"
    ]
  },
  {
    "id": "data_analytics_bi",
    "domain": "data",
    "tier": "A",
    "label": "Data analytics / BI",
    "seekerLabel": "data analysis and reporting experience",
    "aliases": [
      "data analyst",
      "business intelligence analyst",
      "reporting analyst",
      "analytics analyst"
    ],
    "patterns": [
      "data analysis",
      "analytics",
      "business intelligence",
      "sql",
      "excel",
      "power bi",
      "tableau",
      "dashboard",
      "reporting",
      "metrics",
      "kpi",
      "forecasting",
      "data visualization"
    ]
  },
  {
    "id": "data_engineering",
    "domain": "data",
    "tier": "A",
    "label": "Data engineering",
    "seekerLabel": "data engineering experience",
    "aliases": [
      "data engineer",
      "etl developer",
      "analytics engineer"
    ],
    "patterns": [
      "data engineering",
      "etl",
      "elt",
      "data pipeline",
      "data warehouse",
      "snowflake",
      "databricks",
      "bigquery",
      "postgresql",
      "mongodb",
      "airflow",
      "spark"
    ]
  },
  {
    "id": "ai_machine_learning",
    "domain": "artificial_intelligence",
    "tier": "B",
    "label": "AI / machine learning",
    "seekerLabel": "AI and machine learning experience",
    "aliases": [
      "machine learning engineer",
      "ai engineer",
      "ml engineer",
      "prompt engineer"
    ],
    "patterns": [
      "artificial intelligence",
      "machine learning",
      "llm",
      "prompt engineering",
      "ai systems",
      "neural network",
      "model evaluation",
      "rag",
      "openai",
      "anthropic",
      "computer vision",
      "nlp"
    ]
  },
  {
    "id": "customer_service_support",
    "domain": "customer_client",
    "tier": "A",
    "label": "Customer service / support",
    "seekerLabel": "customer service and support experience",
    "aliases": [
      "customer service representative",
      "customer support",
      "support specialist",
      "client support",
      "customer care"
    ],
    "patterns": [
      "customer service",
      "customer support",
      "customer care",
      "client support",
      "inbound calls",
      "outbound calls",
      "customer inquiries",
      "case management",
      "ticketing",
      "call center",
      "contact center",
      "issue resolution"
    ]
  },
  {
    "id": "customer_success_account_management",
    "domain": "customer_client",
    "tier": "A",
    "label": "Customer success / account management",
    "seekerLabel": "customer success and account management experience",
    "aliases": [
      "customer success manager",
      "client success",
      "account manager",
      "relationship manager"
    ],
    "patterns": [
      "customer success",
      "client success",
      "account management",
      "book of business",
      "portfolio",
      "customer onboarding",
      "renewals",
      "retention",
      "qbr",
      "quarterly business review",
      "health score",
      "adoption",
      "expansion",
      "upsell"
    ]
  },
  {
    "id": "service_delivery",
    "domain": "customer_client",
    "tier": "A",
    "label": "Service delivery",
    "seekerLabel": "service delivery and SLA ownership",
    "aliases": [
      "service delivery manager",
      "client delivery manager",
      "support delivery"
    ],
    "patterns": [
      "service delivery",
      "sla",
      "service level",
      "client delivery",
      "delivery operations",
      "escalation management",
      "operational review",
      "customer operations",
      "support delivery"
    ]
  },
  {
    "id": "sales_business_development",
    "domain": "revenue",
    "tier": "A",
    "label": "Sales / business development",
    "seekerLabel": "sales and business development experience",
    "aliases": [
      "account executive",
      "sales representative",
      "sales development representative",
      "sdr",
      "bdr",
      "business development"
    ],
    "patterns": [
      "sales",
      "business development",
      "account executive",
      "sdr",
      "bdr",
      "prospecting",
      "lead generation",
      "pipeline",
      "quota",
      "closing",
      "negotiation",
      "crm",
      "salesforce",
      "hubspot"
    ]
  },
  {
    "id": "marketing_growth",
    "domain": "marketing",
    "tier": "A",
    "label": "Marketing / growth",
    "seekerLabel": "marketing and growth execution experience",
    "aliases": [
      "marketing manager",
      "growth marketer",
      "digital marketer",
      "content marketer"
    ],
    "patterns": [
      "marketing",
      "growth marketing",
      "digital marketing",
      "campaign management",
      "brand strategy",
      "content marketing",
      "seo",
      "sem",
      "paid media",
      "email marketing",
      "demand generation",
      "marketing automation",
      "google analytics"
    ]
  },
  {
    "id": "operations_process_improvement",
    "domain": "operations",
    "tier": "A",
    "label": "Operations / process improvement",
    "seekerLabel": "operations and process improvement experience",
    "aliases": [
      "operations manager",
      "business operations",
      "process improvement analyst",
      "operations coordinator"
    ],
    "patterns": [
      "operations",
      "business operations",
      "process improvement",
      "workflow optimization",
      "sop",
      "kpi",
      "quality assurance",
      "continuous improvement",
      "lean",
      "six sigma",
      "resource planning",
      "vendor management"
    ]
  },
  {
    "id": "manufacturing_production",
    "domain": "manufacturing",
    "tier": "B",
    "label": "Manufacturing / production",
    "seekerLabel": "manufacturing and production experience",
    "aliases": [
      "production associate",
      "machine operator",
      "quality control technician",
      "assembly worker"
    ],
    "patterns": [
      "manufacturing",
      "production",
      "assembly",
      "machine operator",
      "quality control",
      "quality assurance",
      "plant operations",
      "inspection",
      "materials",
      "maintenance",
      "safety",
      "lean manufacturing"
    ]
  },
  {
    "id": "logistics_supply_chain",
    "domain": "logistics",
    "tier": "B",
    "label": "Logistics / supply chain",
    "seekerLabel": "logistics and supply chain experience",
    "aliases": [
      "warehouse associate",
      "inventory specialist",
      "supply chain analyst",
      "procurement specialist"
    ],
    "patterns": [
      "logistics",
      "supply chain",
      "warehouse",
      "inventory",
      "shipping",
      "receiving",
      "procurement",
      "purchasing",
      "freight",
      "distribution",
      "materials management",
      "vendor coordination"
    ]
  },
  {
    "id": "finance_accounting",
    "domain": "finance",
    "tier": "B",
    "label": "Finance / accounting",
    "seekerLabel": "finance and accounting experience",
    "aliases": [
      "financial analyst",
      "accountant",
      "bookkeeper",
      "payroll specialist",
      "accounts payable specialist"
    ],
    "patterns": [
      "finance",
      "accounting",
      "financial analysis",
      "budgeting",
      "forecasting",
      "accounts payable",
      "accounts receivable",
      "payroll",
      "reconciliation",
      "general ledger",
      "audit",
      "quickbooks"
    ]
  },
  {
    "id": "hr_people_operations",
    "domain": "people_talent",
    "tier": "B",
    "label": "HR / people operations",
    "seekerLabel": "HR and people operations experience",
    "aliases": [
      "hr generalist",
      "hr business partner",
      "people operations",
      "employee relations specialist"
    ],
    "patterns": [
      "human resources",
      "hr",
      "people operations",
      "employee relations",
      "benefits",
      "compensation",
      "hris",
      "workday",
      "adp",
      "policy",
      "performance management",
      "employee engagement"
    ]
  },
  {
    "id": "recruiting_talent_acquisition",
    "domain": "people_talent",
    "tier": "B",
    "label": "Recruiting / talent acquisition",
    "seekerLabel": "recruiting and talent acquisition experience",
    "aliases": [
      "recruiter",
      "technical recruiter",
      "talent acquisition",
      "sourcer",
      "recruiting coordinator"
    ],
    "patterns": [
      "recruiting",
      "talent acquisition",
      "sourcing",
      "candidate screening",
      "interview coordination",
      "applicant tracking",
      "ats",
      "job posting",
      "offer coordination",
      "talent pipeline"
    ]
  },
  {
    "id": "legal_compliance",
    "domain": "legal_compliance",
    "tier": "B",
    "label": "Legal / compliance",
    "seekerLabel": "legal, compliance, or regulatory experience",
    "aliases": [
      "paralegal",
      "legal assistant",
      "compliance analyst",
      "contracts specialist"
    ],
    "patterns": [
      "legal",
      "paralegal",
      "legal assistant",
      "contracts",
      "compliance",
      "regulatory",
      "risk management",
      "policy review",
      "case management",
      "document review",
      "legal research",
      "privacy"
    ]
  },
  {
    "id": "healthcare_administration",
    "domain": "healthcare",
    "tier": "B",
    "label": "Healthcare administration",
    "seekerLabel": "healthcare administration experience",
    "aliases": [
      "medical office",
      "patient coordinator",
      "medical assistant",
      "healthcare administrator"
    ],
    "patterns": [
      "healthcare",
      "medical office",
      "patient scheduling",
      "patient care",
      "clinical support",
      "medical records",
      "emr",
      "ehr",
      "hipaa",
      "insurance verification",
      "billing",
      "claims",
      "front desk"
    ]
  },
  {
    "id": "education_training",
    "domain": "education",
    "tier": "B",
    "label": "Education / training",
    "seekerLabel": "education, training, or instruction experience",
    "aliases": [
      "teacher",
      "trainer",
      "instructor",
      "curriculum specialist",
      "learning and development"
    ],
    "patterns": [
      "education",
      "teaching",
      "training",
      "instruction",
      "curriculum",
      "lesson planning",
      "learning and development",
      "facilitation",
      "classroom management",
      "coaching",
      "e-learning",
      "instructional design"
    ]
  },
  {
    "id": "government_military",
    "domain": "government_military",
    "tier": "B",
    "label": "Government / military environment",
    "seekerLabel": "government or military environment experience",
    "aliases": [
      "federal employee",
      "military",
      "veteran",
      "government contractor",
      "dod"
    ],
    "patterns": [
      "department of defense",
      "dod",
      "army",
      "air force",
      "navy",
      "marines",
      "federal",
      "government contract",
      "clearance",
      "classified",
      "gs-",
      "opm",
      "contingency planning",
      "command and control",
      "c4",
      "c&i"
    ]
  },
  {
  id: "public_safety_security",
  domain: "public_safety",
  tier: "B",
  label: "Public safety / security",
  seekerLabel: "public safety, security, or corrections experience",
  aliases: [
    "security officer",
    "corrections officer",
    "law enforcement",
    "public safety"
  ],
  patterns: [
    "public safety",
    "security",
    "corrections",
    "law enforcement",
    "incident response",
    "transport officer",
    "special response",
    "conflict resolution",
    "emergency response",
    "access control"
  ]
},
{
  id: "employee_benefits_workers_comp",
  domain: "people_talent",
  tier: "A",
  label: "Employee benefits / workers compensation",
  seekerLabel: "employee benefits and workers compensation experience",
  aliases: ["benefits specialist", "workers compensation specialist", "employee benefits specialist"],
  patterns: ["employee benefits", "workers compensation", "worker's compensation", "feca", "claims case management", "benefits administration", "leave administration", "department of labor", "case documentation"],
},
{
  id: "financial_planning_analysis",
  domain: "finance",
  tier: "A",
  label: "FP&A / financial planning",
  seekerLabel: "financial planning and analysis experience",
  aliases: ["fp&a manager", "financial planning manager", "finance manager", "financial analyst"],
  patterns: ["fp&a", "financial planning", "variance analysis", "budget", "forecast", "forecasting", "financial reporting", "monthly financial reports", "financial model", "netsuite", "erp", "scenario analysis"],
},
{
  id: "clinical_laboratory_science",
  domain: "healthcare",
  tier: "A",
  label: "Clinical laboratory science",
  seekerLabel: "clinical laboratory science certification and lab experience",
  aliases: ["clinical laboratory scientist", "medical laboratory scientist", "medical technologist", "laboratory technologist"],
  patterns: ["clinical laboratory scientist", "medical laboratory scientist", "medical technologist", "mls", "mt", "ascp", "amt", "laboratory testing", "specimen", "clinical lab", "laboratory certification"],
},

  {
    id: "business_analysis",
    domain: "project_program_management",
    tier: "A",
    label: "Business analysis",
    seekerLabel: "business analysis and requirements translation experience",
    aliases: ["business analyst", "systems analyst", "requirements analyst", "process analyst"],
    patterns: ["business analysis", "requirements gathering", "requirements documentation", "user requirements", "functional requirements", "process mapping", "gap analysis", "stakeholder interviews", "use cases", "acceptance criteria", "brd", "frd", "user acceptance testing", "uat"],
  },
  {
    id: "technical_program_management",
    domain: "project_program_management",
    tier: "A",
    label: "Technical program management",
    seekerLabel: "technical program management and cross-functional execution experience",
    aliases: ["technical program manager", "tpm", "technical delivery manager", "engineering program manager"],
    patterns: ["technical program management", "technical roadmap", "engineering coordination", "cross-functional delivery", "system dependencies", "technical requirements", "release coordination", "architecture review", "platform delivery", "technical risk", "engineering milestones"],
  },
  {
    id: "platform_architecture",
    domain: "technology",
    tier: "A",
    label: "Platform architecture",
    seekerLabel: "platform architecture and scalable systems design experience",
    aliases: ["platform architect", "solutions architect", "enterprise architect", "systems architect"],
    patterns: ["platform architecture", "solution architecture", "enterprise architecture", "systems design", "scalable architecture", "reference architecture", "integration architecture", "technical architecture", "architecture governance", "api architecture", "distributed systems"],
  },
  {
    id: "qa_testing",
    domain: "software_engineering",
    tier: "A",
    label: "QA / testing",
    seekerLabel: "quality assurance and software testing experience",
    aliases: ["qa analyst", "qa engineer", "test engineer", "software tester", "quality engineer"],
    patterns: ["quality assurance", "software testing", "test cases", "test plans", "manual testing", "automated testing", "regression testing", "selenium", "cypress", "playwright", "defect tracking", "bug reports", "test coverage", "qa process"],
  },
  {
    id: "devops_sre",
    domain: "technology",
    tier: "A",
    label: "DevOps / SRE",
    seekerLabel: "DevOps, reliability, and deployment automation experience",
    aliases: ["devops engineer", "site reliability engineer", "sre", "release engineer", "platform engineer"],
    patterns: ["devops", "site reliability", "sre", "ci/cd", "deployment automation", "observability", "monitoring", "incident postmortem", "reliability", "uptime", "terraform", "kubernetes", "docker", "github actions", "jenkins", "gitlab ci"],
  },
  {
    id: "database_administration",
    domain: "data",
    tier: "A",
    label: "Database administration",
    seekerLabel: "database administration and data platform operations experience",
    aliases: ["database administrator", "dba", "database engineer", "sql administrator"],
    patterns: ["database administration", "dba", "sql server", "postgresql", "mysql", "oracle", "database tuning", "query optimization", "backup and restore", "replication", "database migration", "stored procedures", "indexing"],
  },
  {
    id: "ux_ui_design",
    domain: "design",
    tier: "A",
    label: "UX / UI design",
    seekerLabel: "user experience and interface design experience",
    aliases: ["ux designer", "ui designer", "product designer", "interaction designer"],
    patterns: ["ux design", "ui design", "user experience", "user interface", "figma", "wireframes", "prototypes", "design system", "usability testing", "interaction design", "user journeys", "information architecture", "accessibility"],
  },
  {
    id: "content_communications",
    domain: "marketing",
    tier: "B",
    label: "Content / communications",
    seekerLabel: "content, communications, and messaging experience",
    aliases: ["content strategist", "communications manager", "copywriter", "technical writer", "content manager"],
    patterns: ["content strategy", "communications", "copywriting", "technical writing", "documentation", "editorial", "messaging", "brand voice", "press release", "internal communications", "knowledge articles", "writing", "storytelling"],
  },
  {
    id: "partnerships_alliances",
    domain: "revenue",
    tier: "A",
    label: "Partnerships / alliances",
    seekerLabel: "partnerships, alliances, and ecosystem growth experience",
    aliases: ["partnership manager", "alliances manager", "channel manager", "partner development"],
    patterns: ["partnerships", "strategic alliances", "channel partners", "partner ecosystem", "partner development", "co-selling", "reseller", "marketplace", "joint go-to-market", "partner enablement", "alliance management"],
  },
  {
    id: "revenue_operations",
    domain: "revenue",
    tier: "A",
    label: "Revenue operations",
    seekerLabel: "revenue operations and sales process optimization experience",
    aliases: ["revenue operations", "revops", "sales operations", "crm operations"],
    patterns: ["revenue operations", "revops", "sales operations", "crm administration", "pipeline reporting", "forecasting", "salesforce administration", "hubspot administration", "territory planning", "lead routing", "sales process", "quote to cash"],
  },
  {
    id: "procurement_vendor_management",
    domain: "operations",
    tier: "A",
    label: "Procurement / vendor management",
    seekerLabel: "procurement, sourcing, and vendor management experience",
    aliases: ["procurement specialist", "vendor manager", "sourcing manager", "purchasing manager"],
    patterns: ["procurement", "sourcing", "vendor management", "supplier management", "rfp", "rfq", "contract negotiation", "purchase orders", "supplier performance", "vendor onboarding", "cost savings", "third-party management"],
  },
  {
    id: "facilities_real_estate",
    domain: "operations",
    tier: "B",
    label: "Facilities / real estate operations",
    seekerLabel: "facilities, workplace, or real estate operations experience",
    aliases: ["facilities manager", "workplace manager", "property manager", "real estate operations"],
    patterns: ["facilities", "workplace operations", "real estate", "property management", "space planning", "lease administration", "building maintenance", "vendor coordination", "site operations", "workplace safety", "office operations"],
  },
  {
    id: "executive_administration",
    domain: "administration",
    tier: "B",
    label: "Executive administration",
    seekerLabel: "executive administration and operational coordination experience",
    aliases: ["executive assistant", "administrative assistant", "office manager", "administrative coordinator"],
    patterns: ["executive assistant", "administrative support", "calendar management", "travel coordination", "expense reports", "meeting coordination", "office management", "executive communications", "confidential information", "scheduling", "administrative operations"],
  },
  {
    id: "grant_nonprofit_programs",
    domain: "nonprofit_public_sector",
    tier: "B",
    label: "Grant / nonprofit programs",
    seekerLabel: "grant, nonprofit, or mission-program experience",
    aliases: ["grant manager", "program coordinator", "nonprofit manager", "development associate"],
    patterns: ["grant management", "grant writing", "nonprofit", "fundraising", "donor management", "program coordination", "community outreach", "mission-driven", "impact reporting", "case management", "public benefit", "foundation"],
  },
  {
    id: "clinical_operations",
    domain: "healthcare",
    tier: "A",
    label: "Clinical operations",
    seekerLabel: "clinical operations and patient care coordination experience",
    aliases: ["clinical operations manager", "clinic manager", "patient care coordinator", "healthcare operations"],
    patterns: ["clinical operations", "clinic operations", "patient flow", "care coordination", "clinical workflow", "provider scheduling", "medical office operations", "patient experience", "ehr", "emr", "hipaa", "quality of care"],
  },
  {
    id: "insurance_claims",
    domain: "finance_operations",
    tier: "B",
    label: "Insurance / claims",
    seekerLabel: "insurance, claims, and case review experience",
    aliases: ["claims adjuster", "claims specialist", "insurance specialist", "underwriting assistant"],
    patterns: ["insurance", "claims", "claims processing", "claims review", "underwriting", "policy review", "coverage", "loss runs", "case documentation", "appeals", "benefits claims", "workers compensation claims"],
  },
  {
    id: "banking_financial_services",
    domain: "finance",
    tier: "B",
    label: "Banking / financial services",
    seekerLabel: "banking and financial services experience",
    aliases: ["banker", "loan officer", "branch manager", "financial services representative"],
    patterns: ["banking", "financial services", "loan processing", "credit analysis", "mortgage", "branch operations", "deposits", "lending", "finra", "kyc", "aml", "customer accounts"],
  },
  {
    id: "hospitality_guest_experience",
    domain: "hospitality",
    tier: "B",
    label: "Hospitality / guest experience",
    seekerLabel: "hospitality and guest experience experience",
    aliases: ["hospitality manager", "front desk agent", "guest services", "hotel manager"],
    patterns: ["hospitality", "guest experience", "front desk", "hotel operations", "reservations", "guest services", "customer complaints", "food and beverage", "event coordination", "service recovery", "guest satisfaction"],
  },
  {
    id: "retail_store_operations",
    domain: "retail",
    tier: "B",
    label: "Retail / store operations",
    seekerLabel: "retail, merchandising, and store operations experience",
    aliases: ["retail manager", "store manager", "sales associate", "merchandising manager","cashier","retail cashier","store associate","cashier associate","front end associate"],
    patterns: ["retail", "store operations", "merchandising", "point of sale", "pos", "inventory", "loss prevention", "visual merchandising", "cash handling", "sales floor", "customer experience", "store manager", "cashier", "cash handling", "register", "checkout", "point of sale", "pos system", "retail associate", "store associate", "front end", "customer transactions"],
  },
  {
    id: "food_service_operations",
    domain: "hospitality",
    tier: "B",
    label: "Food service operations",
    seekerLabel: "food service and restaurant operations experience",
    aliases: ["restaurant manager", "food service manager", "server", "kitchen manager"],
    patterns: ["food service", "restaurant operations", "kitchen operations", "serving", "food safety", "servsafe", "menu", "front of house", "back of house", "guest service", "shift management", "labor scheduling"],
  },
  {
    id: "construction_trades",
    domain: "skilled_trades",
    tier: "B",
    label: "Construction / skilled trades",
    seekerLabel: "construction, maintenance, or skilled trades experience",
    aliases: ["construction worker", "electrician", "plumber", "maintenance technician", "tradesperson"],
    patterns: ["construction", "skilled trades", "maintenance technician", "electrical", "plumbing", "hvac", "carpentry", "blueprints", "site safety", "osha", "preventive maintenance", "repair", "installation"],
  },
  {
    id: "transportation_fleet",
    domain: "logistics",
    tier: "B",
    label: "Transportation / fleet",
    seekerLabel: "transportation, dispatch, or fleet operations experience",
    aliases: ["dispatcher", "fleet manager", "driver", "transportation coordinator"],
    patterns: ["transportation", "fleet", "dispatch", "route planning", "drivers", "dot", "cdl", "logistics coordination", "vehicle maintenance", "delivery operations", "last mile", "freight coordination"],
  },
  {
    id: "safety_environmental_compliance",
    domain: "operations",
    tier: "A",
    label: "Safety / environmental compliance",
    seekerLabel: "safety, environmental, and compliance experience",
    aliases: ["safety manager", "ehs specialist", "environmental health and safety", "compliance coordinator"],
    patterns: ["safety", "ehs", "environmental health and safety", "osha", "incident investigation", "safety training", "risk assessment", "hazard analysis", "environmental compliance", "corrective actions", "workplace safety"],
  },
  {
    id: "research_analysis",
    domain: "research",
    tier: "B",
    label: "Research / analysis",
    seekerLabel: "research, analysis, and insight development experience",
    aliases: ["research analyst", "policy analyst", "market researcher", "research associate"],
    patterns: ["research", "analysis", "literature review", "market research", "policy analysis", "survey", "interviews", "qualitative research", "quantitative research", "insights", "findings", "recommendations"],
  },
  {
    id: "training_enablement",
    domain: "education",
    tier: "A",
    label: "Training / enablement",
    seekerLabel: "training, enablement, and knowledge transfer experience",
    aliases: ["trainer", "enablement specialist", "learning specialist", "training manager"],
    patterns: ["training", "enablement", "onboarding", "curriculum", "knowledge transfer", "facilitation", "workshops", "training materials", "learning management system", "lms", "coaching", "documentation", "job aids"],
  },
  {
    id: "community_social_services",
    domain: "public_service",
    tier: "B",
    label: "Community / social services",
    seekerLabel: "community, social service, or client advocacy experience",
    aliases: ["case manager", "social services coordinator", "community outreach", "advocate"],
    patterns: ["case management", "community outreach", "social services", "client advocacy", "intake", "referrals", "crisis intervention", "program eligibility", "support services", "family services", "public assistance"],
  },
  {
    id: "creative_media_production",
    domain: "creative_media",
    tier: "B",
    label: "Creative / media production",
    seekerLabel: "creative, media, or production experience",
    aliases: ["producer", "video editor", "graphic designer", "creative director", "media specialist"],
    patterns: ["creative production", "media production", "video editing", "graphic design", "adobe", "premiere", "after effects", "photoshop", "illustrator", "content production", "storyboarding", "brand assets", "creative direction"],
  },

  {
    id: "customer_retention",
    domain: "customer_client",
    tier: "A",
    label: "Customer retention",
    seekerLabel: "customer retention and churn reduction experience",
    aliases: ["retention manager", "customer retention", "retention specialist", "churn reduction", "customer loyalty"],
    patterns: ["customer retention", "client retention", "retention", "churn reduction", "reduced churn", "retained customers", "renewal risk", "at-risk accounts", "save rate", "customer loyalty", "retention strategy", "retention program", "customer satisfaction", "csat", "nps", "customer lifecycle"],
  },
  {
    id: "customer_onboarding",
    domain: "customer_client",
    tier: "A",
    label: "Customer onboarding",
    seekerLabel: "customer onboarding and implementation handoff experience",
    aliases: ["onboarding specialist", "customer onboarding", "client onboarding", "implementation onboarding"],
    patterns: ["customer onboarding", "client onboarding", "onboarding program", "onboarding workflow", "implementation handoff", "new customer launch", "go-live", "enablement", "training customers", "activation", "time to value", "customer implementation", "post-sale onboarding"],
  },
  {
    id: "customer_adoption",
    domain: "customer_client",
    tier: "A",
    label: "Customer adoption",
    seekerLabel: "customer adoption and product usage growth experience",
    aliases: ["adoption manager", "customer adoption", "product adoption", "usage growth"],
    patterns: ["adoption", "customer adoption", "product adoption", "usage", "usage growth", "engagement", "feature adoption", "platform adoption", "enablement", "training adoption", "user adoption", "activation", "adoption strategy", "adoption metrics"],
  },
  {
    id: "customer_health_management",
    domain: "customer_client",
    tier: "A",
    label: "Customer health management",
    seekerLabel: "customer health scoring and account risk management experience",
    aliases: ["customer health", "health score", "account health", "customer risk management"],
    patterns: ["customer health", "health score", "account health", "risk score", "customer risk", "at-risk account", "customer signals", "usage signals", "churn risk", "account risk", "customer sentiment", "success metrics", "customer dashboard", "health dashboard"],
  },
  {
    id: "renewals_expansion",
    domain: "customer_client",
    tier: "A",
    label: "Renewals / expansion",
    seekerLabel: "renewals, expansion, and account growth experience",
    aliases: ["renewals manager", "renewal management", "expansion", "upsell", "cross-sell"],
    patterns: ["renewals", "renewal", "renewal management", "expansion", "upsell", "cross-sell", "account growth", "net revenue retention", "nrr", "gross revenue retention", "grr", "contract renewal", "retention revenue", "book of business", "expansion revenue"],
  },
  {
    id: "voice_of_customer",
    domain: "customer_client",
    tier: "B",
    label: "Voice of customer",
    seekerLabel: "voice-of-customer and feedback intelligence experience",
    aliases: ["voice of customer", "voc", "customer feedback", "customer insights"],
    patterns: ["voice of customer", "voc", "customer feedback", "client feedback", "customer insights", "feedback loop", "product feedback", "customer sentiment", "survey", "nps", "csat", "customer interviews", "feedback analysis", "customer themes"],
  },
  {
    id: "executive_business_reviews",
    domain: "customer_client",
    tier: "A",
    label: "Executive business reviews",
    seekerLabel: "executive business review and strategic account communication experience",
    aliases: ["ebr", "qbr", "business review", "executive business review", "quarterly business review"],
    patterns: ["executive business review", "quarterly business review", "qbr", "ebr", "business review", "strategic business review", "account review", "executive sponsor", "customer leadership", "client leadership", "executive presentation", "stakeholder review", "service review", "operational review"],
  },
  {
    id: "incident_management",
    domain: "technology_support",
    tier: "A",
    label: "Incident management",
    seekerLabel: "incident management and service restoration experience",
    aliases: ["incident manager", "incident management", "service restoration"],
    patterns: ["incident management", "incident manager", "incident response", "service restoration", "restore service", "ticket escalation", "priority incident", "p1", "p2", "outage", "service outage", "triage", "incident triage", "resolution coordination"],
  },
  {
    id: "problem_management",
    domain: "technology_support",
    tier: "B",
    label: "Problem management",
    seekerLabel: "problem management and root-cause improvement experience",
    aliases: ["problem manager", "problem management", "root cause analysis", "rca"],
    patterns: ["problem management", "root cause", "root cause analysis", "rca", "known error", "recurring issue", "problem record", "prevent recurrence", "corrective action", "permanent fix", "trend analysis", "defect reduction"],
  },
  {
    id: "major_incident_management",
    domain: "technology_support",
    tier: "A",
    label: "Major incident management",
    seekerLabel: "major incident and enterprise outage coordination experience",
    aliases: ["major incident manager", "major incident", "critical incident", "sev1", "sev2"],
    patterns: ["major incident", "critical incident", "sev1", "sev 1", "sev2", "sev 2", "enterprise outage", "war room", "bridge call", "command center", "executive update", "incident commander", "high severity", "service-impacting"],
  },
  {
    id: "service_operations",
    domain: "customer_client",
    tier: "A",
    label: "Service operations",
    seekerLabel: "service operations and delivery operating-model experience",
    aliases: ["service operations", "support operations", "delivery operations", "customer operations"],
    patterns: ["service operations", "support operations", "delivery operations", "customer operations", "operating model", "service model", "service governance", "operational cadence", "service performance", "support model", "delivery model", "run operations", "business-as-usual", "bau"],
  },
  {
    id: "sla_management",
    domain: "customer_client",
    tier: "A",
    label: "SLA management",
    seekerLabel: "SLA, KPI, and service-performance management experience",
    aliases: ["sla management", "service level management", "kpi management", "service performance"],
    patterns: ["sla", "slas", "service level", "service level agreement", "service level management", "kpi", "kpis", "performance metrics", "operational metrics", "service performance", "target attainment", "service targets", "breach", "sla breach", "sla improvement"],
  },
  {
    id: "capacity_planning",
    domain: "operations",
    tier: "A",
    label: "Capacity planning",
    seekerLabel: "capacity planning and demand forecasting experience",
    aliases: ["capacity planner", "capacity planning", "demand planning", "resource planning"],
    patterns: ["capacity planning", "capacity model", "demand planning", "demand forecast", "forecasting", "resource planning", "resource model", "volume forecast", "workload forecast", "staffing forecast", "capacity forecast", "utilization", "throughput planning"],
  },
  {
    id: "workforce_management",
    domain: "operations",
    tier: "A",
    label: "Workforce management",
    seekerLabel: "workforce management and staffing optimization experience",
    aliases: ["workforce management", "wfm", "staffing model", "workforce planning"],
    patterns: ["workforce management", "wfm", "workforce planning", "staffing model", "staffing plan", "schedule adherence", "shrinkage", "coverage", "staffing alignment", "labor planning", "headcount planning", "resource allocation", "offshore", "onshore", "hybrid team"],
  },
  {
    id: "operational_reporting",
    domain: "operations",
    tier: "A",
    label: "Operational reporting",
    seekerLabel: "operational reporting, dashboards, and performance visibility experience",
    aliases: ["operational reporting", "reporting analyst", "performance reporting", "dashboard reporting"],
    patterns: ["operational reporting", "performance reporting", "dashboard", "dashboards", "scorecard", "reporting framework", "metrics reporting", "leadership reporting", "executive reporting", "data visibility", "operational analytics", "trend reporting", "kpi dashboard", "weekly report", "monthly report"],
  },
  {
    id: "budget_ownership",
    domain: "executive_strategy",
    tier: "A",
    label: "Budget ownership",
    seekerLabel: "budget ownership and financial accountability experience",
    aliases: ["budget owner", "budget management", "department budget", "financial ownership"],
    patterns: ["budget ownership", "budget management", "managed budget", "department budget", "operational budget", "financial accountability", "cost center", "budget planning", "budget forecast", "budget variance", "expense management", "labor cost", "cost savings", "p&l", "profit and loss"],
  },
  {
    id: "executive_communication",
    domain: "leadership",
    tier: "A",
    label: "Executive communication",
    seekerLabel: "executive communication and leadership reporting experience",
    aliases: ["executive communication", "executive reporting", "leadership communication", "board communication"],
    patterns: ["executive communication", "executive reporting", "senior leadership", "leadership reporting", "board reporting", "c-suite", "executive presentation", "briefing", "briefed executives", "stakeholder communication", "leadership update", "business review", "steering committee"],
  },
  {
    id: "organizational_development",
    domain: "leadership",
    tier: "B",
    label: "Organizational development",
    seekerLabel: "organizational development and team-scaling experience",
    aliases: ["organizational development", "org development", "team scaling", "operating structure"],
    patterns: ["organizational development", "org development", "team scaling", "organizational design", "operating structure", "team structure", "role design", "career pathing", "management cadence", "team maturity", "leadership bench", "organizational effectiveness"],
  },
  {
    id: "talent_development",
    domain: "leadership",
    tier: "A",
    label: "Talent development",
    seekerLabel: "talent development, coaching, and employee growth experience",
    aliases: ["talent development", "employee development", "people development", "coaching"],
    patterns: ["talent development", "employee development", "people development", "coaching", "mentoring", "career development", "skills development", "performance coaching", "training plan", "development plan", "succession", "bench strength", "upskilling"],
  },
  {
    id: "contact_center_operations",
    domain: "customer_client",
    tier: "A",
    label: "Contact center operations",
    seekerLabel: "contact center and high-volume support operations experience",
    aliases: ["contact center manager", "call center manager", "contact center operations", "call center operations"],
    patterns: ["contact center", "call center", "high-volume support", "call volume", "handle time", "aht", "first contact resolution", "fcr", "queue management", "case volume", "ticket volume", "contact center operations", "support operations", "customer care operations"],
  },
  {
    id: "field_service_operations",
    domain: "operations",
    tier: "B",
    label: "Field service operations",
    seekerLabel: "field service, dispatch, and technician operations experience",
    aliases: ["field service manager", "field operations", "dispatch manager", "technician operations"],
    patterns: ["field service", "field operations", "dispatch", "technician dispatch", "work orders", "route optimization", "service appointments", "truck roll", "maintenance tickets", "technician productivity", "field technician", "service technician", "dispatch operations"],
  },
  {
    id: "mechanical_engineering",
    domain: "engineering",
    tier: "B",
    label: "Mechanical engineering",
    seekerLabel: "mechanical engineering and product/system design experience",
    aliases: ["mechanical engineer", "design engineer", "mechanical design"],
    patterns: ["mechanical engineering", "mechanical design", "cad", "solidworks", "autocad", "pro/e", "creo", "thermal analysis", "mechanical systems", "tolerance", "manufacturing design", "prototype", "product design", "gd&t"],
  },
  {
    id: "electrical_engineering",
    domain: "engineering",
    tier: "B",
    label: "Electrical engineering",
    seekerLabel: "electrical engineering, controls, or electronics experience",
    aliases: ["electrical engineer", "controls engineer", "electronics engineer"],
    patterns: ["electrical engineering", "controls", "plc", "hmi", "schematic", "circuit", "electronics", "power systems", "control systems", "automation controls", "scada", "instrumentation", "electrical design", "wiring diagrams"],
  },
  {
    id: "quality_management",
    domain: "operations",
    tier: "A",
    label: "Quality management",
    seekerLabel: "quality management, QA, and continuous improvement experience",
    aliases: ["quality manager", "quality management", "qa manager", "quality systems"],
    patterns: ["quality management", "quality systems", "quality control", "quality assurance", "qa", "qc", "inspection", "defect reduction", "corrective action", "capa", "root cause", "iso", "audit", "continuous improvement", "quality metrics"],
  },
  {
    id: "regulatory_affairs",
    domain: "legal_compliance",
    tier: "A",
    label: "Regulatory affairs",
    seekerLabel: "regulatory affairs and regulated-industry compliance experience",
    aliases: ["regulatory affairs", "regulatory specialist", "regulatory manager"],
    patterns: ["regulatory affairs", "regulatory submissions", "regulatory compliance", "fda", "dea", "epa", "filings", "regulated environment", "regulatory documentation", "compliance documentation", "policy interpretation", "regulatory review"],
  },
  {
  id: "cleaning_janitorial",
  domain: "facilities_service",
  tier: "C",
  label: "Cleaning / janitorial",
  seekerLabel: "cleaning, janitorial, or custodial experience",
  aliases: ["cleaner", "janitor", "custodian", "housekeeper", "commercial cleaner"],
  patterns: ["cleaner", "cleaning", "janitorial", "janitor", "custodian", "custodial", "housekeeping", "housekeeper", "commercial cleaning", "residential cleaning", "sanitation", "disinfecting", "trash removal", "floor care", "restroom cleaning"],
},
{
  id: "warehouse_forklift",
  domain: "logistics",
  tier: "C",
  label: "Warehouse / forklift",
  seekerLabel: "warehouse, forklift, or material handling experience",
  aliases: ["warehouse associate", "forklift operator", "fork truck driver", "material handler", "order picker"],
  patterns: ["warehouse", "forklift", "fork truck", "material handler", "order picking", "picking and packing", "shipping", "receiving", "loading", "unloading", "pallet jack", "inventory", "distribution center", "fulfillment center"],
},
{
  id: "general_labor",
  domain: "labor_trades",
  tier: "C",
  label: "General labor",
  seekerLabel: "general labor, helper, or hands-on work experience",
  aliases: ["general laborer", "laborer", "helper", "yard worker", "utility worker"],
  patterns: ["general labor", "laborer", "helper", "manual labor", "loading", "unloading", "site cleanup", "materials handling", "physical work", "hand tools", "yard work", "utility worker"],
},
{
  id: "maintenance_facilities",
  domain: "facilities_service",
  tier: "C",
  label: "Maintenance / facilities",
  seekerLabel: "maintenance, repair, or facilities support experience",
  aliases: ["maintenance worker", "maintenance technician", "facilities technician", "building maintenance"],
  patterns: ["maintenance", "maintenance technician", "maintenance worker", "facilities", "building maintenance", "repair", "preventive maintenance", "work orders", "basic electrical", "basic plumbing", "painting", "grounds maintenance", "facility upkeep"],
},
{
  id: "social_work_services",
  domain: "public_service",
  tier: "B",
  label: "Social work / social services",
  seekerLabel: "social work, case management, or human services experience",
  aliases: ["social worker", "case manager", "human services specialist", "family services worker", "youth advocate"],
  patterns: ["social worker", "social work", "case management", "case manager", "human services", "family services", "child welfare", "community support", "client advocacy", "intake", "referrals", "crisis intervention", "support services", "youth services"],
},
];


// Optional ontology expansion layer.
// Backward-compatible: existing engines can continue using UNIVERSAL_CAPABILITIES,
// buildUniversalCapabilityClusters(), buildUniversalTermAliases(), and buildWhySignals().
// Newer brain logic can opt into the richer graph through buildUniversalIntelligenceGraph().

export const UNIVERSAL_BEHAVIORAL_SIGNALS = {
  ownership: ["owned", "accountable", "responsible for", "led", "drove", "took ownership", "end-to-end"],
  execution: ["delivered", "implemented", "completed", "launched", "executed", "rolled out", "shipped"],
  problem_solving: ["resolved", "troubleshot", "diagnosed", "root cause", "remediated", "improved", "optimized"],
  customer_communication: ["customer communication", "client communication", "stakeholder communication", "explained", "de-escalated", "presented"],
  strategic_thinking: ["strategy", "roadmap", "market positioning", "business case", "prioritization", "operating model"],
  leadership_presence: ["mentored", "coached", "managed", "supervised", "performance management", "team development"],
  adaptability: ["change", "transition", "pivot", "adapted", "fast-paced", "ambiguous", "evolving environment"],
  analytical_reasoning: ["analysis", "metrics", "kpi", "forecast", "dashboard", "trend", "data-driven"],
  risk_discipline: ["risk", "compliance", "audit", "controls", "policy", "incident", "security", "safety"],
  operational_rigor: ["process", "sop", "workflow", "standardized", "quality", "sla", "continuous improvement"],

  decision_making: ["decision making", "made decisions", "judgment", "prioritized", "tradeoff", "resolved ambiguity", "chose approach"],
  conflict_resolution: ["conflict resolution", "de-escalated", "resolved conflict", "mediated", "difficult conversations", "complaint resolution"],
  negotiation: ["negotiated", "negotiation", "contract negotiation", "terms", "agreement", "renewal negotiation", "vendor negotiation"],
  coaching: ["coached", "mentored", "developed team", "coaching", "feedback", "performance coaching", "skills development"],
  stakeholder_alignment: ["stakeholder alignment", "aligned stakeholders", "cross-functional alignment", "buy-in", "consensus", "partnered with"],
  financial_acumen: ["budget", "p&l", "cost savings", "forecast", "financial analysis", "variance", "revenue", "margin", "labor savings"],
  change_leadership: ["change leadership", "change management", "transformation", "rollout", "adoption", "process change", "organizational change"],
  ambiguity_management: ["ambiguity", "ambiguous", "undefined", "built from scratch", "no playbook", "fast-paced", "evolving"],
  innovation: ["innovation", "created", "designed", "built", "modernized", "automated", "new process", "new system"],
  organizational_influence: ["influenced", "influence", "without authority", "stakeholder buy-in", "executive alignment", "cross-functional leadership"],
};

export const UNIVERSAL_EVIDENCE_WEIGHTS = {
  direct_title: 10,
  direct_responsibility: 9,
  quantified_outcome: 9,
  project_evidence: 8,
  tool_evidence: 7,
  certification: 7,
  domain_context: 6,
  repeated_pattern: 6,
  adjacent_signal: 4,
  declared_soft_skill: 2,
};

export const UNIVERSAL_CAPABILITY_RELATIONSHIPS = {
  executive_leadership: {
    related: ["business_strategy", "people_leadership", "finance_accounting", "operations_process_improvement", "partnerships_alliances"],
    progressionTo: ["board_advisory", "enterprise_strategy", "investor_relations"],
    behaviors: ["ownership", "strategic_thinking", "leadership_presence"],
  },
  business_strategy: {
    related: ["executive_leadership", "product_management", "marketing_growth", "data_analytics_bi", "partnerships_alliances"],
    progressionTo: ["executive_leadership", "enterprise_strategy"],
    behaviors: ["strategic_thinking", "analytical_reasoning", "ownership"],
  },
  people_leadership: {
    related: ["training_enablement", "hr_people_operations", "operations_process_improvement", "project_management"],
    progressionTo: ["program_portfolio_management", "executive_leadership"],
    behaviors: ["leadership_presence", "ownership", "customer_communication"],
  },
  project_management: {
    related: ["program_portfolio_management", "business_analysis", "change_management", "technical_program_management"],
    progressionTo: ["program_portfolio_management", "technical_program_management", "product_management"],
    behaviors: ["execution", "ownership", "operational_rigor"],
  },
  program_portfolio_management: {
    related: ["project_management", "technical_program_management", "business_strategy", "change_management"],
    progressionTo: ["executive_leadership", "business_strategy"],
    behaviors: ["strategic_thinking", "execution", "ownership"],
  },
  product_management: {
    related: ["business_strategy", "ux_ui_design", "software_engineering", "data_analytics_bi", "business_analysis"],
    progressionTo: ["business_strategy", "executive_leadership"],
    behaviors: ["strategic_thinking", "customer_communication", "execution"],
  },
  desktop_technical_support: {
    related: ["endpoint_management", "customer_service_support", "identity_access_management", "it_service_management"],
    progressionTo: ["systems_administration", "cloud_infrastructure", "cybersecurity_operations", "service_delivery"],
    behaviors: ["problem_solving", "customer_communication", "execution"],
  },
  endpoint_management: {
    related: ["desktop_technical_support", "identity_access_management", "systems_administration", "cybersecurity_operations"],
    progressionTo: ["systems_administration", "cloud_infrastructure", "devops_sre"],
    behaviors: ["problem_solving", "operational_rigor", "risk_discipline"],
  },
  identity_access_management: {
    related: ["cybersecurity_operations", "endpoint_management", "systems_administration", "governance_risk_compliance"],
    progressionTo: ["cybersecurity_operations", "governance_risk_compliance", "platform_architecture"],
    behaviors: ["risk_discipline", "operational_rigor", "problem_solving"],
  },
  systems_administration: {
    related: ["desktop_technical_support", "endpoint_management", "networking_infrastructure", "cloud_infrastructure", "database_administration"],
    progressionTo: ["cloud_infrastructure", "devops_sre", "platform_architecture"],
    behaviors: ["problem_solving", "operational_rigor", "execution"],
  },
  cloud_infrastructure: {
    related: ["systems_administration", "networking_infrastructure", "devops_sre", "platform_architecture", "cybersecurity_operations"],
    progressionTo: ["platform_architecture", "devops_sre", "technical_program_management"],
    behaviors: ["problem_solving", "risk_discipline", "execution"],
  },
  networking_infrastructure: {
    related: ["systems_administration", "cloud_infrastructure", "cybersecurity_operations", "telecommunications"],
    progressionTo: ["cloud_infrastructure", "platform_architecture", "cybersecurity_operations"],
    behaviors: ["problem_solving", "operational_rigor", "risk_discipline"],
  },
  cybersecurity_operations: {
    related: ["identity_access_management", "networking_infrastructure", "governance_risk_compliance", "business_continuity"],
    progressionTo: ["governance_risk_compliance", "platform_architecture", "security_leadership"],
    behaviors: ["risk_discipline", "problem_solving", "operational_rigor"],
  },
  governance_risk_compliance: {
    related: ["cybersecurity_operations", "legal_compliance", "business_continuity", "safety_environmental_compliance"],
    progressionTo: ["security_leadership", "executive_leadership"],
    behaviors: ["risk_discipline", "analytical_reasoning", "operational_rigor"],
  },
  software_engineering: {
    related: ["product_management", "qa_testing", "devops_sre", "platform_architecture", "data_engineering"],
    progressionTo: ["platform_architecture", "technical_program_management", "product_management"],
    behaviors: ["problem_solving", "execution", "analytical_reasoning"],
  },
  data_analytics_bi: {
    related: ["data_engineering", "business_analysis", "finance_accounting", "operations_process_improvement", "revenue_operations"],
    progressionTo: ["data_engineering", "business_strategy", "ai_machine_learning"],
    behaviors: ["analytical_reasoning", "strategic_thinking", "execution"],
  },
  data_engineering: {
    related: ["data_analytics_bi", "software_engineering", "database_administration", "ai_machine_learning"],
    progressionTo: ["platform_architecture", "ai_machine_learning", "devops_sre"],
    behaviors: ["analytical_reasoning", "problem_solving", "operational_rigor"],
  },
  ai_machine_learning: {
    related: ["data_engineering", "software_engineering", "data_analytics_bi", "product_management"],
    progressionTo: ["platform_architecture", "business_strategy", "technical_program_management"],
    behaviors: ["analytical_reasoning", "problem_solving", "strategic_thinking"],
  },
  customer_service_support: {
    related: ["customer_success_account_management", "desktop_technical_support", "service_delivery", "hospitality_guest_experience", "retail_store_operations"],
    progressionTo: ["customer_success_account_management", "service_delivery", "people_leadership"],
    behaviors: ["customer_communication", "problem_solving", "adaptability"],
  },
  customer_success_account_management: {
    related: ["customer_service_support", "service_delivery", "sales_business_development", "revenue_operations"],
    progressionTo: ["service_delivery", "sales_business_development", "executive_leadership"],
    behaviors: ["customer_communication", "ownership", "strategic_thinking"],
  },
  service_delivery: {
    related: ["customer_success_account_management", "it_service_management", "operations_process_improvement", "project_management"],
    progressionTo: ["program_portfolio_management", "executive_leadership", "business_strategy"],
    behaviors: ["ownership", "operational_rigor", "customer_communication"],
  },
  sales_business_development: {
    related: ["customer_success_account_management", "marketing_growth", "partnerships_alliances", "revenue_operations"],
    progressionTo: ["revenue_operations", "business_strategy", "executive_leadership"],
    behaviors: ["customer_communication", "ownership", "strategic_thinking"],
  },
  marketing_growth: {
    related: ["sales_business_development", "content_communications", "data_analytics_bi", "business_strategy"],
    progressionTo: ["business_strategy", "product_management", "executive_leadership"],
    behaviors: ["strategic_thinking", "analytical_reasoning", "execution"],
  },
  operations_process_improvement: {
    related: ["project_management", "data_analytics_bi", "procurement_vendor_management", "safety_environmental_compliance", "service_delivery"],
    progressionTo: ["program_portfolio_management", "business_strategy", "executive_leadership"],
    behaviors: ["operational_rigor", "analytical_reasoning", "ownership"],
  },
  manufacturing_production: {
    related: ["operations_process_improvement", "safety_environmental_compliance", "logistics_supply_chain", "qa_testing"],
    progressionTo: ["operations_process_improvement", "people_leadership", "safety_environmental_compliance"],
    behaviors: ["operational_rigor", "execution", "risk_discipline"],
  },
  logistics_supply_chain: {
    related: ["transportation_fleet", "procurement_vendor_management", "operations_process_improvement", "manufacturing_production"],
    progressionTo: ["operations_process_improvement", "procurement_vendor_management", "people_leadership"],
    behaviors: ["operational_rigor", "execution", "problem_solving"],
  },
  finance_accounting: {
    related: ["financial_planning_analysis", "banking_financial_services", "data_analytics_bi", "executive_leadership"],
    progressionTo: ["financial_planning_analysis", "business_strategy", "executive_leadership"],
    behaviors: ["analytical_reasoning", "risk_discipline", "operational_rigor"],
  },
  hr_people_operations: {
    related: ["people_leadership", "recruiting_talent_acquisition", "employee_benefits_workers_comp", "training_enablement"],
    progressionTo: ["people_leadership", "executive_leadership"],
    behaviors: ["customer_communication", "risk_discipline", "leadership_presence"],
  },
  recruiting_talent_acquisition: {
    related: ["hr_people_operations", "sales_business_development", "customer_service_support", "business_strategy"],
    progressionTo: ["hr_people_operations", "people_leadership", "business_strategy"],
    behaviors: ["customer_communication", "analytical_reasoning", "ownership"],
  },
  legal_compliance: {
    related: ["governance_risk_compliance", "hr_people_operations", "finance_accounting", "business_continuity"],
    progressionTo: ["governance_risk_compliance", "executive_leadership"],
    behaviors: ["risk_discipline", "analytical_reasoning", "operational_rigor"],
  },
  healthcare_administration: {
    related: ["clinical_operations", "clinical_laboratory_science", "insurance_claims", "customer_service_support"],
    progressionTo: ["clinical_operations", "operations_process_improvement", "people_leadership"],
    behaviors: ["customer_communication", "risk_discipline", "operational_rigor"],
  },
  education_training: {
    related: ["training_enablement", "people_leadership", "content_communications", "community_social_services"],
    progressionTo: ["training_enablement", "people_leadership", "instructional_design"],
    behaviors: ["customer_communication", "leadership_presence", "adaptability"],
  },
  government_military: {
    related: ["public_safety_security", "business_continuity", "project_management", "security_risk"],
    progressionTo: ["operations_process_improvement", "people_leadership", "public_safety_security"],
    behaviors: ["risk_discipline", "execution", "ownership"],
  },
  public_safety_security: {
    related: ["government_military", "business_continuity", "customer_service_support", "safety_environmental_compliance"],
    progressionTo: ["people_leadership", "operations_process_improvement", "security_risk"],
    behaviors: ["risk_discipline", "adaptability", "customer_communication"],
  },

  customer_retention: {
    related: ["customer_success_account_management", "customer_health_management", "renewals_expansion", "service_delivery", "voice_of_customer"],
    progressionTo: ["customer_success_account_management", "renewals_expansion", "executive_leadership"],
    behaviors: ["ownership", "customer_communication", "analytical_reasoning"],
  },
  customer_onboarding: {
    related: ["customer_success_account_management", "customer_adoption", "training_enablement", "service_delivery", "project_management"],
    progressionTo: ["customer_adoption", "service_delivery", "customer_success_account_management"],
    behaviors: ["execution", "customer_communication", "operational_rigor"],
  },
  customer_adoption: {
    related: ["customer_onboarding", "customer_health_management", "customer_success_account_management", "product_management", "training_enablement"],
    progressionTo: ["customer_success_account_management", "service_delivery", "business_strategy"],
    behaviors: ["customer_communication", "analytical_reasoning", "execution"],
  },
  customer_health_management: {
    related: ["customer_retention", "customer_adoption", "voice_of_customer", "data_analytics_bi", "renewals_expansion"],
    progressionTo: ["customer_success_account_management", "revenue_operations", "business_strategy"],
    behaviors: ["analytical_reasoning", "ownership", "customer_communication"],
  },
  renewals_expansion: {
    related: ["customer_retention", "customer_success_account_management", "sales_business_development", "revenue_operations", "executive_business_reviews"],
    progressionTo: ["sales_business_development", "revenue_operations", "executive_leadership"],
    behaviors: ["negotiation", "ownership", "strategic_thinking"],
  },
  voice_of_customer: {
    related: ["customer_health_management", "product_management", "data_analytics_bi", "customer_success_account_management", "marketing_growth"],
    progressionTo: ["product_management", "business_strategy", "executive_leadership"],
    behaviors: ["customer_communication", "analytical_reasoning", "strategic_thinking"],
  },
  executive_business_reviews: {
    related: ["customer_success_account_management", "service_delivery", "executive_communication", "customer_retention", "renewals_expansion"],
    progressionTo: ["business_strategy", "executive_leadership", "partnerships_alliances"],
    behaviors: ["executive_communication", "stakeholder_alignment", "strategic_thinking"],
  },
  incident_management: {
    related: ["major_incident_management", "problem_management", "it_service_management", "service_delivery", "service_operations"],
    progressionTo: ["major_incident_management", "service_delivery", "operations_process_improvement"],
    behaviors: ["problem_solving", "execution", "risk_discipline"],
  },
  problem_management: {
    related: ["incident_management", "major_incident_management", "quality_management", "operations_process_improvement", "it_service_management"],
    progressionTo: ["service_delivery", "quality_management", "operations_process_improvement"],
    behaviors: ["problem_solving", "analytical_reasoning", "operational_rigor"],
  },
  major_incident_management: {
    related: ["incident_management", "problem_management", "executive_communication", "business_continuity", "service_operations"],
    progressionTo: ["service_delivery", "operations_process_improvement", "executive_leadership"],
    behaviors: ["risk_discipline", "decision_making", "executive_communication"],
  },
  service_operations: {
    related: ["service_delivery", "sla_management", "capacity_planning", "workforce_management", "operational_reporting"],
    progressionTo: ["service_delivery", "operations_process_improvement", "program_portfolio_management"],
    behaviors: ["operational_rigor", "ownership", "analytical_reasoning"],
  },
  sla_management: {
    related: ["service_delivery", "service_operations", "operational_reporting", "it_service_management", "quality_management"],
    progressionTo: ["service_delivery", "operations_process_improvement", "executive_leadership"],
    behaviors: ["operational_rigor", "analytical_reasoning", "ownership"],
  },
  capacity_planning: {
    related: ["workforce_management", "operational_reporting", "operations_process_improvement", "service_operations", "finance_accounting"],
    progressionTo: ["operations_process_improvement", "program_portfolio_management", "executive_leadership"],
    behaviors: ["analytical_reasoning", "financial_acumen", "operational_rigor"],
  },
  workforce_management: {
    related: ["capacity_planning", "people_leadership", "service_operations", "operations_process_improvement", "data_analytics_bi"],
    progressionTo: ["people_leadership", "operations_process_improvement", "executive_leadership"],
    behaviors: ["analytical_reasoning", "leadership_presence", "operational_rigor"],
  },
  operational_reporting: {
    related: ["data_analytics_bi", "service_operations", "sla_management", "operations_process_improvement", "executive_communication"],
    progressionTo: ["data_analytics_bi", "business_strategy", "executive_leadership"],
    behaviors: ["analytical_reasoning", "executive_communication", "operational_rigor"],
  },
  budget_ownership: {
    related: ["finance_accounting", "financial_planning_analysis", "executive_leadership", "operations_process_improvement", "capacity_planning"],
    progressionTo: ["executive_leadership", "business_strategy", "financial_planning_analysis"],
    behaviors: ["financial_acumen", "ownership", "decision_making"],
  },
  executive_communication: {
    related: ["stakeholder_alignment", "executive_leadership", "business_strategy", "executive_business_reviews", "operational_reporting"],
    progressionTo: ["executive_leadership", "business_strategy", "partnerships_alliances"],
    behaviors: ["executive_communication", "stakeholder_alignment", "strategic_thinking"],
  },
  organizational_development: {
    related: ["people_leadership", "talent_development", "change_management", "training_enablement", "business_strategy"],
    progressionTo: ["people_leadership", "executive_leadership", "business_strategy"],
    behaviors: ["leadership_presence", "change_leadership", "organizational_influence"],
  },
  talent_development: {
    related: ["people_leadership", "training_enablement", "organizational_development", "hr_people_operations"],
    progressionTo: ["people_leadership", "organizational_development", "executive_leadership"],
    behaviors: ["coaching", "leadership_presence", "customer_communication"],
  },
  contact_center_operations: {
    related: ["customer_service_support", "service_operations", "workforce_management", "operational_reporting", "sla_management"],
    progressionTo: ["service_delivery", "operations_process_improvement", "people_leadership"],
    behaviors: ["operational_rigor", "customer_communication", "analytical_reasoning"],
  },
  field_service_operations: {
    related: ["service_operations", "transportation_fleet", "workforce_management", "customer_service_support", "quality_management"],
    progressionTo: ["operations_process_improvement", "service_delivery", "people_leadership"],
    behaviors: ["execution", "operational_rigor", "problem_solving"],
  },
  mechanical_engineering: {
    related: ["manufacturing_production", "quality_management", "product_management", "safety_environmental_compliance"],
    progressionTo: ["engineering_leadership", "product_management", "operations_process_improvement"],
    behaviors: ["problem_solving", "analytical_reasoning", "execution"],
  },
  electrical_engineering: {
    related: ["manufacturing_production", "systems_administration", "networking_infrastructure", "quality_management"],
    progressionTo: ["engineering_leadership", "platform_architecture", "operations_process_improvement"],
    behaviors: ["problem_solving", "risk_discipline", "execution"],
  },
  quality_management: {
    related: ["operations_process_improvement", "manufacturing_production", "qa_testing", "safety_environmental_compliance", "problem_management"],
    progressionTo: ["operations_process_improvement", "people_leadership", "regulatory_affairs"],
    behaviors: ["operational_rigor", "risk_discipline", "analytical_reasoning"],
  },
  regulatory_affairs: {
    related: ["legal_compliance", "governance_risk_compliance", "healthcare_administration", "quality_management", "safety_environmental_compliance"],
    progressionTo: ["governance_risk_compliance", "executive_leadership", "legal_compliance"],
    behaviors: ["risk_discipline", "analytical_reasoning", "operational_rigor"],
  },
  cleaning_janitorial: {
  related: ["facilities_real_estate", "maintenance_facilities", "hospitality_guest_experience", "safety_environmental_compliance"],
  progressionTo: ["maintenance_facilities", "facilities_real_estate", "people_leadership"],
  behaviors: ["execution", "operational_rigor", "risk_discipline"],
},
warehouse_forklift: {
  related: ["logistics_supply_chain", "transportation_fleet", "manufacturing_production", "safety_environmental_compliance"],
  progressionTo: ["logistics_supply_chain", "transportation_fleet", "people_leadership"],
  behaviors: ["execution", "operational_rigor", "risk_discipline"],
},
general_labor: {
  related: ["construction_trades", "maintenance_facilities", "warehouse_forklift", "manufacturing_production"],
  progressionTo: ["construction_trades", "maintenance_facilities", "manufacturing_production"],
  behaviors: ["execution", "adaptability", "operational_rigor"],
},
maintenance_facilities: {
  related: ["facilities_real_estate", "construction_trades", "cleaning_janitorial", "safety_environmental_compliance"],
  progressionTo: ["facilities_real_estate", "construction_trades", "people_leadership"],
  behaviors: ["problem_solving", "execution", "operational_rigor"],
},
social_work_services: {
  related: ["community_social_services", "healthcare_administration", "education_training", "public_safety_security"],
  progressionTo: ["community_social_services", "clinical_operations", "people_leadership"],
  behaviors: ["customer_communication", "conflict_resolution", "risk_discipline"],
},
};

export const UNIVERSAL_ROLE_FAMILIES = {
  executive: ["executive_leadership", "business_strategy", "people_leadership", "budget_ownership", "executive_communication", "organizational_development", "finance_accounting", "partnerships_alliances"],
  technology: ["desktop_technical_support", "endpoint_management", "systems_administration", "networking_infrastructure", "cloud_infrastructure", "software_engineering", "devops_sre", "platform_architecture", "database_administration"],
  data_ai: ["data_analytics_bi", "data_engineering", "database_administration", "ai_machine_learning", "operational_reporting"],
  customer_revenue: ["customer_service_support", "customer_success_account_management", "customer_retention", "customer_onboarding", "customer_adoption", "customer_health_management", "renewals_expansion", "voice_of_customer", "executive_business_reviews", "service_delivery", "service_operations", "contact_center_operations", "sales_business_development", "marketing_growth", "revenue_operations"],
  service_operations: ["service_delivery", "service_operations", "sla_management", "incident_management", "problem_management", "major_incident_management", "capacity_planning", "workforce_management", "operational_reporting", "it_service_management"],
  operations_supply_chain: ["operations_process_improvement", "quality_management", "capacity_planning", "workforce_management", "operational_reporting", "manufacturing_production", "logistics_supply_chain", "procurement_vendor_management", "transportation_fleet", "field_service_operations", "safety_environmental_compliance", "warehouse_forklift", "general_labor"],
  people_public_service: ["people_leadership", "talent_development", "organizational_development", "hr_people_operations", "recruiting_talent_acquisition", "education_training", "training_enablement", "government_military", "public_safety_security", "community_social_services", "social_work_services"],
  healthcare_finance_legal: ["healthcare_administration", "clinical_operations", "clinical_laboratory_science", "finance_accounting", "financial_planning_analysis", "legal_compliance", "regulatory_affairs", "insurance_claims", "banking_financial_services"],
  engineering_trades: ["mechanical_engineering", "electrical_engineering", "construction_trades", "manufacturing_production", "quality_management", "safety_environmental_compliance", "field_service_operations", "maintenance_facilities"],
  facilities_basic_service: ["cleaning_janitorial", "maintenance_facilities", "facilities_real_estate", "hospitality_guest_experience"],
};

export function buildUniversalCapabilityClusters() {
  return UNIVERSAL_CAPABILITIES.reduce((acc, capability) => {
    acc[capability.id] = [
      ...(capability.aliases || []),
      ...(capability.patterns || []),
    ];
    return acc;
  }, {});
}

export function buildUniversalTermAliases() {
  return UNIVERSAL_CAPABILITIES.reduce((acc, capability) => {
    for (const alias of capability.aliases || []) {
      acc[alias] = Array.from(
        new Set([...(capability.aliases || []), ...(capability.patterns || [])])
      );
    }
    return acc;
  }, {});
}


export function buildUniversalIntelligenceGraph() {
  return UNIVERSAL_CAPABILITIES.reduce((acc, capability) => {
    const relationships = UNIVERSAL_CAPABILITY_RELATIONSHIPS[capability.id] || {};
    acc[capability.id] = {
      ...capability,
      related: relationships.related || [],
      progressionTo: relationships.progressionTo || [],
      behaviors: relationships.behaviors || [],
      relationshipMeta: relationships,
    };
    return acc;
  }, {});
}

export function buildUniversalRelationshipMap() {
  return UNIVERSAL_CAPABILITY_RELATIONSHIPS;
}

export function buildUniversalBehavioralSignals() {
  return UNIVERSAL_BEHAVIORAL_SIGNALS;
}

export function buildUniversalRoleFamilies() {
  return UNIVERSAL_ROLE_FAMILIES;
}

export function getCapabilityById(id) {
  return buildUniversalIntelligenceGraph()[id] || null;
}

export function getRelatedCapabilities(id) {
  const graph = buildUniversalIntelligenceGraph();
  const node = graph[id];
  if (!node) return [];

  return (node.related || [])
    .map((relatedId) => graph[relatedId])
    .filter(Boolean);
}

export function getProgressionCapabilities(id) {
  const graph = buildUniversalIntelligenceGraph();
  const node = graph[id];
  if (!node) return [];

  return (node.progressionTo || [])
    .map((nextId) => graph[nextId])
    .filter(Boolean);
}

export function buildWhySignals() {
  return UNIVERSAL_CAPABILITIES.map((capability) => ({
    id: capability.id,
    domain: capability.domain,
    tier: capability.tier,
    label: capability.label,
    seekerLabel: capability.seekerLabel,
    patterns: capability.patterns || [],
  }));
}
