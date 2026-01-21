import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'oauth_error');
    loginUrl.searchParams.set('error_description', errorDescription || error);
    return NextResponse.redirect(loginUrl.toString());
  }

  // If no code, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin).toString());
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'session_error');
      loginUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.user) {
      console.error('No user data after OAuth exchange');
      return NextResponse.redirect(new URL('/login', requestUrl.origin).toString());
    }

    // Determine redirect based on user role
    // Check if user is an operator
    const isOperator = data.user.user_metadata?.role === 'operator';
    
    // Redirect based on role
    if (isOperator) {
      return NextResponse.redirect(new URL('/portal/meter-reading-list', requestUrl.origin).toString());
    } else {
      return NextResponse.redirect(new URL('/portal/dashboard', requestUrl.origin).toString());
    }
  } catch (error: any) {
    console.error('Unexpected error in OAuth callback:', error);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'unexpected_error');
    loginUrl.searchParams.set('error_description', error?.message || 'An unexpected error occurred');
    return NextResponse.redirect(loginUrl.toString());
  }
}