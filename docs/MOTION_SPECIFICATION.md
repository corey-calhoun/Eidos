# Eidos Motion Specification

> [!IMPORTANT]
> **Historical graph-workspace motion contract.** The current catalog UI follows ordinary reduced-motion-safe page, drawer, and comparison behavior. These camera/node rules are retained only for a possible future optional relationship map.

**Status:** Historical prototype contract; optional map reference only
**Purpose:** Preserve spatial orientation and communicate state changes without making motion an authority signal.
**Companion contracts:** [Design System](./DESIGN_SYSTEM.md), [Visual Grammar](./VISUAL_GRAMMAR.md)

## 1. Motion principles

1. **Orientation before spectacle.** Transitions explain where the user came from, what remains selected, and where related records moved.
2. **Identity is stable.** Existing nodes morph/reposition using stable IDs; they do not fade out and reappear as visually unrelated objects.
3. **Meaning is redundant.** Motion may emphasize change or urgency but never carries the only indication of status, provenance, direction, or selection.
4. **The camera serves the task.** It moves only to reveal selected context, avoid occlusion, fit requested scope, or restore history.
5. **Interruption is safe.** A new selection, Back action, filter change, or `Esc` cancels the current transition and resolves from the current rendered state.
6. **Reduced motion is first-class.** Every operation remains understandable with no camera travel, fan animation, pulse, parallax, or animated counting.

## 2. Motion tokens

### 2.1 Durations

| Token | Value | Use |
|---|---:|---|
| `--motion-instant` | `0ms` | Reduced motion, immediate state repair |
| `--motion-micro` | `90ms` | Press, focus-adjacent emphasis |
| `--motion-fast` | `140ms` | Hover, tooltip dismissal, chip state |
| `--motion-base` | `220ms` | Drawer/sheet, panel, node selection |
| `--motion-layout` | `360ms` | Local graph reflow, category fan |
| `--motion-camera` | `520ms` | Domain/entity drill-down and Back restore |
| `--motion-attention` | `1200ms` | One bounded urgent-state pulse cycle |

No UI transition may exceed `600ms`, except a bounded urgent pulse. Staggering is capped at `120ms` total regardless of item count.

### 2.2 Easing

| Token | Value | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Reposition and resize |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Entering UI |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting UI |
| `--ease-camera` | `cubic-bezier(0.22, 1, 0.36, 1)` | Pan/zoom |
| `--ease-linear` | `linear` | Progress only, never camera travel |

Spring/bounce easing is prohibited for assurance data and panels.

### 2.3 Distance and opacity

- Micro translation: `4px`; panel translation: `12px`; drawer source translation: `24px` from right.
- New contextual records start at their parent/category origin and fan to destination; they do not fly in from viewport edges.
- Background relevance opacity floor: `.18`; transitioning records never pass through `0` unless they are truly removed from active scope.
- Scale range for graph transitions: `0.94–1.04`; selection does not “pop” beyond `1.04`.
- Blur animation is prohibited. Ambient background parallax is prohibited.

## 3. Camera contract

### 3.1 Safe viewport

Camera fitting uses the unobscured rectangle after subtracting:

- top bar(s) plus `24px` margin;
- bottom panel/sheet plus `24px` margin;
- detail drawer plus `24px` margin;
- safe-area insets.

The selected node’s full hit area and label remain inside this rectangle throughout and after camera motion. If simultaneous constraints cannot fit, preserve the selected node first, then anchor/path, then expanded neighbors.

### 3.2 Direct manipulation

- Pointer/touch pan tracks the input at `1:1`, with no inertial travel after release by default.
- Wheel/pinch zoom is centered on the pointer/focal point.
- Zoom controls change one semantic tier per activation.
- Clamp zoom to implementation-defined bounds that keep at least one labeled node actionable; never allow loss in an empty canvas.
- Keyboard pan is not required when spatial node navigation and Fit are available, but any provided pan uses fixed predictable increments.

### 3.3 Programmatic movement

- Domain/entity drill-down: `520ms`, `--ease-camera`.
- Fit current scope (`0`): `360ms`, `--ease-standard`.
- Drawer/panel clearance correction: `220ms`, `--ease-standard`, translating only enough to preserve the selected node.
- Back/Forward restores exact stored camera transform over `520ms` and replays no intermediate fan stagger.
- Programmatic movement must be cancelable by direct pan/zoom input and may not trap focus.

## 4. Transition choreography

### 4.1 Complete universe → domain

Total budget: `520ms`.

1. `0–90ms`: selected domain receives the gold outer ring; breadcrumb announces the pending scope.
2. `60–420ms`: camera pans/zooms; client anchor moves toward the upper-left safe quadrant while remaining visible.
3. `90–360ms`: unrelated domains reposition to perimeter context markers and lower to `.18` relevance; do not remove them.
4. `180–520ms`: selected domain records resolve into their deterministic positions; verified/proposed path from anchor remains drawn.
5. At completion: announce domain name and visible relationship count in a polite live region; move no keyboard focus.

### 4.2 Domain/entity → focused relationship view

Total budget: `360ms` local reflow plus camera correction up to `520ms`.

- Selected entity maintains screen-space continuity: animate from its current rectangle to focus origin.
- Existing direct neighbors travel along their current edge curves.
- Relationship-category satellites emerge from the selected entity at `0.94` scale to `1`, staggered by at most `20ms` each and `120ms` total.
- Unrelated nodes move to perimeter or relevance `.18`; they do not abruptly vanish unless excluded by an active filter.
- Detail drawer may open concurrently only after selection is visually established (`90ms` delay).

### 4.3 Category expansion/collapse

Total budget: `360ms`, `--ease-standard`.

- Expand: category button sets `aria-expanded=true` immediately; child records travel from the category origin along the target arc. Edges draw/reveal with the nodes, not before endpoints exist.
- Stagger: deterministic fan order, max `15ms` per item and `120ms` total. More than nine items animate as a single group with no further stagger.
- Collapse: children travel back toward category origin for `220ms`; selection cannot be collapsed invisibly—if a child is selected, focus returns to the category button and the selected child remains as an “outside collapsed category” context marker until selection changes.
- Count changes are cross-faded; numeric slot width is fixed to prevent layout shift. Screen readers receive one textual count update.

### 4.4 Filter and search changes

- User-initiated filter updates debounce only expensive graph layout, maximum `150ms`; controls update immediately.
- Excluded nodes transition to `.18` over `140ms`, reposition neighbors over `360ms`, then leave hit testing. Do not animate to scale `0`.
- Newly included nodes originate from their domain/category parent and settle over `360ms`.
- If selection is outside filters, keep the selected node and path stable and show its explicit exception state.
- Search-result stepping moves the camera over `220ms`; repeated “next” commands skip animation after the third command within `800ms`.

### 4.5 Natural-language query/results

- Submit immediately marks input busy and shows a static progress line; no endlessly pulsing skeleton.
- Result cards enter upward `12px → 0` and opacity `0 → 1` over `220ms`, as one group.
- Source connectors reveal only after the card is visible. Activating a citation uses the standard entity-focus transition.
- Streaming text, if used, must accumulate in meaningful sentence/paragraph chunks, not animate character-by-character. Screen-reader live updates occur no more than once per completed paragraph.
- Errors replace progress in place without camera movement.

### 4.6 Detail drawer

- Open: translate `24px → 0`, opacity `.8 → 1`, `220ms`, `--ease-enter`.
- Close: translate `0 → 12px`, opacity `1 → .8`, `140ms`, `--ease-exit`; graph selection remains.
- Simultaneously shift camera just enough to keep selection in the safe viewport. Graph and drawer animations share the same start time.
- Switching related records: title/content cross-fade `140ms`; drawer shell does not close/reopen. The graph reorients using entity-focus behavior and pushes history.
- Modeless opening does not animate a page scrim.

### 4.7 Bottom panel and responsive sheets

- Bottom panel expand/collapse: `220ms`, vertical translation `12px`; selected node clearance correction runs concurrently.
- Metrics do not count up. Updated values cross-fade `140ms` and include a timestamp/change label.
- On narrow layouts, details and query sheets are mutually exclusive. Switching uses outgoing `140ms`, then incoming `220ms`; camera correction occurs once against the final sheet height.

### 4.8 Back/Forward

- Restore selection, expansions, filters, camera, drawer record/section, and representation from one graph-history entry.
- Shared nodes follow reverse paths to prior positions; entering/leaving marks use the relevant parent/category origin.
- Breadcrumb updates at transition start; live-region scope announcement occurs at completion.
- Repeated Back/Forward input coalesces to the latest requested history entry; it must not queue multiple seconds of motion.

## 5. Change and urgency motion

Pulse is reserved for **active change or urgent state**, never ordinary selection, hover, or decoration.

- Trigger examples: newly failed control, newly critical finding, evidence expiring within the configured urgent threshold, live validation state changing.
- Pulse uses a non-layout outer ring: opacity `.25 → .75 → .25`, scale `1 → 1.04 → 1`, `1200ms` linear/eased cycle.
- Maximum three cycles, then stop on the high-visibility static status treatment.
- At most three items pulse concurrently. Additional urgent items receive static badges and are prioritized by severity/time.
- Pulse begins only while the tab is visible and pauses offscreen/backgrounded.
- No flashing exceeds three changes per second. Never blink text, fills, or the full viewport.
- Every pulse has persistent color + pattern + icon + text equivalence and an entry in the change/activity summary.

## 6. Loading and data refresh

- Initial graph: render chrome immediately; show stable domain placeholders or a static progress state. When data resolves, place the anchor first, then reveal the complete layout as one `220ms` group.
- Do not simulate graph data with decorative moving nodes.
- Refresh retains stable node positions and IDs. Existing nodes interpolate to changed positions over `360ms`; added nodes emerge from parent; removed nodes retain a labeled tombstone/fade for `220ms` if removal affects current context.
- Source unavailable: freeze last-known graph only when labeled with timestamp and unavailable banner; otherwise show unknown placeholders. Never animate unavailable to healthy zero.
- Background refresh must not steal focus, trigger camera movement, or reopen a closed drawer.

## 7. Focus and assistive-technology behavior

Motion and DOM focus are separate:

- Node/camera movement never moves keyboard focus automatically.
- When a focused node remains in the graph, retain its focus identity throughout reflow.
- If a focused item is removed by a user action, move focus to its logical parent/category and announce the removal.
- Explicit “Open details” may focus the drawer heading; selection-triggered modeless opening retains node focus.
- Closing drawer returns focus to its opener when focus was inside; otherwise focus remains unchanged.
- Announcements describe resulting scope/state, not animation (“Risk R-12 selected, 6 relationships”).

## 8. Reduced-motion contract

Under `prefers-reduced-motion: reduce`, an in-product Reduce motion setting, or test override:

- Set all motion tokens to `0ms` except focus-color transitions up to `50ms`.
- Replace camera travel with an instantaneous transform plus a `150ms` non-moving gold outline confirmation on the selected node; if strict zero-motion is requested, omit even the fade.
- Replace node movement/fan choreography with atomic layout changes. Preserve anchor, breadcrumb, path, selection, and history so orientation is semantic rather than animated.
- Replace pulse with a static urgent ring and badge.
- Disable parallax (already prohibited), animated edge drawing, count-up, shimmer, scale, smooth scrolling, and streaming character effects.
- Drawer/panels appear/disappear in place with no translation. Focus and live-region behavior are identical to standard mode.
- Direct pointer pan/zoom remains available because it is user-controlled; programmatic pan/zoom is instant.

Reduced motion must not reduce information, remove change indicators, disable graph operations, or force users into a different workflow.

## 9. Performance and interruption contract

- Target `60fps`; never fall below an interactive floor of `30fps` during graph transitions on the supported baseline.
- Animate transform and opacity where possible; avoid layout-bound top/left/width animation for nodes and panels.
- Keep input-to-visual-feedback under `100ms`.
- Virtualization/level-of-detail changes occur at semantic zoom boundaries and preserve focus/selection IDs.
- If layout computation exceeds `100ms`, immediately show a static “Arranging relationships” status. The main thread must remain responsive to `Esc`, Back, and direct manipulation.
- On new input, cancel prior animation frames, sample current visual state, and transition to the latest target. No snap-back to an obsolete origin.
- Tests must be able to force all transitions complete deterministically.

## 10. Motion acceptance criteria

- [ ] Domain drill-down keeps the client anchor, selected domain/entity, and connecting contextual path visible throughout or semantically persistent in reduced motion.
- [ ] Entity focus and category fan use stable IDs and deterministic ordering; unchanged data does not reshuffle.
- [ ] The selected node remains in the unobscured safe viewport when top chrome, bottom panel, drawer, or sheets change.
- [ ] Back/Forward atomically restores camera, selection, filters, expansions, drawer, query context, and representation.
- [ ] Motion is interruptible by selection, direct manipulation, Back/Forward, and `Esc`, with no stale queued animations.
- [ ] Detail drawer and bottom panel open without replacing or clearing graph context.
- [ ] Filter/search transitions never hide a selected entity without an explicit “outside filters” state.
- [ ] Pulse is bounded, nonessential, limited to active change/urgent states, and has static accessible equivalents.
- [ ] No animation flashes more than three times per second, traps focus, or causes unexpected focus movement.
- [ ] Reduced-motion mode removes camera travel, fan motion, pulse, shimmer, count-up, and translations while preserving every operation and state.
- [ ] Loading, refresh, source-unavailable, add, update, and removal states do not fabricate authority or healthy zeros.
- [ ] Input feedback is under `100ms`, graph transitions meet the frame-rate floor, and long layout work remains cancelable.
- [ ] Automated tests can disable/finish motion deterministically and verify final graph state without timing races.
