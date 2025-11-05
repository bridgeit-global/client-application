import { OrganizationProps } from "@/types/organization-type";
import { createClient } from "@/lib/supabase/server";

export const fetchOrganization = async (): Promise<OrganizationProps> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('organizations').select('*').eq('id', user?.user_metadata?.org_id).single();
    if (error) {
        throw error;
    }
    return data;
};