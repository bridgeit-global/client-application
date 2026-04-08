'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Bell, BellOff } from 'lucide-react';

type Frequency = 'daily' | 'weekly' | 'monthly';

interface Sections {
    summary: boolean;
    new_bills: boolean;
    abnormal_bills: boolean;
    active_bill_calendar: boolean;
    arrears_and_penalties: boolean;
    site_lag_alerts: boolean;
    low_balance_connections: boolean;
}

interface Preferences {
    id: string | null;
    enabled: boolean;
    frequency: Frequency;
    delivery_time: string;
    delivery_day_of_week: number | null;
    delivery_day_of_month: number | null;
    sections: Sections;
}

const SECTION_META: { key: keyof Sections; label: string; description: string }[] = [
    {
        key: 'summary',
        label: 'Pipeline Summary',
        description: 'Total sites, connections, and bills generated since the last digest.',
    },
    {
        key: 'new_bills',
        label: 'New / Incremental Bills',
        description: 'Bills generated from the pipeline since the previous report period.',
    },
    {
        key: 'abnormal_bills',
        label: 'Abnormal Bills',
        description: 'Bills flagged as abnormal by amount, charges, or consumption.',
    },
    {
        key: 'active_bill_calendar',
        label: 'Active Bill Calendar',
        description: 'Upcoming bill due dates within the report window.',
    },
    {
        key: 'arrears_and_penalties',
        label: 'Arrears & Penalties',
        description: 'Outstanding arrears, LPSC, power factor penalty, sanctioned load penalty.',
    },
    {
        key: 'site_lag_alerts',
        label: 'Site Lag Alerts',
        description: 'Sites where bill fetching is overdue or lagging beyond threshold.',
    },
    {
        key: 'low_balance_connections',
        label: 'Low Balance Connections',
        description: 'Prepaid connections that need recharge attention.',
    },
];

const DAYS_OF_WEEK = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return { value: `${h}:00`, label: `${h}:00` };
});

export default function NotificationPreferencesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<Preferences>({
        id: null,
        enabled: true,
        frequency: 'daily',
        delivery_time: '08:00',
        delivery_day_of_week: 1,
        delivery_day_of_month: 1,
        sections: {
            summary: true,
            new_bills: true,
            abnormal_bills: true,
            active_bill_calendar: true,
            arrears_and_penalties: true,
            site_lag_alerts: true,
            low_balance_connections: true,
        },
    });

    const fetchPreferences = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/preferences');
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setPrefs({
                id: data.id,
                enabled: data.enabled,
                frequency: data.frequency,
                delivery_time: data.delivery_time ?? '08:00',
                delivery_day_of_week: data.delivery_day_of_week ?? 1,
                delivery_day_of_month: data.delivery_day_of_month ?? 1,
                sections: { ...prefs.sections, ...data.sections },
            });
        } catch {
            toast({ title: 'Error', description: 'Could not load notification preferences.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: prefs.enabled,
                    frequency: prefs.frequency,
                    delivery_time: prefs.delivery_time,
                    delivery_day_of_week: prefs.frequency === 'weekly' ? prefs.delivery_day_of_week : null,
                    delivery_day_of_month: prefs.frequency === 'monthly' ? prefs.delivery_day_of_month : null,
                    sections: prefs.sections,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Save failed');
            }

            const data = await res.json();
            setPrefs(prev => ({ ...prev, id: data.id }));
            toast({ title: 'Saved', description: 'Notification preferences updated.' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to save preferences.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const toggleSection = (key: keyof Sections) => {
        setPrefs(prev => ({
            ...prev,
            sections: { ...prev.sections, [key]: !prev.sections[key] },
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    Notification Preferences
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure email digest reports covering your billing pipeline activity.
                </p>
            </div>

            {/* Master toggle */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Email Notifications</CardTitle>
                            <CardDescription>
                                {prefs.enabled
                                    ? 'You will receive digest emails based on the schedule below.'
                                    : 'All email notifications are currently disabled.'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {prefs.enabled ? (
                                <Bell className="h-4 w-4 text-primary" />
                            ) : (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Switch
                                checked={prefs.enabled}
                                onCheckedChange={(checked) =>
                                    setPrefs(prev => ({ ...prev, enabled: checked }))
                                }
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {prefs.enabled && (
                <>
                    {/* Frequency & Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Delivery Schedule</CardTitle>
                            <CardDescription>
                                Choose how often and when you receive the digest.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Frequency */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Frequency</Label>
                                <RadioGroup
                                    value={prefs.frequency}
                                    onValueChange={(val) =>
                                        setPrefs(prev => ({ ...prev, frequency: val as Frequency }))
                                    }
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="daily" id="freq-daily" />
                                        <Label htmlFor="freq-daily" className="font-normal cursor-pointer">
                                            Daily
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="weekly" id="freq-weekly" />
                                        <Label htmlFor="freq-weekly" className="font-normal cursor-pointer">
                                            Weekly
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="monthly" id="freq-monthly" />
                                        <Label htmlFor="freq-monthly" className="font-normal cursor-pointer">
                                            Monthly
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Delivery time */}
                                <div className="space-y-1.5">
                                    <Label>Delivery Time</Label>
                                    <Select
                                        value={prefs.delivery_time}
                                        onValueChange={(val) =>
                                            setPrefs(prev => ({ ...prev, delivery_time: val }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HOURS.map(h => (
                                                <SelectItem key={h.value} value={h.value}>
                                                    {h.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Day of week (weekly only) */}
                                {prefs.frequency === 'weekly' && (
                                    <div className="space-y-1.5">
                                        <Label>Day of Week</Label>
                                        <Select
                                            value={String(prefs.delivery_day_of_week ?? 1)}
                                            onValueChange={(val) =>
                                                setPrefs(prev => ({
                                                    ...prev,
                                                    delivery_day_of_week: parseInt(val, 10),
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS_OF_WEEK.map(d => (
                                                    <SelectItem key={d.value} value={d.value}>
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Day of month (monthly only) */}
                                {prefs.frequency === 'monthly' && (
                                    <div className="space-y-1.5">
                                        <Label>Day of Month</Label>
                                        <Select
                                            value={String(prefs.delivery_day_of_month ?? 1)}
                                            onValueChange={(val) =>
                                                setPrefs(prev => ({
                                                    ...prev,
                                                    delivery_day_of_month: parseInt(val, 10),
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 28 }, (_, i) => (
                                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                                        {i + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report sections */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Report Sections</CardTitle>
                            <CardDescription>
                                Toggle the sections included in your digest email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {SECTION_META.map((section, idx) => (
                                <div key={section.key}>
                                    <div className="flex items-center justify-between py-3">
                                        <div className="space-y-0.5 pr-4">
                                            <Label className="text-sm font-medium">
                                                {section.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {section.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={prefs.sections[section.key]}
                                            onCheckedChange={() => toggleSection(section.key)}
                                        />
                                    </div>
                                    {idx < SECTION_META.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Save button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
