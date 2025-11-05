export interface SubmeterInfoProps {
    connection_id: string;
    bank_name?: string | null;
    bank_branch_name?: string | null;
    bank_account_number?: string | null;
    bank_account_holder_name?: string | null;
    ifsc_code?: string | null;
    tl_mobile_number?: number | null;
    operator_mobile_number?: number | null;
    operator_name?: string | null;
    operational_hours?: string | null;
    created_at?: string;
    created_by?: string | null;
    updated_at?: string | null;
    updated_by?: string | null;
} 