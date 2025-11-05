import { SearchParamsProps } from '@/types';
import { fetchAllUsers } from '@/services/user';
import { UserTable } from '@/components/tables/user/user-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page({
    searchParams
}: {
    searchParams: SearchParamsProps;
}) {
    const supabase = createClient();
    const supabasePublic = createPublicClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.user_metadata?.role === 'admin') {
        try {
            const { data } = await fetchAllUsers(searchParams);
            const { data: users } = await supabasePublic.from('user_requests').select('*').eq('org_id', user?.user_metadata?.org_id);
            const modifiedUsers = users?.map((user: any) => ({
                ...user,
                verified: data.some((item: any) => '+' + item.phone_no === "+91" + user.phone),
                user: data.some((item: any) => '+' + item.phone_no === "+91" + user.phone) ? data.find((item: any) => '+' + item.phone_no === "+91" + user.phone) : user
            })).sort((a: any, b: any) => {
                return (a.verified === b.verified) ? 0 : a.verified ? 1 : -1;
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
