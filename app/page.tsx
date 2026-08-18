"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultLeads,
  defaultPolicy,
  type Agent,
  type AgentDimension,
  type Industry,
  type Language,
  type Lead,
  type LeadField,
  type Region,
  type RoutingDecision,
  type RoutingPolicy,
  type RoutingRule,
  type Segment,
} from "../lib/router";

type Stage = "agents" | "policy" | "leads" | "results";

const stages: { id: Stage; number: string; label: string; hint: string }[] = [
  { id: "agents", number: "01", label: "Agents", hint: "Availability" },
  { id: "policy", number: "02", label: "Policy", hint: "Rules" },
  { id: "leads", number: "03", label: "Test leads", hint: "Inputs" },
  { id: "results", number: "04", label: "Decisions", hint: "Trace" },
];

const regions: Region[] = ["West", "Central", "East"];
const segments: Segment[] = ["Enterprise", "Mid-market", "SMB"];
const industries: Industry[] = ["Healthcare", "FinTech", "SaaS"];
const languages: Language[] = ["English", "Spanish"];
const skills = [...segments, ...industries];
const fieldOptions: { value: LeadField; label: string; values: string[] }[] = [
  { value: "region", label: "lead region", values: regions },
  { value: "segment", label: "lead segment", values: segments },
  { value: "industry", label: "lead industry", values: industries },
  { value: "language", label: "lead language", values: languages },
];
const dimensionOptions: { value: AgentDimension; label: string }[] = [
  { value: "regions", label: "territory" },
  { value: "skills", label: "capability" },
  { value: "languages", label: "language" },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function copyPolicy(policy: RoutingPolicy): RoutingPolicy {
  return JSON.parse(JSON.stringify(policy)) as RoutingPolicy;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

export default function Home() {
  const howItWorksDialog = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>("agents");
  const [policy, setPolicy] = useState<RoutingPolicy>(() => copyPolicy(defaultPolicy));
  const [leads, setLeads] = useState<Lead[]>(() => JSON.parse(JSON.stringify(defaultLeads)) as Lead[]);
  const [version, setVersion] = useState(4);
  const [hash, setHash] = useState("pending");
  const [savedAt, setSavedAt] = useState("Not yet saved");
  const [decisions, setDecisions] = useState<RoutingDecision[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Vault ready");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadVault() {
      try {
        const response = await fetch("/api/policy");
        if (!response.ok) throw new Error("Vault unavailable");
        const data = (await response.json()) as {
          version: number;
          hash: string;
          savedAt: string;
          policy: RoutingPolicy;
        };
        if (!cancelled) {
          setPolicy(data.policy);
          setVersion(data.version);
          setHash(data.hash);
          setSavedAt(data.savedAt);
          setMessage("Published policy loaded");
        }
      } catch {
        if (!cancelled) setMessage("Working from the demo policy");
      }
    }
    void loadVault();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableAgents = policy.agents.filter((agent) => agent.available && agent.capacity > 0);
  const activeRules = policy.rules.filter((rule) => rule.active);
  const routedCount = decisions.filter((decision) => decision.status === "routed").length;
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

  const agentById = useMemo(
    () => new Map(policy.agents.map((agent) => [agent.id, agent])),
    [policy.agents],
  );

  function updateAgent(agentId: string, patch: Partial<Agent>) {
    setPolicy((current) => ({
      ...current,
      agents: current.agents.map((agent) => (agent.id === agentId ? { ...agent, ...patch } : agent)),
    }));
  }

  function toggleAgentValue(
    agent: Agent,
    dimension: "regions" | "skills" | "languages",
    value: string,
  ) {
    const current = agent[dimension] as string[];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateAgent(agent.id, { [dimension]: next } as Partial<Agent>);
  }

  function addAgent() {
    const id = `agent-${Date.now()}`;
    setPolicy((current) => ({
      ...current,
      agents: [
        ...current.agents,
        {
          id,
          name: "New agent",
          role: "Account executive",
          available: true,
          capacity: 5,
          regions: ["West"],
          skills: ["Mid-market", "SaaS"],
          languages: ["English"],
          accent: "mint",
        },
      ],
    }));
  }

  function updateRule(ruleId: string, patch: Partial<RoutingRule>) {
    setPolicy((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    }));
  }

  function addRule() {
    setPolicy((current) => ({
      ...current,
      rules: [
        ...current.rules,
        {
          id: `rule-${Date.now()}`,
          name: "New routing rule",
          active: true,
          conditionField: "industry",
          conditionValue: "*",
          effect: "prefer",
          agentDimension: "skills",
          matchMode: "leadValue",
          capabilityValue: "",
          weight: 10,
        },
      ],
    }));
  }

  function updateLead(leadId: string, patch: Partial<Lead>) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, ...patch } : lead)));
  }

  function addLead() {
    const sequence = 1042 + leads.length;
    setLeads((current) => [
      ...current,
      {
        id: `LD-${sequence}`,
        company: "New account",
        contact: "New contact",
        region: "West",
        segment: "Mid-market",
        industry: "SaaS",
        language: "English",
        value: 50000,
      },
    ]);
  }

  async function saveAndRoute() {
    setSaving(true);
    setMessage("Publishing a new policy snapshot…");
    try {
      const saveResponse = await fetch("/api/policy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      const saved = (await saveResponse.json()) as {
        version?: number;
        hash?: string;
        savedAt?: string;
        error?: string;
      };
      if (!saveResponse.ok || !saved.version) throw new Error(saved.error ?? "Save failed");

      const routeResponse = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: saved.version, leads }),
      });
      const routed = (await routeResponse.json()) as {
        decisions?: RoutingDecision[];
        error?: string;
      };
      if (!routeResponse.ok || !routed.decisions) throw new Error(routed.error ?? "Routing failed");

      setVersion(saved.version);
      setHash(saved.hash ?? "");
      setSavedAt(saved.savedAt ?? new Date().toISOString());
      setDecisions(routed.decisions);
      setMessage(`${routed.decisions.length} decisions recorded`);
      setStage("results");
      setExpandedDecision(routed.decisions[0]?.leadId ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The simulation could not be completed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <div className="brand-stack">
          <a className="brand" href="#top" aria-label="RAIFE routing vault home">
            <span className="brand-mark">R</span>
            <span>RAIFE</span>
          </a>
          <a className="back-link" href="https://angelicareams.com">
            <span aria-hidden="true">←</span> Back to angelicareams.com
          </a>
        </div>
        <div className="header-center">
          <span className="status-dot" />
          Proof of concept
        </div>
        <div className="header-actions">
          <span className="version-chip">Policy v{String(version).padStart(2, "0")}</span>
          <button className="primary-button compact" type="button" onClick={saveAndRoute} disabled={saving}>
            {saving ? "Routing…" : "Save & route"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>Live prototype</span> Governed decisioning</div>
        <div className="hero-grid">
          <div>
            <h1>Every route<br />has a reason.</h1>
          </div>
          <div className="hero-copy">
            <p>
              Configure the available team, publish a versioned routing policy, and see exactly
              why every lead landed where it did.
            </p>
            <div className="determinism-note">
              <span className="seal">✓</span>
              <div>
                <strong>Reproducible by design</strong>
                <span>Same lead + policy + agent snapshot = same decision</span>
              </div>
            </div>
            <button
              className="how-it-works-button"
              type="button"
              onClick={() => howItWorksDialog.current?.showModal()}
            >
              <span>How it works</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </section>

      <dialog
        ref={howItWorksDialog}
        className="how-it-works-dialog"
        aria-labelledby="how-it-works-title"
      >
        <div className="dialog-card">
          <div className="dialog-topline">
            <span className="section-kicker">About this demo</span>
            <button
              className="dialog-close"
              type="button"
              aria-label="Close How it works"
              onClick={() => howItWorksDialog.current?.close()}
            >
              ×
            </button>
          </div>
          <h2 id="how-it-works-title">How the routing proof of concept works.</h2>
          <p className="dialog-intro">
            RAIFE turns a defined set of agent availability and routing rules into a versioned,
            reproducible decision—so every simulated lead assignment has a visible reason.
          </p>

          <ol className="how-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Configure the agent snapshot</strong>
                <p>Set availability, capacity, territories, capabilities, and languages.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Publish an explicit policy</strong>
                <p>Active requirements and preferences are saved together as a new policy version.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Resolve fictional test leads</strong>
                <p>The engine filters, scores, and selects an agent, then records the explanation trace.</p>
              </div>
            </li>
          </ol>

          <section className="dialog-data-note" aria-labelledby="data-use-title">
            <span className="dialog-icon" aria-hidden="true">i</span>
            <div>
              <h3 id="data-use-title">How information is used</h3>
              <p>
                Information entered here is sent to this demo&apos;s Firebase backend when you select
                Save &amp; route. Policy versions and routing decision records may persist across sessions.
              </p>
            </div>
          </section>

          <section className="dialog-warning" aria-labelledby="demo-warning-title">
            <span className="dialog-icon" aria-hidden="true">!</span>
            <div>
              <h3 id="demo-warning-title">Use fictional information only</h3>
              <p>
                This is a proof of concept, not a live production service. Do not upload real leads or
                personal, confidential, customer, health, financial, or other sensitive information.
              </p>
            </div>
          </section>

          <button
            className="primary-button dialog-done"
            type="button"
            onClick={() => howItWorksDialog.current?.close()}
          >
            I understand—continue to the demo
          </button>
        </div>
      </dialog>

      <nav className="stage-nav" aria-label="Routing workflow">
        {stages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={stage === item.id ? "active" : ""}
            onClick={() => setStage(item.id)}
            aria-current={stage === item.id ? "step" : undefined}
          >
            <span className="stage-number">{item.number}</span>
            <span><strong>{item.label}</strong><small>{item.hint}</small></span>
            {item.id !== "results" && <span className="stage-arrow">→</span>}
          </button>
        ))}
      </nav>

      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <span className="section-kicker">Routing vault / {stages.find((item) => item.id === stage)?.number}</span>
            <h2>
              {stage === "agents" && "Who can receive a lead?"}
              {stage === "policy" && "Make the policy explicit."}
              {stage === "leads" && "Test structured inputs."}
              {stage === "results" && "Inspect every decision."}
            </h2>
          </div>
          <div className="workspace-summary">
            {stage === "agents" && <><strong>{availableAgents.length}</strong><span>of {policy.agents.length} agents available</span></>}
            {stage === "policy" && <><strong>{activeRules.length}</strong><span>active rules in sequence</span></>}
            {stage === "leads" && <><strong>{money.format(totalValue)}</strong><span>pipeline in this simulation</span></>}
            {stage === "results" && <><strong>{decisions.length ? `${routedCount}/${decisions.length}` : "—"}</strong><span>leads routed automatically</span></>}
          </div>
        </div>

        {stage === "agents" && (
          <div className="agent-layout">
            <div className="agent-grid">
              {policy.agents.map((agent) => (
                <article className={`agent-card accent-${agent.accent}`} key={agent.id}>
                  <div className="agent-topline">
                    <div className="avatar">{initials(agent.name)}</div>
                    <div className="agent-identity">
                      <input
                        aria-label="Agent name"
                        value={agent.name}
                        onChange={(event) => updateAgent(agent.id, { name: event.target.value })}
                      />
                      <input
                        aria-label="Agent role"
                        className="role-input"
                        value={agent.role}
                        onChange={(event) => updateAgent(agent.id, { role: event.target.value })}
                      />
                    </div>
                    <Toggle
                      checked={agent.available}
                      onChange={() => updateAgent(agent.id, { available: !agent.available })}
                      label={`${agent.available ? "Mark" : "Make"} ${agent.name} ${agent.available ? "unavailable" : "available"}`}
                    />
                  </div>
                  <div className="agent-meta">
                    <span className={`availability ${agent.available ? "online" : "offline"}`}>
                      {agent.available ? "Available" : "Unavailable"}
                    </span>
                    <label>
                      Capacity
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={agent.capacity}
                        onChange={(event) => updateAgent(agent.id, { capacity: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="capability-group">
                    <span>Territory</span>
                    <div className="pill-row">
                      {regions.map((region) => (
                        <button
                          key={region}
                          type="button"
                          className={agent.regions.includes(region) ? "selected" : ""}
                          onClick={() => toggleAgentValue(agent, "regions", region)}
                        >{region}</button>
                      ))}
                    </div>
                  </div>
                  <div className="capability-group">
                    <span>Capabilities</span>
                    <div className="pill-row wrap">
                      {skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className={agent.skills.includes(skill) ? "selected" : ""}
                          onClick={() => toggleAgentValue(agent, "skills", skill)}
                        >{skill}</button>
                      ))}
                    </div>
                  </div>
                  <div className="capability-group">
                    <span>Languages</span>
                    <div className="pill-row">
                      {languages.map((language) => (
                        <button
                          key={language}
                          type="button"
                          className={agent.languages.includes(language) ? "selected" : ""}
                          onClick={() => toggleAgentValue(agent, "languages", language)}
                        >{language}</button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
              <button className="add-card" type="button" onClick={addAgent}>
                <span>＋</span>
                <strong>Add an agent</strong>
                <small>Define availability and capabilities</small>
              </button>
            </div>
            <aside className="vault-aside">
              <div className="aside-label">Availability snapshot</div>
              <div className="snapshot-orbit">
                <div><strong>{availableAgents.length}</strong><span>online</span></div>
                {policy.agents.map((agent, index) => (
                  <span
                    key={agent.id}
                    className={`orbit-dot dot-${index + 1} ${agent.available ? "on" : ""}`}
                    title={`${agent.name}: ${agent.available ? "available" : "unavailable"}`}
                  />
                ))}
              </div>
              <p>Availability is captured with the policy version so the route can be reproduced later.</p>
              <button className="text-button" type="button" onClick={() => setStage("policy")}>Continue to policy <span>→</span></button>
            </aside>
          </div>
        )}

        {stage === "policy" && (
          <div className="policy-layout">
            <div className="rule-stack">
              {policy.rules.map((rule, index) => {
                const selectedField = fieldOptions.find((option) => option.value === rule.conditionField);
                return (
                  <article className={`rule-card ${rule.active ? "" : "muted"}`} key={rule.id}>
                    <div className="rule-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="rule-body">
                      <div className="rule-title-row">
                        <input
                          aria-label="Rule name"
                          value={rule.name}
                          onChange={(event) => updateRule(rule.id, { name: event.target.value })}
                        />
                        <Toggle
                          checked={rule.active}
                          onChange={() => updateRule(rule.id, { active: !rule.active })}
                          label={`${rule.active ? "Disable" : "Enable"} ${rule.name}`}
                        />
                      </div>
                      <div className="rule-sentence">
                        <span>When</span>
                        <select
                          aria-label="Lead field"
                          value={rule.conditionField}
                          onChange={(event) => updateRule(rule.id, { conditionField: event.target.value as LeadField, conditionValue: "*" })}
                        >
                          {fieldOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                        </select>
                        <span>is</span>
                        <select
                          aria-label="Condition value"
                          value={rule.conditionValue}
                          onChange={(event) => updateRule(rule.id, { conditionValue: event.target.value })}
                        >
                          <option value="*">any value</option>
                          {selectedField?.values.map((value) => <option value={value} key={value}>{value}</option>)}
                        </select>
                        <span>then</span>
                        <select
                          aria-label="Rule effect"
                          value={rule.effect}
                          onChange={(event) => updateRule(rule.id, { effect: event.target.value as RoutingRule["effect"] })}
                        >
                          <option value="require">require</option>
                          <option value="prefer">prefer</option>
                        </select>
                        <span>agent</span>
                        <select
                          aria-label="Agent capability"
                          value={rule.agentDimension}
                          onChange={(event) => updateRule(rule.id, { agentDimension: event.target.value as AgentDimension })}
                        >
                          {dimensionOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                        </select>
                        <span>matching</span>
                        <select
                          aria-label="Match source"
                          value={rule.matchMode}
                          onChange={(event) => updateRule(rule.id, { matchMode: event.target.value as RoutingRule["matchMode"] })}
                        >
                          <option value="leadValue">the lead value</option>
                          <option value="fixed">a fixed value</option>
                        </select>
                        {rule.matchMode === "fixed" && (
                          <input
                            className="inline-value"
                            aria-label="Required capability value"
                            value={rule.capabilityValue}
                            onChange={(event) => updateRule(rule.id, { capabilityValue: event.target.value })}
                          />
                        )}
                      </div>
                    </div>
                    <div className="rule-weight">
                      {rule.effect === "prefer" ? (
                        <label><input type="number" min="0" max="100" value={rule.weight} onChange={(event) => updateRule(rule.id, { weight: Number(event.target.value) })} /><span>points</span></label>
                      ) : (
                        <span className="hard-gate">Hard gate</span>
                      )}
                    </div>
                  </article>
                );
              })}
              <button className="add-rule" type="button" onClick={addRule}><span>＋</span> Add routing rule</button>
            </div>
            <aside className="policy-aside">
              <span className="aside-label">Execution order</span>
              <ol>
                <li><span>1</span><div><strong>Eligibility</strong><small>Availability + capacity</small></div></li>
                <li><span>2</span><div><strong>Requirements</strong><small>Hard gates remove candidates</small></div></li>
                <li><span>3</span><div><strong>Preferences</strong><small>Explicit points rank the rest</small></div></li>
                <li><span>4</span><div><strong>Tie-break</strong><small>Stable hash, never randomness</small></div></li>
              </ol>
              <div className="aside-callout"><strong>Configuration, not code.</strong><p>The frontend edits a constrained policy. The trusted resolver always executes the same sequence.</p></div>
              <button className="text-button" type="button" onClick={() => setStage("leads")}>Continue to test leads <span>→</span></button>
            </aside>
          </div>
        )}

        {stage === "leads" && (
          <div className="leads-panel">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Lead</th><th>Region</th><th>Segment</th><th>Industry</th><th>Language</th><th>Est. value</th></tr></thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <span className="lead-id">{lead.id}</span>
                        <input aria-label="Company" value={lead.company} onChange={(event) => updateLead(lead.id, { company: event.target.value })} />
                        <input className="contact-input" aria-label="Contact" value={lead.contact} onChange={(event) => updateLead(lead.id, { contact: event.target.value })} />
                      </td>
                      <td><select aria-label="Region" value={lead.region} onChange={(event) => updateLead(lead.id, { region: event.target.value as Region })}>{regions.map((value) => <option key={value}>{value}</option>)}</select></td>
                      <td><select aria-label="Segment" value={lead.segment} onChange={(event) => updateLead(lead.id, { segment: event.target.value as Segment })}>{segments.map((value) => <option key={value}>{value}</option>)}</select></td>
                      <td><select aria-label="Industry" value={lead.industry} onChange={(event) => updateLead(lead.id, { industry: event.target.value as Industry })}>{industries.map((value) => <option key={value}>{value}</option>)}</select></td>
                      <td><select aria-label="Language" value={lead.language} onChange={(event) => updateLead(lead.id, { language: event.target.value as Language })}>{languages.map((value) => <option key={value}>{value}</option>)}</select></td>
                      <td><div className="money-input"><span>$</span><input aria-label="Estimated value" type="number" min="0" value={lead.value} onChange={(event) => updateLead(lead.id, { value: Number(event.target.value) })} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="leads-footer">
              <button className="add-rule" type="button" onClick={addLead}><span>＋</span> Add test lead</button>
              <div className="route-action">
                <div><strong>Ready to resolve {leads.length} leads</strong><span>Against {availableAgents.length} available agents and {activeRules.length} active rules</span></div>
                <button className="primary-button large" type="button" onClick={saveAndRoute} disabled={saving}>{saving ? "Resolving…" : "Publish & route"}<span>↗</span></button>
              </div>
            </div>
          </div>
        )}

        {stage === "results" && (
          decisions.length > 0 ? (
            <div className="results-layout">
              <div className="decision-list">
                <div className="results-banner">
                  <div className="banner-icon">✓</div>
                  <div><strong>Policy v{String(version).padStart(2, "0")} resolved {decisions.length} leads</strong><span>Decision record {hash.slice(0, 8)} · {new Date(savedAt).toLocaleString()}</span></div>
                  <span className="locked-chip">Snapshot locked</span>
                </div>
                {decisions.map((decision) => {
                  const selectedAgent = decision.selectedAgentId ? agentById.get(decision.selectedAgentId) : undefined;
                  const expanded = expandedDecision === decision.leadId;
                  return (
                    <article className={`decision-card ${decision.status}`} key={decision.leadId}>
                      <button className="decision-summary" type="button" onClick={() => setExpandedDecision(expanded ? null : decision.leadId)} aria-expanded={expanded}>
                        <div className="lead-monogram">{decision.company.slice(0, 2).toUpperCase()}</div>
                        <div className="decision-company"><span>{decision.leadId}</span><strong>{decision.company}</strong></div>
                        <div className="route-line"><span className="route-origin" /><span className="route-track" /><span className={`route-end ${decision.status}`} /></div>
                        <div className="decision-agent">
                          <span className={`mini-avatar accent-${selectedAgent?.accent ?? "review"}`}>{selectedAgent ? initials(selectedAgent.name) : "RQ"}</span>
                          <div><small>{decision.status === "routed" ? "Routed to" : "Fallback"}</small><strong>{decision.selectedAgentName}</strong></div>
                        </div>
                        <div className="score"><strong>{decision.score}</strong><span>score</span></div>
                        <span className={`chevron ${expanded ? "up" : ""}`}>⌄</span>
                      </button>
                      {expanded && (
                        <div className="decision-trace">
                          <div className="trace-column"><span className="trace-label">Decision reason</span><p>{decision.reason}</p><div className="tie-break"><span>≋</span><div><strong>{decision.tieBreaker}</strong><small>Final resolution method</small></div></div></div>
                          <div className="trace-column"><span className="trace-label">Candidate set</span>{decision.candidates.length ? decision.candidates.map((candidate) => <div className="candidate" key={candidate.agentId}><span>{initials(candidate.agentName)}</span><strong>{candidate.agentName}</strong><em>{candidate.score} pts</em></div>) : <p>No eligible candidates.</p>}</div>
                          <div className="trace-column"><span className="trace-label">Excluded</span>{decision.excluded.map((item) => <div className="exclusion" key={item.agentId}><strong>{item.agentName}</strong><span>{item.reason}</span></div>)}</div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <aside className="audit-panel">
                <span className="aside-label">Decision provenance</span>
                <div className="audit-visual"><span className="audit-ring ring-one" /><span className="audit-ring ring-two" /><div><strong>v{String(version).padStart(2, "0")}</strong><span>{hash.slice(0, 6)}</span></div></div>
                <dl>
                  <div><dt>Policy rules</dt><dd>{activeRules.length} active</dd></div>
                  <div><dt>Agent snapshot</dt><dd>{availableAgents.length} available</dd></div>
                  <div><dt>Lead inputs</dt><dd>{leads.length} structured</dd></div>
                  <div><dt>Resolver</dt><dd>Deterministic</dd></div>
                </dl>
                <p>Replay this exact snapshot to reproduce every decision shown here.</p>
                <button className="secondary-button" type="button" onClick={() => setStage("agents")}>Edit next version <span>→</span></button>
              </aside>
            </div>
          ) : (
            <div className="empty-results">
              <div className="empty-orbit"><span /><span /><strong>0</strong></div>
              <h3>No decision record yet.</h3>
              <p>Configure the vault, then publish and route your test leads to generate a complete decision trace.</p>
              <button className="primary-button" type="button" onClick={() => setStage("leads")}>Review test leads <span>→</span></button>
            </div>
          )
        )}
      </section>

      <footer>
        <div><span className="brand-mark small">R</span><strong>RAIFE</strong> / Governed routing prototype</div>
        <div className="footer-status"><span className="status-dot" /> {message}</div>
        <div>Policy v{String(version).padStart(2, "0")} · {hash === "pending" ? "local draft" : hash.slice(0, 8)}</div>
      </footer>
    </main>
  );
}
