# Google SSO Setup Guide

This guide walks you through configuring Google OAuth sign-in with Supabase for the BridgeIT application.

## Overview

Google SSO allows users to sign in using their Google account. The implementation automatically links Google accounts to existing users if they have the same email address, enabling seamless authentication across both phone OTP and Google sign-in methods.

## Prerequisites

- Access to Supabase Dashboard
- Access to Google Cloud Console
- Google account with appropriate permissions

## Step 1: Google Cloud Console Configuration

### 1.1 Create OAuth 2.0 Credentials

1. **Navigate to Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Select your project or create a new one

2. **Enable Google+ API (if not already enabled)**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Alternatively, use "Google Identity Services" (newer approach)

3. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application" as the application type
   - Name it (e.g., "BridgeIT OAuth Client")

4. **Configure Authorized Redirect URIs**
   Add these redirect URIs:
   ```
   https://api.bridgeit.in/auth/v1/callback
   ```
   
   **Important**: This is Supabase's callback URL, not your application's callback URL. Supabase handles the OAuth flow and then redirects to your application.

   **Optional for development**: If you need localhost support, add:
   ```
   http://localhost:3000/api/auth/callback
   ```

5. **Save Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Keep these secure - you'll need them for Supabase configuration

## Step 2: Supabase Dashboard Configuration

### 2.1 Enable Google Provider

1. **Navigate to Authentication Settings**
   - Open your Supabase Dashboard
   - Go to "Authentication" > "Providers"

2. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Toggle it to "Enabled"

3. **Enter OAuth Credentials**
   - Paste the **Client ID** from Google Cloud Console
   - Paste the **Client Secret** from Google Cloud Console
   - Click "Save"

### 2.2 Configure Provider Settings

**Critical Settings for Account Linking:**

1. **Email Confirmation**
   - Set "Confirm email" to **OFF**
   - This allows automatic account linking for existing users
   - Without this, users with existing accounts won't be able to link

2. **Additional Settings (Recommended)**
   - "Skip nonce check" - Keep as default (usually OFF for security)
   - "Authorized client IDs" - Leave empty (allows all Google clients)

### 2.3 Verify Site URL

1. **Go to Authentication > URL Configuration**
   - Ensure "Site URL" is set to your production domain
   - For development: Add `http://localhost:3000` to "Redirect URLs"

2. **Add Redirect URLs**
   - Add: `https://yourdomain.com/api/auth/callback`
   - Add: `http://localhost:3000/api/auth/callback` (for development)

### 2.4 Enable Account Linking (Important)

1. **Navigate to Authentication > Settings**
   - Find "Enable manual linking" or "Account linking"
   - Enable this option
   - This allows Supabase to automatically link OAuth accounts with existing email-based accounts

## Step 3: Verify Configuration

### 3.1 Test the Flow

1. **Start your development server**
   ```bash
   pnpm dev
   ```

2. **Navigate to login page**
   - Go to `http://localhost:3000/login`

3. **Click "Continue with Google"**
   - You should be redirected to Google's sign-in page
   - After authentication, you should return to your application

### 3.2 Common Issues

**Issue: "redirect_uri_mismatch"**
- **Solution**: Verify the redirect URI in Google Cloud Console matches exactly: `https://api.bridgeit.in/auth/v1/callback`

**Issue: Account not linking for existing users**
- **Solution**: 
  - Verify "Confirm email" is set to OFF in Supabase
  - Check that "Enable manual linking" is ON in Supabase settings
  - Ensure the email address matches exactly (case-sensitive)

**Issue: "Invalid client" error**
- **Solution**: 
  - Verify Client ID and Client Secret are correct in Supabase
  - Check that OAuth consent screen is configured in Google Cloud Console

**Issue: Callback not working**
- **Solution**:
  - Verify middleware allows `/api/auth/callback` route
  - Check that the callback route exists at `app/api/auth/callback/route.ts`
  - Ensure environment variables are set correctly

## Step 4: Production Deployment

### 4.1 Update Redirect URLs

Before deploying to production:

1. **Update Google Cloud Console**
   - Add production redirect URI: `https://yourdomain.com/api/auth/callback`

2. **Update Supabase Settings**
   - Add production redirect URL to allowed URLs
   - Update Site URL to production domain

### 4.2 Environment Variables

Ensure these are set in your production environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

No additional environment variables are needed - all OAuth credentials are stored in Supabase.

## How It Works

### Authentication Flow

1. User clicks "Continue with Google" on login page
2. Application calls `supabase.auth.signInWithOAuth()` with Google provider
3. User is redirected to Google OAuth consent screen
4. After authentication, Google redirects to Supabase callback: `https://api.bridgeit.in/auth/v1/callback`
5. Supabase processes the OAuth flow and links accounts (if email matches)
6. Supabase redirects to your application callback: `/api/auth/callback`
7. Your callback handler exchanges the code for a session
8. **New User Flow**: If user doesn't have `org_id` in metadata, redirect to `/signup` to create organization
9. **Existing User Flow**: If user has `org_id`, redirect to appropriate dashboard based on role

### Account Linking

Supabase automatically links OAuth accounts when:
- Email from Google matches an existing user's email
- "Confirm email" is disabled (allows automatic linking)
- Account linking is enabled in Supabase settings

Users can then sign in using either:
- Phone OTP (original method)
- Google OAuth (new method)

Both methods access the same account if the email matches.

### New User Organization Setup

When a new user signs in with Google SSO for the first time:

1. **OAuth Callback Check**: The callback handler checks if `user.user_metadata.org_id` exists
2. **Redirect to Signup**: If no `org_id`, user is redirected to `/signup` with email pre-filled
3. **Organization Creation**: User completes the signup form with:
   - Contact information (name, email, phone)
   - Company details (name, PAN, GST, CIN)
   - Business information (type, locations, monthly bill)
4. **External Processing**: Form submission creates a `contact_request` record
5. **Admin Approval**: Admin reviews and approves the request via external API
6. **Organization Setup**: Upon approval:
   - Organization is created in `organizations` table
   - User metadata is updated with `org_id`
   - Default site types are configured in `org_master` table
   - User receives onboarding email

### Site Types Configuration

Site types are organization-specific and stored in the `org_master` table:

**Default Site Types** (if none configured):
- COCO (Company Owned, Company Operated)
- POPO (Partner Owned, Partner Operated)
- COPO (Company Owned, Partner Operated)
- POCO (Partner Owned, Company Operated)
- Warehouse

**Custom Site Types**:
Organizations can have custom site types configured by admin during organization setup. These are stored as:
```
org_master {
  org_id: <organization_id>
  type: 'site_type'
  value: <site_type_code>
  name: <display_name>
}
```

The application automatically uses custom site types if configured, otherwise falls back to default types.

## Security Considerations

1. **OAuth Credentials**: Never commit Client ID/Secret to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Handling**: All OAuth tokens are handled server-side by Supabase
4. **Session Management**: Sessions are managed securely via httpOnly cookies
5. **CSP Headers**: Content Security Policy headers are configured to allow necessary OAuth domains

## Troubleshooting

### Debug Mode

To see detailed OAuth errors:

1. Check browser console for client-side errors
2. Check server logs for callback route errors
3. Use Supabase Dashboard > Authentication > Logs to see auth events

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | Redirect URI not in Google Console | Add exact URI to authorized redirects |
| `invalid_client` | Wrong Client ID/Secret | Verify credentials in Supabase |
| `access_denied` | User cancelled OAuth | Normal - user chose not to sign in |
| `session_error` | Code exchange failed | Check Supabase configuration |

## Support

For additional help:
- Supabase Documentation: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2