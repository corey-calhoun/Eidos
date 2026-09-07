import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { sampleGraph } from "../domain/sample-graph.js";
import { validateGraph, type AssuranceGraph } from "../domain/graph.js";
import {
  buildAllRelationshipRows,
  buildRelationshipRows,
  filterGraph,
  formatLabel,
  summarizeView,
  type AuthorityFilter,
  type FilteredGraph,
} from "./graph-view-model.js";
import {
  createGraphHistory,
  moveGraphHistory,
  pushGraphHistory,
  selectionFromSearch,
} from "./graph-navigation.js";
import { attachInitialGraphFit, createSemanticPositions } from "./graph-runtime.js";

const API_URL = "http://127.0.0.1:4317";
const EMPTY_FILTERS = { nodeTypes: new Set<string>(), assuranceStates: new Set<string>() };

const familyFor = (type: string) => {
  if (["application", "business_objective"].includes(type)) return "mission";
  if (["asset", "identity", "dependency", "data", "owner"].includes(type)) return "system";
  if (["threat", "vulnerability", "risk"].includes(type)) return "risk";
  if (type === "control") return "control";
  if (["validation_activity", "evidence", "requirement", "policy", "framework"].includes(type)) return "evidence";
  return "finding";
};

const iconFor = (type: string) => ({
  application: "▣", business_objective: "◎", asset: "◇", identity: "♙", dependency: "⌁",
  data: "▤", threat: "ϟ", vulnerability: "⬡", risk: "◆", control: "⬟",
  validation_activity: "✓", evidence: "▧", requirement: "¶", policy: "§", framework: "▦",
  finding: "⚑", owner: "●",
}[type] ?? "○");

const statusTone = (assurance: string) => {
  if (assurance === "validated") return "validated";
  if (assurance === "failed") return "failed";
  if (["stale", "partially_effective"].includes(assurance)) return "warning";
  return "unknown";
};

const statusGlyph = (assurance: string) => ({
  validated: "✓", failed: "×", stale: "◷", partially_effective: "◐",
  implemented_unverified: "◇", planned: "○", unknown: "?", not_applicable: "—", risk_accepted: "◇",
}[assurance] ?? "?");

function graphElements(
  graph: FilteredGraph,
  positions: Readonly<Record<string, { x: number; y: number }>>,
): ElementDefinition[] {
  return [
    ...graph.nodes.map((node) => ({
      position: positions[node.id],
      data: {
        id: node.id,
        label: node.label,
        type: formatLabel(node.type),
        family: familyFor(node.type),
        assurance: node.assurance,
        statusTone: statusTone(node.assurance),
        statusLabel: formatLabel(node.assurance),
        icon: iconFor(node.type),
        critical: node.severity === "critical" ? "yes" : "no",
        outsideFilters: graph.contextNodeIds.has(node.id) ? "yes" : "no",
      },
    })),
    ...graph.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.state === "verified" ? edge.type.replaceAll("_", " ") : `${edge.type.replaceAll("_", " ")} · Proposed`,
        state: edge.state,
      },
    })),
  ];
}

interface GraphCanvasProps {
  graph: FilteredGraph;
  layoutNodes: AssuranceGraph["nodes"];
  selectedId: string | null;
  onSelect: (id: string) => void;
  graphRef: React.MutableRefObject<Core | null>;
}

function GraphCanvas({ graph, layoutNodes, selectedId, onSelect, graphRef }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;
    const positions = createSemanticPositions(layoutNodes);
    const cy = cytoscape({
      container: containerRef.current,
      elements: graphElements(graph, positions),
      minZoom: 0.35,
      maxZoom: 2,
      wheelSensitivity: 0.18,
      selectionType: "single",
      style: [
        { selector: "node", style: {
          "background-color": "#141D29", "border-width": 2, "border-color": "#718096",
          color: "#F4F7FB", label: "data(label)", "font-size": 11, "font-family": "Inter, Segoe UI, sans-serif",
          "font-weight": "bold", "text-wrap": "wrap", "text-max-width": "122px", "text-valign": "center",
          "text-halign": "center", width: 148, height: 54, shape: "round-rectangle", padding: "8px",
          "text-background-opacity": 0, "overlay-padding": 8,
        } },
        { selector: 'node[family = "mission"]', style: { "background-color": "#2b2414", "border-color": "#F2C14E" } },
        { selector: 'node[family = "system"]', style: { "background-color": "#211b35", "border-color": "#A78BFA" } },
        { selector: 'node[family = "risk"]', style: { "background-color": "#30172b", "border-color": "#F472B6" } },
        { selector: 'node[family = "control"]', style: { "background-color": "#10291e", "border-color": "#4ADE80" } },
        { selector: 'node[family = "evidence"]', style: { "background-color": "#0d2730", "border-color": "#22D3EE" } },
        { selector: 'node[family = "finding"]', style: { "background-color": "#32191e", "border-color": "#F87171" } },
        { selector: 'node[statusTone = "failed"]', style: { "border-color": "#F87171", "border-width": 3 } },
        { selector: 'node[statusTone = "warning"]', style: { "border-color": "#F59E0B", "border-style": "dashed" } },
        { selector: 'node[statusTone = "unknown"]', style: { "border-color": "#94A3B8", "border-style": "dotted" } },
        { selector: 'node[critical = "yes"]', style: { "outline-color": "#F87171", "outline-width": 2, "outline-offset": 4 } },
        { selector: 'node[outsideFilters = "yes"]', style: { opacity: 0.45, label: "data(label)", "border-style": "dashed" } },
        { selector: "node:selected", style: { "border-color": "#F2C14E", "border-width": 4, "outline-color": "#F2C14E", "outline-width": 2, "outline-offset": 6 } },
        { selector: "edge", style: {
          width: 2, "line-color": "#64748B", "target-arrow-color": "#64748B", "target-arrow-shape": "triangle",
          "curve-style": "bezier", opacity: 0.55, label: "data(label)", "font-size": 8, color: "#AEB9C7",
          "text-background-color": "#070A10", "text-background-opacity": 0.8, "text-background-padding": "3px",
          "text-rotation": "autorotate",
        } },
        { selector: 'edge[state = "verified"]', style: { "line-style": "solid" } },
        { selector: 'edge[state = "proposed"], edge[state = "unknown"]', style: { "line-style": "dotted", "line-color": "#94A3B8", "target-arrow-color": "#94A3B8" } },
        { selector: "edge:selected", style: { "line-color": "#22D3EE", "target-arrow-color": "#22D3EE", opacity: 1 } },
      ],
      layout: { name: "preset" },
    });
    attachInitialGraphFit(cy);
    cy.on("tap", "node", (event) => onSelectRef.current(event.target.id()));
    graphRef.current = cy;
    return () => { graphRef.current = null; cy.destroy(); };
  }, [graph, graphRef, layoutNodes]);

  useEffect(() => {
    const cy = graphRef.current;
    if (!cy) return;
    cy.$(":selected").unselect();
    if (selectedId) cy.getElementById(selectedId).select();
  }, [selectedId, graphRef]);

  return <div className="graph-canvas" ref={containerRef} aria-hidden="true" />;
}

export default function App() {
  const [graph, setGraph] = useState<AssuranceGraph | null>(null);
  const [mode, setMode] = useState<"loading" | "api" | "sample" | "error">("loading");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [representation, setRepresentation] = useState<"graph" | "list">("graph");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<string>>(EMPTY_FILTERS.nodeTypes);
  const [assuranceFilters, setAssuranceFilters] = useState<Set<string>>(EMPTY_FILTERS.assuranceStates);
  const [authority, setAuthority] = useState<AuthorityFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [queryResult, setQueryResult] = useState<{ text: string; sourceIds: string[] } | null>(null);
  const [queryBusy, setQueryBusy] = useState(false);
  const [queryError, setQueryError] = useState("");
  const historyRef = useRef(createGraphHistory(null));
  const graphRef = useRef<Core | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const drawerHeadingRef = useRef<HTMLHeadingElement>(null);
  const drawerOpenerRef = useRef<HTMLElement | null>(null);
  const graphEntryRef = useRef<HTMLDivElement>(null);

  const loadGraph = useCallback(async () => {
    setMode("loading");
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(`${API_URL}/api/graph`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Local API returned ${response.status}.`);
      const payload = await response.json() as { graph?: unknown };
      const parsed = validateGraph(payload.graph);
      if (!parsed.success) {
        setMode("error");
        setError("The local API returned graph data that failed schema validation.");
        return;
      }
      setGraph(parsed.data);
      setMode("api");
    } catch (reason) {
      setGraph(sampleGraph);
      setMode("sample");
      setError(reason instanceof Error ? reason.message : "Local API unavailable.");
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => { void loadGraph(); }, [loadGraph]);

  useEffect(() => {
    if (!graph) return;
    const id = selectionFromSearch(
      window.location.search,
      new Set(graph.nodes.map((node) => node.id)),
    );
    if (!id) return;
    setSelectedId(id);
    setDrawerOpen(true);
    historyRef.current = createGraphHistory(id);
  }, [graph]);

  const visibleGraph = useMemo(() => graph ? filterGraph(graph, {
    query: search, nodeTypes: typeFilters, assuranceStates: assuranceFilters, authority,
  }, selectedId) : null, [graph, search, typeFilters, assuranceFilters, authority, selectedId]);
  const selectedNode = graph?.nodes.find((node) => node.id === selectedId) ?? null;

  useEffect(() => {
    if (!drawerOpen || !selectedNode) return;
    const focusTimer = window.setTimeout(() => drawerHeadingRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [drawerOpen, selectedNode]);
  const relationships = useMemo(
    () => graph && selectedId ? buildRelationshipRows(graph, selectedId) : [],
    [graph, selectedId],
  );
  const visibleRelationships = useMemo(
    () => visibleGraph ? buildAllRelationshipRows(visibleGraph) : [],
    [visibleGraph],
  );
  const metrics = visibleGraph ? summarizeView(visibleGraph) : null;
  const appNode = graph?.nodes.find((node) => node.type === "application");
  const nodeTypes = useMemo(() => [...new Set(graph?.nodes.map((node) => node.type) ?? [])].sort(), [graph]);
  const assuranceStates = useMemo(() => [...new Set(graph?.nodes.map((node) => node.assurance) ?? [])].sort(), [graph]);
  const activeFilterCount = typeFilters.size + assuranceFilters.size + (authority === "all" ? 0 : 1);

  const selectNode = useCallback((id: string, pushHistory = true) => {
    const active = document.activeElement;
    drawerOpenerRef.current = active instanceof HTMLElement && active !== document.body
      ? active
      : graphEntryRef.current;
    setSelectedId(id);
    setDrawerOpen(true);
    if (pushHistory) {
      historyRef.current = pushGraphHistory(historyRef.current, id);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("entity", id);
    window.history.replaceState(null, "", url);
  }, []);

  const navigateHistory = (delta: number) => {
    const current = historyRef.current;
    const next = moveGraphHistory(current, delta);
    if (next.index === current.index) return;
    historyRef.current = next;
    const id = next.entries[next.index] ?? null;
    setSelectedId(id);
    setDrawerOpen(id !== null);
    if (id) graphRef.current?.getElementById(id).select();
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    (drawerOpenerRef.current ?? graphEntryRef.current)?.focus();
  }, []);

  const toggleSet = (value: string, source: Set<string>, setter: (next: Set<string>) => void) => {
    const next = new Set(source);
    if (next.has(value)) next.delete(value); else next.add(value);
    setter(next);
  };

  const onWorkspaceKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const tag = (event.target as HTMLElement).tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (event.key === "/") { event.preventDefault(); searchRef.current?.focus(); }
    else if (event.key.toLowerCase() === "q") { event.preventDefault(); queryRef.current?.focus(); }
    else if (event.key.toLowerCase() === "f") { event.preventDefault(); setFiltersOpen(true); }
    else if (event.key.toLowerCase() === "l") { event.preventDefault(); setLegendOpen(true); }
    else if (event.key.toLowerCase() === "d" && selectedId) { setDrawerOpen(true); window.setTimeout(() => drawerHeadingRef.current?.focus(), 0); }
    else if (event.key === "0") { event.preventDefault(); graphRef.current?.fit(undefined, 72); }
    else if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); navigateHistory(-1); }
    else if (event.altKey && event.key === "ArrowRight") { event.preventDefault(); navigateHistory(1); }
    else if (event.key === "Escape") {
      if (legendOpen) setLegendOpen(false); else if (filtersOpen) setFiltersOpen(false); else if (drawerOpen) closeDrawer();
    }
  };

  const onGraphEntryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter", " "].includes(event.key) || !visibleGraph?.nodes.length) return;
    event.preventDefault();
    if ((event.key === "Enter" || event.key === " ") && selectedId) { setDrawerOpen(true); return; }
    const index = Math.max(0, visibleGraph.nodes.findIndex((node) => node.id === selectedId));
    const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
    selectNode(visibleGraph.nodes[(index + delta + visibleGraph.nodes.length) % visibleGraph.nodes.length]!.id);
  };

  const submitQuery = async (event: FormEvent) => {
    event.preventDefault();
    const question = query.trim();
    if (!question) return;
    setQueryBusy(true); setQueryError(""); setQueryResult(null);
    try {
      const response = await fetch(`${API_URL}/api/analysis/proposals`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error(`Analysis service returned ${response.status}.`);
      const payload = await response.json() as { proposal?: string };
      if (!payload.proposal) throw new Error("Analysis response was incomplete.");
      setQueryResult({ text: payload.proposal, sourceIds: selectedId ? [selectedId] : appNode ? [appNode.id] : [] });
    } catch (reason) {
      setQueryError(reason instanceof Error ? reason.message : "Analysis service unavailable.");
    } finally { setQueryBusy(false); }
  };

  const exportView = () => {
    if (!visibleGraph) return;
    const blob = new Blob([JSON.stringify(visibleGraph, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "eidos-current-view.json"; link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className={`app-shell ${drawerOpen ? "drawer-is-open" : ""}`} onKeyDown={onWorkspaceKeyDown}>
      <header className="top-shell">
        <div className="identity-block"><span className="mark" aria-hidden="true">E</span><div><strong>EIDOS</strong><small>SECURITY ASSURANCE GRAPH</small></div></div>
        <div className="scope-block"><span className="eyebrow">CLIENT APPLICATION</span><strong>{appNode?.label ?? "Loading assurance scope"}</strong><span className="environment">Assessment</span></div>
        <div className="project-actions"><span className={`source-state ${mode}`}><span aria-hidden="true">●</span>{mode === "api" ? "Live local data" : mode === "sample" ? "Local sample mode" : mode === "loading" ? "Connecting" : "Data unavailable"}</span><button className="primary-button" onClick={exportView} disabled={!visibleGraph}>Export view</button></div>
      </header>

      <nav className="graph-tools" aria-label="Graph controls">
        <div className="history-tools"><button aria-label="Back in graph history" onClick={() => navigateHistory(-1)}>←</button><button aria-label="Forward in graph history" onClick={() => navigateHistory(1)}>→</button></div>
        <button onClick={() => graphRef.current?.fit(undefined, 72)} aria-label="Fit graph to view">Fit</button>
        <button onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.2)} aria-label="Zoom out">−</button>
        <button onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2)} aria-label="Zoom in">+</button>
        <label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Search graph</span><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search graph…" /></label>
        <button className={filtersOpen ? "selected-control" : ""} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>Filters {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}</button>
        <button onClick={() => setLegendOpen((value) => !value)} aria-expanded={legendOpen}>Legend</button>
        <span className="result-count" aria-live="polite">{visibleGraph ? `${visibleGraph.nodes.length} of ${graph?.nodes.length ?? 0} entities` : "Source unavailable"}</span>
      </nav>

      <main className="workspace" aria-label={`Assurance graph for ${appNode?.label ?? "client application"}`}>
        <div className="atmosphere" aria-hidden="true" />
        {visibleGraph && graph && <GraphCanvas graph={visibleGraph} layoutNodes={graph.nodes} selectedId={selectedId} onSelect={selectNode} graphRef={graphRef} />}
        {mode === "loading" && <div className="workspace-state"><span className="static-loader" /> <h1>Building assurance context</h1><p>Connecting to the local authoritative graph…</p></div>}
        {mode === "error" && <div className="workspace-state error-state"><h1>Graph source unavailable</h1><p>{error}</p><button onClick={() => void loadGraph()}>Retry connection</button></div>}
        {mode === "sample" && <div className="sample-banner" role="status"><strong>Local sample mode</strong><span>Local API unavailable. Showing bundled, non-live sample data.</span><button onClick={() => void loadGraph()}>Retry API</button></div>}
        {visibleGraph?.nodes.length === 0 && <div className="workspace-state"><h1>No entities match</h1><p>Filters hide all records in this loaded scope.</p><button onClick={() => { setSearch(""); setTypeFilters(new Set()); setAssuranceFilters(new Set()); setAuthority("all"); }}>Clear filters</button></div>}
        <div ref={graphEntryRef} className="graph-entry" tabIndex={0} role="application" aria-label="Interactive graph. Use arrow keys to move between entities, Enter for details, D for drawer, and zero to fit." onKeyDown={onGraphEntryKeyDown}><span>Graph keyboard entry</span><kbd>Arrow keys</kbd></div>
      </main>

      {filtersOpen && <section className="popover filter-popover" aria-label="Graph filters">
        <div className="popover-header"><div><span className="eyebrow">VISIBILITY</span><h2>Filter the graph</h2></div><button aria-label="Close filters" onClick={() => setFiltersOpen(false)}>×</button></div>
        <fieldset><legend>Entity type</legend><div className="filter-grid">{nodeTypes.map((type) => <label key={type}><input type="checkbox" checked={typeFilters.has(type)} onChange={() => toggleSet(type, typeFilters, setTypeFilters)} /><span>{iconFor(type)} {formatLabel(type)}</span></label>)}</div></fieldset>
        <fieldset><legend>Assurance state</legend><div className="filter-grid">{assuranceStates.map((state) => <label key={state}><input type="checkbox" checked={assuranceFilters.has(state)} onChange={() => toggleSet(state, assuranceFilters, setAssuranceFilters)} /><span>{statusGlyph(state)} {formatLabel(state)}</span></label>)}</div></fieldset>
        <label className="select-label">Relationship authority<select value={authority} onChange={(event) => setAuthority(event.target.value as AuthorityFilter)}><option value="all">All authority states</option><option value="verified">Verified only</option><option value="proposed">Proposed only</option><option value="unknown">Unknown only</option></select></label>
        {activeFilterCount > 0 && <button className="text-button" onClick={() => { setTypeFilters(new Set()); setAssuranceFilters(new Set()); setAuthority("all"); }}>Clear all filters</button>}
      </section>}

      {legendOpen && <section className="popover legend-popover" aria-label="Graph legend">
        <div className="popover-header"><div><span className="eyebrow">VISUAL GRAMMAR</span><h2>How to read the graph</h2></div><button aria-label="Close legend" onClick={() => setLegendOpen(false)}>×</button></div>
        <h3>Entity families</h3><div className="legend-list"><span><i className="swatch mission" />Mission / selection</span><span><i className="swatch system" />Systems & assets</span><span><i className="swatch risk" />Threats & risks</span><span><i className="swatch valid" />Validated controls</span><span><i className="swatch evidence" />Evidence & requirements</span><span><i className="swatch failure" />Failed / critical</span></div>
        <h3>Assurance</h3><div className="legend-list"><span>✓ Solid — validated</span><span>◷ Dashed — stale / partial</span><span>? Dotted — unknown</span><span>Gold ring — selected only</span></div>
        <h3>Relationships</h3><div className="edge-key"><span className="solid-edge" />Verified <span className="dotted-edge" />Proposed <span>→ direction</span></div>
      </section>}

      <section className={`analysis-panel ${queryResult || queryError ? "has-result" : ""}`} aria-label="Graph analysis">
        {metrics && <div className="metrics-strip"><div><span>Assurance state</span><strong className={metrics.failedOrCritical ? "metric-danger" : ""}>{metrics.failedOrCritical ? "Attention required" : "No active failures"}</strong></div><div><span>Failed / critical</span><strong>{metrics.failedOrCritical}</strong><small>in current view</small></div><div><span>Stale evidence</span><strong>{metrics.staleEvidence}</strong><small>in current view</small></div><div><span>Verified coverage</span><strong>{metrics.verifiedCoverage}%</strong><small>{visibleGraph?.edges.length} relationships</small></div></div>}
        {(queryResult || queryError) && <div className={`query-result ${queryError ? "query-error" : ""}`} role="status"><span className="ai-badge">AI-assisted interpretation</span><p>{queryError || queryResult?.text}</p>{queryResult && <div className="citations">Sources: {queryResult.sourceIds.map((id) => <button key={id} onClick={() => selectNode(id)}>{id}</button>)} <span>· Proposed, not authoritative</span></div>}</div>}
        <form className="query-form" onSubmit={submitQuery}><div className="query-scope"><span className="eyebrow">ASK EIDOS</span><span>{selectedNode ? `Scoped to ${selectedNode.label}` : "Scoped to current view"}</span></div><label><span className="sr-only">Ask a question about this assurance graph</span><input ref={queryRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What needs attention before the client review?" maxLength={500} /></label><button className="query-submit" type="submit" disabled={queryBusy || !query.trim()}>{queryBusy ? "Analyzing…" : "Analyze"}</button></form>
      </section>

      <div className="view-switcher" role="group" aria-label="Graph representation"><button className={representation === "graph" ? "active" : ""} onClick={() => setRepresentation("graph")}>Graph</button><button className={representation === "list" ? "active" : ""} onClick={() => setRepresentation("list")}>List</button></div>

      {representation === "list" && <section className="relationship-sheet" aria-label="Accessible relationship list"><div className="sheet-header"><div><span className="eyebrow">NON-GRAPH REPRESENTATION</span><h2>{selectedNode ? `${selectedNode.label} relationships` : "All graph relationships"}</h2></div><button onClick={() => setRepresentation("graph")}>Return to graph</button></div><div className="table-wrap"><table><thead><tr><th>Source / type</th><th>Relationship / direction</th><th>Target / type</th><th>Authority</th><th>Importance</th><th>Provenance</th><th>Action</th></tr></thead><tbody>{(selectedNode ? relationships : visibleRelationships).map((item) => {
        if ("edge" in item) return <tr key={item.edge.id}><td><strong>{item.source.label}</strong><small>{formatLabel(item.source.type)}</small></td><td>{formatLabel(item.edge.type)}<small>Outgoing →</small></td><td><strong>{item.target.label}</strong><small>{formatLabel(item.target.type)}</small></td><td>{formatLabel(item.edge.state)}</td><td>Not rated</td><td className="mono">{item.edge.provenance?.sourceReference ?? "Source unavailable"}</td><td><button onClick={() => selectNode(item.target.id)}>Focus target</button></td></tr>;
        const source = item.direction === "Outgoing" ? selectedNode! : item.counterpart; const target = item.direction === "Outgoing" ? item.counterpart : selectedNode!;
        return <tr key={item.edgeId}><td><strong>{source.label}</strong><small>{formatLabel(source.type)}</small></td><td>{formatLabel(item.verb)}<small>{item.direction} {item.direction === "Outgoing" ? "→" : "←"}</small></td><td><strong>{target.label}</strong><small>{formatLabel(target.type)}</small></td><td>{item.authority}</td><td>{item.importance}<small>{item.relevance}</small></td><td className="mono">{item.source}</td><td><button onClick={() => selectNode(item.counterpart.id)}>Focus {item.counterpart.label}</button></td></tr>;
      })}</tbody></table></div></section>}

      <aside className={`detail-drawer ${drawerOpen && selectedNode ? "open" : ""}`} aria-label="Entity details" aria-hidden={!drawerOpen || !selectedNode}>
        {selectedNode && <><div className="drawer-header"><div className={`entity-icon ${familyFor(selectedNode.type)}`} aria-hidden="true">{iconFor(selectedNode.type)}</div><div><span className="eyebrow">{formatLabel(selectedNode.type)}</span><h2 ref={drawerHeadingRef} tabIndex={-1}>{selectedNode.label}</h2><code>{selectedNode.id}</code></div><button aria-label="Close details" onClick={closeDrawer}>×</button></div><div className="drawer-body">
          <section><h3>Summary</h3><p>{selectedNode.summary ?? "Summary unavailable."}</p></section>
          <section className="detail-pair"><div><h3>Owner</h3><p>{String(selectedNode.metadata?.owner ?? "Owner unavailable")}</p></div><div><h3>Assurance status</h3><span className={`status-badge ${statusTone(selectedNode.assurance)}`}>{statusGlyph(selectedNode.assurance)} {formatLabel(selectedNode.assurance)}</span></div></section>
          <section><h3>Provenance</h3>{selectedNode.provenance ? <ul className="provenance-list"><li><span>{formatLabel(selectedNode.provenance.authority)} · {formatLabel(selectedNode.provenance.sourceType)}</span><code>{selectedNode.provenance.sourceReference}</code><small>Observed {new Date(selectedNode.provenance.observedAt).toLocaleString()} · Verified by {selectedNode.provenance.verifiedBy ?? "not verified"}{selectedNode.provenance.verifiedAt ? ` on ${new Date(selectedNode.provenance.verifiedAt).toLocaleString()}` : ""}</small></li></ul> : <p>No authoritative provenance is recorded for this entity.</p>}</section>
          <section><h3>Evidence freshness</h3><p>{selectedNode.type === "evidence" ? (selectedNode.assurance === "stale" ? "Stale — review required." : selectedNode.provenance ? `Observed ${new Date(selectedNode.provenance.observedAt).toLocaleDateString()}; no explicit expiry is recorded.` : "Freshness unknown because provenance is unavailable.") : "Not applicable to this entity type."}</p></section>
          <section><h3>Related findings</h3><p>{relationships.filter((row) => row.counterpart.type === "finding").length || "No related findings in the loaded graph."}</p></section>
          <section><h3>Affected requirements</h3><p>{relationships.filter((row) => row.counterpart.type === "requirement").length || "No directly affected requirements in the loaded graph."}</p></section>
          <section className="notes-section"><h3>Consultant notes</h3><p>No consultant notes recorded.</p><small>Notes are separate from source-backed facts.</small></section>
          <section><div className="section-heading"><h3>Relationships</h3><span>{relationships.length}</span></div>{relationships.length ? <ul className="relationship-list">{relationships.map((row) => <li key={row.edgeId}><button onClick={() => selectNode(row.counterpart.id)}><span className={`mini-icon ${familyFor(row.counterpart.type)}`}>{iconFor(row.counterpart.type)}</span><span><strong>{row.counterpart.label}</strong><small>{row.direction} · {formatLabel(row.verb)} · {row.authority}</small></span><span aria-hidden="true">→</span></button></li>)}</ul> : <p>No relationships in the loaded graph.</p>}</section>
        </div></>}
      </aside>
      <div className="sr-only" aria-live="polite">{selectedNode ? `${selectedNode.label} selected, ${relationships.length} relationships.` : "No entity selected."}</div>
    </div>
  );
}
