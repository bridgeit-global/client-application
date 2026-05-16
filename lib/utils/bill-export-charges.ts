import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import type { AllBillTableProps } from '@/types/bills-type';

const CHARGE_META_KEYS = new Set(['id', 'created_at', 'updated_at']);

/** Same semantics as BillDetails calculateTotalCharges negative adjustments */
const NEGATIVE_CHARGE_KEYS = new Set([
  'tod_rebate',
  'interest_on_sd',
  'rebate_subsidy',
  'power_factor_incentive',
]);

export function getEnergyBasedUnitCostValue(bill: AllBillTableProps): number | null {
  const billed = bill.billed_unit;
  if (billed == null || billed <= 0) return null;
  const energy = bill.core_charges?.energy_charges;
  if (typeof energy !== 'number' || Number.isNaN(energy)) return null;
  return energy / billed;
}

/** Display string for bill report UI + main export sheet unit cost column */
export function getEnergyBasedUnitCostLabel(bill: AllBillTableProps): string | null {
  const v = getEnergyBasedUnitCostValue(bill);
  if (v == null) return null;
  return formatRupees(v);
}

function signedChargeAmount(key: string, raw: number): number {
  if (NEGATIVE_CHARGE_KEYS.has(key)) {
    return raw > 0 ? -raw : raw;
  }
  return raw;
}

type ChargeCategory = 'core' | 'regulatory' | 'adherence' | 'additional';

/** Column id: `{category}_{field}` e.g. `core_energy_charges` — stable for Excel headers after title-case. */
function chargeColumnId(category: ChargeCategory, fieldKey: string): string {
  return `${category}_${fieldKey}`;
}

/** Signed amounts per wide column for one bill */
function chargeAmountsMapForBill(bill: AllBillTableProps): Map<string, number> {
  const map = new Map<string, number>();
  const blocks: [ChargeCategory, Record<string, unknown> | null | undefined][] = [
    ['core', bill.core_charges as Record<string, unknown> | undefined],
    ['regulatory', bill.regulatory_charges as Record<string, unknown> | undefined],
    ['adherence', bill.adherence_charges as Record<string, unknown> | undefined],
    ['additional', bill.additional_charges as Record<string, unknown> | undefined],
  ];

  for (const [category, obj] of blocks) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [key, val] of Object.entries(obj)) {
      if (CHARGE_META_KEYS.has(key)) continue;
      if (typeof val !== 'number' || Number.isNaN(val)) continue;
      map.set(chargeColumnId(category, key), signedChargeAmount(key, val));
    }
  }
  return map;
}

/**
 * One row per bill for the "charges split" sheet: correlation columns + one numeric column per
 * charge component (union of all keys seen in the batch).
 */
export function buildChargeSplitWideExportRows(
  bills: AllBillTableProps[],
  siteKey: string
): Record<string, string | number | null>[] {
  const perBillMaps = bills.map((b) => chargeAmountsMapForBill(b));
  const allColumnIds = new Set<string>();
  for (const m of perBillMaps) {
    for (const k of Array.from(m.keys())) allColumnIds.add(k);
  }
  const sortedChargeColumns = Array.from(allColumnIds).sort();

  return bills.map((bill, i) => {
    const amounts = perBillMaps[i];
    const row: Record<string, string | number | null> = {
      [siteKey]: String(bill.connections?.site_id ?? ''),
      account_number: String(bill.connections?.account_number ?? ''),
      bill_date_iso: bill.bill_date?.slice(0, 10) ?? '',
    };
    for (const col of sortedChargeColumns) {
      row[col] = amounts.has(col) ? amounts.get(col)! : '';
    }
    return row;
  });
}

export function buildMeterReadingExportRows(
  bill: AllBillTableProps,
  siteKey: string
): Record<string, string | number | null>[] {
  const siteId = String(bill.connections?.site_id ?? '');
  const accountNumber = String(bill.connections?.account_number ?? '');
  const billDateIso = bill.bill_date?.slice(0, 10) ?? '';
  const readings = bill.meter_readings;
  if (!readings?.length) return [];

  return readings.map((r) => ({
    [siteKey]: siteId,
    account_number: accountNumber,
    bill_date_iso: billDateIso,
    type: r.type ?? '',
    start_date: r.start_date ?? '',
    end_date: r.end_date ?? '',
    start_reading: r.start_reading ?? '',
    end_reading: r.end_reading ?? '',
    multiplication_factor: r.multiplication_factor ?? '',
  }));
}

/** One row per bill for XLSX "Connection Info": site, account, bill date, bill-level connection snapshot. */
export function buildBillConnectionInfoExportRows(
  bills: AllBillTableProps[],
  siteKey: string
): Record<string, string | number | null>[] {
  return bills.map((bill) => {
    const info = bill.bill_level_connection_info;
    return {
      [siteKey]: String(bill.connections?.site_id ?? ''),
      account_number: String(bill.connections?.account_number ?? ''),
      bill_date: bill.bill_date ? ddmmyy(bill.bill_date) : '',
      sanction_load: info?.sanction_load ?? bill.connections?.sanction_load ?? '',
      sanction_type: info?.sanction_type ?? bill.connections?.sanction_type ?? '',
      tariff: info?.tariff ?? bill.connections?.tariff ?? ''
    };
  });
}
