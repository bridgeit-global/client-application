import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get the authenticated user making the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    // Only allow users to revoke their own sessions
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden: Can only revoke own sessions' }, { status: 403 });
    }

    // Use admin client to revoke all sessions for the user
    const adminClient = createAdminClient();
    
    // Sign out the user globally - this revokes all refresh tokens
    const { error: signOutError } = await adminClient.auth.admin.signOut(userId, 'global');

    if (signOutError) {
      console.error('Error revoking sessions:', signOutError);
      return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'All previous sessions revoked successfully',
      userId
    });

  } catch (error) {
    console.error('Error in revoke-sessions endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
