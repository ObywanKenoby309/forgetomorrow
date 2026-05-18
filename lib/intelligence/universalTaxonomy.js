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
];

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
