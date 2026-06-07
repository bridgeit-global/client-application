'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';

/**
 * UserInitializer Component
 * 
 * This component initializes the user store with fresh data from Supabase
 * on app mount/page reload. It ensures the user object has the correct
 * structure including user_metadata.org_id which is required by other hooks.
 */
export function UserInitializer() {
    const { user, setUser, setOrganization } = useUserStore();

    useEffect(() => {
        const initializeUser = async () => {
            console.log('🔄 UserInitializer: Checking user authentication...');
            
            const supabase = createClient();
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

            if (error) {
                console.error('❌ UserInitializer: Error fetching user:', error);
                return;
            }

            if (!supabaseUser) {
                console.log('⚠️ UserInitializer: No authenticated user found');
                return;
            }

            console.log('👤 UserInitializer: Supabase user:', supabaseUser);
            console.log('🏢 UserInitializer: org_id:', supabaseUser.user_metadata?.org_id);

            // Always update the user store with fresh data if:
            // 1. User store is empty
            // 2. User store doesn't have user_metadata
            // 3. User IDs don't match (different user logged in)
            const shouldUpdateUser = 
                !user || 
                Object.keys(user).length === 0 || 
                !user.user_metadata || 
                user.id !== supabaseUser.id;

            if (shouldUpdateUser) {
                console.log('✅ UserInitializer: Updating user store with fresh data');
                setUser(supabaseUser);
            } else {
                console.log('ℹ️ UserInitializer: User store already has correct data');
            }

            if (supabaseUser.user_metadata?.org_id) {
                try {
                    const { data: orgData, error: orgError } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', supabaseUser.user_metadata.org_id)
                        .single();

                    if (orgError) {
                        console.error('❌ UserInitializer: Error fetching organization:', orgError);
                    } else if (orgData) {
                        console.log('🏢 UserInitializer: Organization data loaded');
                        setOrganization(orgData);
                    }
                } catch (error) {
                    console.error('❌ UserInitializer: Exception fetching organization:', error);
                }
            }
        };

        initializeUser();
    }, []); // Run only once on mount

    // This component doesn't render anything
    return null;
}
