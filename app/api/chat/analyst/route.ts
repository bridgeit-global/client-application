import { NextRequest, NextResponse } from 'next/server';
import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs
} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SCHEMA_CONTEXT = `
You have access to the following tables in the "portal" schema. 
All queries MUST filter by org_id = '<ORG_ID>' (you will be told the actual value).

TABLE: portal.sites
  id           TEXT  PK
  org_id       UUID  -- always filter on this
  name         TEXT
  zone_id      TEXT
  type         TEXT
  is_active    BOOLEAN
  created_at   TIMESTAMPTZ
  updated_at   TIMESTAMPTZ

TABLE: portal.connections
  id               TEXT  PK
  site_id          TEXT  FK → sites.id
  biller_id        TEXT  FK → biller_list.id
  account_number   TEXT
  name             TEXT
  sanction_load    NUMERIC
  sanction_type    TEXT
  billed_demand    NUMERIC
  tariff           TEXT
  connection_type  TEXT  -- 'EV' | 'Non EV'
  paytype          SMALLINT
  is_active        BOOLEAN
  is_deleted       BOOLEAN
  next_bill_date   DATE
  submeter_info    JSONB
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ

TABLE: portal.bills
  id                        TEXT  PK
  connection_id             TEXT  FK → connections.id
  bill_date                 DATE
  due_date                  DATE
  discount_date             DATE
  disconnection_date        DATE
  bill_amount               NUMERIC
  approved_amount           NUMERIC
  bill_type                 TEXT  -- 'Normal' | 'Abnormal'
  bill_status               TEXT  -- 'new' | 'approved' | 'batch' | 'payment' | 'paid' | 'rejected'
  billed_unit               NUMERIC
  is_overload               BOOLEAN
  penalty_amount            NUMERIC
  rebate_accrued            NUMERIC
  rebate_potential          NUMERIC
  sanction_load             NUMERIC
  sanction_type             TEXT
  station_type              TEXT  -- 'COCO'|'POCO'|'COPO'|'POPO'|'Warehouse'|'Trial'|'FIELD OFFICE'
  start_date                DATE
  end_date                  DATE
  next_bill_date            DATE
  paid_status               TEXT
  is_valid                  BOOLEAN
  is_active                 BOOLEAN
  is_deleted                BOOLEAN
  validation_reason         JSONB
  bill_type_reason          JSONB
  swap_cost                 NUMERIC
  swap_count                NUMERIC
  projected_units           INT
  days_created_vs_bill_date INT  -- generated: created_at::date - bill_date
  days_due_vs_bill_date     INT  -- generated: due_date - bill_date
  batch_id                  TEXT
  created_at                TIMESTAMPTZ
  updated_at                TIMESTAMPTZ

TABLE: portal.core_charges            -- 1:1 with bills on id
  id               TEXT  PK/FK → bills.id
  energy_charges   NUMERIC
  fixed_charges    NUMERIC
  demand_charges   NUMERIC
  fppac_charges    NUMERIC
  minimum_charges  NUMERIC
  surcharge        NUMERIC
  wheeling_charges NUMERIC

TABLE: portal.regulatory_charges      -- 1:1 with bills on id
  id                TEXT  PK/FK → bills.id
  electricity_duty  NUMERIC
  municipal_tax     NUMERIC
  cgst              NUMERIC
  sgst              NUMERIC
  tax_at_source     NUMERIC

TABLE: portal.adherence_charges       -- 1:1 with bills on id
  id                        TEXT  PK/FK → bills.id
  lpsc                      NUMERIC  -- Late Payment Surcharge
  tod_rebate                NUMERIC
  tod_surcharge             NUMERIC
  sanctioned_load_penalty   NUMERIC
  power_factor_penalty      NUMERIC
  power_factor_incentive    NUMERIC
  capacitor_surcharge       NUMERIC
  misuse_surcharge          NUMERIC

TABLE: portal.additional_charges      -- 1:1 with bills on id
  id                         TEXT  PK/FK → bills.id
  arrears                    NUMERIC
  other_charges              NUMERIC
  rebate_subsidy             NUMERIC
  adjustment                 NUMERIC
  interest_on_sd             NUMERIC
  additional_security_deposit NUMERIC
  round_off_amount           NUMERIC

TABLE: portal.meter_readings
  meter_no              TEXT
  bill_id               TEXT  FK → bills.id
  type                  TEXT
  start_date            DATE
  end_date              DATE
  start_reading         NUMERIC
  end_reading           NUMERIC
  multiplication_factor NUMERIC
  billed_demand         NUMERIC
  PK: (meter_no, end_date, type)

RELATIONSHIPS (for JOINs):
  bills         → connections   ON bills.connection_id = connections.id
  connections   → sites         ON connections.site_id = sites.id
  core_charges  → bills         ON core_charges.id = bills.id
  regulatory_charges → bills    ON regulatory_charges.id = bills.id
  adherence_charges  → bills    ON adherence_charges.id = bills.id
  additional_charges → bills    ON additional_charges.id = bills.id
  meter_readings     → bills    ON meter_readings.bill_id = bills.id

COMMON PATTERNS:
  -- org_id isolation (always required via sites join):
  JOIN portal.connections cn ON cn.id = b.connection_id
  JOIN portal.sites s        ON s.id  = cn.site_id
  WHERE s.org_id = '<ORG_ID>'

  -- anomaly signals (derive inline):
  CASE WHEN ac.lpsc > 0 THEN true ELSE false END                 AS has_lpsc
  CASE WHEN ac.power_factor_penalty > 0 THEN true ELSE false END AS has_pf_penalty
  CASE WHEN b.bill_type = 'Abnormal' THEN true ELSE false END    AS is_abnormal
  ROUND(((b.bill_amount - b.approved_amount) / NULLIF(b.bill_amount,0)) * 100, 2)
                                                                  AS approval_variance_pct
  (b.rebate_potential - COALESCE(b.rebate_accrued, 0))           AS missed_rebate
`;

function getSystemPrompt(orgId: string, context?: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `You are BridgeIT's AI Bill Analyst — an expert in Indian electricity billing, 
tariff structures (HT/LT, ToD, sanctioned load, billed demand), DISCOM regulations, 
and cost optimisation for multi-site enterprises.

Current org_id: ${orgId}
Today: ${today}

${SCHEMA_CONTEXT.replace(/<ORG_ID>/g, orgId)}

Behaviour rules:
- Call execute_query before answering any question involving data. Never fabricate numbers.
- For a single bill question: query bills + all four charge tables + meter_readings.
- For trend questions: query the last N months ordered by bill_date ASC.
- For anomaly/portfolio questions: aggregate across sites and surface the top offenders.
- Quantify every finding in ₹. Explain LPSC, PF penalty, ToD, sanctioned load in plain language.
- Cite bill IDs, account numbers, site names, and dates in your answers.
- Proactively flag upcoming discount_date windows — missed windows are direct losses.
- Lead with the finding, follow with the explanation. Be concise and action-oriented.
- SQL safety (CRITICAL): every query passed to execute_query must be a single SELECT statement.
  Never include a semicolon (;) — it is forbidden. Never chain statements. No DDL or DML of any kind.

Response rules (CRITICAL — you MUST follow these):
- You MUST ALWAYS produce a text response after executing queries. NEVER leave the conversation 
  with only tool call results and no text summary.
- If a query returns 0 rows, explicitly say so and suggest what the user could try differently
  (broader date range, different filter, etc.).
- When presenting tabular data, use Markdown tables with clear column headers and proper alignment.
  Keep tables to the most relevant columns — wide tables are hard to read.
- After a table, add a brief plain-language summary of the key takeaways.
${context ? `\nSession context: ${context}` : ''}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      messages?: UIMessage[];
      org_id?: string;
      context?: string;
    };

    const { messages = [], org_id, context } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: 'org_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userOrgId = (user.user_metadata as any)?.org_id as
      | string
      | undefined;

    if (!userOrgId || userOrgId !== org_id) {
      return NextResponse.json(
        { error: 'Forbidden: invalid org_id for this user' },
        { status: 403 }
      );
    }

    const systemPrompt = getSystemPrompt(org_id, context);

    const result = streamText({
      model: google('gemini-3-flash-preview'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: {
        execute_query: tool({
          description: `Execute a read-only SQL SELECT against the BridgeIT portal schema.
Use this tool for EVERY question that requires bill data, amounts, trends, or anomalies.
Never fabricate numbers — always query first.

Rules you must follow when writing SQL:
- Always join through portal.connections and portal.sites and filter WHERE s.org_id = '<ORG_ID>'
- ONLY SELECT statements — absolutely no INSERT, UPDATE, DELETE, DROP, TRUNCATE, or any DDL
- NEVER include a semicolon (;) anywhere in the SQL — the server rejects any query containing one
- NEVER chain multiple statements — only a single SELECT is allowed per call
- Use LEFT JOIN for the charge tables (core_charges, regulatory_charges, adherence_charges, 
  additional_charges) since not all bills may have all charge rows
- Always filter is_deleted = false on bills and connections unless explicitly asked otherwise
- Add LIMIT 200 to any query that could return many rows
- For trend queries order by bill_date ASC; for anomaly queries order by bill_date DESC`.replace(
            /<ORG_ID>/g,
            org_id
          ),
          inputSchema: z.object({
            sql: z
              .string()
              .describe('The SQL SELECT statement to execute'),
            reasoning: z
              .string()
              .describe(
                'One line explaining what this query answers and why'
              )
          }),
          execute: async ({ sql, reasoning }) => {
            try {
              const { data, error } = await supabase.rpc(
                'fn_analyst_query',
                {
                  p_sql: sql,
                  p_org_id: org_id
                }
              );

              if (error) {
                console.error('fn_analyst_query error:', error);
                return {
                  error: error.message ?? String(error),
                  reasoning
                };
              }

              return { rows: data, reasoning };
            } catch (e) {
              console.error('execute_query exception:', e);
              return {
                error:
                  e instanceof Error ? e.message : String(e),
                reasoning
              };
            }
          }
        })
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in /api/chat/analyst:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

