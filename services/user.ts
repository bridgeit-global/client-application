import { createClient } from "@/lib/supabase/server";
import { convertKeysToTitleCase } from "@/lib/utils/string-format";
import { SearchParamsProps } from "@/types";
import { UserTableProps } from "@/types/user-type";
import { cache } from "react";
import { handleDatabaseError } from "@/lib/utils/supabase-error";

export type Result<T> = {
    data: T[];
    totalCount: number;
    pageCount: number;
    export_data?: SearchParamsProps[];
    error?: Error;
}

export const fetchAllUsers = cache(
    async (
        options?: { is_export?: boolean; pay_type?: number }
    ): Promise<Result<UserTableProps>> => {
        const supabase = createClient();
        let query = supabase
            .from('user_view')
            .select(`*`, { count: 'estimated' })
            .not('email_confirmed_at', 'is', null)
            .not('phone_confirmed_at', 'is', null)

        if (options?.is_export) {
            const { data, error } = await query;
            if (error) {
                const handledError = handleDatabaseError(error);
                return {
                    data: [],
                    totalCount: 0,
                    pageCount: 0,
                    error: new Error(handledError.message)
                };
            }

            return {
                data: [],
                export_data: convertKeysToTitleCase(data),
                totalCount: 0,
                pageCount: 0
            };
        }

        const { data, error } = await query;
        if (error) {
            const handledError = handleDatabaseError(error);
            return {
                data: [],
                totalCount: 0,
                pageCount: 0,
                error: new Error(handledError.message)
            };
        }
        return {
            data: data,
            totalCount: 0,
            pageCount: 0
        };
    }
);