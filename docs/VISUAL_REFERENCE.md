# Visual and Interaction Reference

> [!IMPORTANT]
> **Historical graph-workspace reference.** This source informed the preserved assessment prototype only. The current Eidos front door is the catalog experience defined in [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md); any future graph is optional and secondary.

## Reference

- Source: https://cdn.dribbble.com/userupload/47771395/file/2176ba1ef89e12c95fdfcf99e615f302.mp4
- Use: structural and interaction reference only. Do not copy the original product name, logo, text, proprietary assets, or dataset.

## Literal interaction sequence

1. A full-screen graph establishes the complete information universe.
2. A central foundational entity anchors major domains and their related nodes.
3. The user selects a domain and the camera moves toward it while preserving the central anchor.
4. A natural-language analysis command introduces contextual analysis cards.
5. Selecting an entity collapses unrelated context into a focused relationship view.
6. Relationship-category counts appear next to the selected entity.
7. Selecting a category fans related records outward through curved edges.
8. A detail drawer opens without replacing the graph or losing the selected context.

## Eidos adaptation

Eidos replaces the policy universe with a client assurance universe:

- Center: client web application
- Major domains: business objectives, assets, dependencies, threats, risks, controls, evidence, and requirements
- Detail drawer: status, owner, provenance, evidence freshness, related findings, affected requirements, and consultant notes

## Visual grammar requirements

Every visual signal must have one stable meaning:

- Gold: current selection or mission-critical object
- Purple: systems, assets, identities, or dependencies
- Pink: threats and risks
- Green: validated controls
- Cyan: evidence and verified relationships
- Amber: stale, partial, or expiring assurance
- Red: failed control, critical finding, or unsupported claim
- Gray: unknown or unassessed
- Solid edge: verified relationship
- Dotted edge: proposed or unverified relationship
- Edge thickness: relationship importance
- Edge brightness: current contextual relevance
- Pulse: active change or urgent state

Color must not be the only carrier of meaning. Labels, icons, patterns, or status text must provide an accessible equivalent.

## Orientation requirements

- Keep the selected node visible during drill-down.
- Fade or reposition unrelated nodes instead of abruptly replacing the scene.
- Preserve a clear path back to the prior graph state.
- Keep details in an overlay or drawer so the graph remains contextual.
- Support reduced motion.
- Provide keyboard navigation and a non-graph accessible representation of the selected relationships.

## Design principle

Complexity may be exposed when it helps the consultant reason, but density must be semantic rather than decorative. A node, edge, color, position, or animation that has no documented meaning does not belong in the interface.
