
import { createClient } from "@/lib/supabase/server";
import { SearchParamsProps } from "@/types";
import { cache } from "react";
type ConnectionFormProps = {
    paytype: string | undefined,
    site_id: string | undefined,
    biller_id: string | undefined,
    parameters: Array<{
        key: string;
        value: string;
        validation: string;
        message: string;
    }>
}

type ConnectionResult = {
    data: ConnectionFormProps;
    error: any;
}

export const fetchConnectionDetails = cache(
    async (searchParams: SearchParamsProps): Promise<ConnectionResult> => {
        const { id } = searchParams;
        const supabase = createClient(); // Assuming Supabase client is properly set up
        let query = supabase
            .from('connections')
            .select(`id,site_id, paytype, biller_id, parameters`)
            .eq('id', id)
            .single();

        // Execute the query and return the data
        const { data, error } = await query;
        if (error) {
            return {
                data: {
                    paytype: '',
                    site_id: '',
                    biller_id: '',
                    parameters: []
                },
                error: error
            };
        }
        return {
            error: null,
            data: data
        };
    }
);

export interface ConnectionOption {
    id: string
    account_number: string
    site_id: string
}
