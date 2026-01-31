'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

type ApiClientRow = {
    id: string;
    client_secret: string;
    org_id: string;
    role: string | null;
    scopes: string[] | null;
    is_active: boolean | null;
    created_at: string | null;
};

const generateToken = (byteLength: number) => {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const generateClientId = () => {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return generateToken(16);
};

const generateClientSecret = () => generateToken(32);

function ApiClientsPanel() {
    const supabase = createClient();
    const { toast } = useToast();
    const [clients, setClients] = useState<ApiClientRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                throw userError;
            }

            const role = user?.user_metadata?.role;
            const orgId = user?.user_metadata?.org_id;
            setIsAdmin(role === 'admin');

            if (!orgId) {
                setClients([]);
                return;
            }

            const { data, error } = await supabase
                .from('api_clients')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setClients((data as ApiClientRow[]) ?? []);
        } catch (error: any) {
            toast({
                title: 'Unable to load API clients',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (isGenerating) {
            return;
        }

        setIsGenerating(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                throw userError;
            }

            const orgId = user?.user_metadata?.org_id;
            const role = user?.user_metadata?.role;

            if (role !== 'admin') {
                toast({
                    title: 'Not allowed',
                    description: 'Only admins can generate client credentials.',
                    variant: 'destructive',
                });
                return;
            }

            if (!orgId) {
                toast({
                    title: 'Organization not found',
                    description: 'Please contact support if this continues.',
                    variant: 'destructive',
                });
                return;
            }

            const payload = {
                id: generateClientId(),
                client_secret: generateClientSecret(),
                org_id: orgId,
            };

            const { data, error } = await supabase
                .from('api_clients')
                .insert(payload)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                setClients((prev) => [data as ApiClientRow, ...prev]);
                toast({
                    title: 'Client credentials created',
                    description: 'Store the client secret securely.',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Failed to generate credentials',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>API Clients</CardTitle>
                    <CardDescription>
                        Generate client credentials for integrations. Secrets are visible to admins only.
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={loadClients} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh
                    </Button>
                    {isAdmin && (
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Client ID & Secret
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client ID</TableHead>
                                <TableHead>Client Secret</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                        Loading credentials...
                                    </TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                        No client credentials yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono text-xs">{client.id}</TableCell>
                                        <TableCell className="font-mono text-xs break-all">{client.client_secret}</TableCell>
                                        <TableCell className="capitalize">{client.role ?? 'client'}</TableCell>
                                        <TableCell>
                                            <Badge variant={client.is_active ? 'secondary' : 'destructive'}>
                                                {client.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {client.created_at ? new Date(client.created_at).toLocaleString() : '--'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default ApiClientsPanel;
