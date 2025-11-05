'use client'

import { useUserStore } from "../store/user-store";

export function useSiteName() {
    const { organization: { site_name } } = useUserStore();
    return site_name || 'Site';
}

