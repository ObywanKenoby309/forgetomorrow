// scripts/recommendation-cron.cjs
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOOKBACK_DAYS = 14;
const JOB_FETCH_LIMIT = 300;
const MAX_RECOMMENDATIONS_PER_USER = 12;
const MIN_SEARCH_SCORE = 25;

function safe(value) {
  return String(value || '').trim();
}

function lower(value) {
  return safe(value).toLowerCase();
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => safe(v)).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,|]/g).map((v) => safe(v)).filter(Boolean);
  return [];
}

function includesAny(text, terms) {
  const haystack = lower(text);
  if (!haystack) return false;
  return toArray(terms).some((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  });
}

function countMatches(text, terms) {
  const haystack = lower(text);
  if (!haystack) return 0;
  return toArray(terms).filter((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  }).length;
}

const TERM_ALIASES = {
  customer: ['customer support', 'customer success', 'customer service', 'customer experience', 'client services', 'client success', 'account management'],
  'customer support': ['customer service', 'technical support', 'support representative', 'support specialist', 'client support', 'client services', 'help desk', 'service desk', 'customer operations'],
  'customer success': ['client success', 'customer experience', 'account management', 'customer onboarding', 'renewals', 'retention', 'relationship management'],
  'customer service': ['customer support', 'support representative', 'service representative', 'client services', 'customer care', 'customer operations'],
  hr: ['human resources', 'people operations', 'employee relations', 'hr generalist', 'hr business partner'],
  recruiter: ['talent acquisition', 'recruiting', 'sourcer', 'technical recruiter', 'recruitment coordinator'],
  'software engineer': ['software developer', 'full stack developer', 'backend developer', 'frontend developer', 'web developer'],
  'project manager': ['program manager', 'delivery manager', 'technical project manager', 'implementation manager', 'project coordinator', 'scrum master'],
};

const CAPABILITY_CLUSTERS = {
  customerSupport: ['customer support', 'customer service', 'customer care', 'support representative', 'support specialist', 'technical support', 'ticketing', 'sla', 'client support', 'client services', 'service delivery', 'escalation management', 'support delivery', 'incident management', 'itil', 'knowledge management', 'servicenow', 'salesforce', 'team leadership'],
  customerSuccess: ['customer success', 'client success', 'customer experience', 'account management', 'customer onboarding', 'relationship management', 'renewals', 'retention', 'customer engagement', 'saas', 'qbr', 'stakeholder management', 'csat', 'upsell', 'cross-functional'],
  humanResources: ['human resources', 'hr', 'people operations', 'employee relations', 'benefits', 'compensation', 'hris', 'workday', 'adp', 'policy', 'performance management', 'onboarding', 'employee engagement'],
  recruiting: ['recruiting', 'talent acquisition', 'sourcing', 'candidate screening', 'interview coordination', 'applicant tracking', 'ats', 'technical recruiter', 'recruiter', 'talent pipeline', 'job posting', 'offer coordination'],
  softwareEngineering: ['javascript', 'typescript', 'react', 'next.js', 'node.js', 'python', 'java', 'c#', '.net', 'sql', 'api', 'full stack', 'frontend', 'backend', 'software architecture', 'microservices', 'git'],
  cloudInfrastructure: ['aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'docker', 'linux', 'windows server', 'virtualization', 'vmware', 'cloud infrastructure', 'devops', 'ci/cd', 'infrastructure as code'],
  cybersecurity: ['siem', 'splunk', 'sentinel', 'crowdstrike', 'defender', 'edr', 'soc', 'incident response', 'threat hunting', 'vulnerability management', 'firewall', 'iam', 'okta', 'mfa', 'zero trust', 'phishing', 'security operations'],
  sales: ['sales', 'account executive', 'business development', 'sales development', 'sdr', 'bdr', 'prospecting', 'lead generation', 'pipeline', 'quota', 'crm', 'salesforce', 'hubspot', 'negotiation', 'closing'],
  marketing: ['marketing', 'growth marketing', 'digital marketing', 'content marketing', 'campaign management', 'brand strategy', 'seo', 'sem', 'paid media', 'email marketing', 'google analytics', 'social media', 'demand generation', 'marketing automation'],
  operations: ['operations', 'business operations', 'process improvement', 'workflow optimization', 'kpi', 'sop', 'vendor management', 'resource planning', 'quality assurance', 'continuous improvement', 'lean', 'six sigma', 'reporting'],
  projectManagement: ['project management', 'program management', 'delivery management', 'implementation', 'scrum', 'agile', 'jira', 'roadmap', 'stakeholder management', 'risk management', 'timeline', 'milestones', 'budget'],
  financeAccounting: ['finance', 'accounting', 'bookkeeping', 'financial analysis', 'budgeting', 'forecasting', 'accounts payable', 'accounts receivable', 'payroll', 'reconciliation', 'general ledger', 'audit', 'quickbooks', 'excel'],
  healthcareAdmin: ['healthcare', 'medical office', 'patient scheduling', 'patient care', 'clinical support', 'medical records', 'emr', 'ehr', 'hipaa', 'insurance verification', 'billing', 'claims', 'front desk'],
  educationTraining: ['education', 'teaching', 'training', 'instruction', 'curriculum', 'lesson planning', 'learning and development', 'facilitation', 'classroom management', 'coaching', 'e-learning', 'instructional design'],
  legalCompliance: ['legal', 'paralegal', 'legal assistant', 'contracts', 'compliance', 'regulatory', 'risk management', 'policy review', 'case management', 'document review', 'legal research', 'privacy'],
  logisticsSupplyChain: ['logistics', 'supply chain', 'warehouse', 'inventory', 'shipping', 'receiving', 'procurement', 'purchasing', 'vendor coordination', 'freight', 'distribution', 'materials management'],
  manufacturing: ['manufacturing', 'production', 'assembly', 'machine operator', 'quality control', 'quality assurance', 'plant operations', 'safety', 'maintenance', 'lean manufacturing', 'inspection', 'materials'],
  dataAnalytics: ['data analyst', 'analytics', 'business intelligence', 'reporting', 'dashboard', 'sql', 'excel', 'power bi', 'tableau', 'data visualization', 'kpi', 'metrics', 'forecasting'],
};

const JOB_INTENT_FAMILIES = {
  customer: { primaryClusters: ['customerSupport', 'customerSuccess'], semanticTerms: ['customer support', 'customer success', 'customer service', 'customer experience', 'client services', 'client success', 'account management'] },
  customerSupport: { triggers: ['customer support', 'customer service', 'support manager', 'technical support', 'help desk', 'service desk', 'client services', 'customer care'], primaryClusters: ['customerSupport'], adjacentClusters: ['customerSuccess'], semanticTerms: ['customer support', 'customer service', 'technical support', 'client services', 'support representative', 'support specialist', 'customer operations', 'help desk', 'service desk'] },
  customerSuccess: { triggers: ['customer success', 'client success', 'account manager', 'account management', 'customer experience', 'customer onboarding', 'renewals', 'retention'], primaryClusters: ['customerSuccess'], adjacentClusters: ['customerSupport'], semanticTerms: ['customer success', 'client success', 'customer experience', 'account management', 'customer onboarding', 'relationship management', 'renewals', 'retention'] },
  humanResources: { triggers: ['human resources', 'hr', 'people operations', 'employee relations', 'hr generalist', 'hr business partner'], primaryClusters: ['humanResources'], adjacentClusters: ['recruiting'], semanticTerms: ['human resources', 'people operations', 'employee relations', 'hris', 'benefits', 'compensation'] },
  recruiting: { triggers: ['recruiter', 'recruiting', 'talent acquisition', 'sourcer', 'recruitment', 'candidate screening'], primaryClusters: ['recruiting'], adjacentClusters: ['humanResources', 'sales'], semanticTerms: ['recruiting', 'talent acquisition', 'sourcing', 'candidate screening', 'interview coordination', 'ats'] },
  softwareEngineering: { triggers: ['frontend', 'developer', 'software', 'engineer', 'full stack', 'backend', 'react', 'next.js', 'typescript'], primaryClusters: ['softwareEngineering'], adjacentClusters: ['cloudInfrastructure', 'dataAnalytics'], semanticTerms: ['software engineer', 'software developer', 'full stack developer', 'frontend developer', 'backend developer', 'web developer'] },
  sales: { triggers: ['sales', 'account executive', 'business development', 'sales development', 'sdr', 'bdr', 'revenue'], primaryClusters: ['sales'], adjacentClusters: ['marketing', 'customerSuccess'], semanticTerms: ['sales', 'account executive', 'business development', 'sales development', 'lead generation', 'pipeline', 'crm'] },
  marketing: { triggers: ['marketing', 'growth', 'demand generation', 'content marketing', 'digital marketing', 'brand', 'seo', 'social media'], primaryClusters: ['marketing'], adjacentClusters: ['sales', 'dataAnalytics'], semanticTerms: ['marketing', 'growth marketing', 'digital marketing', 'campaign management', 'brand strategy', 'content marketing', 'demand generation'] },
  operations: { triggers: ['operations', 'business operations', 'operations manager', 'process improvement', 'workflow', 'quality assurance'], primaryClusters: ['operations'], adjacentClusters: ['projectManagement', 'dataAnalytics'], semanticTerms: ['operations', 'business operations', 'process improvement', 'workflow optimization', 'quality assurance', 'kpi'] },
  projectManagement: { triggers: ['project manager', 'program manager', 'delivery manager', 'implementation manager', 'scrum master', 'agile'], primaryClusters: ['projectManagement'], adjacentClusters: ['operations'], semanticTerms: ['project management', 'program management', 'delivery management', 'implementation', 'scrum', 'agile', 'stakeholder management'] },
  financeAccounting: { triggers: ['finance', 'accounting', 'financial analyst', 'bookkeeper', 'payroll', 'accounts payable', 'accounts receivable'], primaryClusters: ['financeAccounting'], adjacentClusters: ['dataAnalytics'], semanticTerms: ['finance', 'accounting', 'financial analysis', 'budgeting', 'forecasting', 'payroll', 'reconciliation'] },
  healthcareAdmin: { triggers: ['healthcare', 'medical assistant', 'medical office', 'patient care', 'clinical', 'medical records', 'billing', 'claims'], primaryClusters: ['healthcareAdmin'], adjacentClusters: ['customerSupport'], semanticTerms: ['healthcare', 'medical office', 'patient scheduling', 'patient care', 'clinical support', 'medical records', 'hipaa'] },
  educationTraining: { triggers: ['teacher', 'education', 'training', 'instructor', 'trainer', 'curriculum', 'learning and development'], primaryClusters: ['educationTraining'], adjacentClusters: ['humanResources'], semanticTerms: ['education', 'training', 'instruction', 'curriculum', 'learning and development', 'facilitation', 'coaching'] },
  legalCompliance: { triggers: ['legal', 'paralegal', 'legal assistant', 'compliance', 'contracts', 'regulatory', 'risk'], primaryClusters: ['legalCompliance'], adjacentClusters: ['operations'], semanticTerms: ['legal', 'paralegal', 'contracts', 'compliance', 'regulatory', 'risk management', 'document review'] },
  logisticsSupplyChain: { triggers: ['logistics', 'supply chain', 'warehouse', 'inventory', 'shipping', 'receiving', 'procurement'], primaryClusters: ['logisticsSupplyChain'], adjacentClusters: ['operations', 'manufacturing'], semanticTerms: ['logistics', 'supply chain', 'warehouse', 'inventory', 'shipping', 'receiving', 'procurement'] },
  manufacturing: { triggers: ['manufacturing', 'production', 'assembly', 'machine operator', 'quality control', 'plant operations'], primaryClusters: ['manufacturing'], adjacentClusters: ['logisticsSupplyChain', 'operations'], semanticTerms: ['manufacturing', 'production', 'assembly', 'machine operator', 'quality control', 'plant operations'] },
  dataAnalytics: { triggers: ['data analyst', 'analytics', 'business intelligence', 'reporting analyst', 'dashboard', 'power bi', 'tableau'], primaryClusters: ['dataAnalytics'], adjacentClusters: ['operations', 'financeAccounting', 'marketing'], semanticTerms: ['data analyst', 'analytics', 'business intelligence', 'reporting', 'dashboard', 'sql', 'power bi', 'tableau'] },
};

const CONFLICTING_ECOSYSTEMS = {
  customerSupport: ['react', 'next.js', 'typescript', 'frontend', 'backend', 'full stack', 'postgresql', 'supabase', 'openai api', 'llm', 'ai sdk', 'sales development', 'b2b sales', 'load management', 'demand response', 'energy management'],
  customerSuccess: ['react', 'next.js', 'typescript', 'frontend', 'backend', 'full stack', 'postgresql', 'supabase', 'openai api', 'llm', 'ai sdk', 'sales development', 'b2b sales', 'load management', 'demand response', 'energy management'],
  softwareEngineering: ['call center', 'customer service representative', 'customer support representative', 'support agent', 'patient care', 'warehouse', 'forklift', 'assembly'],
  healthcareAdmin: ['react', 'next.js', 'software engineer', 'warehouse', 'forklift'],
  manufacturing: ['react', 'next.js', 'customer success', 'legal assistant'],
  logisticsSupplyChain: ['react', 'next.js', 'software engineer', 'customer success manager'],
};

function expandTerms(terms) {
  const expanded = new Set();
  for (const raw of toArray(terms)) {
    const original = safe(raw);
    const term = lower(original);
    if (!term) continue;
    expanded.add(original);
    const aliases = TERM_ALIASES[term];
    if (Array.isArray(aliases)) aliases.forEach((alias) => expanded.add(alias));
  }
  return Array.from(expanded);
}

function getJobSearchIntent(keyword = '') {
  const q = safe(keyword).toLowerCase();

  if (!q) return { intentKey: '', primaryClusters: [], adjacentClusters: [], semanticTerms: [] };

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

  return { intentKey: '', primaryClusters: [], adjacentClusters: [], semanticTerms: [q] };
}

function inferLocationType(location) {
  const text = lower(location);
  if (!text) return '';
  if (text.includes('remote')) return 'Remote';
  if (text.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function buildSearchText(job) {
  return [job.title, job.company, job.location, job.description, job.tags, job.salary, job.compensation, job.type].filter(Boolean).join(' ');
}

function scoreJobSearch(job, preference) {
  const keyword = safe(preference.keyword);
  const company = safe(preference.company);
  const location = safe(preference.location);
  const locationType = safe(preference.locationType);
  const source = safe(preference.source);

  const searchIntent = getJobSearchIntent(keyword);
  const keywordTerms = expandTerms([keyword, ...(searchIntent.semanticTerms || [])]);
  const searchableText = buildSearchText(job);

  let score = 0;
  const reasons = [];
  const evidence = [];

  if (keywordTerms.length) {
    const titleHits = countMatches(job.title, keywordTerms);
    const descriptionHits = countMatches(job.description, keywordTerms) + countMatches(job.tags, keywordTerms);

    if (titleHits > 0) {
      const points = Math.min(45, 24 + titleHits * 8);
      score += points;
      reasons.push('Role/title alignment detected.');
      evidence.push({ label: 'Role alignment', text: job.title, points });
    }

    if (descriptionHits > 0) {
      const points = Math.min(25, descriptionHits * 4);
      score += points;
      reasons.push('Related capability language detected.');
      evidence.push({ label: 'Capability overlap', text: `${descriptionHits} related signals found`, points });
    }
  }

  if (company && includesAny(job.company, [company])) {
    score += 10;
    evidence.push({ label: 'Company', text: job.company, points: 10 });
  }

  if (location && includesAny(job.location, [location])) {
    score += 10;
    evidence.push({ label: 'Location', text: job.location, points: 10 });
  }

  if (locationType && inferLocationType(job.location) === locationType) {
    score += 8;
    evidence.push({ label: 'Work type', text: locationType, points: 8 });
  }

  const intentClusterKeys = [...(searchIntent.primaryClusters || []), ...(searchIntent.adjacentClusters || [])];

  const clusterEntries =
    intentClusterKeys.length > 0
      ? Object.entries(CAPABILITY_CLUSTERS).filter(([key]) => intentClusterKeys.includes(key))
      : Object.entries(CAPABILITY_CLUSTERS);

  const clusterResults = clusterEntries
    .map(([key, terms]) => {
      const blockedTerms = CONFLICTING_ECOSYSTEMS[key] || [];
      const blocked = blockedTerms.filter((term) => includesAny(searchableText, [term])).length >= 3;
      if (blocked) return { key, hits: [] };
      return { key, hits: terms.filter((term) => includesAny(searchableText, [term])) };
    })
    .filter((x) => x.hits.length >= 2)
    .sort((a, b) => b.hits.length - a.hits.length);

  const primaryCluster = clusterResults[0];

  if (primaryCluster) {
    const points = Math.min(22, primaryCluster.hits.length * 3);
    score += points;
    evidence.push({ label: 'Capability ecosystem', text: primaryCluster.hits.slice(0, 8).join(', '), points });
  }

  if (source && lower(job.source).includes(lower(source))) score += 6;

  return {
    ...job,
    searchScore: Math.max(0, Math.min(100, Math.round(score))),
    searchReasons: reasons,
    searchEvidence: evidence,
  };
}

function preferenceIsActive(preference) {
  return Boolean(preference.keyword || preference.company || preference.location || preference.locationType || preference.source || preference.days);
}

function buildJobWhereClause(preference, appliedIds) {
  const where = { status: { notIn: ['Draft', 'Closed', 'Expired'] } };

  if (appliedIds.length > 0) where.id = { notIn: appliedIds };

  if (preference.company) {
    where.company = {
      contains: preference.company,
      mode: 'insensitive',
    };
  }

  const days = Number(preference.days || LOOKBACK_DAYS);
  const lookbackDays = Number.isNaN(days) || days < 1 ? LOOKBACK_DAYS : Math.min(days, 365);
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  where.createdAt = { gte: since };

  return where;
}

function passesHardFilters(job, preference) {
  if (preference.location && !includesAny(job.location, [preference.location])) return false;
  if (preference.locationType && inferLocationType(job.location) !== preference.locationType) return false;
  if (preference.source) {
    const source = lower(job.source);
    const target = lower(preference.source);
    if (target && !source.includes(target)) return false;
  }
  return true;
}

async function refreshForPreference(preference) {
  const applied = await prisma.application.findMany({
    where: { userId: preference.userId },
    select: { jobId: true },
  });

  const appliedIds = applied.map((item) => item.jobId).filter((id) => id != null);

  const jobs = await prisma.job.findMany({
    where: buildJobWhereClause(preference, appliedIds),
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      worksite: true,
      compensation: true,
      type: true,
      description: true,
      tags: true,
      source: true,
      salary: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      publishedat: true,
      url: true,
    },
    orderBy: { createdAt: 'desc' },
    take: JOB_FETCH_LIMIT,
  });

  const ranked = jobs
    .map((job) => scoreJobSearch(job, preference))
    .filter((job) => job.searchScore >= MIN_SEARCH_SCORE)
    .filter((job) => passesHardFilters(job, preference))
    .sort((a, b) => {
      if ((b.searchScore || 0) !== (a.searchScore || 0)) return (b.searchScore || 0) - (a.searchScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, MAX_RECOMMENDATIONS_PER_USER);

  await prisma.seekerJobRecommendation.deleteMany({ where: { userId: preference.userId } });

  for (let index = 0; index < ranked.length; index += 1) {
    const job = ranked[index];

    await prisma.seekerJobRecommendation.create({
      data: {
        userId: preference.userId,
        jobId: job.id,
        score: job.searchScore || 0,
        rank: index + 1,
        reasons: {
          searchReasons: job.searchReasons || [],
          searchEvidence: job.searchEvidence || [],
          preference: {
            keyword: preference.keyword,
            company: preference.company,
            location: preference.location,
            locationType: preference.locationType,
            source: preference.source,
            days: preference.days,
          },
        },
        source: 'cron',
      },
    });
  }

  return { userId: preference.userId, count: ranked.length };
}

async function main() {
  console.log('[Recommendations Cron] Starting seeker job recommendation refresh...');

  const preferences = await prisma.seekerJobPreference.findMany({
    where: {
      OR: [
        { keyword: { not: null } },
        { company: { not: null } },
        { location: { not: null } },
        { locationType: { not: null } },
        { source: { not: null } },
        { days: { not: null } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  const activePreferences = preferences.filter(preferenceIsActive);
  console.log(`[Recommendations Cron] Active preferences: ${activePreferences.length}`);

  let totalRecommendations = 0;

  for (const preference of activePreferences) {
    try {
      const result = await refreshForPreference(preference);
      totalRecommendations += result.count;
      console.log(`[Recommendations Cron] User ${result.userId}: stored ${result.count} recommendations.`);
    } catch (err) {
      console.error(`[Recommendations Cron] Failed for user ${preference.userId}:`, err);
    }
  }

  console.log(`[Recommendations Cron] Complete. Stored ${totalRecommendations} total recommendations.`);
}

main()
  .catch((err) => {
    console.error('[Recommendations Cron Fatal]', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
