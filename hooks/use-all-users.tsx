import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useAllUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const supabase = createClient();
    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.from('user_view').select('*')
            if (error) {
                console.error(error);
            } else {
                setUsers(data);
            }
        }
        getUser();
    }, []);
    return users;
}