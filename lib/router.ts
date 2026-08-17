export type Region = "West" | "Central" | "East";
export type Segment = "Enterprise" | "Mid-market" | "SMB";
export type Industry = "Healthcare" | "FinTech" | "SaaS";
export type Language = "English" | "Spanish";

export type Agent = {
  id: string;
  name: string;
  role: string;
  available: boolean;
  capacity: number;
  regions: Region[];
  skills: string[];
  languages: Language[];
  accent: string;
};

export type Lead = {
  id: string;
  company: string;
  contact: string;
  region: Region;
  segment: Segment;
  industry: Industry;
  language: Language;
  value: number;
};

export type LeadField = "region" | "segment" | "industry" | "language";
export type AgentDimension = "regions" | "skills" | "languages";

export type RoutingRule = {
  id: string;
  name: string;
  active: boolean;
  conditionField: LeadField;
  conditionValue: string;
  effect: "require" | "prefer";
  agentDimension: AgentDimension;
  matchMode: "leadValue" | "fixed";
  capabilityValue: string;
  weight: number;
};

export type RoutingPolicy = {
  agents: Agent[];
  rules: RoutingRule[];
};

export type CandidateTrace = {
  agentId: string;
  agentName: string;
  score: number;
  matchedRules: string[];
};

export type ExclusionTrace = {
  agentId: string;
  agentName: string;
  reason: string;
};

export type RoutingDecision = {
  leadId: string;
  company: string;
  selectedAgentId: string | null;
  selectedAgentName: string;
  score: number;
  status: "routed" | "review";
  reason: string;
  matchedRules: string[];
  candidates: CandidateTrace[];
  excluded: ExclusionTrace[];
  tieBreaker: string;
};

export const defaultAgents: Agent[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    role: "Strategic accounts",
    available: true,
    capacity: 8,
    regions: ["West"],
    skills: ["Enterprise", "Healthcare", "SaaS"],
    languages: ["English", "Spanish"],
    accent: "coral",
  },
  {
    id: "theo-bennett",
    name: "Theo Bennett",
    role: "Growth accounts",
    available: true,
    capacity: 5,
    regions: ["East"],
    skills: ["SMB", "FinTech", "SaaS"],
    languages: ["English"],
    accent: "blue",
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    role: "Enterprise accounts",
    available: true,
    capacity: 3,
    regions: ["Central", "East"],
    skills: ["Enterprise", "Mid-market", "FinTech"],
    languages: ["English"],
    accent: "violet",
  },
  {
    id: "jordan-king",
    name: "Jordan King",
    role: "Healthcare accounts",
    available: false,
    capacity: 6,
    regions: ["East"],
    skills: ["SMB", "Mid-market", "Healthcare"],
    languages: ["English", "Spanish"],
    accent: "gold",
  },
];

export const defaultRules: RoutingRule[] = [
  {
    id: "territory-alignment",
    name: "Territory alignment",
    active: true,
    conditionField: "region",
    conditionValue: "*",
    effect: "require",
    agentDimension: "regions",
    matchMode: "leadValue",
    capabilityValue: "",
    weight: 0,
  },
  {
    id: "language-service",
    name: "Language coverage",
    active: true,
    conditionField: "language",
    conditionValue: "*",
    effect: "require",
    agentDimension: "languages",
    matchMode: "leadValue",
    capabilityValue: "",
    weight: 0,
  },
  {
    id: "enterprise-focus",
    name: "Enterprise focus",
    active: true,
    conditionField: "segment",
    conditionValue: "Enterprise",
    effect: "prefer",
    agentDimension: "skills",
    matchMode: "fixed",
    capabilityValue: "Enterprise",
    weight: 30,
  },
  {
    id: "industry-expertise",
    name: "Industry expertise",
    active: true,
    conditionField: "industry",
    conditionValue: "*",
    effect: "prefer",
    agentDimension: "skills",
    matchMode: "leadValue",
    capabilityValue: "",
    weight: 25,
  },
  {
    id: "segment-fit",
    name: "Segment fit",
    active: true,
    conditionField: "segment",
    conditionValue: "*",
    effect: "prefer",
    agentDimension: "skills",
    matchMode: "leadValue",
    capabilityValue: "",
    weight: 15,
  },
];

export const defaultLeads: Lead[] = [
  {
    id: "LD-1042",
    company: "Alpine Health",
    contact: "Nora Fields",
    region: "West",
    segment: "Enterprise",
    industry: "Healthcare",
    language: "English",
    value: 185000,
  },
  {
    id: "LD-1043",
    company: "Northstar Pay",
    contact: "Mateo Ruiz",
    region: "East",
    segment: "Enterprise",
    industry: "FinTech",
    language: "English",
    value: 124000,
  },
  {
    id: "LD-1044",
    company: "Cypress Systems",
    contact: "Avery Cole",
    region: "Central",
    segment: "Mid-market",
    industry: "SaaS",
    language: "English",
    value: 76000,
  },
  {
    id: "LD-1045",
    company: "Loom Dental",
    contact: "Elena Torres",
    region: "East",
    segment: "SMB",
    industry: "Healthcare",
    language: "Spanish",
    value: 28000,
  },
];

export const defaultPolicy: RoutingPolicy = {
  agents: defaultAgents,
  rules: defaultRules,
};

export function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function policyHash(policy: RoutingPolicy) {
  return stableHash(JSON.stringify(policy));
}

function ruleApplies(rule: RoutingRule, lead: Lead) {
  const leadValue = String(lead[rule.conditionField]);
  return rule.conditionValue === "*" || leadValue === rule.conditionValue;
}

function agentMatches(rule: RoutingRule, lead: Lead, agent: Agent) {
  const desired =
    rule.matchMode === "leadValue"
      ? String(lead[rule.conditionField])
      : rule.capabilityValue;
  return (agent[rule.agentDimension] as string[]).includes(desired);
}

export function routeLead(
  lead: Lead,
  policy: RoutingPolicy,
  policyVersion: number,
): RoutingDecision {
  const exclusions: ExclusionTrace[] = [];
  const candidates: CandidateTrace[] = [];

  for (const agent of policy.agents) {
    if (!agent.available) {
      exclusions.push({ agentId: agent.id, agentName: agent.name, reason: "Unavailable in this snapshot" });
      continue;
    }
    if (agent.capacity <= 0) {
      exclusions.push({ agentId: agent.id, agentName: agent.name, reason: "No remaining capacity" });
      continue;
    }

    const requiredRules = policy.rules.filter(
      (rule) => rule.active && rule.effect === "require" && ruleApplies(rule, lead),
    );
    const failed = requiredRules.find((rule) => !agentMatches(rule, lead, agent));
    if (failed) {
      exclusions.push({ agentId: agent.id, agentName: agent.name, reason: `Failed: ${failed.name}` });
      continue;
    }

    let score = 0;
    const matchedRules: string[] = [];
    for (const rule of policy.rules) {
      if (!rule.active || rule.effect !== "prefer" || !ruleApplies(rule, lead)) continue;
      if (agentMatches(rule, lead, agent)) {
        score += Math.max(0, rule.weight);
        matchedRules.push(`${rule.name} +${Math.max(0, rule.weight)}`);
      }
    }
    candidates.push({ agentId: agent.id, agentName: agent.name, score, matchedRules });
  }

  if (candidates.length === 0) {
    return {
      leadId: lead.id,
      company: lead.company,
      selectedAgentId: null,
      selectedAgentName: "Review queue",
      score: 0,
      status: "review",
      reason: "No available agent satisfied every required rule.",
      matchedRules: [],
      candidates: [],
      excluded: exclusions,
      tieBreaker: "Fallback: manual review",
    };
  }

  const highestScore = Math.max(...candidates.map((candidate) => candidate.score));
  const finalists = candidates.filter((candidate) => candidate.score === highestScore);
  finalists.sort((left, right) => {
    const leftHash = stableHash(`${lead.id}:${policyVersion}:${left.agentId}`);
    const rightHash = stableHash(`${lead.id}:${policyVersion}:${right.agentId}`);
    return leftHash.localeCompare(rightHash);
  });
  const selected = finalists[0];
  const tieBreaker =
    finalists.length > 1
      ? `Stable hash across ${finalists.length} equal candidates`
      : "Highest preference score";

  return {
    leadId: lead.id,
    company: lead.company,
    selectedAgentId: selected.agentId,
    selectedAgentName: selected.agentName,
    score: selected.score,
    status: "routed",
    reason:
      selected.matchedRules.length > 0
        ? selected.matchedRules.join(" · ")
        : "All requirements met; deterministic tie-break applied.",
    matchedRules: selected.matchedRules,
    candidates: candidates.sort((left, right) => right.score - left.score),
    excluded: exclusions,
    tieBreaker,
  };
}

export function routeLeads(leads: Lead[], policy: RoutingPolicy, policyVersion: number) {
  return leads.map((lead) => routeLead(lead, policy, policyVersion));
}
