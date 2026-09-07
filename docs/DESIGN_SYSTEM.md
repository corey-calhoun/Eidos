# Eidos Design System Contract

**Status:** Normative UI contract
**Scope:** Security Assurance Graph for a consultant assessing one client web application
**Companion contracts:** [Visual Grammar](./VISUAL_GRAMMAR.md), [Motion Specification](./MOTION_SPECIFICATION.md)

## 1. Product experience principles

1. **The graph is the workspace.** It occupies the viewport; chrome overlays it rather than shrinking it into a dashboard card.
2. **Assurance is explicit.** Verified, proposed, stale, failed, and unknown are visually and textually distinct. AI-generated interpretation is never styled as authoritative evidence.
3. **Context survives inspection.** Filtering, query results, drill-down, and detail inspection retain a visible route back to the complete client graph.
4. **Density must carry meaning.** Every color, shape, edge, position, and animation has a documented semantic role.
5. **Summary once, detail on demand.** Top chrome controls scope; the bottom panel answers and quantifies; the right drawer holds entity detail. Facts are not duplicated across all three.
6. **Accessible equivalence is required.** Every graph operation has a keyboard path and a structured, non-graph representation.

## 2. Viewport composition

The application is a single full-screen workspace (`100dvw × 100dvh`) with these layers, back to front:

| Layer | Region | Contract |
|---|---|---|
| 0 | Graph canvas | Inset `0`; may pan/zoom; never scrolls the document. |
| 1 | Atmosphere | Grid/vignette only; `pointer-events: none`; carries no data. |
| 2 | Top chrome | Two bars: application/context bar, then graph tool/filter bar. |
| 3 | Bottom analysis panel | Metrics strip plus natural-language query surface; overlays canvas. |
| 4 | Right detail drawer | Opens over graph; graph remains visible and retains selection. |
| 5 | Transient UI | Tooltips, menus, toasts, command suggestions, confirmation dialogs. |

### 2.1 Top application/context bar

- Desktop height: `48px`; compact height: `44px`.
- Left: Eidos wordmark as text, client application name, environment badge.
- Center: breadcrumb of graph scope (`Client application / Domain / Entity`), with every ancestor actionable.
- Right: data freshness timestamp, authority-state summary, help, and user menu.
- Do not place primary entity metrics here.

### 2.2 Graph tool/filter bar

- Desktop height: `52px`; sits immediately below the context bar.
- Left-to-right order: back/forward graph history, fit graph, zoom controls, search, filter trigger, visible-result count.
- Legend is a persistent compact row at desktop widths and an explicit popover trigger at narrower widths.
- Active filters appear as removable chips; “Clear all” is visible when two or more are active.
- Search and filters change visibility/emphasis, not the authoritative graph data.

### 2.3 Bottom metrics/query panel

- Expanded desktop height: `176px`; collapsed rail: `48px`; maximum height: `40dvh`.
- Desktop width: `min(960px, calc(100vw - 48px))`; centered `24px` from the bottom.
- First row: up to four cross-domain metrics—assurance state, critical/failed items, stale/expiring evidence, and verified relationship coverage.
- Second row: natural-language query input, submit action, scope indicator, and bounded result summary.
- Query responses are marked **AI-assisted interpretation** and must cite source record IDs/provenance. They cannot create or upgrade a verified relationship, finding, or assurance state.
- Result cards expand upward from this panel and never obscure the selected node; the canvas camera may shift to maintain clearance.

### 2.4 Right detail drawer

- Desktop width: `400px`; wide (`≥1600px`) width: `440px`; maximum `42vw`.
- Opens without route replacement and does not clear graph selection.
- Header: type icon, entity title, stable ID, status, close control.
- Sections, in order: summary; owner; assurance status; provenance; evidence freshness; related findings; affected requirements; consultant notes; relationships table.
- Relationship rows expose type, direction, verification status, source, and an action to focus the counterpart in the graph.
- Consultant notes are visually separated from source-backed facts and show author/time.
- Drawer is modeless. Focus moves to its heading only when opened by an explicit “Open details” command; selection-driven opening leaves focus on the graph entity. `Esc` closes the drawer first.

## 3. Design tokens

Tokens are normative values. Implementations may alias them but must not substitute unrelated semantic colors.

### 3.1 Color

| Token | Value | Use |
|---|---:|---|
| `--color-canvas` | `#070A10` | Full-screen base |
| `--color-surface-1` | `#0D131D` | Bars and panels |
| `--color-surface-2` | `#141D29` | Elevated controls/cards |
| `--color-surface-3` | `#1B2635` | Hover/selected neutral surface |
| `--color-border-subtle` | `#283548` | Panel and control boundaries |
| `--color-border-strong` | `#44536A` | High-emphasis boundaries |
| `--color-text-primary` | `#F4F7FB` | Primary text |
| `--color-text-secondary` | `#AEB9C7` | Secondary text |
| `--color-text-disabled` | `#718096` | Disabled text only |
| `--color-selection` | `#F2C14E` | Current selection / mission-critical |
| `--color-system` | `#A78BFA` | Systems, assets, identities, dependencies |
| `--color-risk` | `#F472B6` | Threats and risks |
| `--color-validated` | `#4ADE80` | Validated controls |
| `--color-evidence` | `#22D3EE` | Evidence and verified relationship emphasis |
| `--color-warning` | `#F59E0B` | Stale, partial, expiring |
| `--color-failure` | `#F87171` | Failed, critical, unsupported |
| `--color-unknown` | `#94A3B8` | Unknown or unassessed |
| `--color-focus` | `#67E8F9` | Keyboard focus only |
| `--color-scrim` | `rgba(2, 6, 12, 0.64)` | Menus/dialogs; not for modeless drawer |

Primary, secondary, and semantic colors above provide at least `6.7:1` contrast on `--color-surface-1`. When used as filled chips, use `#070A10` text. Never put small white text on a semantic fill without a separate contrast check.

### 3.2 Typography

- UI family: `Inter, "Segoe UI", system-ui, sans-serif`.
- Data/ID family: `"IBM Plex Mono", "Cascadia Mono", Consolas, monospace`.
- Weight set: `400`, `500`, `600`, `700`; no lighter weights on dark surfaces.

| Token | Size / line height / weight | Use |
|---|---|---|
| `--type-display` | `24px / 32px / 600` | Workspace or empty-state title |
| `--type-title` | `18px / 26px / 600` | Drawer/panel heading |
| `--type-body` | `14px / 21px / 400` | Default copy |
| `--type-label` | `12px / 16px / 600` | Controls and node labels |
| `--type-meta` | `11px / 16px / 500` | Metadata and counts |
| `--type-code` | `12px / 18px / 500` | IDs, timestamps, source references |

Text scales no smaller than `11px`; critical status text is at least `12px`.

### 3.3 Spacing, size, shape, elevation

- Spacing scale: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 24px`, `--space-6: 32px`, `--space-7: 48px`.
- Radius: controls `6px`; cards `8px`; panels/drawer `12px`; pills `999px`.
- Border: `1px` default, `2px` selection/focus, `3px` critical-node halo.
- Touch target: minimum `44 × 44px`; desktop pointer target minimum `32 × 32px` while retaining a `44px` keyboard/touch hit area.
- Node minimum: compact `112 × 44px`; standard `152 × 56px`; selected `168 × 64px`; node hit target extends `6px` beyond visible bounds.
- Shadows: panels `0 12px 32px rgba(0,0,0,.36)`; drawer `-12px 0 32px rgba(0,0,0,.32)`; selected node `0 0 0 2px #F2C14E, 0 0 24px rgba(242,193,78,.22)`.
- Glass blur is optional and capped at `12px`; an opaque `--color-surface-1` fallback is mandatory.

### 3.4 Iconography

- Use one outlined icon family at `1.75px` stroke, round caps/joins.
- Default sizes: `16px` inline, `20px` controls, `24px` entity glyphs.
- Icons never stand alone for status. Pair status glyphs with a visible label or accessible name.
- Entity-category icon mappings are fixed in the Visual Grammar contract.

## 4. Component states

Every interactive control supports: default, hover, focus-visible, active/pressed, selected, disabled, loading, error. Focus is a `2px` `--color-focus` ring with `2px` offset and must not be removed on dark surfaces.

- **Selection** uses gold border/halo plus a “Selected” accessible state; it does not recolor the entity’s semantic status.
- **Hover** may raise edge brightness or surface color but reveals no hover-only essential action.
- **Loading** uses skeletons for text regions and a non-pulsing progress line under reduced motion.
- **Unavailable** states say which source is unavailable; unavailable data never resolves to a reassuring zero.
- **Empty** states distinguish “no records in scope” from “filters hide all records.”
- **Errors** remain adjacent to the failed operation and include retry if safe.

## 5. Responsive contract

Breakpoints describe behavior, not target devices.

### Wide — `≥1440px`

- Both top bars remain fully expanded.
- Legend is inline; bottom panel is centered at full width; detail drawer overlays or reserves graph clearance via camera shift.
- Graph labels use standard node size; secondary metadata may be visible at zoom ≥100%.

### Standard — `1024–1439px`

- Context names may truncate with full accessible name.
- Legend collapses to type/status summary plus “Legend” popover.
- Bottom panel width is `calc(100vw - 48px)` and shifts left when the drawer is open.
- Drawer is `400px`; selected node remains in the unobscured graph area.

### Compact — `768–1023px`

- Top bars become one `56px` bar plus a horizontally scrollable active-filter row (`40px`) when needed.
- Search becomes an icon-triggered overlay; legend/filter share a sheet.
- Bottom panel is edge-docked (`left/right/bottom: 12px`), collapsed by default.
- Drawer width is `min(420px, 80vw)`.
- Node labels show name plus type only; edge labels appear on focus/selection.

### Narrow — `<768px` or height `<560px`

- This is an investigation companion, not a miniature dense graph.
- Top bar is `52px`; graph fills the remainder. Metrics/query and details open as mutually exclusive bottom sheets, max `75dvh`.
- Filter and legend use a full-width sheet. The breadcrumb shows current entity plus a Back action.
- Initial graph shows the anchor and one relationship ring; users expand categories explicitly.
- A persistent “List view” action exposes the accessible relationship representation.
- No horizontal document scrolling. Safe-area insets are applied to bars and sheets.

At every width: viewport changes preserve selected entity, filters, query scope, camera intent, and graph-history stack.

## 6. Accessibility and keyboard contract

Target **WCAG 2.2 AA**.

### 6.1 Landmarks and names

- Use landmarks for application header, graph workspace, analysis panel, and details aside.
- The graph has an accessible name that includes client application and current scope.
- Canvas/SVG rendering is never the sole representation. Maintain a synchronized relationship table/tree containing the selected entity and all currently expanded relationships.
- Live regions: polite for selection/result counts; assertive only for failed mutations or lost data access. Camera motion is never announced.

### 6.2 Keyboard model

| Key | Behavior |
|---|---|
| `Tab` / `Shift+Tab` | Move among top chrome, graph entry point, bottom panel, drawer; not through every node. |
| `Enter` or `Space` on graph | Enter node-navigation mode / activate focused node. |
| Arrow keys | Move to the nearest node spatially; in focused relationship view, cycle siblings. |
| `Ctrl+Arrow` | Move by relationship category. |
| `Enter` | Select/focus node; on category count, expand/collapse that category. |
| `D` | Open details for selected node. |
| `/` | Focus graph search. |
| `F` | Open filters. |
| `L` | Open legend. |
| `Q` | Focus analysis query. |
| `0` | Fit current scope. |
| `Alt+Left` / `Alt+Right` | Navigate graph-state history without changing browser route. |
| `Esc` | Close transient UI, then drawer/sheet, then exit node-navigation mode; never clears filters without confirmation. |

Provide a discoverable keyboard-help dialog. Do not override shortcuts while typing in an input, textarea, select, or editable region, except `Esc`.

### 6.3 Non-color equivalence

- Node types: icon + text label + shape treatment.
- Assurance states: icon/badge text plus border pattern.
- Relationship authority: solid versus dotted line plus “Verified”/“Proposed” text in tooltips and table.
- Thickness/brightness values are repeated as importance and relevance labels in the relationship table.
- Criticality never relies on pulse; it includes a visible “Critical” badge.

### 6.4 User preferences

- `prefers-reduced-motion: reduce` follows the Motion Specification.
- `forced-colors: active`: remove glows/gradients, use system colors, and retain line pattern plus text labels.
- Browser zoom to `200%` must preserve operations without two-dimensional document scrolling; narrow layout may activate.
- Pointer gestures have equivalent controls; pinch zoom is not required for task completion.

## 7. Content rules

- Use consultant-facing nouns: Objective, Asset, Dependency, Threat, Vulnerability, Risk, Control, Validation, Evidence, Requirement.
- Always distinguish **verified**, **proposed**, **AI-suggested**, and **unknown**.
- Status labels use sentence case and plain language. Tooltips explain abbreviations.
- Dates use an unambiguous local display plus ISO timestamp in accessible/detail text.
- Counts name their scope: “3 failed controls in current view,” not “3 failures.”
- Destructive or authority-changing actions require explicit confirmation and are not implied by graph interaction.

## 8. Acceptance criteria

A release conforms only when all statements are true:

- [ ] The graph is full-screen and remains visible behind both the analysis panel and right detail drawer.
- [ ] Two-tier top chrome provides context, history, search, filters, zoom/fit, and legend access.
- [ ] The bottom panel provides four-or-fewer decision metrics and a scoped natural-language query with AI-authority disclosure and provenance links.
- [ ] Drill-down retains the selected node, breadcrumb/history, and a visible path back.
- [ ] The drawer contains every required detail section and does not replace the graph route.
- [ ] Tokens in this document are used by semantic role; selection color never replaces status color.
- [ ] All interactive states, source-unavailable states, filtered-empty states, and loading states are designed.
- [ ] Wide, standard, compact, narrow, short-height, 200%-zoom, and drawer-open states have no clipped essential controls.
- [ ] Keyboard-only users can search, filter, select a node, expand a category, inspect relationships, open/close details, run a query, and return to the prior graph state.
- [ ] The synchronized non-graph relationship representation exposes the same selected/expanded data.
- [ ] Color, pattern, icon, and text jointly communicate type, status, and authority; normal text contrast meets WCAG 2.2 AA.
- [ ] Reduced-motion and forced-colors presentations retain all information and operations.
- [ ] Unknown or unavailable inputs never render as healthy zero, and AI output never appears verified without deterministic/human provenance.
