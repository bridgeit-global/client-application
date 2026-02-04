import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth/magic link errors
  if (error) {
    console.error('Auth error:', error, errorDescription);
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
    // This works for both OAuth (Google SSO) and magic link (email) flows
    // Supabase magic links redirect with a 'code' parameter that can be exchanged the same way
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'session_error');
      loginUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.user) {
      console.error('No user data after auth exchange');
      return NextResponse.redirect(new URL('/login', requestUrl.origin).toString());
    }

    // Ensure user has an email (required for access)
    if (!data.user.email) {
      console.error('User authenticated but has no email');
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'no_email');
      loginUrl.searchParams.set('error_description', 'Your account must have an email address to access the application.');
      return NextResponse.redirect(loginUrl.toString());
    }

    // Check if user has an organization
    const userOrgId = data.user.user_metadata?.org_id;
    const isOperator = data.user.user_metadata?.role === 'operator';

    // If user doesn't have an org_id and is not an operator, redirect to no-organization page
    if (!userOrgId && !isOperator) {
      console.log('User without organization, redirecting to no-organization page');
      return NextResponse.redirect(new URL('/no-organization', requestUrl.origin).toString());
    }

    // User has org_id, check if they need to complete profile
    // For Google OAuth users, first_name and last_name might be in user_metadata or from Google
    const hasProfile = data.user.user_metadata?.first_name || data.user.user_metadata?.last_name;
    
    // Redirect based on role and profile completion
    if (isOperator) {
      return NextResponse.redirect(new URL('/portal/meter-reading-list', requestUrl.origin).toString());
    } else if (!hasProfile && !isOperator) {
      // New user needs to complete profile - but they have org, so go to dashboard
      // The dashboard or middleware will handle profile completion if needed
      return NextResponse.redirect(new URL('/portal/dashboard', requestUrl.origin).toString());
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