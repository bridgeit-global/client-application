'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';

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
    const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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

    const handleDelete = async (clientId: string) => {
        if (deletingIds.has(clientId)) {
            return;
        }

        if (!confirm('Are you sure you want to delete this client credential? This action cannot be undone.')) {
            return;
        }

        setDeletingIds((prev) => new Set(prev).add(clientId));
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                throw userError;
            }

            const role = user?.user_metadata?.role;

            if (role !== 'admin') {
                toast({
                    title: 'Not allowed',
                    description: 'Only admins can delete client credentials.',
                    variant: 'destructive',
                });
                return;
            }

            const { error } = await supabase
                .from('api_clients')
                .delete()
                .eq('id', clientId);

            if (error) {
                throw error;
            }

            setClients((prev) => prev.filter((client) => client.id !== clientId));
            setVisibleSecrets((prev) => {
                const next = new Set(prev);
                next.delete(clientId);
                return next;
            });
            toast({
                title: 'Client credential deleted',
                description: 'The client credential has been removed.',
            });
        } catch (error: any) {
            toast({
                title: 'Failed to delete credential',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(clientId);
                return next;
            });
        }
    };

    const toggleSecretVisibility = (clientId: string) => {
        setVisibleSecrets((prev) => {
            const next = new Set(prev);
            if (next.has(clientId)) {
                next.delete(clientId);
            } else {
                next.add(clientId);
            }
            return next;
        });
    };

    const maskSecret = (secret: string, isVisible: boolean) => {
        if (isVisible) {
            return secret;
        }
        return '•'.repeat(Math.min(secret.length, 32));
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
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client ID</TableHead>
                                <TableHead>Client Secret</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-sm text-muted-foreground">
                                        Loading credentials...
                                    </TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-sm text-muted-foreground">
                                        No client credentials yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => {
                                    const isSecretVisible = visibleSecrets.has(client.id);
                                    return (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-mono text-xs">{client.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs break-all">
                                                        {maskSecret(client.client_secret, isSecretVisible)}
                                                    </span>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => toggleSecretVisibility(client.id)}
                                                        >
                                                            {isSecretVisible ? (
                                                                <EyeOff className="h-3 w-3" />
                                                            ) : (
                                                                <Eye className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{client.role ?? 'client'}</TableCell>
                                            <TableCell>
                                                <Badge variant={client.is_active ? 'secondary' : 'destructive'}>
                                                    {client.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {client.created_at ? new Date(client.created_at).toLocaleString() : '--'}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(client.id)}
                                                        disabled={deletingIds.has(client.id)}
                                                    >
                                                        {deletingIds.has(client.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {isLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Loading credentials...
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No client credentials yet.
                        </div>
                    ) : (
                        clients.map((client) => {
                            const isSecretVisible = visibleSecrets.has(client.id);
                            return (
                                <div key={client.id} className="rounded-lg border p-4 space-y-3">
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Client ID</div>
                                            <div className="font-mono text-xs break-all">{client.id}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Client Secret</div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-mono text-xs break-all flex-1">
                                                    {maskSecret(client.client_secret, isSecretVisible)}
                                                </div>
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => toggleSecretVisibility(client.id)}
                                                    >
                                                        {isSecretVisible ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Role</div>
                                            <div className="text-sm capitalize">{client.role ?? 'client'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                                            <Badge variant={client.is_active ? 'secondary' : 'destructive'}>
                                                {client.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Created</div>
                                            <div className="text-xs text-muted-foreground">
                                                {client.created_at ? new Date(client.created_at).toLocaleString() : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="pt-2 border-t">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleDelete(client.id)}
                                                disabled={deletingIds.has(client.id)}
                                            >
                                                {deletingIds.has(client.id) ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Credential
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default ApiClientsPanel;
