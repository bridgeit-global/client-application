'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Trash2, Pencil } from 'lucide-react';

type OrgMasterRow = {
    org_id: string;
    type: string;
    value: string;
    name: string | null;
    created_at: string;
    updated_at: string | null;
};

type ConfigSection = 'site_type' | 'zone_id';

function SiteZoneConfigPanel() {
    const supabase = createClient();
    const { toast } = useToast();
    const [siteTypes, setSiteTypes] = useState<OrgMasterRow[]>([]);
    const [zoneIds, setZoneIds] = useState<OrgMasterRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [orgId, setOrgId] = useState<string | null>(null);

    // Add form state: section, value, name
    const [addValue, setAddValue] = useState({ site_type: '', zone_id: '' });
    const [addName, setAddName] = useState({ site_type: '', zone_id: '' });
    const [adding, setAdding] = useState<ConfigSection | null>(null);

    // Edit state: which row is being edited (key = type+value), and draft { value, name }
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState({ value: '', name: '' });
    const [saving, setSaving] = useState(false);
    const [deletingValue, setDeletingValue] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const id = user?.user_metadata?.org_id;
            if (!id) {
                setSiteTypes([]);
                setZoneIds([]);
                setOrgId(null);
                return;
            }
            setOrgId(id);

            const { data, error } = await supabase
                .from('org_master')
                .select('*')
                .eq('org_id', id)
                .in('type', ['site_type', 'zone_id'])
                .order('type')
                .order('value');

            if (error) throw error;

            const rows = (data as OrgMasterRow[]) ?? [];
            setSiteTypes(rows.filter((r) => r.type === 'site_type'));
            setZoneIds(rows.filter((r) => r.type === 'zone_id'));
        } catch (error: any) {
            toast({
                title: 'Unable to load configuration',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async (section: ConfigSection) => {
        if (!orgId) return;
        const value = section === 'site_type' ? addValue.site_type.trim() : addValue.zone_id.trim();
        const name = section === 'site_type' ? addName.site_type.trim() : addName.zone_id.trim();
        if (!value || !name) {
            toast({
                title: 'Validation error',
                description: 'Value and display name are required.',
                variant: 'destructive',
            });
            return;
        }

        setAdding(section);
        try {
            const existing = section === 'site_type' ? siteTypes : zoneIds;
            if (existing.some((r) => r.value === value)) {
                toast({
                    title: 'Duplicate value',
                    description: 'This value already exists.',
                    variant: 'destructive',
                });
                return;
            }

            const { error } = await supabase.from('org_master').insert({
                org_id: orgId,
                type: section,
                value,
                name,
            });

            if (error) throw error;

            if (section === 'site_type') {
                setAddValue((prev) => ({ ...prev, site_type: '' }));
                setAddName((prev) => ({ ...prev, site_type: '' }));
                setSiteTypes((prev) => [...prev, { org_id: orgId, type: 'site_type', value, name, created_at: new Date().toISOString(), updated_at: null }]);
            } else {
                setAddValue((prev) => ({ ...prev, zone_id: '' }));
                setAddName((prev) => ({ ...prev, zone_id: '' }));
                setZoneIds((prev) => [...prev, { org_id: orgId, type: 'zone_id', value, name, created_at: new Date().toISOString(), updated_at: null }]);
            }
            toast({
                title: section === 'site_type' ? 'Site type added' : 'Zone ID added',
                description: 'Configuration updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Failed to save',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setAdding(null);
        }
    };

    const startEdit = (row: OrgMasterRow) => {
        setEditingKey(`${row.type}:${row.value}`);
        setEditDraft({ value: row.value, name: row.name ?? '' });
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditDraft({ value: '', name: '' });
    };

    const saveEdit = async (row: OrgMasterRow) => {
        if (!orgId) return;
        const key = `${row.type}:${row.value}`;
        if (editingKey !== key) return;

        const { value: newValue, name: newName } = editDraft;
        if (!newValue.trim() || !newName.trim()) {
            toast({
                title: 'Validation error',
                description: 'Value and display name are required.',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            const list = row.type === 'site_type' ? siteTypes : zoneIds;
            const duplicate = list.some((r) => r.value === newValue && r.value !== row.value);
            if (duplicate) {
                toast({
                    title: 'Duplicate value',
                    description: 'This value already exists.',
                    variant: 'destructive',
                });
                return;
            }

            if (newValue === row.value) {
                const { error } = await supabase
                    .from('org_master')
                    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
                    .eq('org_id', orgId)
                    .eq('type', row.type)
                    .eq('value', row.value);

                if (error) throw error;

                if (row.type === 'site_type') {
                    setSiteTypes((prev) => prev.map((r) => (r.value === row.value ? { ...r, name: newName.trim(), updated_at: new Date().toISOString() } : r)));
                } else {
                    setZoneIds((prev) => prev.map((r) => (r.value === row.value ? { ...r, name: newName.trim(), updated_at: new Date().toISOString() } : r)));
                }
            } else {
                const { error: delError } = await supabase
                    .from('org_master')
                    .delete()
                    .eq('org_id', orgId)
                    .eq('type', row.type)
                    .eq('value', row.value);
                if (delError) throw delError;

                const { error: insError } = await supabase.from('org_master').insert({
                    org_id: orgId,
                    type: row.type,
                    value: newValue.trim(),
                    name: newName.trim(),
                });
                if (insError) throw insError;

                if (row.type === 'site_type') {
                    setSiteTypes((prev) => prev.filter((r) => r.value !== row.value).concat([{ org_id: orgId, type: 'site_type', value: newValue.trim(), name: newName.trim(), created_at: new Date().toISOString(), updated_at: null }]));
                } else {
                    setZoneIds((prev) => prev.filter((r) => r.value !== row.value).concat([{ org_id: orgId, type: 'zone_id', value: newValue.trim(), name: newName.trim(), created_at: new Date().toISOString(), updated_at: null }]));
                }
            }

            toast({
                title: 'Updated',
                description: 'Configuration saved.',
            });
            setEditingKey(null);
        } catch (error: any) {
            toast({
                title: 'Failed to save',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row: OrgMasterRow) => {
        if (!orgId) return;
        if (!confirm(`Remove "${row.name ?? row.value}"? This cannot be undone.`)) return;

        setDeletingValue(row.value);
        try {
            const { error } = await supabase
                .from('org_master')
                .delete()
                .eq('org_id', orgId)
                .eq('type', row.type)
                .eq('value', row.value);

            if (error) throw error;

            if (row.type === 'site_type') {
                setSiteTypes((prev) => prev.filter((r) => r.value !== row.value));
            } else {
                setZoneIds((prev) => prev.filter((r) => r.value !== row.value));
            }
            if (editingKey === `${row.type}:${row.value}`) setEditingKey(null);
            toast({
                title: 'Removed',
                description: 'Configuration updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Failed to delete',
                description: error?.message ?? 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setDeletingValue(null);
        }
    };

    const renderSection = (
        title: string,
        type: ConfigSection,
        rows: OrgMasterRow[],
        addValueKey: 'site_type' | 'zone_id',
        addNameKey: 'site_type' | 'zone_id'
    ) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Add, edit, or remove entries. Value is the stored code; name is the display label.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor={`value-${type}`}>Value</Label>
                        <Input
                            id={`value-${type}`}
                            placeholder="e.g. COCO"
                            value={type === 'site_type' ? addValue.site_type : addValue.zone_id}
                            onChange={(e) => setAddValue((prev) => ({ ...prev, [addValueKey]: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`name-${type}`}>Display name</Label>
                        <Input
                            id={`name-${type}`}
                            placeholder="e.g. Company Owned Company Operated"
                            value={type === 'site_type' ? addName.site_type : addName.zone_id}
                            onChange={(e) => setAddName((prev) => ({ ...prev, [addNameKey]: e.target.value }))}
                        />
                    </div>
                    <Button
                        onClick={() => handleAdd(type)}
                        disabled={adding !== null}
                    >
                        {adding === type ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No entries yet. Add one above.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Value</TableHead>
                                <TableHead>Display name</TableHead>
                                <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => {
                                const key = `${row.type}:${row.value}`;
                                const isEditing = editingKey === key;
                                return (
                                    <TableRow key={key}>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    value={editDraft.value}
                                                    onChange={(e) => setEditDraft((prev) => ({ ...prev, value: e.target.value }))}
                                                    className="h-8"
                                                />
                                            ) : (
                                                row.value
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    value={editDraft.name}
                                                    onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                                                    className="h-8"
                                                />
                                            ) : (
                                                row.name ?? '—'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="default" onClick={() => saveEdit(row)} disabled={saving}>
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" onClick={() => startEdit(row)} title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(row)}
                                                        disabled={deletingValue !== null}
                                                        title="Delete"
                                                    >
                                                        {deletingValue === row.value ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Site types & zone IDs</CardTitle>
                        <CardDescription>
                            Configure site types and zone IDs for your organization. These are used across the portal for filters and labels.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </CardHeader>
            </Card>

            {renderSection('Site types', 'site_type', siteTypes, 'site_type', 'site_type')}
            {renderSection('Zone IDs', 'zone_id', zoneIds, 'zone_id', 'zone_id')}
        </div>
    );
}

export default SiteZoneConfigPanel;
