import type { Agent, Lead, RoutingPolicy, RoutingRule } from "./router";

const MAX_AGENTS = 50;
const MAX_RULES = 50;
const MAX_LEADS = 25;
const MAX_TEXT_LENGTH = 160;

const regions = new Set(["West", "Central", "East"]);
const segments = new Set(["Enterprise", "Mid-market", "SMB"]);
const industries = new Set(["Healthcare", "FinTech", "SaaS"]);
const languages = new Set(["English", "Spanish"]);
const leadFields = new Set(["region", "segment", "industry", "language"]);
const agentDimensions = new Set(["regions", "skills", "languages"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, allowEmpty = false): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_TEXT_LENGTH &&
    (allowEmpty || value.trim().length > 0)
  );
}

function isTextArray(value: unknown, maximum = 12): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximum &&
    value.every((item) => isText(item))
  );
}

function isAgent(value: unknown): value is Agent {
  if (!isRecord(value)) return false;

  return (
    isText(value.id) &&
    isText(value.name) &&
    isText(value.role) &&
    typeof value.available === "boolean" &&
    Number.isInteger(value.capacity) &&
    Number(value.capacity) >= 0 &&
    Number(value.capacity) <= 999 &&
    isTextArray(value.regions) &&
    value.regions.every((item) => regions.has(item)) &&
    isTextArray(value.skills) &&
    isTextArray(value.languages) &&
    value.languages.every((item) => languages.has(item)) &&
    isText(value.accent)
  );
}

function isRule(value: unknown): value is RoutingRule {
  if (!isRecord(value)) return false;

  return (
    isText(value.id) &&
    isText(value.name) &&
    typeof value.active === "boolean" &&
    leadFields.has(String(value.conditionField)) &&
    isText(value.conditionValue) &&
    (value.effect === "require" || value.effect === "prefer") &&
    agentDimensions.has(String(value.agentDimension)) &&
    (value.matchMode === "leadValue" || value.matchMode === "fixed") &&
    isText(value.capabilityValue, true) &&
    Number.isFinite(value.weight) &&
    Number(value.weight) >= 0 &&
    Number(value.weight) <= 100
  );
}

function isLead(value: unknown): value is Lead {
  if (!isRecord(value)) return false;

  return (
    isText(value.id) &&
    isText(value.company) &&
    isText(value.contact) &&
    regions.has(String(value.region)) &&
    segments.has(String(value.segment)) &&
    industries.has(String(value.industry)) &&
    languages.has(String(value.language)) &&
    Number.isFinite(value.value) &&
    Number(value.value) >= 0 &&
    Number(value.value) <= 1_000_000_000
  );
}

function hasUniqueIds(values: Array<{ id: string }>) {
  return new Set(values.map((value) => value.id)).size === values.length;
}

export function isValidPolicy(value: unknown): value is RoutingPolicy {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.agents) || !Array.isArray(value.rules)) return false;
  if (value.agents.length < 1 || value.agents.length > MAX_AGENTS) return false;
  if (value.rules.length < 1 || value.rules.length > MAX_RULES) return false;
  if (!value.agents.every(isAgent) || !value.rules.every(isRule)) return false;
  return hasUniqueIds(value.agents) && hasUniqueIds(value.rules);
}

export function isValidLeads(value: unknown): value is Lead[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_LEADS) {
    return false;
  }
  return value.every(isLead) && hasUniqueIds(value);
}
