import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  catalogRecords,
  catalogSummary,
  compareRecords,
  getRelatedRecords,
  type CatalogIndustry,
  type CatalogRecord,
} from "../domain/catalog.js";
import {
  buildPolicyPlaybookView,
  buildCatalogFacets,
  filterCatalog,
  formatCatalogType,
  formatIndustry,
  formatRelationshipAuthority,
  getCatalogSearchMatch,
  getAdjacentRecordDetailSection,
  getDialogFocusEdge,
  getIndustryRelevance,
  getRecordDialogFocusAction,
  getRecordDetailSections,
  humanize,
  isComparable,
  toggleComparison,
  type RecordDetailSection,
} from "./catalog-view-model.js";

const summary = catalogSummary();
const initialSlug = new URLSearchParams(window.location.search).get("record");
const initialRecord = initialSlug ? catalogRecords.find((record) => record.slug === initialSlug) ?? null : null;
const playbookPhases = [
  ["define", "Define"],
  ["implement", "Implement"],
  ["operate", "Operate"],
  ["review", "Review"],
] as const;

function trapDialogFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]',
  )].filter((element) => element.tabIndex >= 0);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
  const edge = getDialogFocusEdge(activeIndex, focusable.length, event.shiftKey);
  if (edge === "last") {
    event.preventDefault();
    last?.focus();
  } else if (edge === "first") {
    event.preventDefault();
    first?.focus();
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(() => window.matchMedia("(min-width: 821px)").matches);
  const [materialTypesOpen, setMaterialTypesOpen] = useState(() => window.matchMedia("(min-width: 821px)").matches);
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set());
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set());
  const [activeIndustries, setActiveIndustries] = useState<Set<CatalogIndustry>>(new Set());
  const [selectedRecord, setSelectedRecord] = useState<CatalogRecord | null>(initialRecord);
  const [invalidRecordSlug, setInvalidRecordSlug] = useState<string | null>(initialSlug && !initialRecord ? initialSlug : null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [detailSection, setDetailSection] = useState<RecordDetailSection>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const comparisonHeadingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsPaneRef = useRef<HTMLElement>(null);
  const detailBodyRef = useRef<HTMLDivElement>(null);
  const recordOpenerRef = useRef<HTMLElement | null>(null);
  const comparisonOpenerRef = useRef<HTMLElement | null>(null);
  const recordDepthRef = useRef(0);
  const recordDialogWasOpenRef = useRef(Boolean(initialRecord || invalidRecordSlug));

  const facets = useMemo(() => buildCatalogFacets(catalogRecords), []);
  const records = useMemo(() => filterCatalog(catalogRecords, {
    query,
    types: activeType ? new Set([activeType]) : new Set(),
    statuses: activeStatuses,
    domains: activeDomains,
    industries: activeIndustries,
  }), [query, activeType, activeStatuses, activeDomains, activeIndustries]);

  const comparedRecords = comparisonIds
    .map((id) => catalogRecords.find((record) => record.id === id))
    .filter((record): record is CatalogRecord => record !== undefined);
  const comparison = comparisonIds.length >= 2 ? compareRecords(comparisonIds) : null;

  function restoreRecordFocus() {
    const opener = recordOpenerRef.current;
    window.setTimeout(() => {
      if (opener?.isConnected) opener.focus();
      else (document.querySelector<HTMLElement>(".comparison-bar button:not([disabled])") ?? searchRef.current)?.focus();
    }, 50);
  }

  useEffect(() => {
    const isOpen = Boolean(selectedRecord || invalidRecordSlug);
    const focusAction = getRecordDialogFocusAction(recordDialogWasOpenRef.current, isOpen);
    recordDialogWasOpenRef.current = isOpen;
    if (focusAction === "focus_dialog") detailHeadingRef.current?.focus();
    if (focusAction === "restore_library") restoreRecordFocus();
  }, [invalidRecordSlug, selectedRecord]);

  useEffect(() => {
    if (comparisonOpen) comparisonHeadingRef.current?.focus();
  }, [comparisonOpen]);

  useEffect(() => {
    resultsPaneRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [query, activeType, activeStatuses, activeDomains, activeIndustries]);

  useEffect(() => {
    if (selectedRecord) detailBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedRecord?.id]);

  useEffect(() => {
    if (!selectedRecord && !invalidRecordSlug && !comparisonOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [comparisonOpen, invalidRecordSlug, selectedRecord]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const slug = new URLSearchParams(window.location.search).get("record");
      const record = slug ? catalogRecords.find((item) => item.slug === slug) ?? null : null;
      recordDepthRef.current = typeof event.state?.eidosRecordDepth === "number" ? event.state.eidosRecordDepth : 0;
      setSelectedRecord(record);
      setInvalidRecordSlug(slug && !record ? slug : null);
      if (!slug) restoreRecordFocus();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (comparisonOpen) closeComparison();
        else if (selectedRecord || invalidRecordSlug) closeRecord();
      }
      if (event.key === "/" && !comparisonOpen && !selectedRecord && !invalidRecordSlug && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [comparisonOpen, invalidRecordSlug, selectedRecord]);

  function openRecord(record: CatalogRecord, restoreFocusTo?: HTMLElement | null) {
    if (!selectedRecord && !invalidRecordSlug) recordOpenerRef.current = restoreFocusTo ?? document.activeElement as HTMLElement | null;
    setSelectedRecord(record);
    setDetailSection("overview");
    setInvalidRecordSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.set("record", record.slug);
    if (url.href !== window.location.href) {
      recordDepthRef.current += 1;
      window.history.pushState({ eidosRecordDepth: recordDepthRef.current }, "", url);
    }
  }

  function closeRecord() {
    const restoreFocusTo = recordOpenerRef.current ?? searchRef.current;
    const url = new URL(window.location.href);
    url.searchParams.delete("record");
    if (recordDepthRef.current > 0) {
      const depth = recordDepthRef.current;
      recordDepthRef.current = 0;
      window.history.go(-depth);
    } else {
      setSelectedRecord(null);
      setInvalidRecordSlug(null);
      window.history.replaceState({}, "", url);
      if (restoreFocusTo) restoreRecordFocus();
    }
  }

  function openComparison(opener: HTMLElement) {
    comparisonOpenerRef.current = opener;
    setComparisonOpen(true);
  }

  function closeComparison() {
    setComparisonOpen(false);
    window.setTimeout(() => comparisonOpenerRef.current?.focus(), 0);
  }

  function openComparedRecord(record: CatalogRecord) {
    const restoreFocusTo = comparisonOpenerRef.current;
    setComparisonOpen(false);
    openRecord(record, restoreFocusTo);
  }

  function chooseType(type: string | null) {
    setActiveType(type);
    setSelectedRecord(null);
    document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleIndustry(industry: CatalogIndustry) {
    setActiveIndustries((current) => {
      const next = new Set(current);
      if (next.has(industry)) next.delete(industry);
      else next.add(industry);
      return next;
    });
  }

  function toggleStatus(status: string) {
    setActiveStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleDomain(domain: string) {
    setActiveDomains((current) => {
      const next = new Set(current);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setActiveType(null);
    setActiveStatuses(new Set());
    setActiveDomains(new Set());
    setActiveIndustries(new Set());
  }

  function changeComparison(record: CatalogRecord) {
    const result = toggleComparison(comparisonIds, record);
    setComparisonIds(result.ids);
    setNotice(result.reason);
  }

  function selectRecordSection(section: RecordDetailSection, focus = false) {
    setDetailSection(section);
    if (focus) window.setTimeout(() => document.querySelector<HTMLElement>(`[data-record-section="${section}"]`)?.focus(), 0);
  }

  function moveRecordSection(event: ReactKeyboardEvent<HTMLElement>) {
    if (!selectedRecord) return;
    let next: RecordDetailSection | null = null;
    if (event.key === "ArrowRight") next = getAdjacentRecordDetailSection(detailSection, "next", selectedRecord);
    if (event.key === "ArrowLeft") next = getAdjacentRecordDetailSection(detailSection, "previous", selectedRecord);
    if (event.key === "Home") next = getRecordDetailSections(selectedRecord)[0]!.id;
    if (event.key === "End") next = getRecordDetailSections(selectedRecord).at(-1)!.id;
    if (next) {
      event.preventDefault();
      selectRecordSection(next, true);
    }
  }

  const related = selectedRecord ? getRelatedRecords(selectedRecord.id) : [];
  const playbook = selectedRecord ? buildPolicyPlaybookView(selectedRecord, activeIndustries) : null;
  const detailSections = selectedRecord ? getRecordDetailSections(selectedRecord) : [];

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Eidos library home">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span><strong>Eidos</strong><small>Governance knowledge workspace</small></span>
        </a>
        <div className="header-status"><span className="status-dot" aria-hidden="true" />Local catalog</div>
        <button className="nav-compare" onClick={(event) => openComparison(event.currentTarget)} disabled={comparisonIds.length < 2}>
          Compare <span>{comparisonIds.length}</span>
        </button>
      </header>

      <main id="top" className="workspace">
        <section className="workspace-intro" aria-labelledby="workspace-title">
          <div>
            <span className="eyebrow">Cybersecurity governance library</span>
            <h1 id="workspace-title">Find the right guidance without digging.</h1>
            <p>Search, filter, and open a focused reference workspace. Publisher evidence stays one click away.</p>
          </div>
          <div className="search-area">
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search the Eidos library</span>
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, publisher, topic, or identifier" autoComplete="off" />
              <kbd>/</kbd>
            </label>
            <div className="quick-links" aria-label="Suggested searches">
              <span>Try</span>
              {["NIST CSF", "privacy", "authentication", "incident response"].map((term) => <button key={term} onClick={() => setQuery(term)}>{term}</button>)}
            </div>
          </div>
        </section>

        <div className="library-frame">
          <aside className="filter-rail" aria-label="Catalog filters">
            <details className="refine-disclosure" open={refineOpen} onToggle={(event) => setRefineOpen(event.currentTarget.open)}>
              <summary className="mobile-refine-summary">Refine results <span>{records.length} shown</span></summary>
              <div className="refine-content">
            <div className="rail-heading">
              <div><span className="section-kicker">Refine</span><h2 id="filter-heading">Browse</h2></div>
              {(query || activeType || activeStatuses.size > 0 || activeDomains.size > 0 || activeIndustries.size > 0) && <button className="rail-clear" onClick={clearFilters}>Reset</button>}
            </div>
            <details className="filter-group material-filter" open={materialTypesOpen} onToggle={(event) => setMaterialTypesOpen(event.currentTarget.open)}>
              <summary>Material type {activeType && <span>1</span>}</summary>
              <div className="type-options">
                <button className={activeType === null ? "active" : ""} aria-pressed={activeType === null} onClick={() => chooseType(null)}><span>All materials</span><b>{summary.totalRecords}</b></button>
                {facets.types.map((facet) => <button key={facet.value} className={activeType === facet.value ? "active" : ""} aria-pressed={activeType === facet.value} onClick={() => chooseType(activeType === facet.value ? null : facet.value)}><span>{facet.label}</span><b>{facet.count}</b></button>)}
              </div>
            </details>
            <details className="filter-group facet-filter">
              <summary>Status {activeStatuses.size > 0 && <span>{activeStatuses.size}</span>}</summary>
              <div className="facet-options" role="group" aria-label="Status filters">
                {facets.statuses.map((facet) => <button key={facet.value} aria-pressed={activeStatuses.has(facet.value)} className={activeStatuses.has(facet.value) ? "active" : ""} onClick={() => toggleStatus(facet.value)}><span>{facet.label}</span><b>{facet.count}</b></button>)}
              </div>
            </details>
            <details className="filter-group facet-filter topic-filter">
              <summary>Topic {activeDomains.size > 0 && <span>{activeDomains.size}</span>}</summary>
              <div className="facet-options" role="group" aria-label="Topic filters">
                {facets.domains.map((facet) => <button key={facet.value} aria-pressed={activeDomains.has(facet.value)} className={activeDomains.has(facet.value) ? "active" : ""} onClick={() => toggleDomain(facet.value)}><span>{facet.label}</span><b>{facet.count}</b></button>)}
              </div>
            </details>
            <details className="filter-group industry-filter">
              <summary>Industry context</summary>
              <p>Common relevance, not legal applicability.</p>
              <div className="industry-options" role="group" aria-label="Industry filters">
                {facets.industries.filter((facet) => facet.value !== "cross-industry").map((facet) => {
                  const industry = facet.value as CatalogIndustry;
                  const selected = activeIndustries.has(industry);
                  return <button key={industry} aria-pressed={selected} className={selected ? "active" : ""} onClick={() => toggleIndustry(industry)}><span>{facet.label}</span><b>{facet.directCount === 0 ? "Broad only" : facet.directCount}</b></button>;
                })}
              </div>
            </details>
            <p className="rail-legal">Educational reference only. Not legal advice, certification, or a compliance determination.</p>
              </div>
            </details>
          </aside>

          <section ref={resultsPaneRef} className="results-pane" id="catalog-results" aria-labelledby="catalog-heading">
            <div className="results-toolbar">
              <div><span className="section-kicker">Reference library</span><h2 id="catalog-heading">{activeType ? formatCatalogType(activeType, true) : query ? "Search results" : "All materials"}</h2></div>
              <div className="catalog-count" aria-live="polite"><strong>{records.length}</strong><span>of {summary.totalRecords}</span></div>
            </div>
            {(query || activeType || activeStatuses.size > 0 || activeDomains.size > 0 || activeIndustries.size > 0) && <div className="active-filters" aria-label="Active filters">
              {query && <button aria-label={`Remove search filter ${query}`} onClick={() => setQuery("")}>“{query}” <span aria-hidden="true">×</span></button>}
              {activeType && <button aria-label={`Remove ${formatCatalogType(activeType)} filter`} onClick={() => setActiveType(null)}>{formatCatalogType(activeType)} <span aria-hidden="true">×</span></button>}
              {[...activeStatuses].map((status) => <button key={status} aria-label={`Remove ${humanize(status)} status filter`} onClick={() => toggleStatus(status)}>{humanize(status)} <span aria-hidden="true">×</span></button>)}
              {[...activeDomains].map((domain) => <button key={domain} aria-label={`Remove ${humanize(domain)} topic filter`} onClick={() => toggleDomain(domain)}>{humanize(domain)} <span aria-hidden="true">×</span></button>)}
              {[...activeIndustries].map((industry) => <button key={industry} aria-label={`Remove ${formatIndustry(industry)} industry filter`} onClick={() => toggleIndustry(industry)}>{formatIndustry(industry)} <span aria-hidden="true">×</span></button>)}
            </div>}
            {records.length === 0 ? <div className="empty-state"><h3>No references found</h3><p>Try a broader term or reset the filters.</p><button onClick={clearFilters}>Show the full library</button></div> : <div className="record-grid">
              {records.map((record) => {
                const selected = comparisonIds.includes(record.id);
                const industryRelevance = getIndustryRelevance(record, activeIndustries);
                const searchMatch = getCatalogSearchMatch(record, query);
                return <article className="record-card" key={record.id}>
                  <div className="record-meta"><span className={`type-badge type-${record.type}`}>{formatCatalogType(record.type)}</span><span>{humanize(record.status)}</span></div>
                  <h3><button className="record-title-button" onClick={() => openRecord(record)}><span>{record.name}</span><small aria-hidden="true">Open →</small></button></h3>
                  <p>{record.summary}</p>
                  {searchMatch && <p className="search-match">{searchMatch.label}</p>}
                  {industryRelevance && <p className={`relevance-note ${industryRelevance.kind}`}>{industryRelevance.label}</p>}
                  <div className="record-footer"><span>{record.issuer}</span><span>{record.version ?? "Version not specified"}</span></div>
                  {isComparable(record) && <div className="record-actions"><label className="compare-check"><input type="checkbox" checked={selected} onChange={() => changeComparison(record)} /> Compare</label></div>}
                </article>;
              })}
            </div>}
          </section>
        </div>
      </main>
      {comparisonIds.length > 0 && (
        <div className="comparison-bar" role="status">
          <div><strong>{comparisonIds.length} selected</strong><span>{comparedRecords.map((record) => record.acronym ?? record.name).join(" · ")}</span></div>
          <button disabled={comparisonIds.length < 2} onClick={(event) => openComparison(event.currentTarget)}>Compare references</button>
          <button className="text-button" onClick={() => setComparisonIds([])}>Clear</button>
        </div>
      )}

      {selectedRecord && (
        <div className="overlay detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRecord(); }}>
          <article className="detail-dialog" aria-modal="true" role="dialog" aria-labelledby="record-title" onKeyDown={trapDialogFocus}>
            <header className="detail-header">
              <div className="detail-title">
                <div className="detail-badges">
                  <span className={`type-badge type-${selectedRecord.type}`}>{formatCatalogType(selectedRecord.type)}</span>
                  <span className="authority-badge">{selectedRecord.contentAuthority === "publisher" ? "Publisher material · Eidos paraphrase" : "Eidos editorial guidance"}</span>
                </div>
                <h2 id="record-title" ref={detailHeadingRef} tabIndex={-1}>{selectedRecord.name}</h2>
                <p>{selectedRecord.summary}</p>
              </div>
              <button className="close-button" onClick={closeRecord} aria-label="Close reference">×</button>
            </header>

            <nav className="detail-tabs" role="tablist" aria-label="Reference sections" onKeyDown={moveRecordSection}>
              {detailSections.map((section) => <button
                key={section.id}
                id={`record-tab-${section.id}`}
                data-record-section={section.id}
                role="tab"
                aria-selected={detailSection === section.id}
                aria-controls={`record-panel-${section.id}`}
                tabIndex={detailSection === section.id ? 0 : -1}
                onClick={() => selectRecordSection(section.id)}
              >{section.label}{section.id === "related" && related.length > 0 ? <span>{related.length}</span> : null}</button>)}
            </nav>

            <div ref={detailBodyRef} className="detail-body">
              {detailSection === "overview" && <section className="detail-section" id="record-panel-overview" role="tabpanel" aria-labelledby="record-tab-overview">
                <div className="overview-grid">
                  <div className="overview-primary">
                    <span className="section-kicker">What this is</span>
                    <p className="overview-description">{selectedRecord.description}</p>
                    <section className="applicability-card">
                      <h3>Who commonly uses it</h3>
                      <p>{selectedRecord.applicability}</p>
                      <small>Use this as orientation. Confirm contractual, legal, and regulatory applicability with qualified stakeholders.</small>
                    </section>
                  </div>
                  <aside className="at-a-glance" aria-label="Reference at a glance">
                    <h3>At a glance</h3>
                    <dl>
                      <div><dt>Publisher</dt><dd>{selectedRecord.issuer}</dd></div>
                      <div><dt>Version</dt><dd>{selectedRecord.version ?? "Not specified"}</dd></div>
                      <div><dt>Status</dt><dd>{humanize(selectedRecord.status)}</dd></div>
                      <div><dt>Jurisdiction</dt><dd>{selectedRecord.jurisdictions.join(", ")}</dd></div>
                    </dl>
                  </aside>
                </div>
                <section className="topic-strip"><h3>Key topics</h3><div>{[...selectedRecord.domains, ...selectedRecord.tags].map((tag) => <span key={tag}>{tag}</span>)}</div></section>
              </section>}

              {detailSection === "playbook" && playbook && <section className="detail-section" id="record-panel-playbook" role="tabpanel" aria-labelledby="record-tab-playbook">
                <div className="playbook-intro">
                  <div><span className="section-kicker">Eidos policy playbook</span><h3>Put this policy to work</h3></div>
                  <span className="context-pill">{playbook.contextLabel}</span>
                </div>
                <p className="playbook-boundary">Editorial starter guidance—not a compliance determination. Tailor it with accountable technical, business, legal, and privacy stakeholders.</p>
                <section className="playbook-outcome"><span>Intended outcome</span><p>{playbook.outcome}</p></section>
                <div className="playbook-accordion-grid">
                  <details><summary><span>Decisions to make</span><b>{playbook.decisions.length}</b></summary><div className="decision-grid">{playbook.decisions.map((decision) => <article key={decision.id}><strong>{decision.question}</strong><ul>{decision.options.map((option) => <li key={option}>{option}</li>)}</ul></article>)}</div></details>
                  <details><summary><span>Implementation options</span><b>{playbook.approaches.length}</b></summary><div className="approach-list">{playbook.approaches.map((approach) => <article key={approach.id}><strong>{approach.name}</strong><p><b>Fits:</b> {approach.whenToUse}</p><p><b>Tradeoff:</b> {approach.tradeoff}</p></article>)}</div></details>
                  <details><summary><span>Phased starter checklist</span><b>{playbook.checklist.length}</b></summary><div className="checklist-phases">{playbookPhases.map(([phase, label]) => {
                    const items = playbook.checklist.filter((item) => item.phase === phase);
                    if (items.length === 0) return null;
                    return <section key={phase}><h4>{label}</h4><ol>{items.map((item) => <li key={item.id} className={item.industries ? "contextual-item" : ""}><strong>{item.title}</strong><p>{item.guidance}</p>{item.industries && <small>Context: {item.industries.filter((industry) => activeIndustries.has(industry)).map(formatIndustry).join(" / ")}</small>}</li>)}</ol></section>;
                  })}</div></details>
                  <details><summary><span>Ownership, evidence, and review</span><b>3</b></summary><div className="playbook-support"><section><h4>Likely owners</h4><ul>{playbook.suggestedOwners.map((owner) => <li key={owner}>{owner}</li>)}</ul></section><section><h4>Evidence examples</h4><ul>{playbook.evidenceExamples.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></section><section><h4>Review triggers</h4><ul>{playbook.reviewTriggers.map((trigger) => <li key={trigger}>{trigger}</li>)}</ul></section></div></details>
                </div>
              </section>}

              {detailSection === "related" && <section className="detail-section" id="record-panel-related" role="tabpanel" aria-labelledby="record-tab-related">
                <div className="section-intro"><span className="section-kicker">Reviewed connections</span><h3>Related materials</h3><p>Relationship labels distinguish publisher-supported links from Eidos editorial context.</p></div>
                <div className="related-grid">{related.length === 0 ? <div className="empty-state"><h3>No reviewed relationships yet</h3><p>This reference remains usable on its own.</p></div> : related.map(({ record, relationship }) => <button key={relationship.id} onClick={() => openRecord(record)}>
                  <span className={`type-badge type-${record.type}`}>{formatCatalogType(record.type)}</span><strong>{record.name}</strong><small>{humanize(relationship.type)} · {formatRelationshipAuthority(relationship.status)}</small><p>{relationship.provenance.rationale}</p><span className="related-source">{relationship.provenance.sourceLabel} · reviewed {relationship.provenance.reviewedAt}</span><b aria-hidden="true">Open →</b>
                </button>)}</div>
              </section>}

              {detailSection === "source" && <section className="detail-section" id="record-panel-source" role="tabpanel" aria-labelledby="record-tab-source">
                <div className="section-intro"><span className="section-kicker">Evidence and trust</span><h3>Source & record metadata</h3><p>Verify the publisher material and see how Eidos classified this record.</p></div>
                <div className="source-layout">
                  <dl className="detail-facts">
                    <div><dt>Published by</dt><dd>{selectedRecord.issuer}</dd></div><div><dt>Version or edition</dt><dd>{selectedRecord.version ?? "Not specified"}</dd></div>
                    <div><dt>Status</dt><dd>{humanize(selectedRecord.status)}</dd></div><div><dt>Effective date</dt><dd>{selectedRecord.effectiveDate ?? "Not recorded"}</dd></div>
                    <div><dt>Industry context</dt><dd>{selectedRecord.industries.map(formatIndustry).join(", ")} · Eidos editorial classification</dd></div><div><dt>Content authority</dt><dd>{selectedRecord.contentAuthority === "publisher" ? "Publisher material — Eidos paraphrase" : "Eidos editorial sample"}</dd></div>
                    <div className="wide"><dt>Editorial review</dt><dd>{selectedRecord.reviewedAt} · {selectedRecord.reviewedBy}</dd></div>
                  </dl>
                  <aside className="source-card">
                    {selectedRecord.officialUrl ? <a className="source-link" href={selectedRecord.officialUrl} target="_blank" rel="noreferrer">Open official publisher source <span aria-hidden="true">↗</span></a> : <div className="editorial-note">Eidos-authored editorial sample—not an official publisher document.</div>}
                    <p className="source-citation"><strong>Source record</strong>{selectedRecord.sourceCitation}</p>
                    <p>{selectedRecord.copyrightTreatment === "metadata_summary_link" ? "Eidos stores metadata, an original short summary, and the publisher link." : "This sample text is Eidos-authored."}</p>
                  </aside>
                </div>
              </section>}
            </div>
          </article>
        </div>
      )}
      {invalidRecordSlug && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRecord(); }}>
          <aside className="detail-panel not-found-panel" aria-modal="true" role="dialog" aria-labelledby="missing-record-title" onKeyDown={trapDialogFocus}>
            <button className="close-button" onClick={closeRecord} aria-label="Close missing reference">×</button>
            <span className="type-badge">Reference not found</span>
            <h2 id="missing-record-title" ref={detailHeadingRef} tabIndex={-1}>This catalog record does not exist.</h2>
            <p className="detail-summary">No published Eidos record matches “{invalidRecordSlug}”. The link may be outdated or incomplete.</p>
            <button className="return-library" onClick={closeRecord}>Return to the library</button>
          </aside>
        </div>
      )}

      {comparisonOpen && comparison && (
        <div className="overlay comparison-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeComparison(); }}>
          <section className="comparison-panel" role="dialog" aria-modal="true" aria-labelledby="compare-title" onKeyDown={trapDialogFocus}>
            <button className="close-button" onClick={closeComparison} aria-label="Close comparison">×</button>
            <span className="section-kicker">Side-by-side reference</span><h2 id="compare-title" ref={comparisonHeadingRef} tabIndex={-1}>Compare governance materials</h2>
            <p>Comparison explains differences; it does not imply equivalence, superiority, or compliance.</p>
            <div className="comparison-grid">
              {comparison.records.map((record) => <article key={record.id}><span className={`type-badge type-${record.type}`}>{formatCatalogType(record.type)}</span><h3>{record.name}</h3><p>{record.summary}</p><dl><div><dt>Publisher</dt><dd>{record.issuer}</dd></div><div><dt>Version</dt><dd>{record.version ?? "Not specified"}</dd></div><div><dt>Status</dt><dd>{humanize(record.status)}</dd></div><div><dt>Jurisdiction</dt><dd>{record.jurisdictions.join(", ")}</dd></div><div><dt>Applicability</dt><dd>{record.applicability}</dd></div><div><dt>Authoritative source</dt><dd>{record.officialUrl ? <a href={record.officialUrl} target="_blank" rel="noreferrer">Official publisher source <span aria-hidden="true">↗</span></a> : "No official publisher link recorded"}</dd></div></dl><button className="open-record" onClick={() => openComparedRecord(record)}>Open full reference</button></article>)}
            </div>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="alert" onAnimationEnd={() => setNotice(null)}>{notice}</div>}
    </div>
  );
}

export default App;
