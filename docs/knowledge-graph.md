# Knowledge Graph — Schema and Maintenance

> **2026-08-31 (audit) — STALE, regenerate before trusting:** the graph (v1.2, 2026-07-02) still
> encodes the RETIRED joint dual-signed clearance (`CO_RELEASES_WITH`: "one physical certificate
> requiring both signatures") and the pre-collapse DPREQ status chain (screening/endorsed), and
> predates independent certificates, control numbers, cohorts, revisions, and the exemption
> outcome. Treat `0.4`/`1.2`/`WORKFLOWS.md` as controlling until the graph is regenerated.

`knowledge-graph.json` (same folder) is the machine-readable source of truth for how PCC-EDMS's
entities relate to each other across DPO and ORD/REC. It exists because the module docs
(`0.x`–`9.x`) describe relationships in prose scattered across many files (e.g. "this field
feeds that report," in `5.3`; "linked 1:1 or 1:many," in `5.3`'s data model note) — the graph
makes those relationships queryable and diffable in one place.

## Format

Node/edge JSON, compatible with import into Neo4j (via `apoc.load.json` or a small script),
Gephi, or any graph-viz tool that accepts a nodes/edges list. Not GraphML XML — JSON was chosen
for easier hand-editing and diffing in version control; a GraphML export can be generated from
this file if a specific tool requires it.

```json
{
  "meta": { "name": "...", "version": "...", "generated": "...", "nodeCount": N, "edgeCount": N },
  "nodes": [ { "id": "type.slug", "type": "Office|Module|Role|Entity|Status|Report", "label": "...", "properties": { ... } } ],
  "edges": [ { "id": "source::TYPE::target", "source": "node.id", "target": "node.id", "type": "RELATIONSHIP_TYPE", "properties": { ... } } ]
}
```

### Node types
| Type | What it represents | Example |
|---|---|---|
| `Office` | DPO, ORD, REC | `office.dpo` |
| `Module` | A functional module or submodule | `module.remis`, `module.remis_incident` |
| `Role` | A user role (DPO-side or REMIS-side, see `0.2`) | `role.ethics_reviewer` |
| `Entity` | A record/document type the system manages | `entity.remis_application` |
| `Status` | A workflow status value for a given module | `status.remis.for_review` |
| `Report` | A defined report from `5.x` | `report.incident_summary` |

### Edge types (non-exhaustive; see the file for the full set in use)
`OWNS`, `HAS_SUBUNIT`, `HAS_SUBMODULE`, `OPERATES_IN`, `MANAGES`, `LINKED_TO`, `HAS_MANY`,
`HAS_ONE`, `GENERATES`, `EXPOSES`, `ATTACHES`, `LOGS_TO`, `CAN_HAVE_STATUS`, `TRANSITIONS_TO`,
`ACTOR_FOR`, `NOTIFIES`, `NOTIFIED_ON_SUBSET`, `DEFINES`, `FEEDS`.

## Current contents (v1.2, 2026-07-02)
88 nodes / 184 edges covering: both offices, all 6 modules/submodules, all 16 roles (8 DPO-side
+ 7 REMIS-side + Admin), 17 record entities (added `entity.research_application` and
`entity.research_team_nda`, see `0.4-dpo-ethics-integration.md`), the full workflow status chain
for DPREQ/DPNDA/REMIS/Incident (with branch transitions), and all 13 defined reports with their
data-source edges.

Two edges are the most important in the graph — the original DPO↔REMIS notification edge, and
the new joint-clearance edge added this pass:

```json
{ "source": "entity.incident", "target": "role.dpo_staff", "type": "NOTIFIES",
  "properties": { "condition": "incidentType in [Data Breach, Confidentiality Breach]" } }
```

This is the concrete DPO ↔ REMIS integration point: a REMIS incident of type Data Breach or
Confidentiality Breach notifies DPO Staff directly, rather than DPO and REMIS being two
airtight silos that happen to share infrastructure. See `3.5-remis-incident-reporting.md` and
`architecture.md`.

```json
{ "source": "entity.clearance_certificate_dpreq", "target": "entity.clearance_certificate_remis",
  "type": "CO_RELEASES_WITH",
  "properties": { "note": "Form 3 is one physical certificate requiring both signatures before issuance" } }
```

This is the second DPO ↔ Ethics integration point (added 2026-07-02): DPREQ and REMIS aren't
independent applications each issuing their own clearance — they're two tracks on one shared
`entity.research_application` (Form 1), and the resulting certificate is withheld from the
applicant until both tracks sign. See `0.4-dpo-ethics-integration.md`.

## Update process — do this whenever a module doc changes structurally

1. If you add/remove/rename a **role, module, entity, status, or report**, add/remove the
   corresponding node in `knowledge-graph.json`.
2. If you add/remove a **relationship** (a new "feeds this report," a new workflow transition,
   a new cross-module notification), add/remove the corresponding edge.
3. Bump `meta.version` (patch for additive changes, minor for structural rework) and update
   `meta.generated` to the current date.
4. Re-run the validation check below before committing.
5. Log the change in `CHANGELOG.md` alongside whatever doc edit triggered it — the knowledge
   graph update is not a separate changelog entry, it's part of the same entry.

### Validation
```bash
python3 -c "
import json
d = json.load(open('knowledge-graph.json'))
ids = {n['id'] for n in d['nodes']}
assert len(ids) == len(d['nodes']), 'duplicate node id'
dangling = [e for e in d['edges'] if e['source'] not in ids or e['target'] not in ids]
assert not dangling, f'dangling edges: {dangling}'
print('OK:', len(d['nodes']), 'nodes,', len(d['edges']), 'edges')
"
```

## What's intentionally excluded
Individual form fields (e.g. every field in `1.1`'s Section A) are not modeled as nodes — that
level of granularity belongs in `system-design.md`'s data model, not the knowledge graph. The
graph models structural relationships between roles, modules, entities, workflow states, and
reports; the data model in `system-design.md` models field-level schema. Where the two overlap
(e.g. `Risk Level` driving both a status transition and a report), the graph references the
concept by entity/status, and `system-design.md` is the source of truth for the field itself.
