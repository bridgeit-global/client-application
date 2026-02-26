import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';

const RATING_VALUES = ['up', 'down'] as const;
const MAX_ASSISTANT_TEXT_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = (user.user_metadata as Record<string, unknown>)?.org_id as
    | string
    | undefined;

  if (!orgId) {
    return NextResponse.json(
      { error: 'Your account has no associated organization.' },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      message_id?: string;
      rating?: string;
      user_query?: string;
      assistant_text?: string;
    };

    const { message_id, rating, user_query, assistant_text } = body;

    if (!message_id || typeof message_id !== 'string' || !message_id.trim()) {
      return NextResponse.json(
        { error: 'message_id is required' },
        { status: 400 }
      );
    }

    if (
      !rating ||
      typeof rating !== 'string' ||
      !RATING_VALUES.includes(rating as (typeof RATING_VALUES)[number])
    ) {
      return NextResponse.json(
        { error: 'rating must be "up" or "down"' },
        { status: 400 }
      );
    }

    const truncatedAssistant =
      typeof assistant_text === 'string'
        ? assistant_text.slice(0, MAX_ASSISTANT_TEXT_LENGTH)
        : null;
    const userQuery =
      typeof user_query === 'string' ? user_query : null;

    const row = {
      org_id: orgId,
      user_id: user.id,
      message_id: message_id.trim(),
      rating: rating as 'up' | 'down',
      user_query: userQuery,
      assistant_text: truncatedAssistant
    };

    const { error } = await supabase.from('ai_analyst_feedback').upsert(row, {
      onConflict: 'message_id',
      ignoreDuplicates: false
    });

    if (error) {
      console.error('Feedback DB error:', error.code, error.message, error.details);
      const handled = handleDatabaseError(error);
      // 42P01 = undefined_table — migration not run yet
      const isMissingTable = error.code === '42P01';
      return NextResponse.json(
        {
          error: isMissingTable
            ? 'Feedback storage is not set up yet. Please run the ai_analyst_feedback migration.'
            : handled.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error in /api/chat/analyst/feedback:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
