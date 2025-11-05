-- Create stored procedures for reports
CREATE OR REPLACE FUNCTION portal.get_bill_date_vs_generation_report(
    p_biller_id text[] DEFAULT NULL,
    p_site_id text[] DEFAULT NULL,
    p_account_number text[] DEFAULT NULL,
    p_group_by text DEFAULT 'biller'
)
RETURNS TABLE (
    identifier text,
    "0-2 days" bigint,
    "2-5 days" bigint,
    "5-10 days" bigint,
    ">10 days" bigint
) AS $$
BEGIN
    IF p_group_by = 'biller' THEN
        RETURN QUERY
        SELECT
            c.biller_id::text as identifier,
            count(b.id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 2
            ) as "0-2 days",
            count(b.id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 2
                and extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 5
            ) as "2-5 days",
            count(b.id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 5
                and extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 10
            ) as "5-10 days",
            count(b.id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 10
            ) as ">10 days"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date > c.created_at
        AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.biller_id;
    ELSE
        RETURN QUERY
        SELECT
            c.id::text as identifier,
            count(b.connection_id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 2
            ) as "0-2 days",
            count(b.connection_id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 2
                and extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 5
            ) as "2-5 days",
            count(b.connection_id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 5
                and extract(epoch from (b.created_at - b.bill_date)) / 86400 <= 10
            ) as "5-10 days",
            count(b.connection_id) filter (
                where extract(epoch from (b.created_at - b.bill_date)) / 86400 > 10
            ) as ">10 days"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date > c.created_at
        AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for bill date vs due date report
CREATE OR REPLACE FUNCTION portal.get_bill_date_vs_due_date_report(
    p_biller_id text[] DEFAULT NULL,
    p_site_id text[] DEFAULT NULL,
    p_account_number text[] DEFAULT NULL,
    p_group_by text DEFAULT 'biller'
)
RETURNS TABLE (
    identifier text,
    "0-7 days" bigint,
    "7-14 days" bigint,
    "14-21 days" bigint,
    "21-30 days" bigint,
    ">30 days" bigint
) AS $$
BEGIN
    IF p_group_by = 'biller' THEN
        RETURN QUERY
        SELECT
            c.biller_id::text as identifier,
            count(b.id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 7
            ) as "0-7 days",
            count(b.id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 7
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 14
            ) as "7-14 days",
            count(b.id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 14
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 21
            ) as "14-21 days",
            count(b.id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 21
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 30
            ) as "21-30 days",
            count(b.id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 30
            ) as ">30 days"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date > c.created_at
        AND c.paytype = 1
        AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.biller_id;
    ELSE
        RETURN QUERY
        SELECT
            c.id::text as identifier,
            count(b.connection_id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 7
            ) as "0-7 days",
            count(b.connection_id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 7
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 14
            ) as "7-14 days",
            count(b.connection_id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 14
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 21
            ) as "14-21 days",
            count(b.connection_id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 21
                and extract(epoch from age(b.due_date, b.bill_date)) / 86400 <= 30
            ) as "21-30 days",
            count(b.connection_id) filter (
                where extract(epoch from age(b.due_date, b.bill_date)) / 86400 > 30
            ) as ">30 days"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE b.bill_date > c.created_at
        AND c.paytype = 1
        AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for timely payment report
CREATE OR REPLACE FUNCTION portal.get_timely_payment_report(
    p_biller_id text[] DEFAULT NULL,
    p_site_id text[] DEFAULT NULL,
    p_account_number text[] DEFAULT NULL,
    p_group_by text DEFAULT 'connection'
)
RETURNS TABLE (
    identifier text,
    connection_id text,
    due_date timestamp,
    collection_date timestamp,
    lpsc numeric,
    lpsc_applied boolean,
    total_bills_with_lpsc bigint,
    total_lpsc_amount numeric
) AS $$
BEGIN
    IF p_group_by = 'bill' THEN
        RETURN QUERY
        WITH payment_window AS (
            SELECT
                b.id AS bill_id,
                b.connection_id,
                MIN(p.collection_date) AS collection_date
            FROM portal.bills b
            LEFT JOIN portal.payments p
                ON p.connection_id = b.connection_id
                AND p.collection_date >= b.bill_date
            WHERE b.is_active = true
            AND p.collection_date <= b.due_date + INTERVAL '30 days'
            AND (p_biller_id IS NULL OR b.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR b.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR b.account_number = ANY(p_account_number))
            GROUP BY b.id, b.connection_id
        )
        SELECT
            b.id::text as identifier,
            b.connection_id::text,
            b.due_date,
            pw.collection_date,
            a.lpsc,
            CASE
                WHEN pw.collection_date > b.due_date AND a.lpsc > 0 THEN TRUE
                ELSE FALSE
            END AS lpsc_applied,
            NULL::bigint as total_bills_with_lpsc,
            NULL::numeric as total_lpsc_amount
        FROM portal.bills b
        LEFT JOIN payment_window pw ON pw.bill_id = b.id
        JOIN portal.adherence_charges a ON a.id = b.id
        WHERE b.is_active = true;
    ELSE
        RETURN QUERY
        WITH payment_window AS (
            SELECT
                b.id AS bill_id,
                b.connection_id,
                b.due_date,
                MIN(p.collection_date) AS collection_date
            FROM portal.bills b
            LEFT JOIN portal.payments p
                ON p.connection_id = b.connection_id
                AND p.collection_date >= b.bill_date
                AND p.collection_date <= b.due_date + INTERVAL '30 days'
            WHERE b.is_active = true
            GROUP BY b.id, b.connection_id, b.due_date
        )
        SELECT
            b.connection_id::text as identifier,
            NULL::text as connection_id,
            NULL::timestamp as due_date,
            NULL::timestamp as collection_date,
            NULL::numeric as lpsc,
            NULL::boolean as lpsc_applied,
            COUNT(DISTINCT b.id) FILTER (
                WHERE pw.collection_date > b.due_date AND a.lpsc > 0
            ) AS total_bills_with_lpsc,
            SUM(a.lpsc) FILTER (
                WHERE pw.collection_date > b.due_date
            ) AS total_lpsc_amount
        FROM portal.bills b
        JOIN portal.adherence_charges a ON a.id = b.id
        LEFT JOIN payment_window pw ON pw.bill_id = b.id
        WHERE b.is_active = true
        AND (p_biller_id IS NULL OR b.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR b.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR b.account_number = ANY(p_account_number))
        GROUP BY b.connection_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for actual vs abnormal report
CREATE OR REPLACE FUNCTION portal.get_actual_vs_abnormal_report(
    p_biller_id text[] DEFAULT NULL,
    p_site_id text[] DEFAULT NULL,
    p_account_number text[] DEFAULT NULL,
    p_group_by text DEFAULT 'biller'
)
RETURNS TABLE (
    identifier text,
    "No of Bills Normal" bigint,
    "No of Bills Abnormal" bigint,
    "Abnormal Bills Percentage" numeric
) AS $$
BEGIN
    IF p_group_by = 'biller' THEN
        RETURN QUERY
        SELECT
            c.biller_id::text as identifier,
            count(b.id) filter (where b.bill_type = 'Normal') as "No of Bills Normal",
            count(b.id) filter (where b.bill_type = 'Abnormal') as "No of Bills Abnormal",
            round(
                100.0 * count(b.id) filter (where b.bill_type = 'Abnormal') / nullif(count(b.id), 0),
                2
            ) as "Abnormal Bills Percentage"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.biller_id;
    ELSE
        RETURN QUERY
        SELECT
            c.id::text as identifier,
            count(b.connection_id) filter (where b.bill_type = 'Normal') as "No of Bills Normal",
            count(b.connection_id) filter (where b.bill_type = 'Abnormal') as "No of Bills Abnormal",
            round(
                100.0 * count(b.connection_id) filter (where b.bill_type = 'Abnormal') / nullif(count(b.connection_id), 0),
                2
            ) as "Abnormal Bills Percentage"
        FROM portal.bills b
        JOIN portal.connections c ON b.connection_id = c.id
        WHERE (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
        AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
        AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
        GROUP BY c.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for average consumption report
CREATE OR REPLACE FUNCTION portal.get_average_consumption_report(
    p_biller_id text[] DEFAULT NULL,
    p_site_id text[] DEFAULT NULL,
    p_account_number text[] DEFAULT NULL,
    p_group_by text DEFAULT 'connection'
)
RETURNS TABLE (
    identifier text,
    total_bills bigint,
    total_billed_units numeric,
    total_days_in_range bigint,
    average_monthly_consumption_30day numeric
) AS $$
BEGIN
    CASE p_group_by
        WHEN 'connection' THEN
            RETURN QUERY
            SELECT
                c.id::text as identifier,
                COUNT(b.id) AS total_bills,
                SUM(b.billed_unit) AS total_billed_units,
                SUM(GREATEST((b.end_date - b.start_date), 1)) AS total_days_in_range,
                ROUND(
                    AVG(
                        (b.billed_unit / NULLIF(GREATEST((b.end_date - b.start_date), 1), 0)) * 30
                    )::numeric,
                    2
                ) AS average_monthly_consumption_30day
            FROM portal.bills b
            JOIN portal.connections c ON b.connection_id = c.id
            WHERE b.bill_type = 'Normal'
            AND b.start_date IS NOT NULL
            AND b.end_date IS NOT NULL
            AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
            GROUP BY c.id;

        WHEN 'biller' THEN
            RETURN QUERY
            SELECT
                c.biller_id::text as identifier,
                COUNT(b.id) AS total_bills,
                SUM(b.billed_unit) AS total_billed_units,
                SUM(GREATEST((b.end_date - b.start_date), 1)) AS total_days_in_range,
                ROUND(
                    AVG(
                        (b.billed_unit / NULLIF(GREATEST((b.end_date - b.start_date), 1), 0)) * 30
                    )::numeric,
                    2
                ) AS average_monthly_consumption_30day
            FROM portal.bills b
            JOIN portal.connections c ON b.connection_id = c.id
            WHERE b.bill_type = 'Normal'
            AND b.start_date IS NOT NULL
            AND b.end_date IS NOT NULL
            AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
            GROUP BY c.biller_id;

        WHEN 'circle' THEN
            RETURN QUERY
            SELECT
                s.zone_id::text as identifier,
                COUNT(b.id) AS total_bills,
                SUM(b.billed_unit) AS total_billed_units,
                SUM(GREATEST((b.end_date - b.start_date), 1)) AS total_days_in_range,
                ROUND(
                    AVG(
                        (b.billed_unit / NULLIF(GREATEST((b.end_date - b.start_date), 1), 0)) * 30
                    )::numeric,
                    2
                ) AS average_monthly_consumption_30day
            FROM portal.bills b
            JOIN portal.connections c ON b.connection_id = c.id
            JOIN portal.sites s ON c.site_id = s.id
            WHERE b.bill_type = 'Normal'
            AND b.start_date IS NOT NULL
            AND b.end_date IS NOT NULL
            AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
            GROUP BY s.zone_id;

        WHEN 'site_type' THEN
            RETURN QUERY
            SELECT
                s.type::text as identifier,
                COUNT(b.id) AS total_bills,
                SUM(b.billed_unit) AS total_billed_units,
                SUM(GREATEST((b.end_date - b.start_date), 1)) AS total_days_in_range,
                ROUND(
                    AVG(
                        (b.billed_unit / NULLIF(GREATEST((b.end_date - b.start_date), 1), 0)) * 30
                    )::numeric,
                    2
                ) AS average_monthly_consumption_30day
            FROM portal.bills b
            JOIN portal.connections c ON b.connection_id = c.id
            JOIN portal.sites s ON c.site_id = s.id
            WHERE b.bill_type = 'Normal'
            AND b.start_date IS NOT NULL
            AND b.end_date IS NOT NULL
            AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
            GROUP BY s.type;

        ELSE
            RETURN QUERY
            SELECT
                c.id::text as identifier,
                COUNT(b.id) AS total_bills,
                SUM(b.billed_unit) AS total_billed_units,
                SUM(GREATEST((b.end_date - b.start_date), 1)) AS total_days_in_range,
                ROUND(
                    AVG(
                        (b.billed_unit / NULLIF(GREATEST((b.end_date - b.start_date), 1), 0)) * 30
                    )::numeric,
                    2
                ) AS average_monthly_consumption_30day
            FROM portal.bills b
            JOIN portal.connections c ON b.connection_id = c.id
            WHERE b.bill_type = 'Normal'
            AND b.start_date IS NOT NULL
            AND b.end_date IS NOT NULL
            AND (p_biller_id IS NULL OR c.biller_id = ANY(p_biller_id))
            AND (p_site_id IS NULL OR c.site_id = ANY(p_site_id))
            AND (p_account_number IS NULL OR c.account_number = ANY(p_account_number))
            GROUP BY c.id;
    END CASE;
END;
$$ LANGUAGE plpgsql; 



CREATE OR REPLACE FUNCTION portal.get_paid_bill_summary()
RETURNS TABLE (
  total_paid bigint,
  total_timely_paid bigint,
  total_late_paid bigint,
  total_paid_not_available_receipt bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT b.id) AS Total_Paid,
    SUM(CASE 
          WHEN p.collection_date <= b.due_date THEN 1 
          ELSE 0 
        END) AS Total_Timely_Paid,
    SUM(CASE 
          WHEN p.collection_date > b.due_date THEN 1 
          ELSE 0 
        END) AS Total_Late_Paid,
    SUM(CASE 
          WHEN p.collection_date IS NULL THEN 1 
          ELSE 0 
        END) AS Total_Paid_Not_Available_Receipt    
  FROM
    portal.bills b
    LEFT JOIN portal.payments p 
      ON b.connection_id = p.connection_id
      AND b.bill_date <= p.collection_date
  WHERE
    b.is_active = true
    AND b.payment_status = true;
END;
$$;


CREATE OR REPLACE FUNCTION portal.get_connection_summary_by_biller()
RETURNS TABLE (
  biller_id text,
  total_connections bigint,
  total_sanction_load NUMERIC,
  total_billed_demand NUMERIC,
  avg_sanction_load NUMERIC,
  avg_billed_demand NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.biller_id as biller_id,
    COUNT(*) AS total_connections,
    ROUND(SUM(c.sanction_load), 2) AS total_sanction_load,
    ROUND(SUM(c.billed_demand), 2) AS total_billed_demand,
    ROUND(AVG(c.sanction_load), 2) AS avg_sanction_load,
    ROUND(AVG(c.billed_demand), 2) AS avg_billed_demand
  FROM
    portal.connections c
  WHERE
    c.is_active = true
    AND c.is_deleted = false
  GROUP BY
    c.biller_id;
END;
$$;


CREATE OR REPLACE FUNCTION portal.get_bill_component_analysis()
RETURNS TABLE (
  bill_id text,
  connection_id text,
  bill_date DATE,
  due_date DATE,
  billed_unit NUMERIC,
  unit_cost NUMERIC,
  energy_charges NUMERIC,
  fixed_charges NUMERIC,
  demand_charges NUMERIC,
  fppac_charges NUMERIC,
  minimum_charges NUMERIC,
  surcharge NUMERIC,
  electricity_duty NUMERIC,
  municipal_tax NUMERIC,
  cgst NUMERIC,
  sgst NUMERIC,
  tax_at_source NUMERIC,
  total_charges NUMERIC,
  energy_charges_pct NUMERIC,
  fixed_charges_pct NUMERIC,
  demand_charges_pct NUMERIC,
  fppac_charges_pct NUMERIC,
  minimum_charges_pct NUMERIC,
  surcharge_pct NUMERIC,
  electricity_duty_pct NUMERIC,
  municipal_tax_pct NUMERIC,
  cgst_pct NUMERIC,
  sgst_pct NUMERIC,
  tax_at_source_pct NUMERIC,
  core_charges_pct_in_unit_cost NUMERIC,
  regulatory_charges_pct_in_unit_cost NUMERIC
)
LANGUAGE sql
AS $$
SELECT
  b.id,
  b.connection_id,
  b.bill_date,
  b.due_date,
  b.billed_unit,
  b.unit_cost,
  cc.energy_charges,
  cc.fixed_charges,
  cc.demand_charges,
  cc.fppac_charges,
  cc.minimum_charges,
  cc.surcharge,
  rc.electricity_duty,
  rc.municipal_tax,
  rc.cgst,
  rc.sgst,
  rc.tax_at_source,
  (
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge +
    rc.electricity_duty + rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source
  ) AS total_charges,

  ROUND((cc.energy_charges / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((cc.fixed_charges / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((cc.demand_charges / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((cc.fppac_charges / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((cc.minimum_charges / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((cc.surcharge / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((rc.electricity_duty / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((rc.municipal_tax / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((rc.cgst / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((rc.sgst / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),
  ROUND((rc.tax_at_source / NULLIF((
    cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge + rc.electricity_duty +
    rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source), 0)) * 100, 2),

  ROUND(((cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
    cc.minimum_charges + cc.surcharge) /
    NULLIF((
      cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
      cc.minimum_charges + cc.surcharge +
      rc.electricity_duty + rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source
    ), 0)) * 100, 2),

  ROUND(((rc.electricity_duty + rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source) /
    NULLIF((
      cc.energy_charges + cc.fixed_charges + cc.demand_charges + cc.fppac_charges +
      cc.minimum_charges + cc.surcharge +
      rc.electricity_duty + rc.municipal_tax + rc.cgst + rc.sgst + rc.tax_at_source
    ), 0)) * 100, 2)

FROM
  portal.bills b
JOIN portal.core_charges cc ON cc.id = b.id
JOIN portal.regulatory_charges rc ON rc.id = b.id
WHERE
  b.bill_type = 'Normal'
  AND b.is_active = true
  AND b.billed_unit >= 1000
  AND (b.is_deleted IS FALSE OR b.is_deleted IS NULL);
$$;


CREATE OR REPLACE FUNCTION portal.get_bill_lpsc_summary()
RETURNS TABLE (
  bill_id text,
  connection_id text,
  due_date DATE,
  collection_date DATE,
  lpsc NUMERIC,
  lpsc_applied BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH payment_window AS (
    SELECT
      b.id AS bill_id,
      b.connection_id,
      MIN(p.collection_date) AS collection_date
    FROM
      portal.bills b
      LEFT JOIN portal.payments p
        ON p.connection_id = b.connection_id
        AND p.collection_date >= b.bill_date
    WHERE
      b.is_active = true
      AND p.collection_date <= b.due_date + INTERVAL '30 days'
    GROUP BY
      b.id, b.connection_id
  )
  SELECT
    b.id AS bill_id,
    b.connection_id,
    b.due_date,
    pw.collection_date,
    a.lpsc,
    CASE
      WHEN pw.collection_date > b.due_date AND a.lpsc > 0 THEN TRUE
      ELSE FALSE
    END AS lpsc_applied
  FROM
    portal.bills b
    LEFT JOIN payment_window pw ON pw.bill_id = b.id
    JOIN portal.adherence_charges a ON a.id = b.id
  WHERE
    b.is_active = true;
END;
$$;


CREATE OR REPLACE FUNCTION portal.get_connection_lpsc_summary()
RETURNS TABLE (
  connection_id text,
  total_bills_with_lpsc bigint,
  total_lpsc_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH payment_window AS (
    SELECT
      b.id AS bill_id,
      b.connection_id,
      b.due_date,
      MIN(p.collection_date) AS collection_date
    FROM portal.bills b
    LEFT JOIN portal.payments p
      ON p.connection_id = b.connection_id
      AND p.collection_date >= b.bill_date
      AND p.collection_date <= b.due_date + INTERVAL '30 days'
    WHERE b.is_active = true
    GROUP BY b.id, b.connection_id, b.due_date
  )
  SELECT
    b.connection_id,
    COUNT(DISTINCT b.id) FILTER (
      WHERE pw.collection_date > b.due_date AND a.lpsc > 0
    ) AS total_bills_with_lpsc,
    SUM(a.lpsc) FILTER (
      WHERE pw.collection_date > b.due_date
    ) AS total_lpsc_amount
  FROM
    portal.bills b
    JOIN portal.adherence_charges a ON a.id = b.id
    LEFT JOIN payment_window pw ON pw.bill_id = b.id
  WHERE
    b.is_active = true
  GROUP BY
    b.connection_id;
END;
$$;



CREATE OR REPLACE FUNCTION portal.get_bill_rebate_summary()
RETURNS TABLE (
  bill_id text,
  connection_id text,
  rebate_potential NUMERIC,
  rebate_accrued NUMERIC,
  collection_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bill_id,
    b.connection_id,
    b.due_date_rebate AS rebate_potential,
    CASE
      WHEN MIN(p.collection_date) <= b.due_date THEN b.due_date_rebate
      ELSE 0
    END AS rebate_accrued,
    MIN(p.collection_date) AS collection_date
  FROM
    portal.bills b
    LEFT JOIN portal.payments p 
      ON b.connection_id = p.connection_id
      AND b.bill_date <= p.collection_date
  WHERE
    b.is_active = true
  GROUP BY
    b.id, b.connection_id, b.due_date_rebate, b.due_date;
END;
$$;

CREATE OR REPLACE FUNCTION portal.get_connection_rebate_summary()
RETURNS TABLE (
  connection_id text,
  total_rebate_potential NUMERIC,
  total_rebate_accrued NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH bill_rebate_eval AS (
    SELECT
      b.connection_id,
      b.id AS bill_id,
      b.due_date_rebate,
      b.due_date,
      MIN(p.collection_date) AS first_payment_date
    FROM
      portal.bills b
      LEFT JOIN portal.payments p
        ON b.connection_id = p.connection_id
        AND b.bill_date <= p.collection_date
    WHERE
      b.is_active = true
    GROUP BY
      b.connection_id, b.id, b.due_date_rebate, b.due_date
  )
  SELECT
    b.connection_id,
    SUM(due_date_rebate) AS total_rebate_potential,
    SUM(
      CASE
        WHEN first_payment_date <= due_date THEN due_date_rebate
        ELSE 0
      END
    ) AS total_rebate_accrued
  FROM
    bill_rebate_eval b
  GROUP BY
    b.connection_id;
END;
$$;




CREATE OR REPLACE FUNCTION portal.get_paid_bill_summary()
RETURNS TABLE (
  total_bills bigint,
  unpaid_bills bigint,
  paid_on_time_bills bigint,
  paid_late_bills bigint,
  paid_but_receipt_missing bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT b.id) AS total_bills,
    SUM(CASE 
          WHEN b.payment_status = false THEN 1 
          ELSE 0 
        END) AS unpaid_bills,
    SUM(CASE 
          WHEN b.payment_status = true AND payment.collection_date <= b.due_date THEN 1 
          ELSE 0 
        END) AS paid_on_time_bills,
    SUM(CASE 
          WHEN b.payment_status = true AND payment.collection_date > b.due_date THEN 1 
          ELSE 0 
        END) AS paid_late_bills,
    SUM(CASE 
          WHEN payment.collection_date IS NULL AND b.payment_status = true THEN 1 
          ELSE 0 
        END) AS paid_but_receipt_missing
  FROM
    portal.bills b
  LEFT JOIN LATERAL (
    SELECT p.collection_date
    FROM portal.payments p
    WHERE p.connection_id = b.connection_id
      AND p.collection_date >= b.bill_date
    ORDER BY p.collection_date ASC
    LIMIT 1
  ) payment ON true
  WHERE
    b.is_active = true
    AND b.due_date < CURRENT_DATE;
END;
$$;


