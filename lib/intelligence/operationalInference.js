// lib/intelligence/operationalInference.js
// ForgeTomorrow shared operational inference layer.
// Purpose:
// - Use universalTaxonomy as vocabulary + relationship source.
// - Apply context bundles so generic words do not create false positives.
// - Return concise recruiter-facing conclusions, meanings, validation prompts,
//   and expandable evidence/detail metadata.
// Pure functions only. No React imports.

import {
  UNIVERSAL_CAPABILITIES,
  UNIVERSAL_CAPABILITY_RELATIONSHIPS,
  UNIVERSAL_BEHAVIORAL_SIGNALS,
  UNIVERSAL_ROLE_FAMILIES,
} from "@/lib/intelligence/universalTaxonomy";

function safeArr(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s
      .split(/\r?\n|,/g)
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }
  return [];
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return String(value || "");
}

function normalize(text = "") {
  return String(text || "").toLowerCase();
}

function unique(items = [], limit = 10) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const clean = String(item || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }

  return out;
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRegex(phrase = "") {
  const p = normalize(phrase).trim();
  if (!p) return null;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}([^a-z0-9]|$)`, "i");
}

function includesPhrase(text, phrase) {
  const clean = normalize(text);
  const rx = phraseRegex(phrase);
  return rx ? rx.test(clean) : false;
}

function countPhraseHits(text, terms = []) {
  const clean = normalize(text);
  return safeArr(terms).filter((term) => includesPhrase(clean, term));
}

function evidenceBasisFromSource(source = {}) {
  const raw = [
    ...safeArr(source?.highlights),
    ...safeArr(source?.bullets),
    ...safeArr(source?.description),
    ...safeArr(source?.details),
  ];

  if (raw.length) return unique(raw, 8);

  const text = textOf(source);
  return unique(
    text
      .split(/\r?\n/g)
      .map((x) => x.trim())
      .filter((x) => x.length >= 8),
    8
  );
}

// Context bundles:
// anchors = specific domain terms that must exist.
// support = generic terms that only increase confidence after anchors exist.
// This avoids "service" alone becoming food service, customer service, etc.
const CONTEXT_BUNDLES = {
  // ────────────────────────────────────────────────────────────────────────────
  // Executive / strategy / leadership
  // ────────────────────────────────────────────────────────────────────────────
  executive_leadership: {
    anchors: ["ceo", "chief executive officer", "founder", "executive leadership", "general manager", "p&l", "profit and loss", "board", "investor", "organizational leadership"],
    support: ["strategy", "ownership", "business model", "market positioning", "leadership", "company"],
  },
  business_strategy: {
    anchors: ["business strategy", "go-to-market", "market strategy", "competitive positioning", "operating model", "business case", "growth strategy", "strategic initiatives"],
    support: ["roadmap", "market analysis", "planning", "prioritization", "positioning"],
  },
  people_leadership: {
    anchors: ["managed team", "managed teams", "direct reports", "team leadership", "supervised", "performance management", "workforce planning", "hiring", "employee development"],
    support: ["coached", "mentored", "staffing", "leadership", "team"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Project / product / delivery
  // ────────────────────────────────────────────────────────────────────────────
  project_management: {
    anchors: ["project management", "managed projects", "project delivery", "implementation", "timeline", "milestones", "scope", "risk management", "stakeholder management", "jira", "agile", "scrum", "kanban"],
    support: ["budget", "delivery", "coordination", "requirements", "issue management"],
  },
  program_portfolio_management: {
    anchors: ["program management", "portfolio management", "pmo", "enterprise program", "multi-project", "steering committee", "dependency management", "executive reporting"],
    support: ["governance", "cadence", "delivery", "roadmap", "program"],
  },
  product_management: {
    anchors: ["product management", "product owner", "product roadmap", "user stories", "backlog", "prioritization", "mvp", "feature development", "release planning", "user research"],
    support: ["requirements", "roadmap", "users", "product strategy"],
  },
  change_management: {
    anchors: ["change management", "organizational change", "transformation", "adoption planning", "training rollout", "stakeholder adoption", "process transformation"],
    support: ["communications plan", "adoption", "training", "change"],
  },
  business_analysis: {
    anchors: ["business analysis", "requirements gathering", "requirements documentation", "functional requirements", "process mapping", "gap analysis", "stakeholder interviews", "acceptance criteria", "uat", "brd", "frd"],
    support: ["requirements", "analysis", "process", "stakeholder"],
  },
  technical_program_management: {
    anchors: ["technical program management", "technical roadmap", "engineering coordination", "cross-functional delivery", "system dependencies", "technical requirements", "release coordination", "architecture review"],
    support: ["platform delivery", "technical risk", "milestones", "delivery"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Technology / IT / security / data
  // ────────────────────────────────────────────────────────────────────────────
  desktop_technical_support: {
    anchors: ["desktop support", "desktop technician", "help desk", "service desk", "technical support", "tier 1", "tier 2", "tier ii", "troubleshooting", "end-user", "end user", "ticketing", "windows support", "hardware troubleshooting", "software troubleshooting", "user support", "public tech support", "general public tech support"],
    support: ["support", "service", "customer", "client", "issue resolution", "remote troubleshooting"],
  },
  endpoint_management: {
    anchors: ["intune", "sccm", "mecm", "jamf", "endpoint", "device management", "imaging", "workstation", "autopilot", "mdm", "hardware triage", "device repair", "software deployment", "hardware deployment"],
    support: ["hardware", "software", "deployment", "troubleshooting", "devices", "repair"],
  },
  identity_access_management: {
    anchors: ["active directory", "azure ad", "entra", "okta", "iam", "identity", "access management", "sso", "mfa", "rbac", "user provisioning", "permissions", "global protect", "vpn"],
    support: ["access", "account", "password", "security", "connectivity"],
  },
  networking_infrastructure: {
    anchors: ["cisco", "meraki", "routing", "switching", "network infrastructure", "tcp/ip", "dns", "dhcp", "vpn", "firewall", "wan", "lan", "connectivity"],
    support: ["network", "infrastructure", "access", "troubleshooting"],
  },
  systems_administration: {
    anchors: ["windows server", "linux", "server administration", "azure servers", "local servers", "server troubleshooting", "powershell", "bash", "vmware", "hyper-v", "patching", "backup", "disaster recovery"],
    support: ["server", "administration", "infrastructure", "troubleshooting"],
  },
  cloud_infrastructure: {
    anchors: ["azure", "aws", "gcp", "cloud infrastructure", "cloud migration", "terraform", "kubernetes", "docker", "devops", "ci/cd", "serverless"],
    support: ["cloud", "infrastructure", "deployment", "server"],
  },
  cybersecurity_operations: {
    anchors: ["cybersecurity", "security operations", "soc", "siem", "splunk", "sentinel", "incident response", "vulnerability", "edr", "crowdstrike", "defender", "quarantine", "infected devices", "threat"],
    support: ["security", "risk", "incident", "vulnerable", "response"],
  },
  governance_risk_compliance: {
    anchors: ["grc", "governance", "risk management", "compliance", "audit", "soc2", "iso 27001", "nist", "pci", "hipaa", "control testing", "risk assessment", "regulatory"],
    support: ["policy", "controls", "risk", "audit"],
  },
  it_service_management: {
    anchors: ["itil", "itsm", "incident management", "problem management", "change advisory", "cab", "service request", "knowledge base", "sla", "service level", "p1", "p2", "bridge calls"],
    support: ["service", "incident", "knowledge", "process", "support"],
  },
  software_engineering: {
    anchors: ["software engineering", "software development", "developer", "full stack", "frontend", "backend", "react", "next.js", "node.js", "typescript", "javascript", "python", "java", "c#", ".net", "api development", "microservices", "git"],
    support: ["software", "development", "code", "application"],
    strictAnchor: true,
  },
  qa_testing: {
    anchors: ["quality assurance", "software testing", "test cases", "test plans", "manual testing", "automated testing", "regression testing", "selenium", "cypress", "playwright", "defect tracking", "bug reports"],
    support: ["qa", "testing", "coverage", "defects"],
  },
  devops_sre: {
    anchors: ["devops", "site reliability", "sre", "ci/cd", "deployment automation", "observability", "monitoring", "incident postmortem", "reliability", "uptime", "terraform", "kubernetes", "docker", "github actions", "jenkins"],
    support: ["automation", "deployment", "monitoring", "reliability"],
  },
  platform_architecture: {
    anchors: ["platform architecture", "solution architecture", "enterprise architecture", "systems design", "scalable architecture", "reference architecture", "integration architecture", "api architecture", "distributed systems"],
    support: ["architecture", "platform", "integration", "systems"],
  },
  database_administration: {
    anchors: ["database administration", "dba", "sql server", "postgresql", "mysql", "oracle", "database tuning", "backup and restore", "replication", "database migration", "stored procedures", "indexing"],
    support: ["database", "query", "optimization"],
  },
  data_analytics_bi: {
    anchors: ["data analysis", "analytics", "business intelligence", "sql", "power bi", "tableau", "dashboard", "reporting", "metrics", "kpi", "forecasting", "data visualization"],
    support: ["weekly meeting", "customer", "analysis", "reporting"],
  },
  data_engineering: {
    anchors: ["data engineering", "etl", "elt", "data pipeline", "data warehouse", "snowflake", "databricks", "bigquery", "airflow", "spark"],
    support: ["pipeline", "warehouse", "data platform"],
  },
  ai_machine_learning: {
    anchors: ["artificial intelligence", "machine learning", "llm", "prompt engineering", "ai systems", "neural network", "model evaluation", "rag", "openai", "anthropic", "computer vision", "nlp"],
    support: ["model", "ai", "automation"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Customer / revenue / marketing
  // ────────────────────────────────────────────────────────────────────────────
  customer_service_support: {
    anchors: ["customer service", "customer support", "customer care", "client support", "call center", "contact center", "customer inquiries", "case management", "public tech support", "general public tech support"],
    support: ["support", "customer", "client", "inbound", "outbound", "issue resolution"],
  },
  customer_success_account_management: {
    anchors: ["customer success", "client success", "account management", "book of business", "customer onboarding", "renewals", "retention", "qbr", "health score", "adoption", "expansion", "upsell"],
    support: ["relationship", "portfolio", "customer", "account"],
  },
  service_delivery: {
    anchors: ["service delivery", "sla", "service level", "client delivery", "delivery operations", "escalation management", "operational review", "customer operations", "support delivery"],
    support: ["service", "delivery", "client", "operations"],
  },
  sales_business_development: {
    anchors: ["sales", "sold", "selling", "product sales", "service sales", "sales of services", "sales of best buy product", "prospecting", "lead generation", "pipeline", "quota", "closing", "crm"],
    support: ["customer", "client", "product", "service"],
  },
  revenue_operations: {
    anchors: ["revenue operations", "revops", "sales operations", "crm administration", "pipeline reporting", "forecasting", "salesforce administration", "hubspot administration", "territory planning", "lead routing"],
    support: ["pipeline", "crm", "reporting", "sales process"],
  },
  marketing_growth: {
    anchors: ["marketing", "growth marketing", "digital marketing", "campaign management", "brand strategy", "content marketing", "seo", "sem", "paid media", "email marketing", "demand generation", "marketing automation"],
    support: ["campaign", "brand", "content", "growth"],
  },
  partnerships_alliances: {
    anchors: ["partnerships", "strategic alliances", "channel partners", "partner ecosystem", "partner development", "co-selling", "reseller", "marketplace", "joint go-to-market", "partner enablement"],
    support: ["partner", "alliance", "channel"],
  },
  content_communications: {
    anchors: ["knowledgebase articles", "knowledge base articles", "technical writing", "documentation", "communications", "copywriting", "editorial", "internal communications", "knowledge articles", "content strategy"],
    support: ["writing", "training", "process", "content"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Operations / manufacturing / logistics / procurement / facilities
  // ────────────────────────────────────────────────────────────────────────────
  operations_process_improvement: {
    anchors: ["operations", "business operations", "process improvement", "workflow optimization", "sop", "kpi", "quality assurance", "continuous improvement", "lean", "six sigma", "resource planning", "vendor management"],
    support: ["workflow", "process", "quality", "planning"],
  },
  manufacturing_production: {
    anchors: ["manufacturing", "production", "assembly", "machine operator", "quality control", "plant operations", "inspection", "materials", "lean manufacturing"],
    support: ["safety", "maintenance", "quality", "production"],
  },
  logistics_supply_chain: {
    anchors: ["logistics", "supply chain", "warehouse", "inventory", "shipping", "receiving", "procurement", "purchasing", "freight", "distribution", "materials management", "vendor coordination"],
    support: ["inventory", "materials", "shipping", "vendor"],
  },
  procurement_vendor_management: {
    anchors: ["procurement", "sourcing", "vendor management", "supplier management", "rfp", "rfq", "contract negotiation", "purchase orders", "supplier performance", "vendor onboarding", "third-party management"],
    support: ["vendor", "supplier", "contract", "purchase"],
  },
  facilities_real_estate: {
    anchors: ["facilities", "workplace operations", "real estate", "property management", "space planning", "lease administration", "building maintenance", "site operations", "office operations"],
    support: ["building", "site", "workplace", "maintenance"],
  },
  safety_environmental_compliance: {
    anchors: ["safety", "ehs", "environmental health and safety", "osha", "incident investigation", "safety training", "risk assessment", "hazard analysis", "environmental compliance", "corrective actions"],
    support: ["risk", "hazard", "compliance", "training"],
  },
  business_continuity: {
    anchors: ["business continuity", "disaster recovery", "bcp", "drp", "continuity planning", "recovery plan", "contingency planning", "resilience"],
    support: ["continuity", "recovery", "resilience"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Finance / HR / legal / healthcare
  // ────────────────────────────────────────────────────────────────────────────
  finance_accounting: {
    anchors: ["finance", "accounting", "financial analysis", "budgeting", "forecasting", "accounts payable", "accounts receivable", "payroll", "reconciliation", "general ledger", "quickbooks"],
    support: ["budget", "ledger", "reconciliation", "audit"],
  },
  financial_planning_analysis: {
    anchors: ["fp&a", "financial planning", "variance analysis", "budget", "forecast", "forecasting", "financial reporting", "monthly financial reports", "financial model", "netsuite", "erp", "scenario analysis"],
    support: ["finance", "reporting", "analysis", "forecast"],
  },
  banking_financial_services: {
    anchors: ["banking", "financial services", "loan processing", "credit analysis", "mortgage", "branch operations", "deposits", "lending", "finra", "kyc", "aml"],
    support: ["customer accounts", "financial", "loan"],
  },
  hr_people_operations: {
    anchors: ["human resources", "hr", "people operations", "employee relations", "benefits", "compensation", "hris", "workday", "adp", "performance management", "employee engagement"],
    support: ["employee", "policy", "people", "benefits"],
  },
  recruiting_talent_acquisition: {
    anchors: ["recruiting", "talent acquisition", "sourcing", "candidate screening", "interview coordination", "applicant tracking", "ats", "job posting", "offer coordination", "talent pipeline"],
    support: ["candidate", "interview", "pipeline", "talent"],
  },
  employee_benefits_workers_comp: {
    anchors: ["employee benefits", "workers compensation", "worker's compensation", "feca", "claims case management", "benefits administration", "leave administration", "department of labor", "case documentation"],
    support: ["claims", "benefits", "documentation", "case"],
  },
  legal_compliance: {
    anchors: ["legal", "paralegal", "legal assistant", "contracts", "compliance", "regulatory", "policy review", "case management", "document review", "legal research", "privacy"],
    support: ["policy", "review", "case", "documents"],
  },
  insurance_claims: {
    anchors: ["insurance", "claims", "claims processing", "claims review", "underwriting", "policy review", "coverage", "loss runs", "appeals", "workers compensation claims"],
    support: ["case documentation", "benefits claims", "claims"],
  },
  healthcare_administration: {
    anchors: ["healthcare", "medical office", "patient scheduling", "patient care", "clinical support", "medical records", "emr", "ehr", "hipaa", "insurance verification", "billing", "claims", "front desk"],
    support: ["patient", "medical", "records", "billing"],
  },
  clinical_operations: {
    anchors: ["clinical operations", "clinic operations", "patient flow", "care coordination", "clinical workflow", "provider scheduling", "medical office operations", "patient experience", "ehr", "emr", "hipaa"],
    support: ["clinical", "patient", "workflow", "provider"],
  },
  clinical_laboratory_science: {
    anchors: ["clinical laboratory scientist", "medical laboratory scientist", "medical technologist", "laboratory testing", "specimen", "clinical lab", "laboratory certification", "ascp", "amt"],
    support: ["lab", "laboratory", "testing", "specimen"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Education / public service / trades / hospitality / retail / creative
  // ────────────────────────────────────────────────────────────────────────────
  education_training: {
    anchors: ["education", "teaching", "instruction", "curriculum", "lesson planning", "classroom management", "e-learning", "instructional design"],
    support: ["training", "coaching", "facilitation", "learning"],
  },
  training_enablement: {
    anchors: ["training", "enablement", "onboarding", "curriculum", "knowledge transfer", "facilitation", "training materials", "trained", "training of new"],
    support: ["documentation", "coaching", "process", "knowledge"],
  },
  government_military: {
    anchors: ["department of defense", "dod", "army", "air force", "navy", "marines", "federal", "government contract", "clearance", "classified", "opm", "command and control"],
    support: ["government", "military", "federal", "security"],
  },
  public_safety_security: {
    anchors: ["public safety", "security", "corrections", "law enforcement", "incident response", "transport officer", "special response", "conflict resolution", "emergency response", "access control"],
    support: ["safety", "response", "security", "incident"],
  },
  community_social_services: {
    anchors: ["case management", "community outreach", "social services", "client advocacy", "intake", "referrals", "crisis intervention", "program eligibility", "support services", "family services"],
    support: ["community", "client", "services", "case"],
  },
  food_service_operations: {
    anchors: ["food service", "restaurant", "kitchen", "servsafe", "menu", "front of house", "back of house", "food safety", "server", "serving", "waiter", "waitress", "chef", "cook", "dishwasher", "catering"],
    support: ["guest", "shift", "service", "customer", "labor scheduling"],
    strictAnchor: true,
  },
  hospitality_guest_experience: {
    anchors: ["hospitality", "guest experience", "front desk", "hotel", "reservations", "guest services", "event coordination", "service recovery", "guest satisfaction"],
    support: ["guest", "customer", "service"],
    strictAnchor: true,
  },
  retail_store_operations: {
    anchors: ["retail", "store operations", "merchandising", "point of sale", "pos", "inventory", "loss prevention", "visual merchandising", "cash handling", "sales floor", "store manager", "best buy product", "best buy", "geek squad"],
    support: ["sales", "customer", "product", "service"],
  },
  construction_trades: {
    anchors: ["construction", "skilled trades", "maintenance technician", "electrical", "plumbing", "hvac", "carpentry", "blueprints", "site safety", "osha", "preventive maintenance"],
    support: ["repair", "installation", "maintenance", "safety"],
    strictAnchor: true,
  },
  transportation_fleet: {
    anchors: ["transportation", "fleet", "dispatch", "route planning", "drivers", "dot", "cdl", "logistics coordination", "vehicle maintenance", "delivery operations", "last mile"],
    support: ["route", "drivers", "delivery", "fleet"],
  },
  executive_administration: {
    anchors: ["executive assistant", "administrative support", "calendar management", "travel coordination", "expense reports", "meeting coordination", "office management", "executive communications", "scheduling"],
    support: ["administrative", "executive", "coordination"],
  },
  grant_nonprofit_programs: {
    anchors: ["grant management", "grant writing", "nonprofit", "fundraising", "donor management", "program coordination", "community outreach", "mission-driven", "impact reporting"],
    support: ["program", "grant", "community", "funding"],
  },
  research_analysis: {
    anchors: ["research", "analysis", "literature review", "market research", "policy analysis", "survey", "interviews", "qualitative research", "quantitative research", "insights", "findings"],
    support: ["recommendations", "data", "analysis"],
  },
  ux_ui_design: {
    anchors: ["ux design", "ui design", "user experience", "user interface", "figma", "wireframes", "prototypes", "design system", "usability testing", "user journeys", "accessibility"],
    support: ["design", "prototype", "users"],
  },
  creative_media_production: {
    anchors: ["creative production", "media production", "video editing", "graphic design", "adobe", "premiere", "after effects", "photoshop", "illustrator", "content production", "storyboarding", "brand assets"],
    support: ["creative", "media", "content", "design"],
  },
};

const GENERIC_TERMS = new Set([
  "support", "service", "training", "documentation", "software", "hardware",
  "installation", "operations", "process", "customer", "client", "communication",
  "repair", "deployment", "management", "analysis", "coordination", "administration",
]);

function getBundleForCapability(capabilityId) {
  return CONTEXT_BUNDLES[capabilityId] || null;
}

function bundleScore(capability, text) {
  const bundle = getBundleForCapability(capability.id);
  if (!bundle) return null;

  const anchorHits = countPhraseHits(text, bundle.anchors || []);
  const supportHits = countPhraseHits(text, bundle.support || []);

  if (!anchorHits.length) {
    return {
      allowed: false,
      score: 0,
      anchorHits,
      supportHits,
      reason: "missing-domain-anchor",
    };
  }

  const score = anchorHits.length * 6 + supportHits.length * 2;

  return {
    allowed: true,
    score,
    anchorHits: unique(anchorHits, 8),
    supportHits: unique(supportHits, 6),
    reason: "context-bundle",
  };
}

function taxonomyScore(capability, text) {
  let score = 0;
  const matchedTerms = [];
  let strongMatches = 0;

  for (const alias of capability.aliases || []) {
    if (includesPhrase(text, alias)) {
      const generic = GENERIC_TERMS.has(normalize(alias));
      score += generic ? 1 : 4;
      if (!generic) strongMatches += 1;
      matchedTerms.push(alias);
    }
  }

  for (const pattern of capability.patterns || []) {
    if (includesPhrase(text, pattern)) {
      const generic = GENERIC_TERMS.has(normalize(pattern));
      score += generic ? 1 : 3;
      if (!generic) strongMatches += 1;
      matchedTerms.push(pattern);
    }
  }

  return {
    score,
    matchedTerms: unique(matchedTerms, 8),
    strongMatches,
  };
}

function capabilityMatchScore(capability, sourceText) {
  const text = normalize(sourceText);
  const bundle = bundleScore(capability, text);
  const tax = taxonomyScore(capability, text);

  if (bundle && !bundle.allowed) {
    return {
      capability,
      score: 0,
      matchedTerms: [],
      anchorHits: [],
      supportHits: [],
      strongMatches: 0,
      source: bundle.reason,
    };
  }

  if (bundle && bundle.allowed) {
    return {
      capability,
      score: Math.max(bundle.score, tax.score),
      matchedTerms: unique([...bundle.anchorHits, ...bundle.supportHits, ...tax.matchedTerms], 10),
      anchorHits: bundle.anchorHits,
      supportHits: bundle.supportHits,
      strongMatches: bundle.anchorHits.length + tax.strongMatches,
      source: "context-bundle",
    };
  }

  // Capabilities without a bundle can still match through taxonomy, but require
  // either a non-generic direct phrase or multiple terms.
  if (tax.strongMatches === 0 && tax.matchedTerms.length < 2) {
    tax.score = 0;
  }

  return {
    capability,
    score: tax.score,
    matchedTerms: tax.matchedTerms,
    anchorHits: [],
    supportHits: [],
    strongMatches: tax.strongMatches,
    source: "taxonomy",
  };
}

export function detectCapabilityMatches(source = {}, options = {}) {
  const text = textOf(source);
  const minScore = Number.isFinite(options.minScore) ? options.minScore : 6;

  return UNIVERSAL_CAPABILITIES.map((capability) => capabilityMatchScore(capability, text))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.capability.tier || "B") !== (b.capability.tier || "B")) {
        return a.capability.tier === "A" ? -1 : 1;
      }
      return String(a.capability.label).localeCompare(String(b.capability.label));
    })
    .slice(0, options.limit || 12);
}

export function detectBehavioralSignals(source = {}) {
  const text = normalize(textOf(source));

  return Object.entries(UNIVERSAL_BEHAVIORAL_SIGNALS || {})
    .map(([key, terms]) => {
      const matchedTerms = safeArr(terms).filter((term) => includesPhrase(text, term));
      return {
        key,
        label: key
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        matchedTerms: unique(matchedTerms, 6),
      };
    })
    .filter((item) => item.matchedTerms.length)
    .slice(0, 8);
}

function roleFamiliesForCapabilities(matches = []) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const out = [];

  for (const [family, capabilityIds] of Object.entries(UNIVERSAL_ROLE_FAMILIES || {})) {
    const count = safeArr(capabilityIds).filter((id) => ids.includes(id)).length;
    if (count) {
      out.push({
        family,
        count,
        capabilityIds: safeArr(capabilityIds).filter((id) => ids.includes(id)),
      });
    }
  }

  return out.sort((a, b) => b.count - a.count);
}

function relatedCapabilityLabels(matches = [], limit = 5) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const relatedIds = [];

  for (const id of ids) {
    const rel = UNIVERSAL_CAPABILITY_RELATIONSHIPS?.[id]?.related || [];
    relatedIds.push(...rel);
  }

  const labels = unique(relatedIds, 12)
    .filter((id) => !ids.includes(id))
    .map((id) => UNIVERSAL_CAPABILITIES.find((cap) => cap.id === id)?.label)
    .filter(Boolean);

  return unique(labels, limit);
}

function progressionCapabilityLabels(matches = [], limit = 5) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const progressionIds = [];

  for (const id of ids) {
    const rel = UNIVERSAL_CAPABILITY_RELATIONSHIPS?.[id]?.progressionTo || [];
    progressionIds.push(...rel);
  }

  const labels = unique(progressionIds, 12)
    .filter((id) => !ids.includes(id))
    .map((id) => UNIVERSAL_CAPABILITIES.find((cap) => cap.id === id)?.label || id)
    .filter(Boolean);

  return unique(labels, limit);
}

function topCapabilityLabels(matches = [], limit = 5) {
  return unique(
    matches
      .slice(0, limit)
      .map((m) => m.capability?.label)
      .filter(Boolean),
    limit
  );
}

function hasCapability(matches = [], id) {
  return matches.some((m) => m.capability?.id === id);
}

function hasAnyCapability(matches = [], ids = []) {
  return ids.some((id) => hasCapability(matches, id));
}

function hasBehavior(behaviors = [], key) {
  return behaviors.some((b) => b.key === key);
}

function sentenceList(items = []) {
  const arr = unique(items, 6);
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function capabilityPhrase(labels = []) {
  return sentenceList(labels).toLowerCase();
}

function inferCapabilityConclusion(matches = [], behaviors = []) {
  if (!matches.length) {
    return "Role evidence is limited. Recruiter should validate scope, systems, ownership, and outcomes.";
  }

  // Technology support
  if (hasCapability(matches, "desktop_technical_support") && hasCapability(matches, "endpoint_management") && hasCapability(matches, "identity_access_management") && hasAnyCapability(matches, ["networking_infrastructure", "systems_administration", "cloud_infrastructure", "cybersecurity_operations", "it_service_management"])) {
    return "Enterprise support operations exposure with visible endpoint troubleshooting, access workflow support, escalation coordination, and infrastructure-adjacent support indicators.";
  }
  if (hasCapability(matches, "desktop_technical_support") && hasCapability(matches, "endpoint_management") && hasCapability(matches, "networking_infrastructure")) {
    return "Desktop support experience with endpoint troubleshooting and network/connectivity support indicators.";
  }
  if (hasCapability(matches, "desktop_technical_support") && hasCapability(matches, "endpoint_management")) {
    return "Technical support experience with practical endpoint troubleshooting and user-impact issue resolution indicators.";
  }
  if (hasCapability(matches, "training_enablement") && hasCapability(matches, "content_communications") && hasCapability(matches, "desktop_technical_support")) {
    return "Support operations experience with knowledge management, training, documentation, and client-facing troubleshooting indicators.";
  }
  if (hasCapability(matches, "retail_store_operations") && hasCapability(matches, "desktop_technical_support") && hasCapability(matches, "sales_business_development")) {
    return "Retail technology support experience with public-facing troubleshooting, service sales exposure, and consumer product support indicators.";
  }

  // Leadership / strategy / delivery
  if (hasCapability(matches, "executive_leadership") && hasCapability(matches, "business_strategy")) {
    return "Executive leadership exposure with business strategy, organizational ownership, and market or operating-model decision indicators.";
  }
  if (hasAnyCapability(matches, ["project_management", "technical_program_management", "program_portfolio_management"]) && hasAnyCapability(matches, ["business_analysis", "change_management", "operations_process_improvement"])) {
    return "Delivery leadership exposure with project execution, requirements translation, change/process coordination, and stakeholder alignment indicators.";
  }
  if (hasCapability(matches, "product_management") && hasAnyCapability(matches, ["business_strategy", "ux_ui_design", "software_engineering", "data_analytics_bi"])) {
    return "Product ownership exposure with roadmap, requirements, user insight, and cross-functional delivery indicators.";
  }

  // Customer / revenue
  if (hasCapability(matches, "customer_success_account_management") && hasCapability(matches, "service_delivery")) {
    return "Customer operations exposure with account relationship, service delivery, adoption, retention, or escalation-management indicators.";
  }
  if (hasCapability(matches, "sales_business_development") && hasAnyCapability(matches, ["customer_service_support", "customer_success_account_management", "revenue_operations"])) {
    return "Revenue-facing experience with customer interaction, sales motion, pipeline/process, or service conversion indicators.";
  }
  if (hasCapability(matches, "marketing_growth") && hasAnyCapability(matches, ["content_communications", "data_analytics_bi", "business_strategy"])) {
    return "Marketing execution exposure with campaign, content, analytics, and growth-positioning indicators.";
  }

  // Operations / logistics / manufacturing
  if (hasCapability(matches, "operations_process_improvement") && hasAnyCapability(matches, ["manufacturing_production", "logistics_supply_chain", "procurement_vendor_management", "safety_environmental_compliance"])) {
    return "Operational execution exposure with process improvement, workflow control, resource coordination, and quality/risk indicators.";
  }
  if (hasCapability(matches, "logistics_supply_chain") && hasAnyCapability(matches, ["procurement_vendor_management", "transportation_fleet", "manufacturing_production"])) {
    return "Supply chain or logistics exposure with inventory, vendor, transportation, distribution, or materials-flow indicators.";
  }
  if (hasCapability(matches, "manufacturing_production")) {
    return "Manufacturing or production environment exposure with quality, safety, process, or plant-floor execution indicators.";
  }

  // Finance / HR / legal / healthcare
  if (hasAnyCapability(matches, ["finance_accounting", "financial_planning_analysis"]) && hasCapability(matches, "data_analytics_bi")) {
    return "Finance operations exposure with reporting, forecasting, variance analysis, metrics, or decision-support indicators.";
  }
  if (hasCapability(matches, "hr_people_operations") && hasAnyCapability(matches, ["recruiting_talent_acquisition", "employee_benefits_workers_comp", "training_enablement"])) {
    return "People operations exposure with employee lifecycle, recruiting, benefits, policy, or training-support indicators.";
  }
  if (hasCapability(matches, "legal_compliance") && hasAnyCapability(matches, ["governance_risk_compliance", "insurance_claims", "hr_people_operations"])) {
    return "Legal, compliance, or regulated-casework exposure with policy, documentation, review, and risk-control indicators.";
  }
  if (hasAnyCapability(matches, ["healthcare_administration", "clinical_operations", "clinical_laboratory_science"])) {
    return "Healthcare environment exposure with patient, clinical workflow, records, compliance, or care coordination indicators.";
  }

  // Public service / education / trades / hospitality / creative
  if (hasAnyCapability(matches, ["government_military", "public_safety_security"]) && hasAnyCapability(matches, ["business_continuity", "operations_process_improvement", "community_social_services"])) {
    return "Public service or security environment exposure with risk discipline, response coordination, compliance, or community-facing responsibility indicators.";
  }
  if (hasAnyCapability(matches, ["education_training", "training_enablement"])) {
    return "Training or education exposure with instruction, curriculum, knowledge transfer, facilitation, or learner-support indicators.";
  }
  if (hasCapability(matches, "construction_trades") && hasAnyCapability(matches, ["safety_environmental_compliance", "facilities_real_estate", "operations_process_improvement"])) {
    return "Skilled trades or field operations exposure with installation, maintenance, safety, and site execution indicators.";
  }
  if (hasAnyCapability(matches, ["food_service_operations", "hospitality_guest_experience"])) {
    return "Hospitality or food service exposure with guest service, service recovery, shift execution, or customer-facing operations indicators.";
  }
  if (hasCapability(matches, "creative_media_production") && hasAnyCapability(matches, ["content_communications", "marketing_growth", "ux_ui_design"])) {
    return "Creative or media production exposure with content execution, brand assets, visual communication, or campaign-support indicators.";
  }

  const family = roleFamiliesForCapabilities(matches)?.[0]?.family || "";
  const primary = topCapabilityLabels(matches, 2);

  if (primary.length) {
    if (family === "technology") return `Technology operations evidence suggests ${capabilityPhrase(primary)} capability. Validate scope, systems, and ownership depth.`;
    if (family === "customer_revenue") return `Customer or revenue-facing evidence suggests ${capabilityPhrase(primary)} capability. Validate customer context, ownership, and outcomes.`;
    if (family === "operations_supply_chain") return `Operational evidence suggests ${capabilityPhrase(primary)} capability. Validate workflow scope, quality, and execution depth.`;
    if (family === "healthcare_finance_legal") return `Regulated professional evidence suggests ${capabilityPhrase(primary)} capability. Validate compliance, documentation, and decision boundaries.`;
    if (family === "people_public_service") return `People or public-service evidence suggests ${capabilityPhrase(primary)} capability. Validate responsibility scope and stakeholder context.`;
    return `Recruiter-visible evidence suggests ${capabilityPhrase(primary)} capability. Validate scope, ownership, and outcomes during review.`;
  }

  return "Role evidence is present, but recruiter should validate scope, systems, ownership, and outcomes.";
}

function inferRecruiterMeaning(matches = [], behaviors = []) {
  if (!matches.length) {
    return "Use interview discussion to confirm what the candidate owned, supported, improved, or delivered.";
  }

  const meaning = [];

  const meaningMap = [
    ["desktop_technical_support", "technical support delivery"],
    ["endpoint_management", "endpoint/device troubleshooting"],
    ["identity_access_management", "access and identity workflow support"],
    ["networking_infrastructure", "network or connectivity troubleshooting"],
    ["cybersecurity_operations", "security-adjacent incident or risk response"],
    ["it_service_management", "structured IT service/incident process exposure"],
    ["systems_administration", "systems administration or server support exposure"],
    ["cloud_infrastructure", "cloud or infrastructure-adjacent support"],
    ["training_enablement", "knowledge transfer or training ownership"],
    ["content_communications", "documentation or communication ownership"],
    ["data_analytics_bi", "reporting, KPI, or information processing exposure"],
    ["customer_service_support", "customer-facing issue resolution"],
    ["customer_success_account_management", "account relationship or adoption support"],
    ["service_delivery", "service delivery and escalation ownership"],
    ["sales_business_development", "sales or service conversion exposure"],
    ["retail_store_operations", "retail operations or consumer environment familiarity"],
    ["marketing_growth", "campaign, content, or growth execution"],
    ["project_management", "project execution and coordination"],
    ["program_portfolio_management", "program-level delivery coordination"],
    ["product_management", "roadmap, requirements, or product ownership"],
    ["business_analysis", "requirements translation and process analysis"],
    ["operations_process_improvement", "workflow or process improvement"],
    ["manufacturing_production", "production or plant-floor execution"],
    ["logistics_supply_chain", "inventory, distribution, or materials coordination"],
    ["procurement_vendor_management", "vendor, sourcing, or supplier coordination"],
    ["finance_accounting", "financial operations or accounting discipline"],
    ["financial_planning_analysis", "forecasting, budgeting, or variance analysis"],
    ["hr_people_operations", "employee lifecycle or people operations"],
    ["recruiting_talent_acquisition", "candidate pipeline or hiring workflow"],
    ["legal_compliance", "policy, documentation, or regulatory review"],
    ["healthcare_administration", "patient, records, or healthcare workflow support"],
    ["clinical_operations", "clinical workflow or patient care coordination"],
    ["government_military", "government or military environment discipline"],
    ["public_safety_security", "safety, security, or response judgment"],
    ["education_training", "instruction or learner support"],
    ["construction_trades", "field installation, maintenance, or repair execution"],
    ["hospitality_guest_experience", "guest service or service recovery"],
    ["food_service_operations", "food service or shift execution"],
    ["creative_media_production", "creative production or visual communication"],
  ];

  for (const [id, phrase] of meaningMap) {
    if (hasCapability(matches, id)) meaning.push(phrase);
  }

  const core = unique(meaning, 4);
  if (!core.length) {
    return "Recruiter should use the visible evidence as a starting point and validate role depth, ownership level, and measurable outcomes.";
  }

  let sentence = `Recruiter should read this as ${sentenceList(core)}.`;

  const validationHints = [];
  if (hasBehavior(behaviors, "risk_discipline")) validationHints.push("confirm risk, controls, escalation, compliance, security, or safety judgment");
  if (hasBehavior(behaviors, "operational_rigor")) validationHints.push("confirm process discipline and repeatable execution");
  if (hasBehavior(behaviors, "analytical_reasoning")) validationHints.push("confirm how information, metrics, or analysis influenced decisions");
  if (hasBehavior(behaviors, "customer_communication")) validationHints.push("confirm communication quality with users, customers, or stakeholders");
  if (hasBehavior(behaviors, "leadership_presence")) validationHints.push("confirm leadership scope and accountability boundaries");

  if (validationHints.length) {
    sentence += ` Recruiter should ${sentenceList(validationHints.slice(0, 2))}.`;
  }

  return sentence;
}

function inferValidationPrompt(matches = [], behaviors = []) {
  if (!matches.length) {
    return "Walk me through the scope of this role, the systems involved, and one example of work you owned from issue to outcome.";
  }

  if (hasCapability(matches, "desktop_technical_support") && hasCapability(matches, "endpoint_management")) {
    return "Ask for one real support scenario showing issue type, tools used, ownership level, escalation path, and outcome.";
  }
  if (hasCapability(matches, "identity_access_management")) {
    return "Ask for one example involving access, identity, account, or permission support and clarify boundaries of responsibility.";
  }
  if (hasCapability(matches, "networking_infrastructure")) {
    return "Ask for one connectivity or infrastructure-support example, including symptoms, troubleshooting path, and handoff/escalation point.";
  }
  if (hasCapability(matches, "cybersecurity_operations")) {
    return "Ask for one incident, quarantine, vulnerability, or risk-response example and clarify whether they owned, assisted, or escalated.";
  }
  if (hasAnyCapability(matches, ["project_management", "technical_program_management", "program_portfolio_management"])) {
    return "Ask for one project example showing scope, stakeholders, timeline, risks, and final outcome.";
  }
  if (hasCapability(matches, "people_leadership")) {
    return "Ask for team size, decision authority, performance responsibility, and one leadership challenge they handled.";
  }
  if (hasAnyCapability(matches, ["customer_success_account_management", "service_delivery", "sales_business_development"])) {
    return "Ask for one customer or account example showing objective, action taken, and business result.";
  }
  if (hasAnyCapability(matches, ["operations_process_improvement", "manufacturing_production", "logistics_supply_chain"])) {
    return "Ask for one workflow or operations example showing process, constraints, quality/risk factors, and measurable result.";
  }
  if (hasAnyCapability(matches, ["finance_accounting", "financial_planning_analysis", "data_analytics_bi"])) {
    return "Ask for one reporting, budget, forecast, or analysis example showing decision impact and accuracy expectations.";
  }
  if (hasAnyCapability(matches, ["hr_people_operations", "recruiting_talent_acquisition", "employee_benefits_workers_comp"])) {
    return "Ask for one employee, candidate, benefits, or people-process example showing policy boundaries and stakeholder handling.";
  }
  if (hasAnyCapability(matches, ["legal_compliance", "governance_risk_compliance", "insurance_claims"])) {
    return "Ask for one regulated review or case example showing documentation, risk judgment, and decision boundaries.";
  }
  if (hasAnyCapability(matches, ["healthcare_administration", "clinical_operations", "clinical_laboratory_science"])) {
    return "Ask for one healthcare workflow example showing patient/context sensitivity, documentation, compliance, and handoff responsibility.";
  }
  if (hasAnyCapability(matches, ["education_training", "training_enablement"])) {
    return "Ask for one training or instruction example showing audience, material created, adoption, and outcome.";
  }
  if (hasAnyCapability(matches, ["public_safety_security", "government_military"])) {
    return "Ask for one high-responsibility situation showing protocol, judgment, communication, and outcome.";
  }
  if (hasAnyCapability(matches, ["retail_store_operations", "hospitality_guest_experience", "food_service_operations"])) {
    return "Ask for one customer-facing operations example showing service recovery, pace, judgment, and outcome.";
  }

  return "Ask for one concrete example showing scope, ownership, tools used, and outcome.";
}

export function detectOperationalSignals(source = {}) {
  return topCapabilityLabels(detectCapabilityMatches(source), 8);
}

export function inferOperationalConclusion(source = {}) {
  const capabilityMatches = detectCapabilityMatches(source, { limit: 12 });
  const behavioralSignals = detectBehavioralSignals(source);
  const evidenceBasis = evidenceBasisFromSource(source);

  const conclusion = inferCapabilityConclusion(capabilityMatches, behavioralSignals);
  const recruiterMeaning = inferRecruiterMeaning(capabilityMatches, behavioralSignals);
  const validationPrompt = inferValidationPrompt(capabilityMatches, behavioralSignals);

  return {
    signals: topCapabilityLabels(capabilityMatches, 10),
    capabilityMatches: capabilityMatches.map((m) => ({
      id: m.capability.id,
      label: m.capability.label,
      domain: m.capability.domain,
      tier: m.capability.tier,
      score: m.score,
      matchedTerms: m.matchedTerms,
      anchorHits: m.anchorHits,
      supportHits: m.supportHits,
      source: m.source,
    })),
    behavioralSignals,
    relatedCapabilities: relatedCapabilityLabels(capabilityMatches, 6),
    progressionCapabilities: progressionCapabilityLabels(capabilityMatches, 5),
    conclusion,
    recruiterMeaning,
    evidenceBasis,
    validationPrompt,
  };
}

export function inferCandidateOperationalProfile({
  experience = [],
  skills = [],
  projects = [],
  hasResume = false,
} = {}) {
  const experienceList = safeArr(experience);
  const projectList = safeArr(projects);
  const skillList = safeArr(skills);

  const roleInferences = experienceList.map((exp) => inferOperationalConclusion(exp));

  const combinedSource = {
    experience: experienceList,
    skills: skillList,
    projects: projectList,
  };

  const combinedInference = inferOperationalConclusion(combinedSource);
  const projectInference = projectList.length ? inferOperationalConclusion({ projects: projectList }) : null;

  const allSignals = unique(
    [
      ...combinedInference.signals,
      ...roleInferences.flatMap((item) => item.signals || []),
      ...(projectInference?.signals || []),
    ],
    14
  );

  const validationFocus = unique(
    [
      !projectList.length ? "Validate project/work examples because structured portfolio projects are not yet visible." : "",
      !hasResume ? "Confirm resume source evidence before final evaluation." : "",
      combinedInference.validationPrompt,
      ...roleInferences.slice(0, 2).map((item) => item.validationPrompt),
    ],
    5
  );

  return {
    overallConclusion: combinedInference.conclusion,
    recruiterMeaning: combinedInference.recruiterMeaning,
    signals: allSignals,
    capabilityMatches: combinedInference.capabilityMatches,
    behavioralSignals: combinedInference.behavioralSignals,
    relatedCapabilities: combinedInference.relatedCapabilities,
    progressionCapabilities: combinedInference.progressionCapabilities,
    roleInferences,
    projectInference,
    validationFocus,
  };
}
