# Eidos Visual Grammar Contract

> [!IMPORTANT]
> **Historical graph-workspace grammar.** It applies only to the preserved assessment prototype. It does not define the catalog-first product or imply that a graph is Eidos's primary interface.

**Status:** Historical prototype contract; optional map reference only
**Purpose:** Define what every graph mark means for one client web-application assurance assessment.
**Companion contracts:** [Design System](./DESIGN_SYSTEM.md), [Motion Specification](./MOTION_SPECIFICATION.md)

## 1. Graph sentence model

The primary assurance chain is:

`Business objective → Asset → Dependency → Threat → Vulnerability → Risk → Control → Validation → Evidence → Requirement`

The graph is not required to render as a single line. It must preserve direction, relationship type, provenance, authority, importance, and relevance. Visual proximity alone never asserts a relationship.

## 2. Coordinate and orientation model

### 2.1 Complete-universe view

- The assessed client web application is the central anchor at world coordinate `(0, 0)`.
- Major domains occupy stable sectors around it in clockwise assurance order:
  - Business objectives `330°–30°`
  - Assets and identities `30°–75°`
  - Dependencies `75°–120°`
  - Threats and vulnerabilities `120°–180°`
  - Risks `180°–220°`
  - Controls `220°–265°`
  - Validations and evidence `265°–310°`
  - Requirements `310°–330°`
- Sector assignment is stable across sessions for the same schema. Within a sector, deterministic sorting uses criticality, then normalized name, then stable ID.
- Domain hubs occupy radius `220–300px`; records occupy successive rings at least `104px` apart. Collision resolution may offset nodes but must not move them into another semantic sector.
- The anchor is always labeled with the client application name, never a generic product or copied reference label.

### 2.2 Domain drill-down

Selecting a domain creates a two-anchor composition:

- Client application anchor remains visible in the upper-left safe quadrant.
- Selected domain moves to the primary focus zone centered in the unobscured canvas.
- A persistent, verified/proposed path connects the anchor to the selected domain.
- Unrelated domains reduce to labeled context markers at the perimeter rather than disappearing.
- Breadcrumb and graph-state history record the prior camera, filters, expansions, and selection.

### 2.3 Entity focus

Selecting an entity produces a local relationship view without replacing the scene:

- Selected entity is fixed at the focus origin.
- Direct relationship-category counts appear as satellites ordered clockwise by the chain model, not by count.
- Unrelated records move to the perimeter at reduced relevance or are hidden if filters demand it.
- Parent domain and client anchor remain visible as context markers connected by a provenance-preserving path.
- Expanding a category fans its records outward on a `70°–120°` arc. Arc side follows relationship direction: incoming on the left/top, outgoing on the right/bottom.
- Fan ordering is deterministic: failed/critical, stale/partial, verified/validated, unknown, then normalized name and stable ID.
- Only one category fan is primary at a time on compact/narrow layouts; desktop may retain up to three expanded categories if nodes do not overlap.

## 3. Node grammar

Every node contains a visible type icon, primary label, and status/authority indicator. A node’s fill identifies its **entity family**; its status is communicated separately.

### 3.1 Entity mapping

| Entity | Family color | Shape treatment | Icon metaphor | Minimum visible label |
|---|---|---|---|---|
| Client web application | Gold `#F2C14E` | Double-ring rounded hexagon | Application window | Application name |
| Business objective | Gold `#F2C14E` | Rounded rectangle with top notch | Target | Objective name |
| Asset | Purple `#A78BFA` | Rounded rectangle | Cube/server | Asset name + subtype |
| Identity | Purple `#A78BFA` | Rounded capsule | User/key | Identity name + subtype |
| Dependency | Purple `#A78BFA` | Clipped-corner rectangle | Linked blocks | Dependency name + subtype |
| Threat | Pink `#F472B6` | Diamond | Adversary/bolt | Threat name |
| Vulnerability | Pink `#F472B6` | Hexagon | Fracture/bug | Identifier or name |
| Risk | Pink `#F472B6` | Rounded diamond with inner dot | Gauge | Risk name + rating |
| Control | Green `#4ADE80` only when validated; gray otherwise | Shield-ended rectangle | Shield | Control name + state |
| Validation | Cyan `#22D3EE` when passed; amber/red/gray by state | Octagon | Check/test tube | Validation name + outcome |
| Evidence | Cyan `#22D3EE` when current and source-backed; state color otherwise | Document rectangle | Document/fingerprint | Evidence name + freshness |
| Requirement/policy | Cyan `#22D3EE` when linked and verified; gray otherwise | Bookmark rectangle | Paragraph/book | Requirement identifier |
| Finding | Red `#F87171` when open/critical; status color otherwise | Triangle-tab card | Flag | Finding name + severity |
| AI suggestion | Gray `#94A3B8` | Dashed outline matching proposed entity type | Spark plus question mark | Suggested type + “AI-suggested” |

Use family color at 12–18% tint for fill and 100% for the type stripe/icon. Status border and badge override the border only, never the family stripe. Controls are not green merely because they exist; green is reserved for validated controls.

### 3.2 Status encoding

| State | Color | Border/pattern | Glyph/text |
|---|---|---|---|
| Selected / mission-critical | Gold | `2px` outer ring; critical adds `3px` separated halo | Pin/star + “Selected” or “Critical” |
| Validated / passed | Green | Solid `2px` | Check + “Validated”/“Passed” |
| Current verified evidence | Cyan | Solid `2px` with provenance tab | Fingerprint + “Verified” |
| Stale / partial / expiring | Amber | Long-dash `2px` | Clock/half-circle + explicit state |
| Failed / critical / unsupported | Red | Double border or `2px` + corner flag | X/flag + explicit state |
| Unknown / unassessed | Gray | Dotted `2px` | Question mark + “Unknown” |
| Proposed / unverified | Gray | Dashed `2px` | Hollow diamond + “Proposed” |

When multiple states apply, priority is selected overlay > failure > warning > validated/current > unknown. Selection is an outer ring and does not remove the underlying status border. Mission-critical status is a persistent badge; it must not be inferred from selection.

### 3.3 Node information budget

At default zoom show no more than:

1. type icon;
2. primary name (two lines maximum);
3. one status label/glyph;
4. one scoped metric (for example, “3 failed controls”).

Owner, full identifiers, provenance, timestamps, notes, and complete relationship lists belong in the detail drawer. At low zoom, nodes reduce to shape + icon + short label; at semantic overview zoom, use labeled domain clusters rather than illegible mini-nodes.

## 4. Edge grammar

An edge represents a typed claim between two records. It is rendered only if a relationship record exists; visual layout must not fabricate relationships.

### 4.1 Authority and verification

| Relationship authority | Line | Label requirement |
|---|---|---|
| Verified by human/deterministic source | Solid | Relationship verb; source available in tooltip/table |
| Proposed, AI-suggested, or unverified | Dotted (`2px` dot, `6px` gap) | Verb + “Proposed”; source/author clearly marked |
| Rejected/invalidated historical link | Red crossed endpoint; not in default graph | Verb + “Rejected”; visible only in history/audit mode |

AI suggestions always use proposed styling, regardless of confidence. No AI-generated relationship may acquire solid styling without an authoritative verification event and provenance record.

### 4.2 Direction and verbs

- Every directed relationship ends in an arrowhead. Bidirectional semantics use two explicit relationship records or a labeled double-headed edge.
- Edge labels use plain verbs such as “supports,” “depends on,” “threatens,” “exploits,” “creates,” “mitigated by,” “tested by,” “produces,” and “satisfies.”
- At low zoom labels hide visually but remain available on focus and in the relationship table.
- Arrowheads remain visible at all supported zoom levels and in forced-colors mode.

### 4.3 Quantitative channels

- **Importance → thickness:** low `1px`, medium `2px`, high `3px`, critical `4px`. Importance values come from the relationship record or an explicit deterministic rule; missing importance uses `1px` and is labeled “Not rated.”
- **Contextual relevance → brightness/opacity:** background `.18`, in-scope `.48`, direct neighbor `.76`, current path `1.0`. Relevance changes with focus but does not change authority or importance.
- **Status → color:** default `#64748B`; verified contextual path cyan `#22D3EE`; validated mitigation green `#4ADE80`; stale/partial amber `#F59E0B`; failed/unsupported red `#F87171`; proposed gray `#94A3B8`.
- Color is subordinate to line pattern, arrowhead, text label, and tabular status.

### 4.4 Geometry

- Default relationships use cubic curves; parallel edges use lanes separated by at least `10px`.
- Curves must not pass through nodes. Endpoint ports are assigned by shortest unobstructed direction and remain stable during a graph state.
- Bundle only edges sharing source, relationship type, authority, and direction. A bundle displays its count and expands on activation.
- Self-relationships use a labeled loop at the upper-right port.
- Crossing reduction may adjust control points but never imply junctions; crossings have no dot. Actual junctions/nodes always have a shape and label.

## 5. Domain, category, and cluster grammar

- Domain hubs are labeled aggregates, not authoritative records. Their counts state the active scope and filter state.
- A category satellite is a button with icon, category name, visible/total count, and expanded state. It is not styled as an entity node.
- Clusters display type distribution plus highest-priority assurance state. A red cluster means it contains a failed/critical item and explicitly says so; it does not mean every child failed.
- Cluster expansion never changes filters. Filtered records are shown in counts as `visible / total` when the total is known.
- Count `0` is permitted only when the source loaded successfully. Unavailable counts render `—` with “Source unavailable.”

## 6. Filter and legend grammar

### 6.1 Filter dimensions

The supported filter dimensions are entity type, assurance state, relationship authority, criticality, owner, evidence freshness, source/provenance, and requirement family.

- Filters combine with AND across dimensions and OR within one dimension.
- Hidden nodes are removed from hit testing and keyboard navigation.
- If a selected node becomes excluded, retain it as a dimmed “Selected outside filters” context node with actions to reveal it or clear selection.
- Filter chips state the dimension and value, not color alone.

### 6.2 Legend

The legend has three explicit groups:

1. **Entity families:** shape + icon + family label.
2. **Assurance/status:** color + border pattern + glyph + text.
3. **Relationships:** solid/dotted authority, thickness importance, brightness relevance, arrow direction.

The legend must explain gold as selection/mission-critical, not generic brand decoration. Legend examples are interactive: focusing one highlights matching marks without changing filters; activating one opens the relevant filter.

## 7. Selection, focus, hover, and comparison

- **Keyboard focus:** cyan `2px` focus ring and no semantic mutation.
- **Pointer hover:** raises local relevance one step and reveals a concise tooltip after `350ms`; no essential information is hover-only.
- **Selection:** gold outer ring, persistent label, relationship-category counts, inspector synchronization.
- **Multi-select/comparison:** optional and capped at four entities. Each gets a numbered gold marker; status colors remain intact. Multi-select is never the default drill-down state.
- Clicking empty canvas clears hover but not selection. Clearing selection requires Back, an explicit “Clear focus,” or returning to the complete-universe state.

## 8. Analysis overlay grammar

Natural-language analysis introduces contextual cards anchored to source nodes or to the bottom query panel.

- Cards are visually neutral (`--color-surface-2`) with an **AI-assisted interpretation** badge.
- Every claim lists the source record(s), provenance state, and “as of” timestamp.
- Confidence, when present, is textual and never converted into verified styling.
- Source-backed facts retain their own status badges within the card.
- Activating a citation focuses the corresponding graph record without closing the analysis result.
- Unsupported claims use red “Unsupported” status and proposed/dotted connectors; they are not silently omitted.

## 9. Detail-drawer synchronization

- Drawer title, status, relationship totals, and selected node must resolve to the same stable entity ID.
- When the selected record updates or disappears, show a visible update/removal state before moving focus; do not silently switch to another record.
- Relationship rows mirror graph edge direction, verb, authority, importance, relevance, and provenance.
- Focusing a relationship row highlights exactly the corresponding edge and endpoints.
- Opening a related record pushes a graph-history entry so Back restores drawer record, camera, and expanded category.

## 10. Accessible non-graph representation

Provide a synchronized tree/table switch adjacent to the graph’s accessible name.

Minimum columns/fields:

- source entity and type;
- relationship verb and direction;
- target entity and type;
- verified/proposed state;
- importance;
- contextual relevance;
- status;
- provenance/source;
- evidence freshness where applicable.

Rows follow the same deterministic order as graph fans. Expand/collapse, select, open details, filter, and Back work in both representations and mutate one shared graph state. The table/tree is not a reduced read-only fallback.

## 11. Graph state and history contract

A restorable graph-state entry contains:

- selected stable entity ID;
- current domain/entity focus;
- expanded relationship categories;
- active filters and search query;
- semantic zoom tier and camera transform;
- open drawer entity and drawer section;
- active analysis result/source references;
- visual or table/tree representation.

The graph Back command restores this state atomically. Browser URL state must encode at least client scope and selected entity so refresh/deep link preserves meaningful orientation; ephemeral hover/tooltips are excluded.

## 12. Acceptance criteria

- [ ] The client web application is the stable central anchor and domains retain deterministic sectors.
- [ ] Domain drill-down, entity focus, and category expansion preserve both client anchor/path context and a Back route.
- [ ] Every entity type uses the specified label, icon, shape treatment, and family/status separation.
- [ ] Gold means selection or mission-critical only; purple, pink, green, cyan, amber, red, and gray match their documented meanings.
- [ ] A control is green only when validated; evidence/requirements are cyan only when current/source-backed or verified as specified.
- [ ] Verified edges are solid; proposed/unverified/AI-suggested edges are dotted and textually labeled.
- [ ] Importance changes only thickness; contextual relevance changes only brightness/opacity.
- [ ] Edge direction, verbs, authority, importance, relevance, and provenance are recoverable without color.
- [ ] Filter results, cluster counts, and unavailable sources cannot create false healthy-zero states.
- [ ] Analysis cards are disclosed as AI-assisted, cite provenance, and cannot visually establish authority.
- [ ] Drawer, graph, and accessible table/tree remain synchronized by stable ID.
- [ ] Keyboard and pointer interactions produce equivalent selection, expansion, details, query, and history behavior.
- [ ] Deterministic ordering prevents unexplained layout churn for unchanged data.
- [ ] Forced-colors and reduced-motion modes preserve every semantic distinction.
