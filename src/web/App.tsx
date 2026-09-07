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
  buildCatalogFacets,
  filterCatalog,
  formatCatalogType,
  formatIndustry,
  formatRelationshipAuthority,
  getIndustryRelevance,
  getRecordDialogFocusAction,
  humanize,
  isComparable,
  toggleComparison,
} from "./catalog-view-model.js";

const summary = catalogSummary();
const initialSlug = new URLSearchParams(window.location.search).get("record");
const initialRecord = initialSlug ? catalogRecords.find((record) => record.slug === initialSlug) ?? null : null;

function trapDialogFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]',
  )].filter((element) => element.tabIndex >= -1);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeIndustries, setActiveIndustries] = useState<Set<CatalogIndustry>>(new Set());
  const [selectedRecord, setSelectedRecord] = useState<CatalogRecord | null>(initialRecord);
  const [invalidRecordSlug, setInvalidRecordSlug] = useState<string | null>(initialSlug && !initialRecord ? initialSlug : null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const comparisonHeadingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const recordOpenerRef = useRef<HTMLElement | null>(null);
  const comparisonOpenerRef = useRef<HTMLElement | null>(null);
  const recordDepthRef = useRef(0);
  const recordDialogWasOpenRef = useRef(Boolean(initialRecord || invalidRecordSlug));

  const facets = useMemo(() => buildCatalogFacets(catalogRecords), []);
  const records = useMemo(() => filterCatalog(catalogRecords, {
    query,
    types: activeType ? new Set([activeType]) : new Set(),
    statuses: new Set(),
    domains: new Set(),
    industries: activeIndustries,
  }), [query, activeType, activeIndustries]);

  const comparedRecords = comparisonIds
    .map((id) => catalogRecords.find((record) => record.id === id))
    .filter((record): record is CatalogRecord => record !== undefined);
  const comparison = comparisonIds.length >= 2 ? compareRecords(comparisonIds) : null;

  useEffect(() => {
    const isOpen = Boolean(selectedRecord || invalidRecordSlug);
    const focusAction = getRecordDialogFocusAction(recordDialogWasOpenRef.current, isOpen);
    recordDialogWasOpenRef.current = isOpen;
    if (focusAction === "focus_dialog") detailHeadingRef.current?.focus();
    if (focusAction === "restore_library") {
      window.setTimeout(() => (recordOpenerRef.current ?? searchRef.current)?.focus(), 0);
    }
  }, [invalidRecordSlug, selectedRecord]);

  useEffect(() => {
    if (comparisonOpen) comparisonHeadingRef.current?.focus();
  }, [comparisonOpen]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const slug = new URLSearchParams(window.location.search).get("record");
      const record = slug ? catalogRecords.find((item) => item.slug === slug) ?? null : null;
      recordDepthRef.current = typeof event.state?.eidosRecordDepth === "number" ? event.state.eidosRecordDepth : 0;
      setSelectedRecord(record);
      setInvalidRecordSlug(slug && !record ? slug : null);
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
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [comparisonOpen, invalidRecordSlug, selectedRecord]);

  function openRecord(record: CatalogRecord) {
    if (!selectedRecord && !invalidRecordSlug) recordOpenerRef.current = document.activeElement as HTMLElement | null;
    setSelectedRecord(record);
    setInvalidRecordSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.set("record", record.slug);
    if (url.href !== window.location.href) {
      recordDepthRef.current += 1;
      window.history.pushState({ eidosRecordDepth: recordDepthRef.current }, "", url);
    }
  }

  function closeRecord() {
    setSelectedRecord(null);
    setInvalidRecordSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("record");
    if (recordDepthRef.current > 0) {
      window.history.go(-recordDepthRef.current);
      recordDepthRef.current = 0;
    } else {
      window.history.replaceState({}, "", url);
    }
  }

  function openComparison() {
    comparisonOpenerRef.current = document.activeElement as HTMLElement | null;
    setComparisonOpen(true);
  }

  function closeComparison() {
    setComparisonOpen(false);
    window.setTimeout(() => comparisonOpenerRef.current?.focus(), 0);
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

  function clearFilters() {
    setQuery("");
    setActiveType(null);
    setActiveIndustries(new Set());
  }

  function changeComparison(record: CatalogRecord) {
    const result = toggleComparison(comparisonIds, record);
    setComparisonIds(result.ids);
    setNotice(result.reason);
  }

  const related = selectedRecord ? getRelatedRecords(selectedRecord.id) : [];

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Eidos library home">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span><strong>Eidos</strong><small>Cybersecurity governance library</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#browse">Browse</a>
          <a href="#catalog-results">Library</a>
          <button className="nav-compare" onClick={openComparison} disabled={comparisonIds.length < 2}>
            Compare <span>{comparisonIds.length}</span>
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="eyebrow">Connected cybersecurity knowledge</div>
          <h1 id="hero-title">Find the rule. Understand the reason. Follow the connection.</h1>
          <p>Eidos brings frameworks, regulations, standards, controls, and policies into one searchable reference library—with sources and relationships you can inspect.</p>
          <label className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <span className="sr-only">Search the Eidos library</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search frameworks, regulations, controls, and policies"
              autoComplete="off"
            />
            <kbd>/</kbd>
          </label>
          <div className="quick-links" aria-label="Suggested searches">
            <span>Try:</span>
            {["NIST CSF", "privacy", "authentication", "incident response"].map((term) => (
              <button key={term} onClick={() => setQuery(term)}>{term}</button>
            ))}
          </div>
        </section>

        <section className="browse-section" id="browse" aria-labelledby="browse-heading">
          <div className="section-heading">
            <div><span className="section-kicker">Browse the landscape</span><h2 id="browse-heading">Start with what you need</h2></div>
            <p>Each directory is a different drawer in the same connected Rolodex.</p>
          </div>
          <div className="directory-grid">
            {facets.types.map((facet) => (
              <button
                key={facet.value}
                className={`directory-card type-${facet.value} ${activeType === facet.value ? "active" : ""}`}
                onClick={() => chooseType(activeType === facet.value ? null : facet.value)}
                aria-pressed={activeType === facet.value}
              >
                <span className="directory-icon" aria-hidden="true">{facet.label.slice(0, 1)}</span>
                <strong>{facet.label}</strong>
                <span>{facet.count} {facet.count === 1 ? "reference" : "references"}</span>
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </section>

        <section className="industry-section" aria-labelledby="industry-heading">
          <div className="industry-panel">
            <div className="industry-copy">
              <span className="section-kicker">Choose your context</span>
              <h2 id="industry-heading">Narrow the library by industry</h2>
              <p>Select one or more sectors. Results include direct industry matches and broadly useful cross-industry references.</p>
              <small>Industry relevance is orientation, not a legal-applicability or compliance determination.</small>
            </div>
            <div className="industry-options" role="group" aria-label="Industry filters">
              {facets.industries.map((facet) => {
                const industry = facet.value as CatalogIndustry;
                const selected = activeIndustries.has(industry);
                return (
                  <button key={industry} aria-pressed={selected} className={selected ? "active" : ""} onClick={() => toggleIndustry(industry)}>
                    <span>{facet.label}</span><b>{facet.directCount === 0 ? "Broad only" : `${facet.directCount} direct`}</b>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="catalog-section" id="catalog-results" aria-labelledby="catalog-heading">
          <div className="section-heading catalog-heading">
            <div>
              <span className="section-kicker">Reference library</span>
              <h2 id="catalog-heading">{activeType ? formatCatalogType(activeType, true) : query ? "Search results" : "Explore the catalog"}</h2>
            </div>
            <div className="catalog-count" aria-live="polite"><strong>{records.length}</strong> shown · {summary.totalRecords} total</div>
          </div>
          {(query || activeType || activeIndustries.size > 0) && (
            <div className="active-filters" aria-label="Active filters">
              {query && <button onClick={() => setQuery("")}>Search: “{query}” <span>×</span></button>}
              {activeType && <button onClick={() => setActiveType(null)}>{formatCatalogType(activeType)} <span>×</span></button>}
              {[...activeIndustries].map((industry) => <button key={industry} onClick={() => toggleIndustry(industry)}>{formatIndustry(industry)} <span>×</span></button>)}
              <button className="clear" onClick={clearFilters}>Clear all</button>
            </div>
          )}
          {records.length === 0 ? (
            <div className="empty-state"><h3>No references found</h3><p>Try a broader term or clear the current filters.</p><button onClick={clearFilters}>Show the full library</button></div>
          ) : (
            <div className="record-grid">
              {records.map((record) => {
                const selected = comparisonIds.includes(record.id);
                const industryRelevance = getIndustryRelevance(record, activeIndustries);
                return (
                  <article className="record-card" key={record.id}>
                    <div className="record-meta"><span className={`type-badge type-${record.type}`}>{formatCatalogType(record.type)}</span><span>{record.status}</span></div>
                    <h3><button onClick={() => openRecord(record)}>{record.name}</button></h3>
                    <p>{record.summary}</p>
                    {industryRelevance && <p className={`relevance-note ${industryRelevance.kind}`}>{industryRelevance.label}</p>}
                    <dl><div><dt>Publisher</dt><dd>{record.issuer}</dd></div><div><dt>Version</dt><dd>{record.version ?? "Not specified"}</dd></div></dl>
                    <div className="record-actions">
                      <button className="open-record" onClick={() => openRecord(record)}>Open reference <span aria-hidden="true">→</span></button>
                      {isComparable(record) && <label className="compare-check"><input type="checkbox" checked={selected} onChange={() => changeComparison(record)} /> Compare</label>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer><div><strong>Eidos</strong><span>{summary.totalRecords} curated references · {summary.totalRelationships} reviewed connections</span></div><p>Educational reference only. Not legal advice, certification, or a compliance determination.</p></footer>

      {comparisonIds.length > 0 && (
        <div className="comparison-bar" role="status">
          <div><strong>{comparisonIds.length} selected</strong><span>{comparedRecords.map((record) => record.acronym ?? record.name).join(" · ")}</span></div>
          <button disabled={comparisonIds.length < 2} onClick={openComparison}>Compare references</button>
          <button className="text-button" onClick={() => setComparisonIds([])}>Clear</button>
        </div>
      )}

      {selectedRecord && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRecord(); }}>
          <aside className="detail-panel" aria-modal="true" role="dialog" aria-labelledby="record-title" onKeyDown={trapDialogFocus}>
            <button className="close-button" onClick={closeRecord} aria-label="Close reference">×</button>
            <span className={`type-badge type-${selectedRecord.type}`}>{formatCatalogType(selectedRecord.type)}</span>
            <h2 id="record-title" ref={detailHeadingRef} tabIndex={-1}>{selectedRecord.name}</h2>
            <p className="detail-summary">{selectedRecord.summary}</p>
            <p>{selectedRecord.description}</p>
            <dl className="detail-facts">
              <div><dt>Published by</dt><dd>{selectedRecord.issuer}</dd></div>
              <div><dt>Version or edition</dt><dd>{selectedRecord.version ?? "Not specified"}</dd></div>
              <div><dt>Status</dt><dd>{humanize(selectedRecord.status)}</dd></div>
              <div><dt>Jurisdiction</dt><dd>{selectedRecord.jurisdictions.join(", ")}</dd></div>
              <div><dt>Industry context</dt><dd>{selectedRecord.industries.map(formatIndustry).join(", ")} · Eidos editorial classification</dd></div>
              <div><dt>Content authority</dt><dd>{selectedRecord.contentAuthority === "publisher" ? "Publisher material — Eidos paraphrase" : "Eidos editorial sample"}</dd></div>
              <div><dt>Effective / applicable date</dt><dd>{selectedRecord.effectiveDate ?? "Not recorded"}</dd></div>
              <div><dt>Editorial review</dt><dd>{selectedRecord.reviewedAt} · {selectedRecord.reviewedBy}</dd></div>
              <div className="wide"><dt>Who it applies to</dt><dd>{selectedRecord.applicability}</dd></div>
            </dl>
            {selectedRecord.officialUrl ? <a className="source-link" href={selectedRecord.officialUrl} target="_blank" rel="noreferrer">Open official publisher source <span aria-hidden="true">↗</span></a> : <div className="editorial-note">Eidos-authored editorial sample—not an official publisher document.</div>}
            <p className="source-citation"><strong>Source record:</strong> {selectedRecord.sourceCitation}. {selectedRecord.copyrightTreatment === "metadata_summary_link" ? "Only metadata, an original short summary, and a publisher link are stored." : "This sample text is Eidos-authored."}</p>
            <section className="tag-section"><h3>Topics</h3><div>{[...selectedRecord.domains, ...selectedRecord.tags].map((tag) => <span key={tag}>{tag}</span>)}</div></section>
            <section className="related-section"><h3>Related materials</h3>{related.length === 0 ? <p>No reviewed relationships yet.</p> : related.map(({ record, relationship }) => (
              <button key={relationship.id} onClick={() => openRecord(record)}>
                <span><strong>{record.name}</strong><small>{humanize(relationship.type)} · {formatRelationshipAuthority(relationship.status)}</small><small>{relationship.provenance.sourceLabel} · reviewed {relationship.provenance.reviewedAt}</small><small>{relationship.provenance.rationale}</small></span><b aria-hidden="true">→</b>
              </button>
            ))}</section>
          </aside>
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
              {comparison.records.map((record) => <article key={record.id}><span className={`type-badge type-${record.type}`}>{formatCatalogType(record.type)}</span><h3>{record.name}</h3><p>{record.summary}</p><dl><div><dt>Publisher</dt><dd>{record.issuer}</dd></div><div><dt>Version</dt><dd>{record.version ?? "Not specified"}</dd></div><div><dt>Jurisdiction</dt><dd>{record.jurisdictions.join(", ")}</dd></div><div><dt>Applicability</dt><dd>{record.applicability}</dd></div></dl><button className="open-record" onClick={() => { closeComparison(); openRecord(record); }}>Open full reference</button></article>)}
            </div>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="alert" onAnimationEnd={() => setNotice(null)}>{notice}</div>}
    </div>
  );
}

export default App;
