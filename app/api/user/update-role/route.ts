import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
    try {
        const supabase = createClient();

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
        const { userId, newRole } = body;

        if (!userId || !newRole) {
            return NextResponse.json({ error: 'Missing required fields: userId, newRole' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['admin', 'user', 'operator'];
        if (!validRoles.includes(newRole)) {
            return NextResponse.json({ error: 'Invalid role. Must be one of: admin, user, operator' }, { status: 400 });
        }

        // Use admin client to update user metadata
        const adminClient = createAdminClient();
        const { data: targetUser, error: getUserError } = await adminClient.auth.admin.getUserById(userId);

        if (getUserError || !targetUser) {
            console.error('Error fetching user:', getUserError);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user metadata with new role
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            userId,
            {
                user_metadata: {
                    ...targetUser.user.user_metadata,
                    role: newRole
                }
            }
        );

        if (updateError) {
            console.error('Error updating user role:', updateError);
            return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
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
