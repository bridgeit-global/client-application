import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

const DEFAULT_SECTIONS = {
    summary: true,
    new_bills: true,
    abnormal_bills: true,
    active_bill_calendar: true,
    arrears_and_penalties: true,
    site_lag_alerts: true,
    low_balance_connections: true,
};

const VALID_SECTION_KEYS = Object.keys(DEFAULT_SECTIONS);

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgId = user.user_metadata?.org_id;
        if (!orgId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        // Try to fetch existing preferences
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching notification preferences:', error);
            return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
        }

        // Return existing or default shape (without auto-creating)
        if (data) {
            return NextResponse.json(data);
        }

        return NextResponse.json({
            id: null,
            user_id: user.id,
            org_id: orgId,
            enabled: true,
            frequency: 'daily',
            delivery_time: '08:00',
            delivery_day_of_week: null,
            delivery_day_of_month: null,
            sections: DEFAULT_SECTIONS,
        });
    } catch (error) {
        console.error('Error in GET /api/notifications/preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgId = user.user_metadata?.org_id;
        if (!orgId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const body = await req.json();
        const { enabled, frequency, delivery_time, delivery_day_of_week, delivery_day_of_month, sections } = body;

        // Validate frequency
        if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
            return NextResponse.json(
                { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
                { status: 400 },
            );
        }

        // Validate sections keys
        if (sections !== undefined) {
            const invalidKeys = Object.keys(sections).filter(k => !VALID_SECTION_KEYS.includes(k));
            if (invalidKeys.length > 0) {
                return NextResponse.json(
                    { error: `Invalid section keys: ${invalidKeys.join(', ')}` },
                    { status: 400 },
                );
            }
        }

        // Validate delivery_day_of_week for weekly
        if (frequency === 'weekly' && delivery_day_of_week !== undefined) {
            if (delivery_day_of_week < 1 || delivery_day_of_week > 7) {
                return NextResponse.json(
                    { error: 'delivery_day_of_week must be between 1 and 7' },
                    { status: 400 },
                );
            }
        }

        // Validate delivery_day_of_month for monthly
        if (frequency === 'monthly' && delivery_day_of_month !== undefined) {
            if (delivery_day_of_month < 1 || delivery_day_of_month > 28) {
                return NextResponse.json(
                    { error: 'delivery_day_of_month must be between 1 and 28' },
                    { status: 400 },
                );
            }
        }

        const upsertPayload = {
            user_id: user.id,
            org_id: orgId,
            enabled: enabled ?? true,
            frequency: frequency ?? 'daily',
            delivery_time: delivery_time ?? '08:00',
            delivery_day_of_week: frequency === 'weekly' ? (delivery_day_of_week ?? 1) : null,
            delivery_day_of_month: frequency === 'monthly' ? (delivery_day_of_month ?? 1) : null,
            sections: sections ? { ...DEFAULT_SECTIONS, ...sections } : DEFAULT_SECTIONS,
        };

        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert(upsertPayload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting notification preferences:', error);
            return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in PUT /api/notifications/preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
