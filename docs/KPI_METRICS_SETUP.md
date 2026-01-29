# KPI Metrics Setup and Usage Guide

## Overview

This document describes the KPI metrics system that provides month-over-month comparison for billing, payment, benefits, and need attention metrics.

## Database Schema

### Table: `portal.kpi_metrics`

Stores calculated KPI metrics for historical tracking and reporting.

**Columns:**
- `id` - UUID primary key
- `org_id` - Organization ID (foreign key to organizations)
- `kpi_name` - Name of the KPI (e.g., "Total Amount", "Payment Done Amount")
- `kpi_category` - Category: 'billing', 'payment', 'benefits', 'need_attention'
- `current_value` - Current month value
- `last_month_value` - Last month value for comparison
- `trend_percentage` - Month-over-month percentage change
- `trend_direction` - 'UP', 'DOWN', 'NEUTRAL', or 'NEW'
- `unit` - Unit of measurement (e.g., 'Lakhs', 'K', 'Count', '₹', '%')
- `calculation_month` - Month for which metrics are calculated
- `metadata` - Additional JSONB data
- `created_at`, `updated_at` - Timestamps

## Database Functions

### 1. `get_billing_kpis(p_org_id, p_start_date, p_end_date)`

Calculates billing KPIs:
- **Total Amount** (₹)
- **Total Units** (Units)
- **Total Bills** (Count)
- **Rate per Unit** (₹)

**Example:**
```sql
SELECT * FROM portal.get_billing_kpis(
    p_org_id := 'your-org-id',
    p_start_date := '2024-12-01',
    p_end_date := '2024-12-31'
);
```

### 2. `get_payment_kpis(p_org_id, p_start_date, p_end_date)`

Calculates payment KPIs:
- **Payment Done Amount** (₹)
- **Payments Completed** (Count)
- **Collection Efficiency** (%)

**Example:**
```sql
SELECT * FROM portal.get_payment_kpis(
    p_org_id := 'your-org-id'
);
```

### 3. `get_benefits_kpis(p_org_id, p_start_date, p_end_date)`

Calculates benefits KPIs:
- **Bills Generated** (Count) - Benefit: ~120 mins per bill
- **Balance Fetched** (Count) - Benefit: ~1 minute per balance
- **Sub meter readings captured** (Count) - Benefit: ~1 minute per reading

**Example:**
```sql
SELECT * FROM portal.get_benefits_kpis(
    p_org_id := 'your-org-id'
);
```

### 4. `get_payment_savings_kpis(p_org_id, p_start_date, p_end_date)`

Calculates payment savings:
- **Prompt Payment** - Potential vs Accrued
- **Timely Payment** - Potential vs Accrued
- **Surcharges** - Potential vs Accrued

**Example:**
```sql
SELECT * FROM portal.get_payment_savings_kpis(
    p_org_id := 'your-org-id'
);
```

### 5. `get_need_attention_kpis(p_org_id, p_start_date, p_end_date)`

Calculates need attention metrics:
- **Lag Bills** (Count) - Bills that are overdue
- **Lag Recharges** (Count) - Recharges that are overdue
- **Arrears** (₹) - Total outstanding arrears
- **Penalties** (₹) - Total penalties
- **Abnormal Bills** (Count) - Invalid bills

**Example:**
```sql
SELECT * FROM portal.get_need_attention_kpis(
    p_org_id := 'your-org-id'
);
```

### 6. `get_all_kpi_metrics(p_org_id, p_start_date, p_end_date)`

Master function that returns all KPIs as JSONB.

**Example:**
```sql
SELECT portal.get_all_kpi_metrics(
    p_org_id := 'your-org-id'
);
```

**Response Structure:**
```json
{
  "billing": [
    {
      "kpiName": "Total Amount",
      "currentValue": 4230000,
      "lastMonthValue": 4020000,
      "trendPercentage": 5.1,
      "trendDirection": "UP",
      "unit": "₹"
    }
  ],
  "payment": [...],
  "benefits": [...],
  "paymentSavings": [...],
  "needAttention": [...]
}
```

### 7. `store_kpi_metrics(p_org_id, p_calculation_month)`

Stores calculated KPIs in the `kpi_metrics` table for historical tracking.

**Example:**
```sql
SELECT portal.store_kpi_metrics(
    p_org_id := 'your-org-id',
    p_calculation_month := '2024-12-01'
);
```

## TypeScript/JavaScript Usage

### Import the service functions:

```typescript
import {
  getAllKPIMetrics,
  getBillingKPIs,
  getPaymentKPIs,
  getBenefitsKPIs,
  getPaymentSavingsKPIs,
  getNeedAttentionKPIs,
  storeKPIMetrics,
} from '@/services/kpi-metrics';
```

### Fetch all KPIs:

```typescript
// In a Server Component or API Route
const allKPIs = await getAllKPIMetrics({
  org_id: 'your-org-id',
  start_date: '2024-12-01',
  end_date: '2024-12-31',
});

if (allKPIs) {
  console.log('Billing KPIs:', allKPIs.billing);
  console.log('Payment KPIs:', allKPIs.payment);
  console.log('Benefits KPIs:', allKPIs.benefits);
  console.log('Need Attention:', allKPIs.needAttention);
}
```

### Fetch specific KPI category:

```typescript
// Get billing KPIs only
const billingKPIs = await getBillingKPIs({
  org_id: 'your-org-id',
});

if (billingKPIs) {
  billingKPIs.forEach(kpi => {
    console.log(`${kpi.kpi_name}: ${kpi.current_value} ${kpi.unit}`);
    console.log(`Trend: ${kpi.trend_percentage}% ${kpi.trend_direction}`);
  });
}
```

### Store KPIs for historical tracking:

```typescript
// Typically called by a scheduled job
const success = await storeKPIMetrics(
  'your-org-id',
  '2024-12-01' // Optional: defaults to current month
);

if (success) {
  console.log('KPIs stored successfully');
}
```

## Trend Calculation Logic

All KPIs use the standard month-over-month trend formula:

```
Trend Percentage = ((This Month Value − Last Month Value) / Last Month Value) × 100
```

**Edge Cases:**
- If last month value is 0, trend is marked as "NEW"
- If last month value is 0, trend_percentage is NULL
- Trend direction: 'UP', 'DOWN', 'NEUTRAL', or 'NEW'

## UI Display Guidelines

### KPI Card Structure:

```
┌─────────────────────────────┐
│ Payment Done (₹)            │
│ ₹42,30,000                  │
│ +5.1% vs Last Month         │
│ Last Month: ₹40,20,000      │
└─────────────────────────────┘
```

### Color Coding:
- **Green**: Positive trend (UP)
- **Red**: Negative trend (DOWN)
- **Grey**: No change (NEUTRAL)
- **Blue**: New metric (NEW)

### Units:
- Amounts: Always in **₹** (Rupees) - actual amounts, not converted
- Units: In **Units** - actual unit values, not converted
- Rates: In **₹** (Rupees)
- Percentages: In **%**

## Scheduled Jobs

To automatically calculate and store KPIs monthly, set up a scheduled job:

```sql
-- Example: Run on the 1st of each month
SELECT cron.schedule(
    'store-monthly-kpis',
    '0 0 1 * *', -- First day of every month at midnight
    $$
    SELECT portal.store_kpi_metrics(org_id, DATE_TRUNC('month', CURRENT_DATE))
    FROM portal.organizations
    WHERE is_active = true;
    $$
);
```

## Migration

To apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20241202_create_kpi_metrics.sql
```

## Type Regeneration

After running the migration, regenerate TypeScript types:

```bash
pnpm exec supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

The new `kpi_metrics` table and functions will be included in the generated types.

## Testing

### Test individual functions:

```sql
-- Test billing KPIs
SELECT * FROM portal.get_billing_kpis();

-- Test payment KPIs
SELECT * FROM portal.get_payment_kpis();

-- Test all KPIs
SELECT portal.get_all_kpi_metrics();
```

### Test in TypeScript:

```typescript
// Test service functions
const testKPIs = await getAllKPIMetrics();
console.log('All KPIs:', JSON.stringify(testKPIs, null, 2));
```

## Performance Considerations

1. **Caching**: All service functions use React `cache()` for server-side caching
2. **Indexes**: The `kpi_metrics` table has indexes on `org_id`, `kpi_category`, and `calculation_month`
3. **Computed vs Stored**: 
   - Use `get_*_kpis()` functions for real-time calculations
   - Use `kpi_metrics` table for historical data and faster queries

## Troubleshooting

### Function returns NULL:
- Check if organization has bills/payments in the date range
- Verify RLS policies allow access
- Check function permissions (SECURITY DEFINER)

### Trend percentage is NULL:
- This is expected when last month value is 0
- Display as "NEW" in UI

### Performance issues:
- Consider storing KPIs monthly using `store_kpi_metrics()`
- Query stored data instead of computing on-the-fly
- Add date range filters to limit data processed

## Support

For issues or questions, refer to:
- Migration file: `supabase/migrations/20241202_create_kpi_metrics.sql`
- Service file: `services/kpi-metrics.ts`
- Type definitions: `types/kpi-metrics-type.ts`
