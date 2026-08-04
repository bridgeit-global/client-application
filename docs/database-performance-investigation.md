# DB performance investigation: widespread `statement timeout` errors

**Status:** Draft for the Supabase/backend repo — not yet applied. This document is a
handoff write-up, not a change made in `client-application`.

**Project:** `bridgeit` (`zgbofwfpldyuvhvmelam`, `ap-south-1`, Postgres 15.8)

**Trigger:** The Batch page's "Funds Overview" card intermittently shows
`57014 canceling statement due to statement timeout` when calling
`portal.is_approved_amount_within_threshold()`.

## TL;DR

This is **not a Supabase platform bug** — it's self-inflicted:

1. `bills`, `connections`, `sites`, `batches`, `client_payments`, and `organizations`
   each carry **4–5 overlapping SELECT-capable RLS policies** that all independently
   re-derive "does this row belong to my org," combined with `OR`. Postgres has to
   evaluate all of them on every row.
2. At least one of those redundant policy branches makes the planner fall back to a
   **sequential scan of the entire `sites` table** instead of using the existing
   `idx_sites_org_id` index (confirmed via `EXPLAIN ANALYZE`, see below).
3. Several hot list/report queries request `count: 'estimated'`, but Supabase's
   "estimated count" strategy only skips the expensive exact `COUNT` when the table
   has **> 50,000 rows**. `bills` (14k), `connections` (7k), and `sites` (7k) are all
   under that threshold, so pagination silently runs a full exact `COUNT` with the
   same expensive joins on every page load anyway.
4. All of this competes for CPU on a modest compute tier (512 MB `shared_buffers`,
   90 `max_connections`), so when the heavy queries above are running, unrelated
   cheap queries (like the Funds Overview RPC) get starved and hit
   `statement_timeout` as collateral damage.

Recommended fix: consolidate the redundant RLS policies (same access rules, cheaper
to evaluate) — draft SQL is below. No app-code changes are required for this.

## Evidence

### 1. Postgres error log

`get_logs(service=postgres)` for the last ~24h shows **60+**
`canceling statement due to statement timeout` errors clustered in a ~23-minute
window, not isolated to one function.

### 2. `pg_stat_statements` — top queries by total time

| Query (abbreviated) | Calls | Mean | Max |
|---|---|---|---|
| Bills list (id/date/status/amount + connection) | 448 | 2.3s | 4.0s |
| Bills list w/ connections + meter readings | 432 | 1.1s | 3.0s |
| Connections list | 35 | 5.1s | 7.8s |
| `get_site_type_summary()` | 38 | 4.0s | 6.2s |
| `get_zone_site_summary()` | 38 | 4.0s | 6.1s |
| Sites list w/ connections | 39 | 3.7s | 7.5s |
| Sites list | 38 | 3.2s | 4.8s |
| Bills w/ additional/adherence charges | 43 | 2.4s | 3.7s |
| `get_connection_paytype_summary()` | 21 | 4.5s | 7.2s |
| `get_active_connections_by_board()` | 38 | 2.3s | 3.7s |
| `is_approved_amount_within_threshold()` (Funds Overview) | 1 | 7.9s | 7.9s |

### 3. `EXPLAIN (ANALYZE, BUFFERS)` — proof of the seq-scan branch

Running the "New/Postpaid bills" query as an authenticated `user` (real RLS active)
shows the planner evaluating a `Filter` on `connections` that OR's together **four**
RLS branches (`user_read_only`, `service_full_access`, `operator_read_only`,
`admin_full_access`). One of those branches — the raw JWT-parsing `user_read_only`
expression — gets planned as:

```
SubPlan 56
  ->  Seq Scan on sites s_15  (cost=0.00..1836.25 rows=3 width=5) (actual time=39.676..113.274 rows=574 loops=1)
        Filter: (...org_id = (((jwt user_metadata)::jsonb ->> 'org_id'))::uuid...)
        Rows Removed by Filter: 7117
```

A sibling branch on the exact same table, using the shared
`portal.get_request_user_org_id()` helper, plans as a cheap index scan instead:

```
SubPlan 60
  ->  Index Scan using idx_sites_org_id on sites s_17  (cost=0.53..2.93 rows=1 width=5) (actual time=0.003..0.003 rows=0 loops=1)
        Index Cond: (org_id = portal.get_request_user_org_id())
```

Same table, same logical check, ~40,000x difference in cost — purely because of how
each policy's condition is written. Every table with duplicated policies pays this
tax on every query that touches it.

### 4. Current RLS policies (as of this investigation)

Full dump of `pg_policies` for the affected tables is preserved in the investigation
session; the shape is consistent across tables: one `service_full_access` (`ALL`,
`auth.role() = 'service_role'`), then 2–4 more policies that each re-implement the
org-membership check with a different role gate (`admin`, `operator`, `user`), mostly
via raw `(auth.jwt() ->> 'user_metadata')::jsonb ->> 'org_id'` casts instead of the
existing `portal.get_request_user_org_id()` helper.

## Root cause

- **Policy duplication, not missing indexes.** All the join columns already have
  indexes (`idx_bills_connection_id`, `idx_connections_site_id`,
  `idx_connections_id`, `idx_sites_id`, `idx_sites_org_id`, etc.). The problem is
  that 3–5 policies per table each independently check org membership, and at least
  one of those per-table implementations doesn't plan down to an index scan.
- **`count: 'estimated'` doesn't help below ~50k rows.** Supabase/PostgREST's
  "estimated" count mode checks `pg_class.reltuples`; only above the 50,000-row
  threshold does it skip the real `COUNT`. For this project's current data volumes,
  every "estimated" count on `bills`/`connections`/`sites` is actually an exact
  count with the full filter+join chain — twice the query cost per page load.
- **Compute tier headroom.** `shared_buffers` = 512MB, `max_connections` = 90,
  `work_mem` = 5MB. With the query costs above, concurrent traffic from a handful of
  staff using the Bills/Sites/Connections list pages and dashboard summary widgets
  is enough to starve the DB and cause unrelated queries to hit
  `statement_timeout`. Fixing the RLS duplication should recover most of this
  headroom without a tier upgrade, but it's worth monitoring afterward.

## Proposed fix (draft — needs review before applying)

Goal: **same access rules**, fewer/cheaper policy evaluations. Two changes:

1. Add a `get_request_user_role()` helper mirroring the existing
   `get_request_user_org_id()` (same pattern, `STABLE`, JWT-first with
   `auth.users` fallback), so role checks stop re-parsing JSON per policy.
2. Per table: keep `service_full_access` as-is, split any `FOR ALL` admin policy
   into write-only (`INSERT`/`UPDATE`/`DELETE`) policies, and replace the 2–4
   duplicated `SELECT` policies with **one** combined `SELECT` policy that checks
   role membership + org match using the shared helpers, wrapped in
   `(select ...)` per the [Postgres RLS performance guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
   so it's evaluated once per statement instead of once per row.

```sql
-- 1. Shared role helper (mirrors get_request_user_org_id)
CREATE OR REPLACE FUNCTION portal.get_request_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH jwt_claim AS (
    SELECT NULLIF(auth.jwt() -> 'user_metadata' ->> 'role', '') AS role
  )
  SELECT COALESCE(
    (SELECT role FROM jwt_claim),
    (SELECT (u.raw_user_meta_data ->> 'role')
     FROM auth.users u
     WHERE u.id = auth.uid())
  );
$function$;

-- 2. connections: operator_read_only / user_read_only are already strict subsets
--    of connections_read_by_org (which has no role gate at all) -> pure dead weight.
DROP POLICY IF EXISTS operator_read_only ON portal.connections;
DROP POLICY IF EXISTS user_read_only ON portal.connections;
-- admin_full_access (ALL) still covers admin writes; split it so SELECT doesn't
-- also re-check admin's branch on top of connections_read_by_org:
DROP POLICY IF EXISTS admin_full_access ON portal.connections;
CREATE POLICY admin_write ON portal.connections
  FOR INSERT
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.sites s
      WHERE s.id = connections.site_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );
CREATE POLICY admin_write ON portal.connections
  FOR UPDATE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.sites s
      WHERE s.id = connections.site_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  )
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.sites s
      WHERE s.id = connections.site_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );
CREATE POLICY admin_write ON portal.connections
  FOR DELETE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.sites s
      WHERE s.id = connections.site_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );
-- connections_read_by_org already grants SELECT to any org member; no change needed there.

-- 3. bills: admin/operator/user SELECT branches are IDENTICAL except for role ->
--    collapse into one policy; keep admin's write access via a separate ALL-minus-select policy.
DROP POLICY IF EXISTS admin_full_access ON portal.bills;
DROP POLICY IF EXISTS operator_read_only ON portal.bills;
DROP POLICY IF EXISTS user_read_only ON portal.bills;

CREATE POLICY read_by_org ON portal.bills
  FOR SELECT
  USING (
    (select portal.get_request_user_role()) = ANY (ARRAY['admin','operator','user'])
    AND EXISTS (
      SELECT 1 FROM portal.connections c
      JOIN portal.sites s ON s.id = c.site_id
      WHERE c.id = bills.connection_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );

CREATE POLICY admin_write ON portal.bills
  FOR INSERT
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.connections c
      JOIN portal.sites s ON s.id = c.site_id
      WHERE c.id = bills.connection_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );
CREATE POLICY admin_write ON portal.bills
  FOR UPDATE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.connections c
      JOIN portal.sites s ON s.id = c.site_id
      WHERE c.id = bills.connection_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  )
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.connections c
      JOIN portal.sites s ON s.id = c.site_id
      WHERE c.id = bills.connection_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );
CREATE POLICY admin_write ON portal.bills
  FOR DELETE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND EXISTS (
      SELECT 1 FROM portal.connections c
      JOIN portal.sites s ON s.id = c.site_id
      WHERE c.id = bills.connection_id
        AND s.org_id = (select portal.get_request_user_org_id())
    )
  );

-- 4. sites: admin + user SELECT branches share the same org_id check.
DROP POLICY IF EXISTS admin_full_access ON portal.sites;
DROP POLICY IF EXISTS user_read_only ON portal.sites;

CREATE POLICY read_by_org ON portal.sites
  FOR SELECT
  USING (
    (select portal.get_request_user_role()) = ANY (ARRAY['admin','user'])
    AND org_id = (select portal.get_request_user_org_id())
  );

CREATE POLICY admin_write ON portal.sites
  FOR INSERT
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND org_id = (select portal.get_request_user_org_id())
  );
CREATE POLICY admin_write ON portal.sites
  FOR UPDATE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND org_id = (select portal.get_request_user_org_id())
  )
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND org_id = (select portal.get_request_user_org_id())
  );
CREATE POLICY admin_write ON portal.sites
  FOR DELETE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND org_id = (select portal.get_request_user_org_id())
  );

-- 5. client_payments: admin/user SELECT branches are IDENTICAL except role.
DROP POLICY IF EXISTS admin_full_access ON portal.client_payments;
DROP POLICY IF EXISTS user_read_only ON portal.client_payments;

CREATE POLICY read_by_org ON portal.client_payments
  FOR SELECT
  USING (
    (select portal.get_request_user_role()) = ANY (ARRAY['admin','user'])
    AND (
      EXISTS (
        SELECT 1 FROM portal.bills b
        JOIN portal.connections c ON c.id = b.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE b.id = client_payments.bill_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
      OR EXISTS (
        SELECT 1 FROM portal.prepaid_recharge pr
        JOIN portal.connections c ON c.id = pr.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE pr.id = client_payments.recharge_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
    )
  );

CREATE POLICY admin_write ON portal.client_payments
  FOR INSERT
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
    AND (
      EXISTS (
        SELECT 1 FROM portal.bills b
        JOIN portal.connections c ON c.id = b.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE b.id = client_payments.bill_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
      OR EXISTS (
        SELECT 1 FROM portal.prepaid_recharge pr
        JOIN portal.connections c ON c.id = pr.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE pr.id = client_payments.recharge_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
    )
  );
CREATE POLICY admin_write ON portal.client_payments
  FOR UPDATE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND (
      EXISTS (
        SELECT 1 FROM portal.bills b
        JOIN portal.connections c ON c.id = b.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE b.id = client_payments.bill_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
      OR EXISTS (
        SELECT 1 FROM portal.prepaid_recharge pr
        JOIN portal.connections c ON c.id = pr.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE pr.id = client_payments.recharge_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
    )
  )
  WITH CHECK (
    (select portal.get_request_user_role()) = 'admin'
  );
CREATE POLICY admin_write ON portal.client_payments
  FOR DELETE
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND (
      EXISTS (
        SELECT 1 FROM portal.bills b
        JOIN portal.connections c ON c.id = b.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE b.id = client_payments.bill_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
      OR EXISTS (
        SELECT 1 FROM portal.prepaid_recharge pr
        JOIN portal.connections c ON c.id = pr.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE pr.id = client_payments.recharge_id
          AND s.org_id = (select portal.get_request_user_org_id())
      )
    )
  );

-- 6. batches: batches_admin_rw (SELECT) and user_read_only (SELECT) share intent,
--    just different role + a much heavier check for users. Combine.
DROP POLICY IF EXISTS batches_admin_rw ON portal.batches;
DROP POLICY IF EXISTS user_read_only ON portal.batches;

CREATE POLICY read_by_org ON portal.batches
  FOR SELECT
  USING (
    (select portal.get_request_user_role()) = 'admin'
    AND org_id = (select portal.get_request_user_org_id())
  )
  OR (
    (select portal.get_request_user_role()) = 'user'
    AND (
      EXISTS (
        SELECT 1 FROM portal.bills b
        JOIN portal.connections c ON c.id = b.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE b.batch_id = batches.batch_id::text
          AND s.org_id = (select portal.get_request_user_org_id())
      )
      OR EXISTS (
        SELECT 1 FROM portal.prepaid_recharge pr
        JOIN portal.connections c ON c.id = pr.connection_id
        JOIN portal.sites s ON s.id = c.site_id
        WHERE pr.batch_id = batches.batch_id::text
          AND s.org_id = (select portal.get_request_user_org_id())
      )
    )
  );
-- batches_admin_insert / batches_admin_update / batches_admin_delete are already
-- narrowly scoped and cheap (direct org_id equality) — just wrap the JWT calls in
-- `(select ...)` for consistency; not a priority.
```

`organizations` policies already use `get_request_user_org_id()` and the table has
4 rows — not a bottleneck, low priority to touch (optionally just wrap
`auth.role()`/`auth.jwt()` in `(select ...)` there too for consistency).

## Secondary recommendations (lower priority)

- Re-run `ANALYZE` on `bills`, `connections`, `sites`, `batches`, `client_payments`,
  `organizations` periodically (or verify `autovacuum` is actually triggering
  `autoanalyze` — as of this investigation `last_autoanalyze` was `null` on all of
  them; only a manual `ANALYZE` we ran during triage had populated `last_analyze`).
- For pages that must page through **exact** totals on tables likely to stay under
  ~50k rows, don't rely on `count: 'estimated'` to save cost — it won't, at this
  scale. Either accept the exact-count cost (should be fine once RLS is
  consolidated) or switch to a cheaper approximate-count UI pattern (e.g. "50+
  results" instead of an exact total) for the heaviest list views.
- After applying the RLS changes, re-run `get_advisors(type=performance)` — it
  should drop most of the `auth_rls_initplan` and `multiple_permissive_policies`
  warnings for these tables.
- If query volume grows further even after this fix, consider a compute tier bump
  (current: `shared_buffers` 512MB / `max_connections` 90).

## Validation plan (once applied)

1. `EXPLAIN (ANALYZE, BUFFERS)` the bills/connections/sites list queries as a real
   `authenticated`/`user` role (see method used in this investigation — set
   `role authenticated` + `request.jwt.claims` inside a rolled-back transaction) and
   confirm the `sites` Seq Scan branch is gone.
2. Re-check `pg_stat_statements` mean/max execution time for the queries in the
   table above after a day of normal traffic.
3. Confirm `is_approved_amount_within_threshold()` and other previously-affected
   calls no longer show up in the Postgres error log as `statement timeout`.
4. Manually exercise each role (`admin`, `operator`, `user`, `service_role`) against
   each changed table to confirm no access regressions before/after.
