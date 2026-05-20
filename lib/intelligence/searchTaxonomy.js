// lib/intelligence/searchTaxonomy.js
// ForgeTomorrow Search Taxonomy
// Search-specific adapter that reads from the Universal Professional Intelligence Taxonomy.
//
// Architecture rule:
// - universalTaxonomy.js owns professional meaning: capabilities, aliases, patterns, relationships.
// - searchTaxonomy.js owns search interpretation: query aliases, intent families, adjacent clusters,
//   conflicting ecosystems, and backwards-compatible search exports.
//
// This file is intentionally backward-compatible with existing search engines that import:
// TERM_ALIASES, CAPABILITY_CLUSTERS, JOB_INTENT_FAMILIES, CONFLICTING_ECOSYSTEMS, getJobSearchIntent.

import {
  UNIVERSAL_CAPABILITIES,
  buildUniversalCapabilityClusters,
  buildUniversalTermAliases,
  buildUniversalIntelligenceGraph,
} from './universalTaxonomy';

function uniq(items = []) {
  return Array.from(
    new Set(
      (items || [])
        .filter(Boolean)
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function capabilityTerms(capabilityId) {
  const cap = UNIVERSAL_CAPABILITIES.find((item) => item.id === capabilityId);
  if (!cap) return [];
  return uniq([
    cap.label,
    cap.seekerLabel,
    ...(cap.aliases || []),
    ...(cap.patterns || []),
  ]);
}

function mergeCapabilityTerms(...capabilityIds) {
  return uniq(capabilityIds.flatMap((capabilityId) => capabilityTerms(capabilityId)));
}

const UNIVERSAL_TERM_ALIASES = buildUniversalTermAliases();
const UNIVERSAL_CLUSTER_MAP = buildUniversalCapabilityClusters();
const UNIVERSAL_GRAPH = buildUniversalIntelligenceGraph();

// Legacy search cluster names are preserved so existing engines/pages/APIs do not need rewiring.
// Values are now generated from Universal wherever possible, with search-specific additions layered in.
export const CAPABILITY_CLUSTERS = {
  ...UNIVERSAL_CLUSTER_MAP,

  customerSupport: uniq([
    ...mergeCapabilityTerms('customer_service_support', 'service_delivery', 'it_service_management'),
    'zendesk',
    'support representative',
    'support specialist',
    'support agent',
    'customer operations',
    'knowledge management',
    'csat',
    'first contact resolution',
    'call handling',
  ]),

  customerSuccess: uniq([
    ...mergeCapabilityTerms('customer_success_account_management', 'service_delivery'),
    'saas',
    'customer engagement',
    'customer experience',
    'cross-functional',
    'business review',
    'customer health',
    'churn reduction',
  ]),

  desktopSupport: uniq([
    ...mergeCapabilityTerms(
      'desktop_technical_support',
      'endpoint_management',
      'identity_access_management',
      'it_service_management'
    ),
    'desktop tech',
    'deskside services',
    'euc support',
    'end user support',
    'workplace support',
    'office 365',
    'microsoft 365',
    'break/fix',
    'imaging',
    'device deployment',
  ]),

  softwareEngineering: uniq([
    ...mergeCapabilityTerms('software_engineering', 'platform_architecture'),
    'api',
    'software architecture',
    'unit testing',
    'application development',
    'web application',
  ]),

  cloudInfrastructure: uniq([
    ...mergeCapabilityTerms('cloud_infrastructure', 'systems_administration', 'devops_sre'),
    'virtualization',
    'systems engineer',
    'site reliability',
    'platform operations',
  ]),

  executiveLeadership: uniq([
    ...mergeCapabilityTerms(
      'executive_leadership',
      'business_strategy',
      'people_leadership',
      'partnerships_alliances',
      'product_management'
    ),
    'fundraising',
    'ip strategy',
    'organizational scaling',
    'company building',
  ]),

  cybersecurity: uniq([
    ...mergeCapabilityTerms(
      'cybersecurity_operations',
      'governance_risk_compliance',
      'identity_access_management',
      'networking_infrastructure'
    ),
    'phishing',
    'security analyst',
    'soc analyst',
  ]),

  networking: uniq([
    ...mergeCapabilityTerms('networking_infrastructure'),
    'network operations',
    'network support',
    'wi-fi',
    'wireless',
  ]),

  sales: uniq([
    ...mergeCapabilityTerms('sales_business_development'),
    'sales development',
    'revenue',
  ]),

  marketing: uniq([
    ...mergeCapabilityTerms('marketing_growth', 'content_communications'),
    'social media',
    'growth',
  ]),

  operations: uniq([
    ...mergeCapabilityTerms('operations_process_improvement'),
    'reporting',
    'operational excellence',
    'process discipline',
  ]),

  projectManagement: uniq([
    ...mergeCapabilityTerms('project_management', 'program_portfolio_management', 'change_management'),
    'technical project manager',
    'delivery lead',
  ]),

  humanResources: uniq([
    ...mergeCapabilityTerms('hr_people_operations', 'employee_benefits_workers_comp'),
    'employee lifecycle',
    'talent management',
  ]),

  recruiting: uniq([
    ...mergeCapabilityTerms('recruiting_talent_acquisition'),
    'recruitment',
    'recruitment coordinator',
    'candidate pipeline',
  ]),

  financeAccounting: uniq([
    ...mergeCapabilityTerms('finance_accounting', 'financial_planning_analysis'),
    'fp&a',
    'variance analysis',
    'financial model',
    'erp',
  ]),

  healthcareAdmin: uniq([
    ...mergeCapabilityTerms('healthcare_administration', 'insurance_claims'),
    'healthcare operations',
    'patient services',
  ]),

  educationTraining: uniq([
    ...mergeCapabilityTerms('education_training', 'training_enablement', 'instructional_design'),
    'trainer',
    'learning experience',
  ]),

  legalCompliance: uniq([
    ...mergeCapabilityTerms('legal_compliance', 'governance_risk_compliance'),
    'contract review',
    'regulatory compliance',
  ]),

  logisticsSupplyChain: uniq([
    ...mergeCapabilityTerms('logistics_supply_chain', 'procurement_vendor_management', 'transportation_fleet'),
    'fulfillment',
    'fleet',
  ]),

  manufacturing: uniq([
    ...mergeCapabilityTerms('manufacturing_production', 'safety_environmental_compliance'),
    'plant',
    'production line',
  ]),

  dataAnalytics: uniq([
    ...mergeCapabilityTerms('data_analytics_bi', 'data_engineering'),
    'analytics analyst',
    'business analyst',
    'insights',
  ]),
};

export const TERM_ALIASES = {
  ...UNIVERSAL_TERM_ALIASES,

  customer: uniq([
    'customer support',
    'customer success',
    'customer service',
    'customer experience',
    'client services',
    'client success',
    'account management',
  ]),

  'customer support': uniq([
    'customer service',
    'technical support',
    'support representative',
    'support specialist',
    'client support',
    'client services',
    'help desk',
    'service desk',
    'customer operations',
  ]),

  'customer success': uniq([
    'client success',
    'customer experience',
    'account management',
    'customer onboarding',
    'renewals',
    'retention',
    'relationship management',
  ]),

  'customer service': uniq([
    'customer support',
    'support representative',
    'service representative',
    'client services',
    'customer care',
    'customer operations',
  ]),

  'customer service manager': uniq([
    'customer service',
    'customer support',
    'support manager',
    'customer operations',
    'client services manager',
    'service delivery manager',
    'customer success',
    'client success',
    'escalation management',
    'support delivery',
  ]),

  'customer support manager': uniq([
    'customer support',
    'support manager',
    'technical support manager',
    'client services manager',
    'service delivery manager',
    'customer success',
    'client success',
    'customer operations',
    'support delivery',
  ]),

  'customer success manager': uniq([
    'customer success',
    'client success',
    'account management',
    'customer onboarding',
    'renewals',
    'retention',
    'customer engagement',
  ]),

  'desktop technician': CAPABILITY_CLUSTERS.desktopSupport,
  'desktop support': CAPABILITY_CLUSTERS.desktopSupport,
  'desktop tech': CAPABILITY_CLUSTERS.desktopSupport,
  'deskside support': CAPABILITY_CLUSTERS.desktopSupport,
  'deskside services': CAPABILITY_CLUSTERS.desktopSupport,
  'endpoint support': CAPABILITY_CLUSTERS.desktopSupport,
  'euc support': CAPABILITY_CLUSTERS.desktopSupport,
  'end user support': CAPABILITY_CLUSTERS.desktopSupport,
  'workplace support': CAPABILITY_CLUSTERS.desktopSupport,
  'it support': CAPABILITY_CLUSTERS.desktopSupport,

  'software engineer': CAPABILITY_CLUSTERS.softwareEngineering,
  'software developer': CAPABILITY_CLUSTERS.softwareEngineering,
  'full stack developer': CAPABILITY_CLUSTERS.softwareEngineering,
  'frontend developer': CAPABILITY_CLUSTERS.softwareEngineering,
  'backend developer': CAPABILITY_CLUSTERS.softwareEngineering,

  'project manager': CAPABILITY_CLUSTERS.projectManagement,
  'program manager': CAPABILITY_CLUSTERS.projectManagement,
  'delivery manager': CAPABILITY_CLUSTERS.projectManagement,
  'implementation manager': CAPABILITY_CLUSTERS.projectManagement,
  'scrum master': CAPABILITY_CLUSTERS.projectManagement,

  operations: CAPABILITY_CLUSTERS.operations,
  sales: CAPABILITY_CLUSTERS.sales,
  marketing: CAPABILITY_CLUSTERS.marketing,
  hr: CAPABILITY_CLUSTERS.humanResources,
  recruiter: CAPABILITY_CLUSTERS.recruiting,
  recruiting: CAPABILITY_CLUSTERS.recruiting,
  finance: CAPABILITY_CLUSTERS.financeAccounting,
  healthcare: CAPABILITY_CLUSTERS.healthcareAdmin,
  education: CAPABILITY_CLUSTERS.educationTraining,
  legal: CAPABILITY_CLUSTERS.legalCompliance,
  logistics: CAPABILITY_CLUSTERS.logisticsSupplyChain,
  manufacturing: CAPABILITY_CLUSTERS.manufacturing,
  data: CAPABILITY_CLUSTERS.dataAnalytics,
};

export const JOB_INTENT_FAMILIES = {
  customer: {
    primaryClusters: ['customerSupport', 'customerSuccess'],
    adjacentClusters: [],
    semanticTerms: TERM_ALIASES.customer,
  },

  customerSupport: {
    triggers: uniq([
      'customer support',
      'customer service',
      'support manager',
      'technical support',
      'help desk',
      'service desk',
      'client services',
      'customer care',
      'support representative',
      'support specialist',
    ]),
    primaryClusters: ['customerSupport'],
    adjacentClusters: ['customerSuccess', 'desktopSupport', 'service_delivery'],
    semanticTerms: CAPABILITY_CLUSTERS.customerSupport,
  },

  customerSuccess: {
    triggers: uniq([
      'customer success',
      'client success',
      'account manager',
      'account management',
      'customer experience',
      'customer onboarding',
      'renewals',
      'retention',
    ]),
    primaryClusters: ['customerSuccess'],
    adjacentClusters: ['customerSupport', 'sales'],
    semanticTerms: CAPABILITY_CLUSTERS.customerSuccess,
  },

  desktopSupport: {
    triggers: uniq([
      'desktop support',
      'desktop technician',
      'desktop tech',
      'deskside support',
      'deskside services',
      'endpoint support',
      'euc support',
      'end user support',
      'workplace support',
      'it support',
      'technical support',
      'help desk',
      'service desk',
    ]),
    primaryClusters: ['desktopSupport'],
    adjacentClusters: ['customerSupport', 'networking', 'endpoint_management', 'identity_access_management'],
    semanticTerms: CAPABILITY_CLUSTERS.desktopSupport,
  },

  softwareEngineering: {
    triggers: uniq([
      'frontend',
      'developer',
      'software',
      'engineer',
      'full stack',
      'backend',
      'react',
      'next.js',
      'typescript',
    ]),
    primaryClusters: ['softwareEngineering'],
    adjacentClusters: ['cloudInfrastructure', 'dataAnalytics', 'platform_architecture'],
    semanticTerms: CAPABILITY_CLUSTERS.softwareEngineering,
  },

  cloudInfrastructure: {
    triggers: uniq([
      'cloud',
      'devops',
      'infrastructure',
      'aws',
      'azure',
      'gcp',
      'kubernetes',
      'terraform',
      'systems engineer',
    ]),
    primaryClusters: ['cloudInfrastructure'],
    adjacentClusters: ['softwareEngineering', 'cybersecurity', 'networking'],
    semanticTerms: CAPABILITY_CLUSTERS.cloudInfrastructure,
  },

  cybersecurity: {
    triggers: uniq([
      'cybersecurity',
      'security analyst',
      'soc analyst',
      'incident response',
      'threat hunting',
      'security engineer',
      'security operations',
    ]),
    primaryClusters: ['cybersecurity'],
    adjacentClusters: ['networking', 'cloudInfrastructure', 'identity_access_management'],
    semanticTerms: CAPABILITY_CLUSTERS.cybersecurity,
  },

  sales: {
    triggers: uniq([
      'sales',
      'account executive',
      'business development',
      'sales development',
      'sdr',
      'bdr',
      'revenue',
    ]),
    primaryClusters: ['sales'],
    adjacentClusters: ['marketing', 'customerSuccess', 'revenue_operations'],
    semanticTerms: CAPABILITY_CLUSTERS.sales,
  },

  marketing: {
    triggers: uniq([
      'marketing',
      'growth',
      'demand generation',
      'content marketing',
      'digital marketing',
      'brand',
      'seo',
      'social media',
    ]),
    primaryClusters: ['marketing'],
    adjacentClusters: ['sales', 'dataAnalytics', 'content_communications'],
    semanticTerms: CAPABILITY_CLUSTERS.marketing,
  },

  operations: {
    triggers: uniq([
      'operations',
      'business operations',
      'operations manager',
      'process improvement',
      'workflow',
      'quality assurance',
      'continuous improvement',
    ]),
    primaryClusters: ['operations'],
    adjacentClusters: ['projectManagement', 'dataAnalytics'],
    semanticTerms: CAPABILITY_CLUSTERS.operations,
  },

  projectManagement: {
    triggers: uniq([
      'project manager',
      'program manager',
      'delivery manager',
      'implementation manager',
      'scrum master',
      'agile',
      'pmo',
    ]),
    primaryClusters: ['projectManagement'],
    adjacentClusters: ['operations', 'change_management'],
    semanticTerms: CAPABILITY_CLUSTERS.projectManagement,
  },

  humanResources: {
    triggers: uniq([
      'human resources',
      'hr',
      'people operations',
      'employee relations',
      'hr generalist',
      'hr business partner',
      'benefits',
      'compensation',
    ]),
    primaryClusters: ['humanResources'],
    adjacentClusters: ['recruiting'],
    semanticTerms: CAPABILITY_CLUSTERS.humanResources,
  },

  recruiting: {
    triggers: uniq([
      'recruiter',
      'recruiting',
      'talent acquisition',
      'sourcer',
      'recruitment',
      'candidate screening',
    ]),
    primaryClusters: ['recruiting'],
    adjacentClusters: ['humanResources', 'sales'],
    semanticTerms: CAPABILITY_CLUSTERS.recruiting,
  },

  financeAccounting: {
    triggers: uniq([
      'finance',
      'accounting',
      'financial analyst',
      'bookkeeper',
      'payroll',
      'accounts payable',
      'accounts receivable',
      'fp&a',
      'financial planning',
    ]),
    primaryClusters: ['financeAccounting'],
    adjacentClusters: ['dataAnalytics', 'operations'],
    semanticTerms: CAPABILITY_CLUSTERS.financeAccounting,
  },

  healthcareAdmin: {
    triggers: uniq([
      'healthcare',
      'medical assistant',
      'medical office',
      'patient care',
      'clinical',
      'medical records',
      'billing',
      'claims',
    ]),
    primaryClusters: ['healthcareAdmin'],
    adjacentClusters: ['customerSupport', 'legalCompliance'],
    semanticTerms: CAPABILITY_CLUSTERS.healthcareAdmin,
  },

  educationTraining: {
    triggers: uniq([
      'teacher',
      'education',
      'training',
      'instructor',
      'trainer',
      'curriculum',
      'learning and development',
    ]),
    primaryClusters: ['educationTraining'],
    adjacentClusters: ['humanResources', 'content_communications'],
    semanticTerms: CAPABILITY_CLUSTERS.educationTraining,
  },

  legalCompliance: {
    triggers: uniq([
      'legal',
      'paralegal',
      'legal assistant',
      'compliance',
      'contracts',
      'regulatory',
      'risk',
    ]),
    primaryClusters: ['legalCompliance'],
    adjacentClusters: ['operations', 'cybersecurity'],
    semanticTerms: CAPABILITY_CLUSTERS.legalCompliance,
  },

  logisticsSupplyChain: {
    triggers: uniq([
      'logistics',
      'supply chain',
      'warehouse',
      'inventory',
      'shipping',
      'receiving',
      'procurement',
    ]),
    primaryClusters: ['logisticsSupplyChain'],
    adjacentClusters: ['operations', 'manufacturing'],
    semanticTerms: CAPABILITY_CLUSTERS.logisticsSupplyChain,
  },

  manufacturing: {
    triggers: uniq([
      'manufacturing',
      'production',
      'assembly',
      'machine operator',
      'quality control',
      'plant operations',
    ]),
    primaryClusters: ['manufacturing'],
    adjacentClusters: ['logisticsSupplyChain', 'operations'],
    semanticTerms: CAPABILITY_CLUSTERS.manufacturing,
  },

  dataAnalytics: {
    triggers: uniq([
      'data analyst',
      'analytics',
      'business intelligence',
      'reporting analyst',
      'dashboard',
      'power bi',
      'tableau',
      'sql',
    ]),
    primaryClusters: ['dataAnalytics'],
    adjacentClusters: ['operations', 'financeAccounting', 'marketing'],
    semanticTerms: CAPABILITY_CLUSTERS.dataAnalytics,
  },
};

// Conflict lists are intentionally search-only. They help avoid over-scoring candidates whose evidence
// belongs to a different professional ecosystem even when a few shared terms appear.
export const CONFLICTING_ECOSYSTEMS = {
  customerSupport: [
    'react',
    'next.js',
    'typescript',
    'frontend',
    'backend',
    'full stack',
    'postgresql',
    'supabase',
    'openai api',
    'llm',
    'ai sdk',
    'sales development',
    'b2b sales',
    'load management',
    'demand response',
    'energy management',
  ],

  customerSuccess: [
    'react',
    'next.js',
    'typescript',
    'frontend',
    'backend',
    'full stack',
    'postgresql',
    'supabase',
    'openai api',
    'llm',
    'ai sdk',
    'sales development',
    'b2b sales',
    'load management',
    'demand response',
    'energy management',
  ],

  softwareEngineering: [
    'call center',
    'customer service representative',
    'customer support representative',
    'support agent',
    'patient care',
    'warehouse',
    'forklift',
    'assembly',
  ],

  sales: ['patient care', 'warehouse', 'machine operator', 'clinical'],

  marketing: ['forklift', 'warehouse', 'patient care', 'machine operator'],

  healthcareAdmin: ['react', 'next.js', 'software engineer', 'warehouse', 'forklift'],

  manufacturing: ['react', 'next.js', 'customer success', 'legal assistant'],

  logisticsSupplyChain: ['react', 'next.js', 'software engineer', 'customer success manager'],
};

function getUniversalIntentByCapability(keyword) {
  const q = String(keyword || '').trim().toLowerCase();
  if (!q) return null;

  for (const capability of Object.values(UNIVERSAL_GRAPH)) {
    const capabilitySearchTerms = uniq([
      capability.id,
      capability.label,
      capability.seekerLabel,
      ...(capability.aliases || []),
      ...(capability.patterns || []),
    ]);

    if (capabilitySearchTerms.some((term) => term && q.includes(term))) {
      return {
        intentKey: capability.id,
        primaryClusters: [capability.id],
        adjacentClusters: capability.related || [],
        semanticTerms: capabilityTerms(capability.id),
      };
    }
  }

  return null;
}

export function getJobSearchIntent(keyword = '') {
  const q = String(keyword || '').trim().toLowerCase();

  if (!q) {
    return {
      intentKey: '',
      primaryClusters: [],
      adjacentClusters: [],
      semanticTerms: [],
    };
  }

  if (q === 'customer') {
    return {
      intentKey: 'customer',
      primaryClusters: JOB_INTENT_FAMILIES.customer.primaryClusters,
      adjacentClusters: JOB_INTENT_FAMILIES.customer.adjacentClusters || [],
      semanticTerms: JOB_INTENT_FAMILIES.customer.semanticTerms,
    };
  }

  for (const [intentKey, config] of Object.entries(JOB_INTENT_FAMILIES)) {
    if (intentKey === 'customer') continue;

    const triggers = Array.isArray(config.triggers) ? config.triggers : [];

    if (triggers.some((term) => q.includes(term))) {
      return {
        intentKey,
        primaryClusters: config.primaryClusters || [],
        adjacentClusters: config.adjacentClusters || [],
        semanticTerms: config.semanticTerms || [],
      };
    }
  }

  const universalIntent = getUniversalIntentByCapability(q);
  if (universalIntent) return universalIntent;

  return {
    intentKey: '',
    primaryClusters: [],
    adjacentClusters: [],
    semanticTerms: uniq([q, ...(TERM_ALIASES[q] || [])]),
  };
}

export function expandSearchTerm(keyword = '') {
  const q = String(keyword || '').trim().toLowerCase();
  if (!q) return [];

  const intent = getJobSearchIntent(q);
  return uniq([
    q,
    ...(TERM_ALIASES[q] || []),
    ...(intent.semanticTerms || []),
    ...(intent.primaryClusters || []).flatMap((clusterKey) => CAPABILITY_CLUSTERS[clusterKey] || []),
    ...(intent.adjacentClusters || []).flatMap((clusterKey) => CAPABILITY_CLUSTERS[clusterKey] || capabilityTerms(clusterKey)),
  ]);
}

export function getSearchClusterTerms(clusterKey = '') {
  const key = String(clusterKey || '').trim();
  if (!key) return [];

  return uniq(CAPABILITY_CLUSTERS[key] || capabilityTerms(key));
}
