-- ============================================================================
-- KPI Metrics Tables and Functions
-- ============================================================================
-- This migration creates tables and functions for dashboard KPI metrics
-- including Billing, Payment, Benefits, and Need Attention metrics
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. KPI Metrics Storage Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.kpi_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL REFERENCES portal.organizations(id) ON DELETE CASCADE,
    kpi_name VARCHAR(255) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL CHECK (kpi_category IN ('billing', 'payment', 'benefits', 'need_attention', 'payment_savings')),
    current_value NUMERIC(15, 2) NOT NULL,
    last_month_value NUMERIC(15, 2),
    trend_percentage NUMERIC(5, 2),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('UP', 'DOWN', 'NEUTRAL', 'NEW')),
    unit VARCHAR(50) NOT NULL,
    calculation_month DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, kpi_name, calculation_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_org_id ON portal.kpi_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_category ON portal.kpi_metrics(kpi_category);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_month ON portal.kpi_metrics(calculation_month);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_org_category_month ON portal.kpi_metrics(org_id, kpi_category, calculation_month);

-- ----------------------------------------------------------------------------
-- 2. Billing KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_billing_kpis(
  p_org_id uuid DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  kpi_name varchar,
  current_value numeric,
  last_month_value numeric,
  trend_percentage numeric,
  trend_direction varchar,
  unit varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
  v_this_month_start date;
  v_this_month_end date;
  v_last_month_start date;
  v_last_month_end date;
  v_org_id uuid;
BEGIN
  v_this_month_start := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::date);
  v_this_month_end := COALESCE(p_end_date, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date);
  v_last_month_start := (v_this_month_start - INTERVAL '1 month')::date;
  v_last_month_end := (v_this_month_start - INTERVAL '1 day')::date;

  -- Use passed org id (fall back only if NULL)
  v_org_id := COALESCE(p_org_id, '49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

  RETURN QUERY
  WITH this_month_data AS (
    SELECT 
      COALESCE(SUM(b.bill_amount), 0)::numeric AS total_amount,
      COALESCE(SUM(b.billed_unit), 0)::numeric AS total_units,
      COUNT(*)::numeric AS total_bills,
      CASE WHEN COALESCE(SUM(b.billed_unit), 0) > 0
           THEN SUM(b.bill_amount)::numeric / NULLIF(SUM(b.billed_unit)::numeric, 0)
           ELSE 0::numeric END AS rate_per_unit
    FROM portal.bills b
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.bill_date >= v_this_month_start
      AND b.bill_date <= v_this_month_end
      AND b.is_active = true
      AND b.is_valid = true
      AND (
        v_org_id IS NULL OR EXISTS (
          SELECT 1
          FROM portal.sites s
          WHERE s.id = c.site_id
            AND s.org_id = v_org_id
        )
      )
  ),
  last_month_data AS (
    SELECT 
      COALESCE(SUM(b.bill_amount), 0)::numeric AS total_amount,
      COALESCE(SUM(b.billed_unit), 0)::numeric AS total_units,
      COUNT(*)::numeric AS total_bills,
      CASE WHEN COALESCE(SUM(b.billed_unit), 0) > 0
           THEN SUM(b.bill_amount)::numeric / NULLIF(SUM(b.billed_unit)::numeric, 0)
           ELSE 0::numeric END AS rate_per_unit
    FROM portal.bills b
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.bill_date >= v_last_month_start
      AND b.bill_date <= v_last_month_end
      AND b.is_active = true
      AND b.is_valid = true
      AND (
        v_org_id IS NULL OR EXISTS (
          SELECT 1
          FROM portal.sites s
          WHERE s.id = c.site_id
            AND s.org_id = v_org_id
        )
      )
  )
  SELECT 
    'Total Amount'::varchar,
    tm.total_amount,
    lm.total_amount,
    CASE WHEN lm.total_amount > 0 THEN ((tm.total_amount - lm.total_amount) / lm.total_amount) * 100 ELSE NULL END,
    CASE 
      WHEN lm.total_amount = 0 THEN 'NEW'::varchar
      WHEN tm.total_amount > lm.total_amount THEN 'UP'::varchar
      WHEN tm.total_amount < lm.total_amount THEN 'DOWN'::varchar
      ELSE 'NEUTRAL'::varchar
    END,
    '₹'::varchar
  FROM this_month_data tm, last_month_data lm

  UNION ALL
  SELECT 
    'Total Units'::varchar,
    tm.total_units,
    lm.total_units,
    CASE WHEN lm.total_units > 0 THEN ((tm.total_units - lm.total_units) / lm.total_units) * 100 ELSE NULL END,
    CASE 
      WHEN lm.total_units = 0 THEN 'NEW'::varchar
      WHEN tm.total_units > lm.total_units THEN 'UP'::varchar
      WHEN tm.total_units < lm.total_units THEN 'DOWN'::varchar
      ELSE 'NEUTRAL'::varchar
    END,
    'Units'::varchar
  FROM this_month_data tm, last_month_data lm

  UNION ALL
  SELECT 
    'Total Bills'::varchar,
    tm.total_bills,
    lm.total_bills,
    CASE WHEN lm.total_bills > 0 THEN ((tm.total_bills - lm.total_bills) / lm.total_bills) * 100 ELSE NULL END,
    CASE 
      WHEN lm.total_bills = 0 THEN 'NEW'::varchar
      WHEN tm.total_bills > lm.total_bills THEN 'UP'::varchar
      WHEN tm.total_bills < lm.total_bills THEN 'DOWN'::varchar
      ELSE 'NEUTRAL'::varchar
    END,
    'Count'::varchar
  FROM this_month_data tm, last_month_data lm

  UNION ALL
  SELECT 
    'Rate per Unit'::varchar,
    tm.rate_per_unit,
    lm.rate_per_unit,
    CASE WHEN lm.rate_per_unit > 0 THEN ((tm.rate_per_unit - lm.rate_per_unit) / lm.rate_per_unit) * 100 ELSE NULL END,
    CASE 
      WHEN lm.rate_per_unit = 0 THEN 'NEW'::varchar
      WHEN tm.rate_per_unit > lm.rate_per_unit THEN 'UP'::varchar
      WHEN tm.rate_per_unit < lm.rate_per_unit THEN 'DOWN'::varchar
      ELSE 'NEUTRAL'::varchar
    END,
    '₹'::varchar
  FROM this_month_data tm, last_month_data lm;
END;
$$;

-- select *
-- from portal.get_billing_kpis(
--   '49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid
-- );


-- ----------------------------------------------------------------------------
-- 3. Payment KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_payment_kpis(
    p_org_id uuid DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE (
    kpi_name varchar,
    current_value numeric,
    last_month_value numeric,
    trend_percentage numeric,
    trend_direction varchar,
    unit varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_this_month_start date;
    v_this_month_end date;
    v_last_month_start date;
    v_last_month_end date;
    v_org_id uuid;
    v_this_month_billed numeric;
    v_last_month_billed numeric;
BEGIN
    v_this_month_start := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE));
    v_this_month_end := COALESCE(p_end_date, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');
    v_last_month_start := v_this_month_start - INTERVAL '1 month';
    v_last_month_end := v_this_month_start - INTERVAL '1 day';

    v_org_id := COALESCE(p_org_id, portal.get_request_user_org_id()::uuid);

    SELECT COALESCE(SUM(b.bill_amount), 0) INTO v_this_month_billed
    FROM portal.bills b
    INNER JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.bill_date >= v_this_month_start
      AND b.bill_date <= v_this_month_end
      AND b.is_active = true
      AND b.is_valid = true
      AND (v_org_id IS NULL OR EXISTS (
            SELECT 1 FROM portal.sites s 
            WHERE s.id = c.site_id AND s.org_id = v_org_id
      ));

    SELECT COALESCE(SUM(b.bill_amount), 0) INTO v_last_month_billed
    FROM portal.bills b
    INNER JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.bill_date >= v_last_month_start
      AND b.bill_date <= v_last_month_end
      AND b.is_active = true
      AND b.is_valid = true
      AND (v_org_id IS NULL OR EXISTS (
            SELECT 1 FROM portal.sites s 
            WHERE s.id = c.site_id AND s.org_id = v_org_id
      ));

    RETURN QUERY
    WITH this_month_payments AS (
      SELECT 
        COALESCE(SUM(cp.paid_amount), 0) AS payment_amount,
        COUNT(DISTINCT cp.id) AS payment_count
      FROM portal.client_payments cp
      INNER JOIN portal.batches b ON cp.batch_id = b.batch_id
      WHERE cp.paid_date >= v_this_month_start
        AND cp.paid_date <= v_this_month_end
        AND cp.status = 'completed'
        AND (v_org_id IS NULL OR b.org_id = v_org_id)
    ),
    last_month_payments AS (
      SELECT 
        COALESCE(SUM(cp.paid_amount), 0) AS payment_amount,
        COUNT(DISTINCT cp.id) AS payment_count
      FROM portal.client_payments cp
      INNER JOIN portal.batches b ON cp.batch_id = b.batch_id
      WHERE cp.paid_date >= v_last_month_start
        AND cp.paid_date <= v_last_month_end
        AND cp.status = 'completed'
        AND (v_org_id IS NULL OR b.org_id = v_org_id)
    )
    SELECT 
      'Payment Done Amount'::varchar,
      tm.payment_amount,
      lm.payment_amount,
      CASE WHEN lm.payment_amount > 0 
           THEN ((tm.payment_amount - lm.payment_amount) / lm.payment_amount) * 100
           ELSE NULL END,
      CASE 
        WHEN lm.payment_amount = 0 THEN 'NEW'::varchar
        WHEN tm.payment_amount > lm.payment_amount THEN 'UP'::varchar
        WHEN tm.payment_amount < lm.payment_amount THEN 'DOWN'::varchar
        ELSE 'NEUTRAL'::varchar
      END,
      '₹'::varchar
    FROM this_month_payments tm, last_month_payments lm

    UNION ALL

    SELECT 
      'Payments Completed'::varchar,
      tm.payment_count::numeric,
      lm.payment_count::numeric,
      CASE WHEN lm.payment_count > 0 
           THEN ((tm.payment_count - lm.payment_count)::numeric / lm.payment_count) * 100
           ELSE NULL END,
      CASE 
        WHEN lm.payment_count = 0 THEN 'NEW'::varchar
        WHEN tm.payment_count > lm.payment_count THEN 'UP'::varchar
        WHEN tm.payment_count < lm.payment_count THEN 'DOWN'::varchar
        ELSE 'NEUTRAL'::varchar
      END,
      'Count'::varchar
    FROM this_month_payments tm, last_month_payments lm

    UNION ALL

    SELECT 
      'Collection Efficiency'::varchar,
      CASE WHEN v_this_month_billed > 0 
           THEN (SELECT payment_amount FROM this_month_payments) / v_this_month_billed * 100
           ELSE 0 END,
      CASE WHEN v_last_month_billed > 0 
           THEN (SELECT payment_amount FROM last_month_payments) / v_last_month_billed * 100
           ELSE 0 END,
      CASE 
        WHEN v_last_month_billed > 0 AND (SELECT payment_amount FROM last_month_payments) > 0 THEN
          ((CASE WHEN v_this_month_billed > 0 
                 THEN (SELECT payment_amount FROM this_month_payments) / v_this_month_billed * 100
                 ELSE 0 END
           - CASE WHEN v_last_month_billed > 0 
                 THEN (SELECT payment_amount FROM last_month_payments) / v_last_month_billed * 100
                 ELSE 0 END)
           / CASE WHEN v_last_month_billed > 0 
                 THEN (SELECT payment_amount FROM last_month_payments) / v_last_month_billed * 100
                 ELSE 1 END) * 100
        ELSE NULL
      END,
      CASE 
        WHEN v_last_month_billed = 0 THEN 'NEW'::varchar
        WHEN (CASE WHEN v_this_month_billed > 0 
                   THEN (SELECT payment_amount FROM this_month_payments) / v_this_month_billed * 100
                   ELSE 0 END)
           > (CASE WHEN v_last_month_billed > 0 
                   THEN (SELECT payment_amount FROM last_month_payments) / v_last_month_billed * 100
                   ELSE 0 END) THEN 'UP'::varchar
        WHEN (CASE WHEN v_this_month_billed > 0 
                   THEN (SELECT payment_amount FROM this_month_payments) / v_this_month_billed * 100
                   ELSE 0 END)
           < (CASE WHEN v_last_month_billed > 0 
                   THEN (SELECT payment_amount FROM last_month_payments) / v_last_month_billed * 100
                   ELSE 0 END) THEN 'DOWN'::varchar
        ELSE 'NEUTRAL'::varchar
      END,
      '%'::varchar
    FROM this_month_payments tm, last_month_payments lm;
END;
$$;

-- SELECT portal.get_payment_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 4. Benefits KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_benefits_kpis(
    p_org_id uuid DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    kpi_name VARCHAR,
    current_value NUMERIC,
    last_month_value NUMERIC,
    trend_percentage NUMERIC,
    trend_direction VARCHAR,
    unit VARCHAR,
    benefit_description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_this_month_start DATE;
    v_this_month_end DATE;
    v_last_month_start DATE;
    v_last_month_end DATE;
    v_org_id uuid;
BEGIN
    v_this_month_start := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE));
    v_this_month_end := COALESCE(p_end_date, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');
    v_last_month_start := v_this_month_start - INTERVAL '1 month';
    v_last_month_end := v_this_month_start - INTERVAL '1 day';

    v_org_id := COALESCE(p_org_id, '49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

    RETURN QUERY
    WITH this_month_bills AS (
        SELECT COUNT(*) AS bill_count
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.created_at >= v_this_month_start
          AND b.created_at <= v_this_month_end
          AND b.is_active = true
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    ),
    last_month_bills AS (
        SELECT COUNT(*) AS bill_count
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.created_at >= v_last_month_start
          AND b.created_at <= v_last_month_end
          AND b.is_active = true
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    ),
    this_month_balances AS (
        SELECT COUNT(*) AS balance_count
        FROM portal.prepaid_balances pb
        INNER JOIN portal.connections c
          -- Verify this join; see note below
          ON pb.id = c.id
        WHERE pb.fetch_date >= v_this_month_start
          AND pb.fetch_date <= v_this_month_end
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    ),
    last_month_balances AS (
        SELECT COUNT(*) AS balance_count
        FROM portal.prepaid_balances pb
        INNER JOIN portal.connections c
          -- Verify this join; see note below
          ON pb.id = c.id
        WHERE pb.fetch_date >= v_last_month_start
          AND pb.fetch_date <= v_last_month_end
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    ),
    this_month_readings AS (
        SELECT COUNT(*) AS reading_count
        FROM portal.submeter_readings sr
        INNER JOIN portal.connections c ON sr.connection_id = c.id
        WHERE sr.reading_date >= v_this_month_start
          AND sr.reading_date <= v_this_month_end
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    ),
    last_month_readings AS (
        SELECT COUNT(*) AS reading_count
        FROM portal.submeter_readings sr
        INNER JOIN portal.connections c ON sr.connection_id = c.id
        WHERE sr.reading_date >= v_last_month_start
          AND sr.reading_date <= v_last_month_end
          AND (v_org_id IS NULL OR EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          ))
    )
    SELECT 
        'Bills Generated'::VARCHAR AS kpi_name,
        tmb.bill_count::NUMERIC AS current_value,
        lmb.bill_count::NUMERIC AS last_month_value,
        CASE 
            WHEN lmb.bill_count > 0 THEN 
                ((tmb.bill_count - lmb.bill_count)::NUMERIC / lmb.bill_count) * 100
            ELSE NULL
        END AS trend_percentage,
        CASE 
            WHEN lmb.bill_count = 0 THEN 'NEW'::VARCHAR
            WHEN tmb.bill_count > lmb.bill_count THEN 'UP'::VARCHAR
            WHEN tmb.bill_count < lmb.bill_count THEN 'DOWN'::VARCHAR
            ELSE 'NEUTRAL'::VARCHAR
        END AS trend_direction,
        'Count'::VARCHAR AS unit,
        'Benefit of approximately 120 mins per bill'::TEXT AS benefit_description
    FROM this_month_bills tmb, last_month_bills lmb
    
    UNION ALL
    
    SELECT 
        'Balance Fetched'::VARCHAR,
        tmb2.balance_count::NUMERIC,
        lmb2.balance_count::NUMERIC,
        CASE 
            WHEN lmb2.balance_count > 0 THEN 
                ((tmb2.balance_count - lmb2.balance_count)::NUMERIC / lmb2.balance_count) * 100
            ELSE NULL
        END,
        CASE 
            WHEN lmb2.balance_count = 0 THEN 'NEW'::VARCHAR
            WHEN tmb2.balance_count > lmb2.balance_count THEN 'UP'::VARCHAR
            WHEN tmb2.balance_count < lmb2.balance_count THEN 'DOWN'::VARCHAR
            ELSE 'NEUTRAL'::VARCHAR
        END,
        'Count'::VARCHAR,
        'Benefit of approximately 1 minute per balance'::TEXT
    FROM this_month_balances tmb2, last_month_balances lmb2
    
    UNION ALL
    
    SELECT 
        'Sub meter readings captured'::VARCHAR,
        tmr.reading_count::NUMERIC,
        lmr.reading_count::NUMERIC,
        CASE 
            WHEN lmr.reading_count > 0 THEN 
                ((tmr.reading_count - lmr.reading_count)::NUMERIC / lmr.reading_count) * 100
            ELSE NULL
        END,
        CASE 
            WHEN lmr.reading_count = 0 THEN 'NEW'::VARCHAR
            WHEN tmr.reading_count > lmr.reading_count THEN 'UP'::VARCHAR
            WHEN tmr.reading_count < lmr.reading_count THEN 'DOWN'::VARCHAR
            ELSE 'NEUTRAL'::VARCHAR
        END,
        'Count'::VARCHAR,
        'Benefit of approximately 1 minute per reading'::TEXT
    FROM this_month_readings tmr, last_month_readings lmr;
END;
$$;


-- select *
-- from portal.get_benefits_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 5. Savings on Payment KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_payment_savings_kpis(
    p_org_id uuid DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE (
    kpi_name varchar,
    potential_value numeric,
    accrued_value numeric,
    savings_percentage numeric,
    unit varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_this_month_start date;
    v_this_month_end date;
    v_org_id uuid;
BEGIN
    v_this_month_start := COALESCE(p_start_date, date_trunc('month', current_date)::date);
    v_this_month_end := COALESCE(p_end_date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date);
    v_org_id := COALESCE(p_org_id, '49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

    RETURN QUERY
    WITH payment_data AS (
        SELECT 
            b.id,
            b.bill_amount,
            b.due_date_rebate AS prompt_potential,
            COALESCE(b.rebate_accrued, 0) AS prompt_accrued,
            b.discount_date_rebate AS timely_potential,
            CASE 
                WHEN b.paid_status = 'paid' AND b.payment_status = true 
                     AND b.paid_status IS NOT NULL THEN COALESCE(b.rebate_accrued, 0)
                ELSE 0
            END AS timely_accrued,
            COALESCE(ac.adjustment, 0) AS surcharge_potential,
            CASE 
                WHEN ac.adjustment < 0 THEN ABS(ac.adjustment)
                ELSE 0
            END AS surcharge_accrued
        FROM portal.bills b
        LEFT JOIN portal.additional_charges ac ON b.id = ac.id
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date >= v_this_month_start
          AND b.bill_date <= v_this_month_end
          AND b.is_active = true
          AND b.is_valid = true
          AND (
               v_org_id IS NULL OR EXISTS (
                 SELECT 1
                 FROM portal.sites s
                 WHERE s.id = c.site_id
                   AND s.org_id = v_org_id
               )
          )
    )
    SELECT 
        'Prompt Payment'::varchar AS kpi_name,
        SUM(pd.prompt_potential) AS potential_value,
        SUM(pd.prompt_accrued) AS accrued_value,
        CASE 
            WHEN SUM(pd.prompt_potential) > 0 THEN 
                (SUM(pd.prompt_accrued) / SUM(pd.prompt_potential)) * 100
            ELSE 0
        END AS savings_percentage,
        '₹'::varchar AS unit
    FROM payment_data pd

    UNION ALL

    SELECT 
        'Timely Payment'::varchar,
        SUM(pd.timely_potential),
        SUM(pd.timely_accrued),
        CASE 
            WHEN SUM(pd.timely_potential) > 0 THEN 
                (SUM(pd.timely_accrued) / SUM(pd.timely_potential)) * 100
            ELSE 0
        END,
        '₹'::varchar
    FROM payment_data pd

    UNION ALL

    SELECT 
        'Surcharges'::varchar,
        SUM(pd.surcharge_potential),
        SUM(pd.surcharge_accrued),
        CASE 
            WHEN SUM(pd.surcharge_potential) > 0 THEN 
                (SUM(pd.surcharge_accrued) / SUM(pd.surcharge_potential)) * 100
            ELSE 0
        END,
        '₹'::varchar
    FROM payment_data pd;
END;
$$;


select *
from portal.get_payment_savings_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 6. Need Attention KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_need_attention_kpis(
  p_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  kpi_name varchar,
  current_value numeric,
  unit varchar,
  severity varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_today date;
BEGIN
  v_org_id := COALESCE(p_org_id, '49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);
  v_today := CURRENT_DATE;

  RETURN QUERY
  WITH lag_bills AS (
    SELECT COUNT(*) AS lag_count
    FROM portal.connections c
    WHERE c.next_bill_date IS NOT NULL
      AND c.next_bill_date < v_today
      AND c.is_active = true
      AND c.is_deleted = false
      AND (v_org_id IS NULL OR EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      ))
  ),
  lag_recharges AS (
    SELECT COUNT(*) AS lag_count
    FROM portal.prepaid_recharge pr
    JOIN portal.connections c ON pr.connection_id = c.id
    WHERE pr.recharge_date < v_today - INTERVAL '30 days'
      AND pr.recharge_status = 'pending'
      AND pr.is_active = true
      AND pr.is_deleted = false
      AND (v_org_id IS NULL OR EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      ))
  ),
  arrears_data AS (
    SELECT COALESCE(SUM(ac.arrears), 0) AS total_arrears
    FROM portal.additional_charges ac
    JOIN portal.bills b ON ac.id = b.id
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.is_active = true
      AND b.is_valid = true
      AND ac.arrears > 0
      AND (v_org_id IS NULL OR EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      ))
  ),
  penalties_data AS (
    SELECT COALESCE(SUM(
      ad.capacitor_surcharge + ad.low_pf_surcharge + ad.lpsc +
      ad.misuse_surcharge + ad.power_factor_penalty + ad.sanctioned_load_penalty +
      ad.tod_surcharge
    ), 0) AS total_penalties
    FROM portal.adherence_charges ad
    JOIN portal.bills b ON ad.id = b.id
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.is_active = true
      AND b.is_valid = true
      AND (v_org_id IS NULL OR EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      ))
  ),
  abnormal_bills AS (
    SELECT COUNT(*) AS abnormal_count
    FROM portal.bills b
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.is_active = true
      AND b.is_valid = false
      AND (v_org_id IS NULL OR EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      ))
  )
  SELECT
    'Lag Bills'::varchar,
    lb.lag_count::numeric,
    'Count'::varchar,
    CASE WHEN lb.lag_count > 10 THEN 'HIGH'
         WHEN lb.lag_count > 5 THEN 'MEDIUM'
         ELSE 'LOW' END::varchar
  FROM lag_bills lb
  UNION ALL
  SELECT
    'Lag Recharges',
    lr.lag_count::numeric,
    'Count',
    CASE WHEN lr.lag_count > 10 THEN 'HIGH'
         WHEN lr.lag_count > 5 THEN 'MEDIUM'
         ELSE 'LOW' END
  FROM lag_recharges lr
  UNION ALL
  SELECT
    'Arrears',
    ad.total_arrears,
    '₹',
    CASE WHEN ad.total_arrears > 1000000 THEN 'HIGH'
         WHEN ad.total_arrears > 500000 THEN 'MEDIUM'
         ELSE 'LOW' END
  FROM arrears_data ad
  UNION ALL
  SELECT
    'Penalties',
    pd.total_penalties,
    '₹',
    CASE WHEN pd.total_penalties > 1000000 THEN 'HIGH'
         WHEN pd.total_penalties > 500000 THEN 'MEDIUM'
         ELSE 'LOW' END
  FROM penalties_data pd
  UNION ALL
  SELECT
    'Abnormal Bills',
    ab.abnormal_count::numeric,
    'Count',
    CASE WHEN ab.abnormal_count > 10 THEN 'HIGH'
         WHEN ab.abnormal_count > 5 THEN 'MEDIUM'
         ELSE 'LOW' END
  FROM abnormal_bills ab;
END;
$$;

-- select * from portal.get_need_attention_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 7. Master Function to Get All KPIs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_all_kpi_metrics(
    p_org_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Build and return JSONB result
    SELECT jsonb_build_object(
        'billing', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'kpiName', kpi_name,
                    'currentValue', current_value,
                    'lastMonthValue', last_month_value,
                    'trendPercentage', trend_percentage,
                    'trendDirection', trend_direction,
                    'unit', unit
                )
            )
            FROM portal.get_billing_kpis(p_org_id, p_start_date, p_end_date)
        ),
        'payment', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'kpiName', kpi_name,
                    'currentValue', current_value,
                    'lastMonthValue', last_month_value,
                    'trendPercentage', trend_percentage,
                    'trendDirection', trend_direction,
                    'unit', unit
                )
            )
            FROM portal.get_payment_kpis(p_org_id, p_start_date, p_end_date)
        ),
        'benefits', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'kpiName', kpi_name,
                    'currentValue', current_value,
                    'lastMonthValue', last_month_value,
                    'trendPercentage', trend_percentage,
                    'trendDirection', trend_direction,
                    'unit', unit,
                    'benefitDescription', benefit_description
                )
            )
            FROM portal.get_benefits_kpis(p_org_id, p_start_date, p_end_date)
        ),
        'paymentSavings', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'kpiName', kpi_name,
                    'potentialValue', potential_value,
                    'accruedValue', accrued_value,
                    'savingsPercentage', savings_percentage,
                    'unit', unit
                )
            )
            FROM portal.get_payment_savings_kpis(p_org_id, p_start_date, p_end_date)
        ),
        'needAttention', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'kpiName', kpi_name,
                    'currentValue', current_value,
                    'unit', unit,
                    'severity', severity
                )
            )
            FROM portal.get_need_attention_kpis(p_org_id)
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Function to Store KPI Metrics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.store_kpi_metrics(
    p_org_id UUID,
    p_calculation_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_kpi_record RECORD;
BEGIN
    v_start_date := p_calculation_month;
    v_end_date := p_calculation_month + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- Store Billing KPIs
    FOR v_kpi_record IN 
        SELECT * FROM portal.get_billing_kpis(p_org_id, v_start_date, v_end_date)
    LOOP
        INSERT INTO portal.kpi_metrics (
            org_id, kpi_name, kpi_category, current_value, 
            last_month_value, trend_percentage, trend_direction, 
            unit, calculation_month
        )
        VALUES (
            p_org_id, v_kpi_record.kpi_name, 'billing',
            v_kpi_record.current_value, v_kpi_record.last_month_value,
            v_kpi_record.trend_percentage, v_kpi_record.trend_direction,
            v_kpi_record.unit, p_calculation_month
        )
        ON CONFLICT (org_id, kpi_name, calculation_month)
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            last_month_value = EXCLUDED.last_month_value,
            trend_percentage = EXCLUDED.trend_percentage,
            trend_direction = EXCLUDED.trend_direction,
            updated_at = NOW();
    END LOOP;
    
    -- Store Payment KPIs
    FOR v_kpi_record IN 
        SELECT * FROM portal.get_payment_kpis(p_org_id, v_start_date, v_end_date)
    LOOP
        INSERT INTO portal.kpi_metrics (
            org_id, kpi_name, kpi_category, current_value, 
            last_month_value, trend_percentage, trend_direction, 
            unit, calculation_month
        )
        VALUES (
            p_org_id, v_kpi_record.kpi_name, 'payment',
            v_kpi_record.current_value, v_kpi_record.last_month_value,
            v_kpi_record.trend_percentage, v_kpi_record.trend_direction,
            v_kpi_record.unit, p_calculation_month
        )
        ON CONFLICT (org_id, kpi_name, calculation_month)
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            last_month_value = EXCLUDED.last_month_value,
            trend_percentage = EXCLUDED.trend_percentage,
            trend_direction = EXCLUDED.trend_direction,
            updated_at = NOW();
    END LOOP;
    
    -- Store Benefits KPIs
    FOR v_kpi_record IN 
        SELECT kpi_name, current_value, last_month_value, 
               trend_percentage, trend_direction, unit, benefit_description
        FROM portal.get_benefits_kpis(p_org_id, v_start_date, v_end_date)
    LOOP
        INSERT INTO portal.kpi_metrics (
            org_id, kpi_name, kpi_category, current_value, 
            last_month_value, trend_percentage, trend_direction, 
            unit, calculation_month, metadata
        )
        VALUES (
            p_org_id, v_kpi_record.kpi_name, 'benefits',
            v_kpi_record.current_value, v_kpi_record.last_month_value,
            v_kpi_record.trend_percentage, v_kpi_record.trend_direction,
            v_kpi_record.unit, p_calculation_month,
            CASE 
                WHEN v_kpi_record.kpi_name = 'Bills Generated' THEN
                    jsonb_build_object(
                        'benefitDescription', v_kpi_record.benefit_description,
                        'bill_fetch_per_min', v_kpi_record.current_value * 120
                    )
                WHEN v_kpi_record.kpi_name = 'Balance Fetched' THEN
                    jsonb_build_object(
                        'benefitDescription', v_kpi_record.benefit_description,
                        'balance_fetch_per_min', v_kpi_record.current_value
                    )
                WHEN v_kpi_record.kpi_name = 'Sub meter readings captured' THEN
                    jsonb_build_object(
                        'benefitDescription', v_kpi_record.benefit_description,
                        'reading_fetch_per_min', v_kpi_record.current_value
                    )
                ELSE
                    jsonb_build_object('benefitDescription', v_kpi_record.benefit_description)
            END
        )
        ON CONFLICT (org_id, kpi_name, calculation_month)
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            last_month_value = EXCLUDED.last_month_value,
            trend_percentage = EXCLUDED.trend_percentage,
            trend_direction = EXCLUDED.trend_direction,
            metadata = EXCLUDED.metadata,
            updated_at = NOW();
    END LOOP;
    
    -- Store Payment Savings KPIs
    FOR v_kpi_record IN
        SELECT * FROM portal.get_payment_savings_kpis(p_org_id, v_start_date, v_end_date)
    LOOP
        INSERT INTO portal.kpi_metrics (
            org_id, kpi_name, kpi_category, current_value, 
            unit, calculation_month, metadata
        )
        VALUES (
            p_org_id, v_kpi_record.kpi_name, 'payment_savings',
            v_kpi_record.accrued_value, v_kpi_record.unit, p_calculation_month,
            jsonb_build_object(
                'potentialValue', v_kpi_record.potential_value,
                'accruedValue', v_kpi_record.accrued_value,
                'savingsPercentage', v_kpi_record.savings_percentage
            )
        )
        ON CONFLICT (org_id, kpi_name, calculation_month)
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            metadata = EXCLUDED.metadata,
            updated_at = NOW();
    END LOOP;
    
    -- Store Need Attention KPIs
    FOR v_kpi_record IN
        SELECT * FROM portal.get_need_attention_kpis(p_org_id)
    LOOP
        INSERT INTO portal.kpi_metrics (
            org_id, kpi_name, kpi_category, current_value, 
            unit, calculation_month, metadata
        )
        VALUES (
            p_org_id, v_kpi_record.kpi_name, 'need_attention',
            v_kpi_record.current_value, v_kpi_record.unit, p_calculation_month,
            jsonb_build_object('severity', v_kpi_record.severity)
        )
        ON CONFLICT (org_id, kpi_name, calculation_month)
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            metadata = EXCLUDED.metadata,
            updated_at = NOW();
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. RLS Policies for kpi_metrics table
-- ----------------------------------------------------------------------------
ALTER TABLE portal.kpi_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their organization's KPIs
CREATE POLICY "Users can view their organization KPIs" ON portal.kpi_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portal.users u
            WHERE u.id = auth.uid()
            AND u.org_id = kpi_metrics.org_id
        )
    );

-- Policy for system to insert/update KPIs (via service role)
CREATE POLICY "Service role can manage KPIs" ON portal.kpi_metrics
    FOR ALL USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. Comments for Documentation
-- ----------------------------------------------------------------------------
COMMENT ON TABLE portal.kpi_metrics IS 'Stores calculated KPI metrics for dashboard display';
COMMENT ON FUNCTION portal.get_billing_kpis IS 'Calculates billing KPIs: Total Amount, Total Units, Total Bills, Rate per Unit';
COMMENT ON FUNCTION portal.get_payment_kpis IS 'Calculates payment KPIs: Payment Done Amount, Payments Completed, Collection Efficiency';
COMMENT ON FUNCTION portal.get_benefits_kpis IS 'Calculates benefits KPIs: Bills Generated, Balance Fetched, Sub meter readings';
COMMENT ON FUNCTION portal.get_payment_savings_kpis IS 'Calculates payment savings: Prompt Payment, Timely Payment, Surcharges';
COMMENT ON FUNCTION portal.get_need_attention_kpis IS 'Calculates need attention metrics: Lag Bills, Lag Recharges, Arrears, Penalties, Abnormal Bills';
COMMENT ON FUNCTION portal.get_all_kpi_metrics IS 'Master function that returns all KPI metrics as JSONB';
COMMENT ON FUNCTION portal.store_kpi_metrics IS 'Stores calculated KPIs in kpi_metrics table for historical tracking';
