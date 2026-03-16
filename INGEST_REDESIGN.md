# Ingest UI Redesign — Comprehensive Design Doc

## Context

The current ingest page has 3 tabs: **Connections**, **Sources**, **Your Warehouse**. NGO users find this confusing — they don't understand the distinction between "Sources" and "Connections". The warehouse tab is a one-time setup wasting prime navigation space. The Pending Actions accordion for schema changes gets ignored.

**Goal:** Build a single unified table view that merges sources and connections, with progressive onboarding, hover-reveal actions, and inline schema change alerts. Keep the current UI as a separate tab for backward compatibility.

---

## Tab Structure on Ingest Page

| Tab | Query Param | Description |
|-----|-------------|-------------|
| `Current` | `?tab=current` | Existing UI unchanged (sub-tabs: Connections, Sources, Warehouse) |
| `Unified` | `?tab=unified` | New unified table view (default) |

---

## New Unified Table View — Layout

### Warehouse Banner (top)

```
┌──────────────────────────────────────────────────────────────────┐
│  Destination: MAD WAREHOUSE (Postgres)                   [Edit] │
└──────────────────────────────────────────────────────────────────┘
```

- Fetches from `organizations/warehouses` (SWR, `revalidateOnFocus: false`)
- Parses `data.warehouses[0]` → shows `name` + `wtype`
- [Edit] opens existing `DestinationForm` modal
- If no warehouse: shows "Set up your warehouse to get started [+ Add Warehouse]"
- Permissions: `can_edit_warehouse` gates Edit button, `can_create_warehouse` gates Add button

### Search + Add Button Row

```
┌──────────────────────────────────────────────────────────────────┐
│  [Search sources & connections...]        [+ Add Data Source]   │
└──────────────────────────────────────────────────────────────────┘
```

- Search filters by source name, source type, or connection name
- [+ Add Data Source] opens existing `SourceForm` (create mode, `sourceId=''`)
- Permission: `can_create_source` gates the button

### Main Table — Normal State

```
┌────────────────────────────────┬─────────────────────────┬──────────────────┬────────┐
│ Source                          │ Connection              │ Last sync        │        │
├────────────────────────────────┼─────────────────────────┼──────────────────┼────────┤
│ Bubble_staging                  │ Bubble conn api         │ 13hrs ago        │ [Sync] │
│ Bubble API's                    │                         │ ✅ success       │        │
│ airbyte/source-declarative:6.61│                         │ View history     │        │
├────────────────────────────────┼─────────────────────────┼──────────────────┼────────┤
│ crm source data                 │ crm source data         │ 15hrs ago        │ [Sync] │
│ Postgres                        │                         │ ✅ success       │        │
│ airbyte/source-postgres:2.0.33  │                         │ View history     │        │
│                                ├─────────────────────────┼──────────────────┼────────┤
│                                │ crm analytics conn      │ 1d ago           │ [Sync] │
│                                │                         │ ❌ failed        │        │
│                                │                         │ View history     │        │
└────────────────────────────────┴─────────────────────────┴──────────────────┴────────┘
```

**Columns:**
1. **Source** — source name (line 1, bold) + source type (line 2, medium weight) + connector tag (line 3, lighter/smaller, e.g. `airbyte/source-google-sheets:0.8.4`). This matches the current Sources tab layout.
2. **Connection** — connection name (bold). Destination is already visible in the warehouse banner at top, no need to repeat per row.
3. **Last sync** — relative time + status badge + "View history" link
4. **Sync** — [Sync] button (or spinner/cancel during sync)

**Row grouping:** When a source has multiple connections, the source cell spans multiple rows (rowSpan). Source info shown once, connections listed underneath.

**Ordering:** New items appear at the top. Existing items sorted by most recent sync.

---

## Hover Behavior

When user hovers over a source group (any row belonging to that source), the group gets:
- Subtle **background tint** (`#f5f5f5`) + **box-shadow** (`0 2px 8px rgba(0,0,0,0.1)`)
- Two small **⋯ icons** fade in + a **"+ Add Connection"** link

```
Hovered row (single connection):
┌──────────────────────────────┬─────────────────────────┬──────────────────┬────────┐
│ Bubble_staging                │ Bubble conn api         │ 13hrs ago        │ [Sync] │
│ Bubble API's                  │                         │ ✅ success       │        │
│ airbyte/source-decl:6.61     │                         │ View history     │        │
│   [⋯]                        │   [⋯]                   │                  │        │
│                              │ + Add Connection         │                  │        │
└──────────────────────────────┴─────────────────────────┴──────────────────┴────────┘
```

```
Hovered row (multiple connections):
┌──────────────────────────────┬─────────────────────────┬──────────────────┬────────┐
│ crm source data               │ crm source data         │ 15hrs ago        │ [Sync] │
│ Postgres                      │                         │ ✅ success       │        │
│ airbyte/source-postgres:2.0   │                         │ View history     │        │
│   [⋯]                        │   [⋯]                   │                  │        │
│                              ├─────────────────────────┼──────────────────┼────────┤
│                              │ crm analytics conn      │ 1d ago           │ [Sync] │
│                              │                         │ ❌ failed        │        │
│                              │   [⋯]                   │ View history     │        │
│                              │ + Add Connection         │                  │        │
└──────────────────────────────┴─────────────────────────┴──────────────────┴────────┘
```

### Source [⋯] menu (appears below source type on hover)

| Menu Item | Permission | Action |
|-----------|-----------|--------|
| Edit source | `can_edit_source` | Opens `SourceForm` with `sourceId` |
| Delete source | `can_delete_source` | Shows `ConfirmationDialog` ("will delete source and all connections") |

- Disabled in demo mode (`globalContext?.CurrentOrg.state.is_demo`)

### Connection [⋯] menu (appears below connection name on hover)

**Normal state (not syncing):**

| Menu Item | Permission | Action |
|-----------|-----------|--------|
| Edit | `can_edit_connection` | Opens `CreateConnectionForm` with `connectionId` |
| Refresh schema | `can_edit_connection` | `GET airbyte/v1/connections/{id}/catalog` → polls `tasks/stp/{taskId}` |
| Clear Streams | `can_reset_connection` | Opens `StreamSelectionDialog` → `ConfirmationDialog` → triggers clear |
| Delete | `can_delete_connection` | Shows `ConfirmationDialog` |

**During sync (viewMode=true):**

| Menu Item | Permission | Action |
|-----------|-----------|--------|
| View | always | Opens `CreateConnectionForm` in readonly mode |

- Menu disabled while `tempSyncState && !lock` (sync just triggered, waiting for lock)

### "+ Add Connection" link (appears in connection column on hover)
- Appears below the last connection for each source group
- Opens `CreateConnectionForm` with that source pre-selected
- Permission: `can_create_connection`

---

## Progressive Onboarding — Empty States & Animations

### State 1: Source just added, no connection yet

```
┌──────────────┬──────────────────────────────────────────┬──────┬──────┐
│ New_source   │  Connect this source to your warehouse   │  —   │  —   │
│ Google Sheets│  [+ Add Connection] ← pulse animation    │      │      │
└──────────────┴──────────────────────────────────────────┴──────┴──────┘
```

- Row appears at **top** of the table
- The `[+ Add Connection]` button has a **gentle pulse glow** animation (CSS keyframes, 2-3 cycles, ~5s)
- Entire row has a subtle **highlight background** that fades out over 3s
- Opens `CreateConnectionForm` with source pre-selected

### State 2: Connection just created, never synced

```
┌──────────────┬─────────────────────────┬──────────────────┬─────────────┐
│ New_source   │ My new connection       │ Never synced     │ [Sync] ←    │
│ Google Sheets│                         │                  │ pulse anim  │
└──────────────┴─────────────────────────┴──────────────────┴─────────────┘
```

- The [Sync] button has a **gentle pulse glow** animation (2-3 cycles, ~5s)
- Animation stops after timeout or user interaction with that row

### State 3: First sync done — normal row

```
┌──────────────┬─────────────────────────┬──────────────────┬────────┐
│ New_source   │ My new connection       │ Just now         │ [Sync] │
│ Google Sheets│                         │ ✅ success       │        │
│              │                         │ View history     │        │
└──────────────┴─────────────────────────┴──────────────────┴────────┘
```

### State 4: No sources at all (empty table)

```
┌──────────────────────────────────────────────────────────────────┐
│  No data sources yet.                                           │
│  Click "+ Add Data Source" to connect your first data source.   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sync States — Complete Map

### Static states (no lock)

| Condition | Status text | Color | Icon | Sync button |
|-----------|------------|-------|------|-------------|
| `lastRun.status === 'succeeded'` | `success` | `#399D47` | `TaskAltIcon` | [Sync] enabled |
| `lastRun.status === 'canceled'` | `cancelled` | `#DAA520` | `CancelIcon` | [Sync] enabled |
| `lastRun.status` anything else | `failed` | `#981F1F` | `WarningAmberIcon` | [Sync] enabled |
| No lastRun | `Never synced` | grey | — | [Sync] enabled (pulse if new) |

### Active states (lock present)

| Condition | Status text | Extra info | Sync button |
|-----------|------------|-----------|-------------|
| `lock.status === 'running'` | `running` | "Triggered by: {email}" + "{time}" | Disabled + spinner icon |
| `lock.status === 'queued'` | `queued` | Queue tooltip (position, wait time) | **[Cancel]** button |
| `lock.status === 'locked'` or `'complete'` | `locked` | "Triggered by: {email}" + "{time}" | Disabled + spinner icon |
| `lock.status === 'cancelled'` | `cancelled` | — | Disabled + spinner icon |
| `syncingConnectionIds.includes(id)` (no lock yet) | `queued` | — | Disabled + spinner icon |

### Cancel button (queued only)
- Appears when `lock?.status === 'queued' && lock?.flowRunId`
- Calls `POST prefect/flow_runs/{flowRunId}/set_state` with `{state: {name: 'Cancelling', type: 'CANCELLING'}, force: true}`
- Shows loading state, then 6s delay before re-enabling

### Queue tooltip
- Shows when status is `queued` and `queueInfo` has valid data (`queue_no > 0, min/max_wait_time > 0`)
- Displays: "Position in queue: N" + "Estimated wait time: X - Y"
- Pulsing animation on the schedule icon

### View history
- "View history" link under status in the Last sync column
- Opens `ConnectionSyncHistory` full-screen dialog
- Shows table: Job type, Date, Records synced, Bytes synced, Duration, Actions
- Actions per job: "Logs" toggle, "AI summary" toggle (if feature flag `LOG_SUMMARIZATION` enabled + job failed)
- Pagination: "Load more" button if `totalSyncs > offset`
- Failed jobs have red-tinted background (`rgba(211, 47, 47, 0.2)`)

---

## Schema Change — Inline Badge

Instead of a separate Pending Actions accordion, show inline on affected connections:

```
┌──────────────┬──────────────────────────────────┬──────────┬────────┐
│ COPFR_SHEET  │ COPFR Data Connection            │ 12d ago  │ [Sync] │
│ Google Sheets│ ⚠ Schema changed [Review]        │ ✅ success│        │
│              │                                  │ View hist│        │
└──────────────┴──────────────────────────────────┴──────────┴────────┘
```

### How we know breaking vs non-breaking
- The API `GET airbyte/v1/connection/schema_change` returns an array of objects
- Each object has `connection_id` and `change_type` fields
- `change_type` is determined by Airbyte/backend — we just display it
- `change_type === 'breaking'` → breaking badge
- Any other value → non-breaking "Updates" badge

### Badge styles

| Change type | Badge text | Style |
|------------|-----------|-------|
| `breaking` | `Breaking change` | Red background (`#D35D5D`), white text |
| non-breaking | `Schema updated` | Red border (`#D35D5D`), red text, transparent bg |

### Behavior
- Fetch schema changes from `GET airbyte/v1/connection/schema_change` on mount
- Match each `connection_id` in response to connection rows
- Show badge below connection name with `[Review]` link
- `[Review]` opens existing `SchemaChangeDetailsForm` dialog
- Review button disabled if connection is syncing/locked (uses `useSyncLock` hook)
- After approval: refetch schema changes, badge disappears
- Also refetch connection list (`mutate()`)

---

## Data Fetching & Polling (reuse existing logic exactly)

### SWR Hooks

| Endpoint | Used for | Polling |
|----------|---------|---------|
| `airbyte/v1/connections` | Connection list | Every 3000ms if any `conn.lock` exists, else 0 |
| `airbyte/sources` | Source list | Default SWR (no polling) |
| `organizations/warehouses` | Warehouse banner | `revalidateOnFocus: false` |

### Additional fetches on mount

| Endpoint | Purpose |
|----------|---------|
| `GET airbyte/source_definitions` | Source type names + docker tags for display |
| `GET airbyte/v1/connection/schema_change` | Schema change badges |

### Sync flow (triggered by Sync button click)
1. `POST prefect/v1/flows/{deploymentId}/flow_run/` → get `flow_run_id`
2. Set `expandSyncLogs(true)` to show LogCard
3. Poll `GET prefect/flow_runs/{flow_run_id}` every 5000ms until `COMPLETED`/`FAILED`/`CANCELLED`
4. Poll `GET prefect/flow_runs/{flow_run_id}/logs` in parallel for real-time logs → display in LogCard
5. On completion: `mutate()` to refresh connection list
6. Remove connectionId from `syncingConnectionIds`

### Refresh schema flow
1. `GET airbyte/v1/connections/{connectionId}/catalog` → get `task_id`
2. Set `isRefreshing = true` (show loading indicator)
3. Poll `GET tasks/stp/{task_id}` every 2000ms
4. On `completed`: success toast + `mutate()` + `isRefreshing = false`
5. On `failed`: error toast + `isRefreshing = false`

### Clear streams flow
1. Open `StreamSelectionDialog` → user selects streams
2. Show `ConfirmationDialog` with count of selected streams
3. If `selectAll`: `POST prefect/v1/flows/{clearConnDeploymentId}/flow_run/`
4. If selective: `POST prefect/v1/flows/{clearConnDeploymentId}/clear_streams/` with `{connectionId, streams}`
5. On success: toast + `mutate()`

### Delete connection flow
1. Show `ConfirmationDialog` ("will delete connection permanently and all flows built on top")
2. `DELETE airbyte/v1/connections/{connectionId}`
3. On success: toast + `mutate()`

### Delete source flow
1. Show `ConfirmationDialog` ("will delete source permanently and all connections related to it")
2. `DELETE airbyte/sources/{sourceId}`
3. On success: toast + mutate sources

---

## Permissions — Complete Map

| Permission | Controls |
|------------|----------|
| `can_create_source` | "+ Add Data Source" button |
| `can_edit_source` | Source ⋯ → Edit source |
| `can_delete_source` | Source ⋯ → Delete source |
| `can_create_connection` | "+ Add Connection" link (hover) |
| `can_edit_connection` | Connection ⋯ → Edit, Refresh schema |
| `can_delete_connection` | Connection ⋯ → Delete |
| `can_reset_connection` | Connection ⋯ → Clear Streams |
| `can_sync_sources` | [Sync] button enabled |
| `can_edit_warehouse` | Warehouse banner [Edit] |
| `can_create_warehouse` | Warehouse banner [+ Add Warehouse] |
| `can_delete_warehouses` | (only in Current tab, not exposed in Unified view) |
| `can_create_org` | Shows Airbyte workspace link in warehouse details |

### Demo mode
- Source ⋯ menu button disabled/no-op in demo mode (`globalContext?.CurrentOrg.state.is_demo`)
- Warehouse Edit/Delete hidden in demo mode

---

## Amplitude Event Tracking (preserve all existing events)

| Event | Trigger |
|-------|---------|
| `[Sync-connection] Button Clicked` | Sync button clicked |
| `[View history] Button clicked` | View history link clicked |
| `[Reset-connection] Button Clicked` | Clear Streams selected from menu |
| `[connection-logs] Button clicked` | Logs/AI summary toggled in sync history |
| `[ai-summary] Button clicked` | AI summary toggled in sync history |

---

## Contexts & Hooks to Reuse

| Context/Hook | Purpose |
|-------------|---------|
| `ConnectionSyncLogsProvider` | Wraps component, provides `syncLogs` + `setSyncLogs` |
| `useConnSyncLogs()` | Get current sync logs array for LogCard |
| `useConnSyncLogsUpdate()` | Get setSyncLogs function for updating logs during poll |
| `useSyncLock(lock)` | Returns `{tempSyncState, setTempSyncState}` — manages button loading state during polling gap |
| `useTracking()` | Returns `trackAmplitudeEvent` function |
| `GlobalContext` | Provides `Permissions.state`, `CurrentOrg.state` (for demo mode check) |

---

## Existing Components to Reuse (NOT rewrite)

| Component | File | Used for |
|-----------|------|---------|
| `CreateConnectionForm` | `src/components/Connections/CreateConnectionForm.tsx` | Create/edit connection dialog |
| `SourceForm` | `src/components/Sources/SourceForm.tsx` | Create/edit source dialog |
| `DestinationForm` | `src/components/Destinations/DestinationForm.tsx` | Edit warehouse dialog |
| `ConnectionSyncHistory` | `src/components/Connections/ConnectionSyncHistory.tsx` | Sync history full-screen dialog |
| `StreamSelectionDialog` | `src/components/Connections/StreamSelectionDialog.tsx` | Select streams to clear |
| `SchemaChangeDetailsForm` | `src/components/Connections/SchemaChangeDetailsForm.tsx` | Review schema changes dialog |
| `ConfirmationDialog` | `src/components/Dialog/ConfirmationDialog.tsx` | Delete/clear confirmation |
| `ActionsMenu` | `src/components/UI/Menu/Menu.tsx` | ⋯ dropdown menu (used for both source and connection) |
| `LogCard` | `src/components/Logs/LogCard.tsx` | Real-time sync logs at bottom |
| `QueueTooltip` | `src/components/Connections/Connections.tsx` (exported) | Queue position tooltip |
| `StatusIcon` | `src/components/Connections/Connections.tsx` (not exported — need to extract or inline) |

---

## Styling Rules — Keep Existing, Only Add New for Hover/Animations

### KEEP SAME (match current app exactly)
- **MUI components**: Use the same MUI components (Button, Typography, Box, Table, etc.)
- **Font weights**: Bold (`fontWeight: 700`) for names, medium (`fontWeight: 600`) for subtitles, normal (`fontWeight: 400`) for secondary text
- **Colors**: Same greens/reds/greys as current Connections/Sources pages
  - Primary/buttons: `#00897B` (teal green — existing app primary)
  - Success status: `#399D47`
  - Failed status: `#981F1F`
  - Cancelled status: `#DAA520`
  - Text: `#000` for primary, grey for secondary
  - Border: `#DDDDDD` (same as tab border)
- **Button styles**: Same `variant="contained"` green buttons as current Sync/Cancel buttons
- **⋯ menu button**: Same `variant="contained" color="info"` with `MoreHorizIcon` (grey button)
- **Icons**: Same `connectionIcon` SVG for source/connection rows
- **Table headers**: Same style as current `List` component headers (`Source details`, `Type`, etc.)
- **Status icons**: Reuse exact same `StatusIcon`, `QueueTooltip` components from Connections.tsx
- **Typography variants**: Same `variant="body1"`, `variant="subtitle2"` usage
- **Spacing**: Same `sx` padding/margin patterns
- **Dialog styles**: Reuse existing `CustomDialog`, `ConfirmationDialog` as-is
- **Toast messages**: Same `errorToast()`, `successToast()` calls

### NEW (only for hover/animation/layout features)
- Hover background tint: `#f5f5f5`
- Hover box-shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Fade-in opacity transition for hover-revealed elements
- Pulse glow animation for onboarding hints
- Row highlight fade animation for newly added items
- Warehouse banner: subtle background (`#f9f9f9`) with border

### Source Column Typography (3 lines)
```
Line 1: source name     → Typography variant="body1"  fontWeight={600}   color="#000"
Line 2: source type      → Typography variant="subtitle2" fontWeight={600}
Line 3: connector tag    → Typography variant="subtitle2" fontWeight={400}  color="grey"
                           e.g. "airbyte/source-google-sheets:0.8.4"
```
This matches the current Sources page layout (name + type + docker tag).

---

## CSS Animations

### Pulse glow (for [+ Add Connection] and [Sync] on new items)
```css
@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(0, 137, 123, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 137, 123, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 137, 123, 0); }
}
/* Applied for 2-3 cycles (~5s), uses app primary color #00897B */
```

### Row highlight for new items
```css
@keyframes fadeHighlight {
  0% { background-color: rgba(0, 137, 123, 0.1); }
  100% { background-color: transparent; }
}
/* Applied once on mount, fades over 3s */
```

### Hover effect on rows
```css
.sourceGroup:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
```

### ⋯ menus and "+ Add Connection" fade in on hover
```css
.hoverActions {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.sourceGroup:hover .hoverActions {
  opacity: 1;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/Ingest/UnifiedIngestionView.tsx` | Main component: table + warehouse banner + search + all state + all logic |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/pipeline/ingest.tsx` | Add top-level tabs: "Current" (existing) + "Unified" (new default) |

---

## Key Implementation Notes

1. **Source-connection grouping logic:**
   - Fetch both `airbyte/sources` and `airbyte/v1/connections`
   - Group connections by `connection.source.sourceId`
   - For each source, find its connections
   - Sources with 0 connections → show empty connection cell with "+ Add Connection"
   - Handle case where a connection's source might not appear in sources list (shouldn't happen but be safe)

2. **Track "newly added" items for animations:**
   - Use a `useRef` to store previous source/connection IDs
   - Compare on data change → items not in previous set are "new"
   - Set a `isNew` flag that clears after animation timeout (5s)

3. **LogCard at bottom:**
   - Same as current — `ConnectionSyncLogsProvider` wraps the component
   - LogCard displayed below the table
   - Expand/collapse via `expandSyncLogs` state

4. **StatusIcon is currently not exported from Connections.tsx:**
   - Either export it or duplicate the logic inline
   - Same for the `SyncStatus` rendering logic — extract the status derivation into a shared util or inline

5. **Source definitions for display:**
   - Fetch `GET airbyte/source_definitions` on mount
   - Build a map: `sourceDefinitionId → {name, dockerRepository, dockerImageTag}`
   - Use to show source type + version in the Source column

---

## Verification Checklist

1. `yarn dev` → navigate to `/pipeline/ingest`
2. "Current" tab: all existing functionality works unchanged
3. "Unified" tab:
   - [ ] Warehouse banner shows correct info with name + type
   - [ ] Warehouse [Edit] opens DestinationForm and saves correctly
   - [ ] No warehouse → shows setup prompt with [+ Add Warehouse]
   - [ ] Table shows all sources with their connections grouped
   - [ ] Source with multiple connections shows rowSpan grouping
   - [ ] Source with 0 connections shows "+ Add Connection" prompt
   - [ ] Search filters by source name, source type, and connection name
   - [ ] New items appear at top of table
   - [ ] Hover on row → background tint + shadow
   - [ ] Hover reveals source [⋯] below source type
   - [ ] Hover reveals connection [⋯] below each connection name
   - [ ] Hover reveals "+ Add Connection" below last connection
   - [ ] Source [⋯] → Edit opens SourceForm with correct data
   - [ ] Source [⋯] → Delete shows confirmation, deletes, refreshes table
   - [ ] Source [⋯] disabled in demo mode
   - [ ] Connection [⋯] → Edit opens CreateConnectionForm with correct data
   - [ ] Connection [⋯] → Refresh schema works with polling + toast
   - [ ] Connection [⋯] → Clear Streams opens StreamSelectionDialog → confirmation → clears
   - [ ] Connection [⋯] → Delete shows confirmation, deletes, refreshes table
   - [ ] [Sync] button triggers sync, shows spinner, polls for completion
   - [ ] [Cancel] button appears when queued, successfully cancels sync
   - [ ] Queue tooltip shows position and wait time for queued syncs
   - [ ] During sync: connection [⋯] shows "View" instead of "Edit"
   - [ ] During sync: Sync button disabled with spinning icon
   - [ ] "Triggered by" + time shown during active sync
   - [ ] View history link opens ConnectionSyncHistory full-screen dialog
   - [ ] Sync history shows all jobs with logs + AI summary (feature-flagged)
   - [ ] Schema change badges show on affected connections
   - [ ] Breaking → red badge, non-breaking → outlined badge
   - [ ] Schema change [Review] opens SchemaChangeDetailsForm
   - [ ] Schema change [Review] disabled while connection is syncing
   - [ ] After schema approval → badge disappears
   - [ ] [+ Add Data Source] opens SourceForm, new source appears at top with pulse animation
   - [ ] New source → "+ Add Connection" button pulses in connection column
   - [ ] [+ Add Connection] opens CreateConnectionForm with source pre-selected
   - [ ] New connection → [Sync] button pulses
   - [ ] Animations stop after ~5s or user interaction
   - [ ] LogCard shows at bottom during sync with real-time logs
   - [ ] All permissions correctly gate buttons/menus/actions
   - [ ] Demo mode disables source actions
   - [ ] Empty table state renders correctly
   - [ ] All amplitude events fire at correct triggers
   - [ ] Connection list auto-refreshes every 3s when any connection has a lock
   - [ ] `isRefreshing` state shows loading indicator during schema refresh
4. `yarn test` — no regressions
5. `yarn build` — builds successfully

---

## Implementation Phases

### Phase 1: Foundation — Tab Structure & Warehouse Banner
**Status: COMPLETED**

**Goal:** Set up the tab structure on the ingest page and create the UnifiedIngestionView shell with the warehouse banner.

**Tasks:**
1. Modify `src/pages/pipeline/ingest.tsx`:
   - Add top-level tabs: "Current" (existing UI) and "Unified" (new default)
   - "Unified" selected by default (`?tab=unified`)
   - "Current" wraps the existing 3-tab interface unchanged
2. Create `src/components/Ingest/UnifiedIngestionView.tsx`:
   - Scaffold the component with warehouse banner at top
   - Fetch `organizations/warehouses` via SWR
   - Display warehouse name + type
   - [Edit] button opens existing `DestinationForm` modal
   - Empty state: "Set up your warehouse to get started [+ Add Warehouse]"
   - Gate Edit/Add buttons with `can_edit_warehouse` / `can_create_warehouse`

**Verification:**
- [ ] Navigate to `/pipeline/ingest` → lands on Unified tab
- [ ] Switch to Current tab → existing UI works unchanged
- [ ] Warehouse banner shows correct name + type
- [ ] Edit opens DestinationForm, saves correctly
- [ ] No warehouse → shows setup prompt

---

### Phase 2: Core Table — Source-Connection Grouped Display
**Status: COMPLETED**

**Goal:** Build the main unified table with source-connection grouping, search bar, and "+ Add Data Source" button.

**Tasks:**
1. Fetch `airbyte/sources` and `airbyte/v1/connections` via SWR
2. Fetch `airbyte/source_definitions` on mount → build sourceDefId → {name, docker} map
3. Group connections by `connection.source.sourceId`
4. Build the table:
   - Source column: name (bold) + source type (medium) + connector tag (light/small)
   - Connection column: connection name (bold)
   - Last sync column: placeholder text (sync status comes in Phase 3)
   - Sync column: placeholder button (functionality in Phase 3)
5. Row grouping: when a source has multiple connections, source cell spans rows (rowSpan)
6. Sources with 0 connections → show empty connection cell with "+ Add Connection" prompt
7. Add search bar + "+ Add Data Source" button row above the table
8. Search filters by source name, source type, or connection name
9. Ordering: sorted by most recent sync (or alphabetical as fallback for now)
10. "+ Add Data Source" opens existing `SourceForm` (create mode)
11. Gate "+ Add Data Source" with `can_create_source`

**Verification:**
- [ ] Table shows all sources with their connections grouped
- [ ] Source with multiple connections shows rowSpan grouping
- [ ] Source with 0 connections shows "+ Add Connection" prompt
- [ ] Search filters correctly
- [ ] "+ Add Data Source" opens SourceForm

---

### Phase 3: Sync & Status — Live Sync States, Polling & LogCard
**Status: COMPLETED**

**Goal:** Implement full sync functionality: status display, sync/cancel buttons, polling, and LogCard integration.

**Tasks:**
1. Wrap `UnifiedIngestionView` with `ConnectionSyncLogsProvider`
2. Implement Last Sync column:
   - Relative time display (e.g., "13hrs ago")
   - Status badge with `StatusIcon` (extract/inline from Connections.tsx)
   - "View history" link → opens `ConnectionSyncHistory` dialog
3. Implement Sync button:
   - Triggers `POST prefect/v1/flows/{deploymentId}/flow_run/`
   - Shows spinner during sync
   - Uses `useSyncLock` hook for state management
4. Implement Cancel button:
   - Appears when `lock?.status === 'queued' && lock?.flowRunId`
   - Calls cancel endpoint
5. Implement `QueueTooltip` for queued connections
6. Show "Triggered by: {email}" + time during active sync
7. Enable connection list polling: every 3s when any connection has a lock, else 0
8. Implement sync log polling:
   - Poll `GET prefect/flow_runs/{flow_run_id}` every 5s
   - Poll logs in parallel → feed to LogCard
   - On completion: `mutate()` to refresh
9. Add `LogCard` below the table (expand/collapse via state)
10. Track `syncingConnectionIds` for UI state during polling gap
11. Fire amplitude event: `[Sync-connection] Button Clicked`
12. Fire amplitude event: `[View history] Button clicked`

**Verification:**
- [ ] Status icons render correctly for all states (success, failed, cancelled, running, queued)
- [ ] Sync button triggers sync, shows spinner, polls for completion
- [ ] Cancel button appears when queued, cancels successfully
- [ ] Queue tooltip shows position and wait time
- [ ] "Triggered by" + time shown during active sync
- [ ] View history opens sync history dialog
- [ ] LogCard shows at bottom during sync with real-time logs
- [ ] Connection list auto-refreshes every 3s when any connection has a lock

---

### Phase 4: Actions & Menus — Hover Behavior, CRUD Operations
**Status: COMPLETED**

**Goal:** Implement hover effects, source/connection action menus, and all CRUD flows.

**Tasks:**
1. Implement hover behavior on source groups:
   - Background tint (`#f5f5f5`) + box-shadow on hover
   - CSS transition: `all 0.2s ease`
2. Source [⋯] menu (fade in on hover):
   - Edit source → opens `SourceForm` with `sourceId`
   - Delete source → `ConfirmationDialog` → `DELETE airbyte/sources/{sourceId}` → mutate
   - Disabled in demo mode
   - Gate with `can_edit_source`, `can_delete_source`
3. Connection [⋯] menu (fade in on hover):
   - Normal state: Edit, Refresh schema, Clear Streams, Delete
   - During sync (viewMode): only "View" option
   - Menu disabled while `tempSyncState && !lock`
   - Gate with appropriate permissions
4. Implement Refresh schema flow:
   - `GET airbyte/v1/connections/{id}/catalog` → poll `tasks/stp/{taskId}` → toast
5. Implement Clear Streams flow:
   - Open `StreamSelectionDialog` → `ConfirmationDialog` → trigger clear
   - Handle selectAll vs selective clear
6. Implement Delete connection flow:
   - `ConfirmationDialog` → `DELETE airbyte/v1/connections/{connectionId}` → toast + mutate
7. "+ Add Connection" link (fade in on hover below last connection):
   - Opens `CreateConnectionForm` with source pre-selected
   - Gate with `can_create_connection`
8. Fire amplitude event: `[Reset-connection] Button Clicked`

**Verification:**
- [ ] Hover on row → background tint + shadow
- [ ] Hover reveals source [⋯] and connection [⋯] menus
- [ ] Hover reveals "+ Add Connection" below last connection
- [ ] Source Edit/Delete work correctly
- [ ] Connection Edit/Refresh/Clear/Delete work correctly
- [ ] During sync: connection menu shows "View" only
- [ ] Demo mode disables source actions
- [ ] All permissions correctly gate buttons/menus/actions

---

### Phase 5: Schema Change — Inline Badges & Review
**Status: COMPLETED**

**Goal:** Replace the Pending Actions accordion with inline schema change badges on affected connections.

**Tasks:**
1. Fetch `GET airbyte/v1/connection/schema_change` on mount
2. Match `connection_id` in response to connection rows
3. Display badge below connection name:
   - Breaking: red background (`#D35D5D`), white text, "Breaking change"
   - Non-breaking: red border (`#D35D5D`), red text, transparent bg, "Schema updated"
4. Add `[Review]` link next to badge
5. `[Review]` opens existing `SchemaChangeDetailsForm` dialog
6. `[Review]` disabled while connection is syncing/locked (use `useSyncLock`)
7. After approval: refetch schema changes → badge disappears
8. Also refetch connection list (`mutate()`)

**Verification:**
- [ ] Schema change badges show on affected connections
- [ ] Breaking → red badge, non-breaking → outlined badge
- [ ] [Review] opens SchemaChangeDetailsForm
- [ ] [Review] disabled while connection is syncing
- [ ] After approval → badge disappears, lists refresh

---

### Phase 6: Progressive Onboarding — Empty States & Animations
**Status: COMPLETED**

**Goal:** Implement all empty states, new-item animations, and progressive onboarding hints.

**Tasks:**
1. Track "newly added" items:
   - Use `useRef` to store previous source/connection IDs
   - Compare on data change → new items get `isNew` flag
   - Clear `isNew` after 5s timeout
2. State 1 — Source added, no connection:
   - Row at top, "Connect this source to your warehouse" message
   - `[+ Add Connection]` button with pulse glow animation
   - Row highlight that fades over 3s
3. State 2 — Connection created, never synced:
   - "Never synced" in Last sync column
   - [Sync] button with pulse glow (2-3 cycles, ~5s)
4. State 3 — First sync done: normal row (already implemented)
5. State 4 — No sources at all:
   - Empty table message: "No data sources yet. Click '+ Add Data Source' to connect your first data source."
6. Implement CSS animations:
   - `@keyframes pulseGlow` for pulse effect
   - `@keyframes fadeHighlight` for new row highlight
7. New items appear at top of table (ordering adjustment)
8. Animations stop after ~5s or user interaction with that row

**Verification:**
- [ ] New source appears at top with pulse on "+ Add Connection"
- [ ] New connection shows pulse on [Sync] button
- [ ] Row highlight fades over 3s for new items
- [ ] Empty table state renders correctly
- [ ] Animations stop after ~5s

---

### Phase 7: Polish — Permissions Audit, Event Tracking & Build
**Status: COMPLETED**

**Goal:** Final pass for permissions, amplitude events, demo mode, edge cases, and build verification.

**Tasks:**
1. Audit all permissions against the complete permission map in the design doc
2. Verify all amplitude events fire at correct triggers:
   - `[Sync-connection] Button Clicked`
   - `[View history] Button clicked`
   - `[Reset-connection] Button Clicked`
   - `[connection-logs] Button clicked`
   - `[ai-summary] Button clicked`
3. Verify demo mode disables correct actions
4. Test edge cases:
   - Source with no connections
   - Connection with no lastRun
   - Connection with lock but no flowRunId
   - Multiple connections per source
   - Search with no results
5. Run `yarn test` — fix any regressions
6. Run `yarn build` — fix any build errors
7. Manual smoke test against full verification checklist

**Verification:**
- [ ] All permissions correctly gate all buttons/menus/actions
- [ ] All amplitude events fire correctly
- [ ] Demo mode works correctly
- [ ] `yarn test` passes
- [ ] `yarn build` succeeds
- [ ] Full verification checklist passes
