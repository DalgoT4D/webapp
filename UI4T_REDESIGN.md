# UI4T Redesign Plan

## Context & Problem

The current workflow editor (UI4T) gives users very little screen space for the DAG canvas:
- **Horizontal squeeze**: Permanently visible ProjectTree sidebar (280-550px)
- **Vertical squeeze**: Bottom Preview/Logs/Statistics pane (300px default, min 100px)
- **Large nodes**: DbtSourceModelNodes are 250x120px, showing column names nobody reads + triggering a `warehouse/table_columns` API call per node on load
- **TopNavBar**: 56px header with just a logo and close button

**Net result**: On a 1440px wide screen, the canvas gets roughly **~900x500px** — less than half the viewport.

**Goal**: Full-screen canvas experience with compact nodes, collapsible sidebar, and per-node detail modal.

---

## Node Design Proposal

### Current Node (250px x ~170px)

```
┌───────────────────────────────────────┐
│  source_table_name              🗑    │  ← Green header (#00897B)
├───────────────────────────────────────┤
│  NAME           │  TYPE               │  ← Column header
├─────────────────┼─────────────────────┤
│  id             │  INTEGER            │  ← Row (scrollable, max 120px)
│  created_at     │  TIMESTAMP          │
│  email          │  VARCHAR            │
│  org_id         │  INTEGER            │
│  ...            │  ...                │
└───────────────────────────────────────┘
   250px wide, ~170px tall
   API call: warehouse/table_columns/{schema}/{table} per node
```

### Proposed Node (160px x ~55px)

**Option A: Compact with info + view (SELECTED)**
```
┌──────────────────────────────┐
│  source_table_n...      🗑   │  ← Green header (color = published status)
├──────────────────────────────┤
│  📊 12 cols              👁  │  ← Gray footer: column count + view icon
└──────────────────────────────┘
   160px wide, ~55px tall
   NO API call on load
```
- Header: node name (trimmed ~20 chars) + delete icon (leaf nodes only)
- Footer left: small table icon + column count from `nodeProps.data.output_columns?.length` (already in graph API response — zero extra API calls)
- Footer right: eye icon (always visible, not hover-only) — opens detail modal
- Published nodes: `#00897B` (teal), Unpublished: `#50A85C` (lighter green)
- Selection: dotted black border (same as current)
- Handles: left (target) and right (source) — same as current

**Why column count works without API calls:** The `CanvasNodeDataResponse` from `transform/v2/dbt_project/graph/` already includes `output_columns: string[]`. We just read `.length` — no extra fetch needed.

**Option B: Single-row compact (even smaller)**
```
┌────────────────────────────────────┐
│  🟢 source_table_name   👁   🗑   │
└────────────────────────────────────┘
   180px wide, ~36px tall
```
- Single row: status dot + name + view icon + delete icon
- Even more compact, but less visual distinction

**Option C: Card-style with type badge**
```
┌────────────────────────────┐
│  source_table_n...         │  ← Green header
│  ┌────────┐                │
│  │ source │         👁  🗑 │  ← Gray body with type badge + actions
│  └────────┘                │
└────────────────────────────┘
   160px wide, ~65px tall
```
- Shows node type (source/model) as a small badge
- More informative but slightly larger

**Recommendation: Option A** — best balance of compact size and visual clarity. The two-row layout (header + footer) gives enough room for the name and actions without being cramped.

### Operation Node (unchanged)
```
┌──────────┐
│   🔧     │  ← Icon area (48px, light bg)
├──────────┤
│  Filter  │  ← Label
└──────────┘
   90px x 100px (no change needed — already compact)
```

---

## Phase 1: Compact DbtSourceModelNode

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/Nodes/DbtSourceModelNode.tsx`

**Remove:**
- `NodeDataTableComponent` — the column table rendering
- `columns` state, `cacheRef` — column data management
- `StyledTableCell`, `StyledTableRow` — styled components for the table
- `useMemo` block that fetches `warehouse/table_columns/{schema}/{name}` — the per-node API call
- `useEffect` block that clears cacheRef on `refresh-canvas`
- MUI Table imports, `httpGet`, `styled` from emotion

**Keep:** ReactFlow Handles, green header, node name, delete button, `handleSelectNode`, `handleDeleteAction`, publish status color logic

**Add:**
- `VisibilityIcon` and `TableChartOutlined` imports from MUI
- Footer row showing: column count (`nodeProps.data.output_columns?.length` — no API call) on the left, View icon button on the right
- View icon dispatches `'open-node-detail-modal'` canvas action
- Reduced width: 250px → 160px

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/Canvas.tsx` (Dagre layout)

Update `getLayoutedElements` graph config for smaller nodes:
| Parameter | Current | New |
|-----------|---------|-----|
| `nodesep` | 200 | 80 |
| `edgesep` | 100 | 50 |
| `width` | 250 | 160 |
| `height` | 120 | 60 |
| `marginx` | 100 | 60 |
| `marginy` | 100 | 60 |
| `ranksep` | 350 | 200 |

---

## Phase 2: Node Detail Modal

### New file: `src/components/TransformWorkflow/FlowEditor/Components/NodeDetailModal.tsx`

MUI Dialog (`maxWidth="lg"`, `fullWidth`, `height: 80vh`) with 3 tabs:
- **Preview**: Table data with pagination, sorting, download (reuse PreviewPane logic)
- **Logs**: Run execution logs (reuse LogsPane as-is)
- **Statistics**: Data insights with charts (reuse StatisticsPane logic, feature-flagged)

Props: `open`, `onClose`, `schema`, `table`, `nodeName`, `dbtRunLogs`, `finalLockCanvas`

Data is lazy-loaded — API calls only happen when the modal opens, not on canvas load.

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane.tsx`

Refactor to accept optional `schema`/`table` props. If provided, use those directly instead of reading from `previewAction` context.

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane.tsx`

Same refactoring — accept optional `schema`/`table` props.

### Modify: `src/contexts/FlowEditorCanvasContext.tsx`

Add `'open-node-detail-modal'` to the Action type union.

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/Canvas.tsx`

- Add `nodeDetailModal` state
- Handle `'open-node-detail-modal'` action
- Import `useDbtRunLogs` hook
- Render `<NodeDetailModal />` alongside existing modals

---

## Phase 3: Remove Bottom LowerSection

### Modify: `src/components/TransformWorkflow/FlowEditor/FlowEditor.tsx`

**Remove entirely:**
- `LowerSection` component
- `LowerSectionTabValues` type export
- `ResizableBox` wrapping LowerSection
- State: `lowerSectionHeight`, `selectedTab`
- `onResize` handler
- All `setSelectedTab('logs')` calls in run/sync handlers
- Imports: `OpenInFull`, `Tab`, `Tabs`, `ResizableBox`, `PreviewPane`, `LogsPane`, `StatisticsPane`, `FeatureFlagKeys`/`useFeatureFlags`

**Add:**
- `isRunning` state to track workflow/sync execution
- Pass `isRunning` as new prop to Canvas

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/Canvas.tsx`

Add floating "Running workflow..." indicator:
- Positioned absolute, bottom-center of canvas
- Shows when `isRunning` prop is true
- Pulsing `CircularProgress` + "Running workflow..." text
- Click to open `NodeDetailModal` with Logs tab focused
- Does NOT auto-open — user clicks when they want to see logs

---

## Phase 4: Collapsible ProjectTree Sidebar

### Modify: `src/components/TransformWorkflow/FlowEditor/FlowEditor.tsx` (UpperSection)

**Replace** the permanently visible `ResizableBox` + `ProjectTree` with:

1. **Toggle button** (absolute positioned, left edge, below CanvasHeader)
   - Shows `AccountTreeIcon` when closed, `ChevronLeftIcon` when open
   - z-index: 1100

2. **Slide-over panel** (Box-based overlay, 320px wide)
   - `position: absolute`, `transform: translateX(0) / translateX(-100%)`
   - 250ms CSS transition for smooth slide
   - z-index: 1050

3. **Backdrop overlay** when open
   - Semi-transparent dark overlay, click to dismiss

**Sidebar stays open** after adding nodes (batch-add UX). Closes via:
- Close button inside ProjectTree header
- Clicking the backdrop overlay
- Clicking the toggle button again

### Modify: `src/components/TransformWorkflow/FlowEditor/Components/ProjectTree.tsx`

Change close button from `{hideHeader && onClose && (...)}` to `{onClose && (...)}` — always show when `onClose` is provided.

---

## Phase 5: Full-Screen Experience

### Modify: `src/components/DBT/UITransformTab.tsx`

**Replace** `TopNavBar` (56px) with a floating close button:
- `position: absolute`, `top: 8`, `right: 8`, `zIndex: 2000`
- White background with border, Close icon
- Dialog `onClose={handleCloseWorkflow}` enables ESC key support (MUI default behavior)

### Modify: `src/components/TransformWorkflow/FlowEditor/FlowEditor.tsx`

Update root Box height: `calc(100vh - 56px)` → `100vh`

---

## Phase 6: Test Updates

- `DbtSourceModelNode.test.tsx` — Remove column-related tests, add View button test
- `FlowEditor.test.tsx` — Remove LowerSection tests, add sidebar toggle test
- `UITransformTab.test.tsx` — Update for new close button pattern
- **New**: `NodeDetailModal.test.tsx` — Modal opens, tabs work, close works

---

## Phase 7: Cleanup

- Remove unused imports across all modified files
- Check if `react-resizable` is still needed elsewhere
- Remove dead `LowerSectionTabValues` type export
- Clean up `FlowEditorPreviewContext` if no longer used

---

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `DbtSourceModelNode.tsx` | Modify | Strip column table/API, compact layout, add View button |
| `Canvas.tsx` | Modify | Dagre params, NodeDetailModal state, run indicator, useDbtRunLogs |
| `FlowEditor.tsx` | Modify | Remove LowerSection, collapsible sidebar, 100vh height, isRunning state |
| `UITransformTab.tsx` | Modify | Replace TopNavBar with floating close button |
| `FlowEditorCanvasContext.tsx` | Modify | Add `open-node-detail-modal` action type |
| `PreviewPane.tsx` | Modify | Accept optional schema/table props |
| `StatisticsPane.tsx` | Modify | Accept optional schema/table props |
| `ProjectTree.tsx` | Modify | Always show close button when onClose provided |
| `NodeDetailModal.tsx` | **Create** | New modal with Preview/Logs/Statistics tabs |

## Implementation Order

**Critical path:** Phase 1 → Phase 2 → Phase 3 (each depends on the previous)

**Independent:** Phase 4 and Phase 5 can be done in parallel, and in parallel with Phase 2/3.

**Suggested order:** Phase 1 → Phase 5 → Phase 4 → Phase 2 → Phase 3 → Phase 6 → Phase 7

---

## Space Savings Summary

| Element | Before | After | Space Reclaimed |
|---------|--------|-------|-----------------|
| TopNavBar | 56px vertical | 0px (floating button) | 56px vertical |
| ProjectTree sidebar | 280-550px horizontal | 0px (overlay) | 280-550px horizontal |
| Bottom pane | 300px vertical | 0px (moved to modal) | 300px vertical |
| Node size | 250x170px | 160x55px | ~70% smaller per node |

**Canvas goes from ~900x500px to ~1440x900px (full viewport).**

---

## Final Verification Checklist

- [ ] "Edit Workflow" → full-screen canvas, no top nav bar, no bottom pane, no sidebar
- [ ] Floating close button (X) at top-right, ESC key closes
- [ ] Toggle button on left edge opens ProjectTree as slide-over overlay
- [ ] Sidebar stays open for batch node additions
- [ ] Source/model nodes are compact (~160x55px), no column tables, no per-node API calls
- [ ] "View" button on node opens modal with Preview/Logs/Statistics tabs
- [ ] Running workflow shows floating indicator, click to see logs
- [ ] All existing functionality preserved: add/delete nodes, run workflow, publish, operations, lock management

---

## Schema Color Coding Exploration (Feb 2026)

### What was attempted
Tried multiple approaches to visually distinguish schemas on the canvas using color coding.

### Approaches tried

**1. Full header color coding (HSL hash-based)**
- Hashed schema name to a hue, used HSL to generate colors
- `hsl(hue, 65%, 42%)` → each schema gets a unique header color
- **Problem**: With 27+ schemas, canvas looked like a rainbow. Too many colors = visual noise, not clarity.

**2. Softened colors**
- Lowered saturation/lightness to `hsl(hue, 45%, 52%)` for muted tones
- **Problem**: Similar schemas still got similar hues. Hard to tell apart.

**3. Golden angle distribution**
- Used golden angle (137.508°) to maximally spread hues apart
- Alternated lightness/saturation: `[44,52,58]%` lightness, `[50,42,55]%` saturation
- **Problem**: Better color spread, but fundamental issue remained — full-color headers don't scale past ~5 schemas aesthetically.

**4. Schema colors in ProjectTree + legend sidebar**
- Added colored dots next to schema folders in the tree
- Created a collapsed sidebar legend strip (44px) with colored dots per schema
- **Problem**: Same core issue — too many colors to be meaningful at 27+ schemas.

### What didn't work (and why)
- **Color coding doesn't scale** past 4-5 categories for full-surface coloring (headers, backgrounds)
- Human perception groups similar colors — with many schemas, users can't reliably map color → schema
- The canvas becomes visually overwhelming instead of informative

### What was kept
- **Table name on node** (`dbtmodel.name`) instead of display name — users see the actual table
- **Schema name as grey label** above the node — clear text identification without color noise
- **Compact operation nodes** (72px wide, down from 90x100px)
- **Dashed border for unpublished** nodes (instead of color differentiation)
- **Original teal/green** header colors (`#00897B` published, `#50A85C` unpublished)
- `getSchemaColor()` utility remains in `utils/common.tsx` if we revisit color coding later

### Future ideas to explore
- **Left accent stripe only** (4px colored left border, neutral header) — much less visual noise
- **Hover-to-highlight** — hover a schema in sidebar highlights all its nodes on canvas
- **Filter/dim** — click a schema to dim all other schemas, focusing on one at a time

---

## Canvas Layout & Interaction Improvements (Feb 2026)

### What was implemented and kept

**1. Node path highlighting** ✅
- Click any node with outgoing edges → highlights all downstream nodes + edges in blue (#1976D2)
- Click an end node (no outgoing edges) → highlights upstream path back to source
- Click canvas background → clears all highlights
- Highlighted nodes: blue border + blue glow shadow
- Highlighted edges: blue stroke, thicker line (2.5px), animated dashed movement
- Non-highlighted nodes/edges dim to 0.3 opacity with 0.2s transition
- Implementation: BFS graph traversal (downstream/upstream) in Canvas.tsx, `isHighlighted`/`isDimmed` flags on node data, `useMemo` for styled nodes/edges

**2. Disconnected subgraph clustering** ✅
- Uses `Dagre.graphlib.alg.components()` to detect disconnected subgraphs
- Each connected component is laid out independently with its own Dagre instance
- Components arranged in a horizontal grid (fills up to 2000px wide, then wraps to next row)
- Larger components placed first for better packing
- 100px gap between clusters
- Prevents the old problem of all nodes stacking in one tall vertical column

**3. Layout controls toolbar** ✅
- Floating toolbar at bottom-left of canvas (next to React Flow zoom controls)
- Horizontal layout (→) — `rankdir: 'LR'`, highlighted when active
- Vertical layout (↓) — `rankdir: 'TB'`, highlighted when active
- Default reset (grid icon) — resets to LR + default spacing
- Decrease spacing (−) — `nodesep` −20 (min 20), `ranksep` −40 (min 60)
- Increase spacing (+) — `nodesep` +20, `ranksep` +40
- Re-layouts current nodes/edges instantly without refetching from backend

### What was tried and removed

**5. Dagre compound graph for schema clustering** ❌
- Used `Dagre.graphlib.Graph({ compound: true })` with `setParent()` to group nodes by schema
- Created visual background rectangle nodes (`SchemaGroupNode`) behind each schema cluster
- `getSchemaColor()` used for tinted backgrounds + dashed borders + uppercase labels
- Operation nodes traced back through edges to inherit their source's schema
- **Problem**: Layout didn't look right in practice — Dagre's compound clustering produced awkward spacing and node arrangements when schemas had cross-schema edges. The visual result was messy rather than clarifying. Same fundamental issue as color coding — with 27+ schemas, visual grouping adds noise rather than clarity.
- **Reverted**: Removed `SchemaGroupNode`, compound graph logic, `getNodeSchema()` helper, and `schemaGroup` node type

**6. ELK layout engine (elkjs)** ❌
- Replaced Dagre with ELK's `layered` algorithm + `LAYER_SWEEP` crossing minimization
- ELK handles disconnected subgraphs natively (`elk.separateConnectedComponents`)
- **Removed**: Did not noticeably improve layout for our complex graph (50+ nodes, many cross-rank edges). ELK's layered algorithm produced similar results to Dagre for this graph topology.

**7. MiniMap (bird's eye view)** ❌
- Added React Flow's built-in `<MiniMap />` component with pannable + zoomable interaction
- Showed node overview in bottom-right corner
- **Removed**: User didn't find it useful for their workflow

### Files modified
- `Canvas.tsx` — layout algorithm (cluster + compound graph attempts), highlight state, layout controls, MiniMap
- `DbtSourceModelNode.tsx` — highlight/dim styling (`isHighlighted`, `isDimmed`)
- `OperationNode.tsx` — highlight/dim styling
- `transform-v2.types.ts` — added `isHighlighted?`, `isDimmed?` to `CanvasNodeRenderData`
- `utils/common.tsx` — `getSchemaColor()` utility kept for future use
