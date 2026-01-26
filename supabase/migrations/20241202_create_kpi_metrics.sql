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
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES portal.organizations(id) ON DELETE CASCADE,
  kpi_name varchar(255) NOT NULL,
  kpi_category varchar(50) NOT NULL CHECK (kpi_category IN ('benefits', 'need_attention', 'payment_savings')),
  current_value numeric(15,2) NOT NULL,
  last_month_value numeric(15,2),
  trend_percentage numeric(5,2),
  trend_direction varchar(10) CHECK (trend_direction IN ('UP','DOWN','NEUTRAL','NEW')),
  unit varchar(50) NOT NULL,
  calculation_month date NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, kpi_name, calculation_month)
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_org_id ON portal.kpi_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_category ON portal.kpi_metrics(kpi_category);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_month ON portal.kpi_metrics(calculation_month);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_org_category_month ON portal.kpi_metrics(org_id, kpi_category, calculation_month);


-- ----------------------------------------------------------------------------
-- 2. Benefits KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_benefits_kpis(
    p_org_id uuid,
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
    v_range_days INTEGER;
    v_last_month_last_day DATE;
    v_org_id uuid;
BEGIN
    v_this_month_start := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::date);
    v_this_month_end := COALESCE(p_end_date, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date);

    -- "Last month" should match the same day-span as the selected range.
    -- Example: 2025-02-01..2025-02-25 => 2025-01-01..2025-01-25
    v_range_days := (v_this_month_end - v_this_month_start);
    v_last_month_start := (v_this_month_start - INTERVAL '1 month')::date;
    v_last_month_last_day := (DATE_TRUNC('month', v_last_month_start) + INTERVAL '1 month' - INTERVAL '1 day')::date;
    v_last_month_end := LEAST(v_last_month_start + v_range_days, v_last_month_last_day);

    v_org_id := p_org_id;

    RETURN QUERY
    WITH this_month_bills AS (
        SELECT COUNT(*) AS bill_count
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.created_at >= v_this_month_start
          AND b.created_at <= v_this_month_end
          AND b.is_active = true
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
    ),
    last_month_bills AS (
        SELECT COUNT(*) AS bill_count
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.created_at >= v_last_month_start
          AND b.created_at <= v_last_month_end
          AND b.is_active = true
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
    ),
    this_month_balances AS (
        SELECT COUNT(*) AS balance_count
        FROM portal.prepaid_balances pb
        INNER JOIN portal.connections c
          -- Verify this join; see note below
          ON pb.id = c.id
        WHERE pb.fetch_date >= v_this_month_start
          AND pb.fetch_date <= v_this_month_end
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
    ),
    last_month_balances AS (
        SELECT COUNT(*) AS balance_count
        FROM portal.prepaid_balances pb
        INNER JOIN portal.connections c
          -- Verify this join; see note below
          ON pb.id = c.id
        WHERE pb.fetch_date >= v_last_month_start
          AND pb.fetch_date <= v_last_month_end
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
    ),
    this_month_readings AS (
        SELECT COUNT(*) AS reading_count
        FROM portal.submeter_readings sr
        INNER JOIN portal.connections c ON sr.connection_id = c.id
        WHERE sr.reading_date >= v_this_month_start
          AND sr.reading_date <= v_this_month_end
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
    ),
    last_month_readings AS (
        SELECT COUNT(*) AS reading_count
        FROM portal.submeter_readings sr
        INNER JOIN portal.connections c ON sr.connection_id = c.id
        WHERE sr.reading_date >= v_last_month_start
          AND sr.reading_date <= v_last_month_end
          AND EXISTS (
                SELECT 1
                FROM portal.sites s
                WHERE s.id = c.site_id
                  AND s.org_id = v_org_id
          )
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


-- select *  from portal.get_benefits_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 3. Savings on Payment KPIs Calculation Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.get_payment_savings_kpis(
    p_org_id uuid,
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
    v_org_id := p_org_id;

    RETURN QUERY
    WITH
    prompt_payment_base AS (
        SELECT
            b.id,
            b.discount_date,
            b.discount_date_rebate,
            (
                SELECT MIN(p.collection_date)
                FROM portal.payments p
                WHERE p.connection_id = b.connection_id
                  AND p.collection_date > b.bill_date
            ) AS first_collection_after_bill
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date >= v_this_month_start
          AND b.bill_date <= v_this_month_end
          AND b.is_valid = true
          AND b.discount_date IS NOT NULL
          AND b.discount_date_rebate IS NOT NULL
          AND EXISTS (
                 SELECT 1
                 FROM portal.sites s
                 WHERE s.id = c.site_id
                   AND s.org_id = v_org_id
               )
    ),
    prompt_payment_potential AS (
        SELECT 
            COALESCE(SUM(ppb.discount_date_rebate), 0) AS total_potential
        FROM prompt_payment_base ppb
    ),
    prompt_payment_accrued AS (
        SELECT 
            COALESCE(SUM(ppb.discount_date_rebate), 0) AS total_accrued
        FROM prompt_payment_base ppb
        WHERE ppb.first_collection_after_bill IS NOT NULL
          AND ppb.first_collection_after_bill <= ppb.discount_date
    ),
    timely_payment_potential AS (
        SELECT 
            COALESCE(SUM(b.bill_amount), 0) AS total_potential
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date >= v_this_month_start
          AND b.bill_date <= v_this_month_end
          AND b.is_valid = true
          AND b.due_date IS NOT NULL
          AND EXISTS (
                 SELECT 1
                 FROM portal.sites s
                 WHERE s.id = c.site_id
                   AND s.org_id = v_org_id
               )
    ),
    timely_payment_accrued AS (
        SELECT 
            COALESCE(SUM(p.amount), 0) AS total_accrued
        FROM portal.payments p
        INNER JOIN portal.bills b ON p.connection_id = b.connection_id
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date >= v_this_month_start
          AND b.bill_date <= v_this_month_end
          AND p.collection_date >= v_this_month_start
          AND p.collection_date <= v_this_month_end
          AND p.collection_date <= b.due_date
          AND b.is_valid = true
          AND b.due_date IS NOT NULL
          AND (
               SELECT MIN(p2.collection_date)
               FROM portal.payments p2
               WHERE p2.connection_id = b.connection_id
                 AND p2.collection_date > b.bill_date
           ) <= b.due_date
          AND EXISTS (
                 SELECT 1
                 FROM portal.sites s
                 WHERE s.id = c.site_id
                   AND s.org_id = v_org_id
               )
    ),
    surcharge_base AS (
        SELECT
            b.id,
            b.due_date,
            b.penalty_amount,
            (
                SELECT MIN(p.collection_date)
                FROM portal.payments p
                WHERE p.connection_id = b.connection_id
                  AND p.collection_date > b.bill_date
            ) AS first_collection_after_bill
        FROM portal.bills b
        INNER JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date >= v_this_month_start
          AND b.bill_date <= v_this_month_end
          AND b.is_valid = true
          AND b.due_date IS NOT NULL
          AND b.penalty_amount IS NOT NULL
          AND EXISTS (
                 SELECT 1
                 FROM portal.sites s
                 WHERE s.id = c.site_id
                   AND s.org_id = v_org_id
               )
    ),
    surcharge_potential AS (
        SELECT 
            COALESCE(SUM(sb.penalty_amount), 0) AS total_potential
        FROM surcharge_base sb
    ),
    surcharge_accrued AS (
        SELECT 
            COALESCE(SUM(sb.penalty_amount), 0) AS total_accrued
        FROM surcharge_base sb
        WHERE sb.first_collection_after_bill IS NOT NULL
          AND sb.first_collection_after_bill < sb.due_date
    )
    SELECT 
        'Prompt Payment'::varchar AS kpi_name,
        ppp.total_potential AS potential_value,
        ppa.total_accrued AS accrued_value,
        CASE 
            WHEN ppp.total_potential > 0 THEN 
                (ppa.total_accrued / ppp.total_potential) * 100
            ELSE 0
        END AS savings_percentage,
        '₹'::varchar AS unit
    FROM prompt_payment_potential ppp
    CROSS JOIN prompt_payment_accrued ppa

    UNION ALL

    SELECT 
        'Timely Payment'::varchar,
        tpp.total_potential,
        tpa.total_accrued,
        CASE 
            WHEN tpp.total_potential > 0 THEN 
                (tpa.total_accrued / tpp.total_potential) * 100
            ELSE 0
        END,
        '₹'::varchar
    FROM timely_payment_potential tpp
    CROSS JOIN timely_payment_accrued tpa

    UNION ALL

    SELECT 
        'Surcharges'::varchar,
        sp.total_potential,
        sa.total_accrued,
        CASE 
            WHEN sp.total_potential > 0 THEN 
                (sa.total_accrued / sp.total_potential) * 100
            ELSE 0
        END,
        '₹'::varchar
    FROM surcharge_potential sp
    CROSS JOIN surcharge_accrued sa;
END;
$$;


-- select * from portal.get_payment_savings_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid);

-- ----------------------------------------------------------------------------
-- 4. Need Attention KPIs Calculation Function
-- ----------------------------------------------------------------------------
-- NOTE:
-- Older versions of this function existed with signature:
--   portal.get_need_attention_kpis(p_org_id uuid DEFAULT NULL)
-- After adding date params (all DEFAULT NULL), calling `portal.get_need_attention_kpis()`
-- becomes ambiguous unless we drop the old 1-arg overload.


CREATE OR REPLACE FUNCTION portal.get_need_attention_kpis(
  p_org_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  kpi_name varchar,
  current_value numeric,
  unit varchar,
  severity varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
  v_this_month_start date;
  v_this_month_end date;
  v_org_id uuid;
  v_today date;
BEGIN
  v_this_month_start := COALESCE(p_start_date, date_trunc('month', current_date)::date);
  v_this_month_end := COALESCE(p_end_date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date);
  v_org_id := p_org_id;
  -- Use end_date as reference date when provided (for historical month-end snapshots)
  v_today := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  WITH lag_bills AS (
    SELECT COUNT(*) AS lag_count
    FROM portal.connections c
    WHERE c.next_bill_date IS NOT NULL
      AND c.next_bill_date < v_today
      AND c.is_active = true
      AND c.is_deleted = false
      AND EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      )
  ),
  lag_recharges AS (
    SELECT COUNT(*) AS lag_count
    FROM portal.connections c
    LEFT JOIN LATERAL (
      SELECT MAX(pb.fetch_date) AS last_fetch_date
      FROM portal.prepaid_balances pb
      WHERE pb.id = c.id
    ) pb ON true
    WHERE c.is_active = true
      AND c.is_deleted = false
      -- Lag definition:
      -- If we did not receive any prepaid balance fetch in the last 3 days,
      -- the displayed balance stays the same => treat as "lag".
      AND pb.last_fetch_date <= v_today - 3
      AND EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      )
  ),
  arrears_data AS (
    SELECT COALESCE(SUM(ac.arrears), 0) AS total_arrears
    FROM portal.additional_charges ac
    JOIN portal.bills b ON ac.id = b.id
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.is_valid = true
      AND ac.arrears > 0
      AND b.bill_date >= v_this_month_start
      AND b.bill_date <= v_this_month_end
      AND EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      )
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
    WHERE b.is_valid = true
      AND b.bill_date >= v_this_month_start
      AND b.bill_date <= v_this_month_end
      AND EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      )
  ),
  abnormal_bills AS (
    SELECT COUNT(*) AS abnormal_count
    FROM portal.bills b
    JOIN portal.connections c ON b.connection_id = c.id
    WHERE b.bill_type IN ('Abnoraml', 'Abnormal')
      AND b.bill_date >= v_this_month_start
      AND b.bill_date <= v_this_month_end
      AND EXISTS (
        SELECT 1 FROM portal.sites s
        WHERE s.id = c.site_id AND s.org_id = v_org_id
      )
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


-- select * from portal.get_need_attention_kpis('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid, null, null);

-- ----------------------------------------------------------------------------
-- 5. clamp trend function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.clamp_trend(p NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $f$
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  IF p > 100 THEN RETURN 100; END IF;
  IF p < -100 THEN RETURN -100; END IF;
  RETURN p;
END;
$f$;

-- ----------------------------------------------------------------------------
-- 6. Function to Store KPI Metrics
-- ----------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION portal.store_kpi_metrics(
  p_org_id UUID,
  p_calculation_month DATE DEFAULT date_trunc('month', current_date)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_kpi_record RECORD;
BEGIN
  v_start_date := p_calculation_month;
  v_end_date := (date_trunc('month', p_calculation_month) + interval '1 month - 1 day')::date;

  -- Benefits
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
      round(v_kpi_record.current_value::numeric, 4),
      round(v_kpi_record.last_month_value::numeric, 4),
      round(
        (
          CASE
            WHEN v_kpi_record.trend_percentage IS NULL THEN NULL
            WHEN v_kpi_record.trend_percentage > 100 THEN 100
            WHEN v_kpi_record.trend_percentage < -100 THEN -100
            ELSE v_kpi_record.trend_percentage
          END
        )::numeric, 2
      ),
      v_kpi_record.trend_direction,
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
      current_value     = EXCLUDED.current_value,
      last_month_value  = EXCLUDED.last_month_value,
      trend_percentage  = EXCLUDED.trend_percentage,
      trend_direction   = EXCLUDED.trend_direction,
      metadata          = EXCLUDED.metadata,
      updated_at        = NOW();
  END LOOP;

  -- Payment Savings
  FOR v_kpi_record IN
    SELECT * FROM portal.get_payment_savings_kpis(p_org_id, v_start_date, v_end_date)
  LOOP
    INSERT INTO portal.kpi_metrics (
      org_id, kpi_name, kpi_category, current_value,
      unit, calculation_month, metadata
    )
    VALUES (
      p_org_id, v_kpi_record.kpi_name, 'payment_savings',
      round(v_kpi_record.accrued_value::numeric, 4),
      v_kpi_record.unit, p_calculation_month,
      jsonb_build_object(
        'potentialValue', v_kpi_record.potential_value,
        'accruedValue', v_kpi_record.accrued_value,
        'savingsPercentage', v_kpi_record.savings_percentage
      )
    )
    ON CONFLICT (org_id, kpi_name, calculation_month)
    DO UPDATE SET
      current_value = EXCLUDED.current_value,
      metadata      = EXCLUDED.metadata,
      updated_at    = NOW();
  END LOOP;

  -- Need Attention
  FOR v_kpi_record IN
    SELECT * FROM portal.get_need_attention_kpis(p_org_id, v_start_date, v_end_date)
  LOOP
    INSERT INTO portal.kpi_metrics (
      org_id, kpi_name, kpi_category, current_value,
      unit, calculation_month, metadata
    )
    VALUES (
      p_org_id, v_kpi_record.kpi_name, 'need_attention',
      round(v_kpi_record.current_value::numeric, 4),
      v_kpi_record.unit, p_calculation_month,
      jsonb_build_object('severity', v_kpi_record.severity)
    )
    ON CONFLICT (org_id, kpi_name, calculation_month)
    DO UPDATE SET
      current_value = EXCLUDED.current_value,
      metadata      = EXCLUDED.metadata,
      updated_at    = NOW();
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6.1. Function to Store KPI Metrics for Entire Year
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal.store_kpi_metrics_for_year(
  p_org_id UUID,
  p_year INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month INTEGER;
  v_calculation_month DATE;
BEGIN
  -- Loop through all 12 months
  FOR v_month IN 1..12 LOOP
    -- Construct the first day of the month for the given year
    v_calculation_month := make_date(p_year, v_month, 1);
    
    -- Call store_kpi_metrics for this month
    PERFORM portal.store_kpi_metrics(p_org_id, v_calculation_month);
  END LOOP;
END;
$$;

-- Example run
-- Store KPIs for a single month
SELECT portal.store_kpi_metrics('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid,'2025-10-01');

-- Store KPIs for entire year (all 12 months)
-- SELECT portal.store_kpi_metrics_for_year('49af6e1b-8d81-4914-b8c4-ffd2e9af2521'::uuid, 2025);

select * from portal.kpi_metrics;
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
COMMENT ON FUNCTION portal.get_need_attention_kpis(uuid, date, date) IS 'Calculates need attention metrics: Lag Bills, Lag Recharges, Arrears, Penalties, Abnormal Bills';
COMMENT ON FUNCTION portal.get_all_kpi_metrics IS 'Master function that returns all KPI metrics as JSONB';
COMMENT ON FUNCTION portal.store_kpi_metrics IS 'Stores calculated KPIs in kpi_metrics table for historical tracking';
COMMENT ON FUNCTION portal.store_kpi_metrics_for_year IS 'Stores KPI metrics for all 12 months of a given year by calling store_kpi_metrics in a loop';
