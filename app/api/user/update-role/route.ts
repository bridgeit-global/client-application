import { createClient, createPublicClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
    try {
        const supabase = createClient();
        const supabasePublic = createPublicClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if (user.user_metadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, newRole, phone } = body;

        if (!userId || !newRole || !phone) {
            return NextResponse.json({ error: 'Missing required fields: userId, newRole, phone' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['admin', 'user', 'operator'];
        if (!validRoles.includes(newRole)) {
            return NextResponse.json({ error: 'Invalid role. Must be one of: admin, user, operator' }, { status: 400 });
        }

        // Update role in user_requests table
        const { error: updateRequestError } = await supabasePublic
            .from('user_requests')
            .update({ role: newRole })
            .eq('phone', phone.replace('+91', ''))
            .eq('org_id', user.user_metadata?.org_id);

        if (updateRequestError) {
            console.error('Error updating role in user_requests:', updateRequestError);
            return NextResponse.json({ error: 'Failed to update user role in database' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User role updated successfully',
            userId,
            newRole
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
