import { SearchParamsProps } from '@/types';
import { UserTable } from '@/components/tables/user/user-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchAllUsers } from '@/services/user';

export default async function Page(
    props: {
        searchParams: Promise<SearchParamsProps>;
    }
) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.user_metadata?.role === 'admin') {
        try {
            const orgId = user?.user_metadata?.org_id;
            
            if (!orgId) {
                throw new Error('Organization ID not found');
            }

            // Fetch all users from user_view
            // The view should be filtered by RLS policies to only show users from the current org
            const { data: allUsers, error: fetchError } = await fetchAllUsers({
                ...searchParams,
                org_id: orgId
            });

            if (fetchError) {
                throw fetchError;
            }

            if (!allUsers || allUsers.length === 0) {
                return (
                    <div id="sites">
                        <UserTable users={[]} />
                    </div>
                );
            }

            // Map users from user_view to UserTable format
            // RLS policies on user_view should ensure only users from the current org are returned
            const modifiedUsers = allUsers.map((viewUser: any) => {
                const phone = viewUser.phone_no?.replace('+91', '') || '';
                return {
                    phone: phone,
                    verified: true,
                    first_name: viewUser.first_name || '',
                    last_name: viewUser.last_name || '',
                    email: viewUser.email || '',
                    role: viewUser.role || 'user',
                    user: {
                        id: viewUser.id,
                        first_name: viewUser.first_name || '',
                        last_name: viewUser.last_name || '',
                        email: viewUser.email || '',
                        phone_no: viewUser.phone_no || '',
                        role: viewUser.role || 'user',
                        phone_confirmed_at: viewUser.phone_confirmed_at,
                        email_confirmed_at: viewUser.email_confirmed_at,
                        created_at: viewUser.created_at,
                        updated_at: viewUser.updated_at
                    }
                };
            });

            return (
                <div id="sites">
                    <UserTable users={modifiedUsers || []} />
                </div>
            );
        } catch (error) {
            console.error('Error fetching users:', error);
            return (
                <div className="p-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error instanceof Error ? error.message : 'An error occurred while fetching users. Please try again later.'}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }
    } else {
        redirect('/portal/dashboard');
    }
}
