// lib/intelligence/searchTaxonomy.js
// ForgeTomorrow Search Taxonomy
// Central source of truth for search aliases, capability clusters,
// intent families, semantic expansions, and conflicting ecosystems.

export const TERM_ALIASES = {
  customer: [
    'customer support',
    'customer success',
    'customer service',
    'customer experience',
    'client services',
    'client success',
    'account management',
  ],

  'customer support': [
    'customer service',
    'technical support',
    'support representative',
    'support specialist',
    'client support',
    'client services',
    'help desk',
    'service desk',
    'customer operations',
  ],

  'customer success': [
    'client success',
    'customer experience',
    'account management',
    'customer onboarding',
    'renewals',
    'retention',
    'relationship management',
  ],

  'customer service': [
    'customer support',
    'support representative',
    'service representative',
    'client services',
    'customer care',
    'customer operations',
  ],

  'desktop technician': [
    'desktop support',
    'desktop tech',
    'it support',
    'technical support',
    'help desk',
    'service desk',
    'endpoint support',
  ],

  'software engineer': [
    'software developer',
    'full stack developer',
    'backend developer',
    'frontend developer',
    'web developer',
  ],

  'project manager': [
    'program manager',
    'delivery manager',
    'technical project manager',
    'implementation manager',
  ],
};

export const CAPABILITY_CLUSTERS = {
  customerSupport: [
    'customer support',
    'customer service',
    'customer care',
    'support representative',
    'support specialist',
    'technical support',
    'ticketing',
    'sla',
    'client support',
    'client services',
    'service delivery',
    'escalation management',
    'support delivery',
    'incident management',
    'itil',
    'knowledge management',
    'servicenow',
    'salesforce',
    'team leadership',
  ],

  customerSuccess: [
    'customer success',
    'client success',
    'customer experience',
    'account management',
    'customer onboarding',
    'relationship management',
    'renewals',
    'retention',
    'customer engagement',
    'saas',
    'qbr',
    'stakeholder management',
    'csat',
    'upsell',
    'cross-functional',
  ],

  desktopSupport: [
    'active directory',
    'sccm',
    'intune',
    'jamf',
    'okta',
    'office 365',
    'microsoft 365',
    'vpn',
    'windows',
    'endpoint',
    'servicenow',
    'help desk',
    'service desk',
    'desktop support',
    'technical support',
  ],

  softwareEngineering: [
    'javascript',
    'typescript',
    'react',
    'next.js',
    'node.js',
    'python',
    'java',
    'c#',
    '.net',
    'sql',
    'api',
    'full stack',
    'frontend',
    'backend',
    'software architecture',
    'microservices',
    'git',
  ],

  cloudInfrastructure: [
    'aws',
    'azure',
    'gcp',
    'terraform',
    'kubernetes',
    'docker',
    'linux',
    'windows server',
    'virtualization',
    'vmware',
    'cloud infrastructure',
    'devops',
    'ci/cd',
    'infrastructure as code',
  ],

  cybersecurity: [
    'siem',
    'splunk',
    'sentinel',
    'crowdstrike',
    'defender',
    'edr',
    'soc',
    'incident response',
    'threat hunting',
    'vulnerability management',
    'firewall',
    'iam',
    'okta',
    'mfa',
    'zero trust',
    'phishing',
    'security operations',
  ],

  networking: [
    'cisco',
    'meraki',
    'fortinet',
    'palo alto',
    'vpn',
    'tcp/ip',
  ],
};

export const JOB_INTENT_FAMILIES = {
  customer: {
    primaryClusters: ['customerSupport', 'customerSuccess'],
    semanticTerms: [
      'customer support',
      'customer success',
      'customer service',
      'customer experience',
      'client services',
      'client success',
      'account management',
    ],
  },

  customerSupport: {
    triggers: [
      'customer support',
      'customer service',
      'support manager',
      'technical support',
      'help desk',
      'service desk',
      'client services',
      'customer care',
    ],
    primaryClusters: ['customerSupport'],
    adjacentClusters: ['customerSuccess', 'desktopSupport'],
    semanticTerms: [
      'customer support',
      'customer service',
      'technical support',
      'client services',
      'support representative',
      'support specialist',
      'customer operations',
      'help desk',
      'service desk',
    ],
  },

  customerSuccess: {
    triggers: [
      'customer success',
      'client success',
      'account manager',
      'account management',
      'customer experience',
      'customer onboarding',
      'renewals',
      'retention',
    ],
    primaryClusters: ['customerSuccess'],
    adjacentClusters: ['customerSupport'],
    semanticTerms: [
      'customer success',
      'client success',
      'customer experience',
      'account management',
      'customer onboarding',
      'relationship management',
      'renewals',
      'retention',
    ],
  },

  softwareEngineering: {
    triggers: [
      'frontend',
      'developer',
      'software',
      'engineer',
      'full stack',
      'backend',
      'react',
      'next.js',
      'typescript',
    ],
    primaryClusters: ['softwareEngineering'],
    adjacentClusters: ['cloudInfrastructure'],
    semanticTerms: [
      'software engineer',
      'software developer',
      'full stack developer',
      'frontend developer',
      'backend developer',
      'web developer',
    ],
  },

  cloudInfrastructure: {
    triggers: [
      'cloud',
      'devops',
      'infrastructure',
      'aws',
      'azure',
      'gcp',
      'kubernetes',
      'terraform',
    ],
    primaryClusters: ['cloudInfrastructure'],
    adjacentClusters: ['softwareEngineering'],
    semanticTerms: [
      'cloud engineer',
      'devops engineer',
      'infrastructure engineer',
      'cloud infrastructure',
      'systems engineer',
    ],
  },

  cybersecurity: {
    triggers: [
      'cybersecurity',
      'security analyst',
      'soc analyst',
      'incident response',
      'threat hunting',
      'security engineer',
    ],
    primaryClusters: ['cybersecurity'],
    adjacentClusters: ['networking', 'cloudInfrastructure'],
    semanticTerms: [
      'cybersecurity',
      'security analyst',
      'soc analyst',
      'incident response',
      'threat hunting',
      'security operations',
    ],
  },
};

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
  ],

  softwareEngineering: [
    'call center',
    'customer service representative',
    'customer support representative',
    'support agent',
  ],
};

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
      adjacentClusters: [],
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

  return {
    intentKey: '',
    primaryClusters: [],
    adjacentClusters: [],
    semanticTerms: [q],
  };
}