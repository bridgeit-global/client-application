import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

const accountLinks = [
    {
        title: 'Report Issue',
        description: 'Create a support request or bug report.',
        href: '/portal/report-issue',
        adminOnly: false,
    },
    {
        title: 'Profile',
        description: 'View and edit your personal details.',
        href: '/portal/user-profile',
        adminOnly: false,
    },
    {
        title: 'User',
        description: 'Manage users in your organization (admin only).',
        href: '/portal/user',
        adminOnly: true,
    },
    {
        title: 'API Clients',
        description: 'Generate client credentials for integrations (admin only).',
        href: '/portal/accounts/api-clients',
        adminOnly: true,
    },
    {
        title: 'Site types & zone IDs',
        description: 'Configure site types and zone IDs for your organization (admin only).',
        href: '/portal/accounts/site-zone-config',
        adminOnly: true,
    },
];

export default async function AccountsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.role === 'admin';
    const visibleLinks = accountLinks.filter((link) => !link.adminOnly || isAdmin);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                        Manage your profile, user access, and integration credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {visibleLinks.map((link) => (
                        <Card key={link.href} className="border border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">{link.title}</CardTitle>
                                <CardDescription>{link.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline">
                                    <Link href={link.href}>Open</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
