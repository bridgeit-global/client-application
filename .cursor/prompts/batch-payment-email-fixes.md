# Paste-ready Cursor agent prompts — batch payment emails

Use these in the **supabase** and **utility-portal-backend** repos.

**Client + batch-updates (2026-08):** Adding items to an unpaid batch must **link first**, then touch `updated_at`/`updated_by` (never `batch_*_url`). `batch-updates` re-runs `batch-create` for unpaid non-URL updates; it skips URL write-backs and processing-without-transition to avoid circular triggers. See `.cursor/rules/batch-webhook-triggers.mdc`.

## Context (shared)

Operations has two Initiate Payment paths:

| Scenario | Client action | Status path | Emails today |
|---|---|---|---|
| **A – Within credit limit** | Direct `batches.batch_status = processing` (items stay `batch`) | `unpaid` → `processing` → (utilities paid) → `client_paid` → (client settles) → `settled` | Processed → Payment Advice → Payment Receipt |
| **B – Over limit (pay first)** | `POST /api/batch/pay` inserts PG txn `pending`, sets items → `payment`, batch → `processing` | `unpaid` → `processing` → (PG approved) → `client_paid` | Processed → Payment Advice (settle copy) — **no Receipt** |

Webhook: `batches` INSERT/UPDATE → edge `batch-updates` → for `unpaid`/`processing` invokes `batch-create`.

| Email | Trigger | Recipients | Code |
|---|---|---|---|
| Batch Advice | `unpaid` | `organizations.email.batch` | `batch-create` |
| Batch Advice Processed | `processing` | `organizations.email.support` (+ CC `updated_by`) | `batch-create` |
| Payment Advice | `client_paid` | `organizations.email.batch` | `batch-updates` |
| Payment Receipt | `settled` | `organizations.email.batch` | `batch-updates` |

---

## Prompt 1 — supabase repo

Paste into a Cursor agent opened on the **supabase** repo:

```
Fix batch payment email communication for the two Operations payment scenarios.

## Scenarios
A (within limit): client sets batch_status=processing with items still bill_status/recharge_status=batch. DB handle_batch_processing inserts client_payments. Later utilities paid → handle_batch_client_paid sets client_paid → Payment Advice. Client settles → PG approved with items still batch → settled → Payment Receipt.

B (over limit / pay first): client POST /api/batch/pay sets items to payment + batch processing + PG txn pending. On PG pending→approved, handle_batch_settled (items=payment branch) sets client_paid and inserts client_payments with client_paid_amount already set. That fires the same Payment Advice template as Scenario A (“pay within 2 days” + Pay Now). Batch never reaches settled on this path, so Payment Receipt never sends. UI also hides Pay Now when gateway txns already exist.

## Files
- supabase/functions/batch-updates/handler.ts
- supabase/functions/batch-updates/email.ts (getAdviceTemplate)
- supabase/functions/batch-updates/batchLogic.ts
- supabase/functions/batch-updates/db.ts (getRecipients — no null guard on email.batch)
- supabase/functions/batch-create/handler.ts
- supabase/functions/batch-create/batchLogic.ts
- supabase/functions/batch-create/email.ts
- supabase/functions/batch-create/db.ts (getRecipients/getSupportRecipients have guards; getEmailByUserId returns [] when missing)
- Migrations defining handle_batch_settled / handle_batch_processing / handle_batch_client_paid (latest: 20250902064326_is_active_false.sql and related)

## Concrete fixes
1. Scenario B on client_paid: do NOT send settle-request Payment Advice (Pay Now / “pay within 2 days”). Prefer a confirmation/receipt-style email, or advance to settled when client already paid via approved batch PG txn, and send Payment Receipt.
2. Distinguish credit-process vs pay-first in Batch Advice Processed (subject/body) so support knows which path ran; optionally notify org that payment details were received and are pending approval.
3. Harden getRecipients in batch-updates/db.ts to match batch-create (null-safe email.batch; return [] instead of throw). Do not silently succeed Processed emails when email.support is empty without logging clearly; consider falling back to email.batch or updated_by as to.
4. Fix batchTotalAmount for Payment Advice: today handler filters client_payments status==='paid' only, which is wrong/zero on Scenario B client_paid insert. Use approved/bill amounts as appropriate.
5. Update Pay Now link from /portal/batch-payment?batch_id=… to /portal/operations?tab=batch-payments (or org-relative equivalent).
6. Stop fallback “Batch Advice Update” emails on incidental batches updates that are not client_paid / settled / validate_at.
7. Optionally re-enable updateURLBatchData for batch_advice_url / batch_receipt_url after PDF upload (currently commented out).
8. Fix batch-create Processed path: totalSent: emailResult.length treats a single object as an array; getEmailByUserId should return undefined/null string for missing email, not [].

## Verify
- Scenario A still: Processed → Payment Advice (settle) → Receipt after settle.
- Scenario B: no misleading Pay Now after client already paid; Receipt or confirmation sends once.
- Org with missing email.batch / email.support does not crash the webhook.
```

---

## Prompt 2 — utility-portal-backend repo

Paste into a Cursor agent opened on the **utility-portal-backend** repo:

```
Audit whether the legacy batch email path still duplicates modern Supabase batch emails.

## Background
BridgeIT portal batches emails now go through Supabase edge functions:
batches INSERT/UPDATE webhook → batch-updates → batch-create (nodemailer).

A legacy AWS path still exists:
- Handler: src/batch/index.js (subject like “Batch Report”)
- serverless.yml path: batch/trigger
- Historical Supabase migration (bridgeit/supabase …/20250115105021_update_dashbaord_support_data.sql) created trigger "batch-trigger" on portal.batches calling:
  https://4jcqurqwvc.execute-api.ap-south-1.amazonaws.com/qa/batch/trigger
- No later migration in the supabase repo DROPs "batch-trigger". Prod may still have it (or a prod URL variant) via Dashboard/manual change.

## Tasks
1. Confirm whether batch/trigger is still deployed and invoked in QA/prod.
2. Check if the portal.batches "batch-trigger" (or equivalent http_request / Database Webhook) still exists in each environment; if both AWS trigger and Supabase batch-updates fire, orgs get duplicate emails.
3. If legacy is obsolete: document how to disable the DB trigger/webhook safely and deprecate/remove the serverless route; do not leave QA URLs pointing at prod traffic.
4. If legacy must stay for non-portal consumers: document which events/recipients it covers vs batch-updates so we do not double-send for the same status change.
5. Report findings only unless asked to change infra; prefer a short runbook over code churn.

## Related client note
client-application already touches the batch after linking items on create and add-items so empty-batch advice is not skipped. Do not change that from this repo.
```

---

## Prompt 3 — supabase repo (Funds Overview Utilized)

Already drafted migration (apply / verify in QA+prod):

`supabase/migrations/20260805120500_utilize_exclude_wallet_paid.sql`

Paste if you need the agent to review or adjust:

```
Funds Overview "Utilized" was inflated because portal.is_approved_amount_within_threshold() summed all client_payments on batches in (processing, client_paid), including pay-first rows where the client already paid from wallet (client_paid_amount > 0) and historical client_paid leftovers.

Expected: Utilized = credit exposure only — batches processed without a wallet payment until the org settles. Exclude settled (via status filter) and any client_payment with COALESCE(client_paid_amount,0) > 0. Also exclude failed/refund/reverse.

Migration 20260805120500_utilize_exclude_wallet_paid.sql rewrites the RPC (SECURITY DEFINER, org-scoped) accordingly. Verify:
1. After apply, Utilized drops for orgs with wallet-paid / old Scenario B client_paid rows.
2. Available to Process = Limit − Utilized aligns with Initiate Payment (within-limit vs require transaction).
3. Credit-path processing/client_paid with null client_paid_amount still counts.
4. Pending_amount similarly ignores wallet-paid unpaid rows.
```
