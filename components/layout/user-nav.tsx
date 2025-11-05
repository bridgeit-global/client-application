'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { useEffect } from 'react';
import { OrganizationProps } from '@/types/organization-type';
export function UserNav() {
  const supabase = createClient();
  const { setBillers } = useBillerBoardStore();
  const { user, setUser, setOrganization } = useUserStore();
  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: supabaseUser }
      } = await supabase.auth.getUser();
      if (Object.keys(user).length === 0 && supabaseUser) {
        setUser(supabaseUser);
        const { data: organization, error: org_error } = await supabase.from('organizations').select('*').eq('id', supabaseUser.user_metadata?.org_id).single();
        if (org_error) throw org_error;
        if (organization) {
          setOrganization(organization);
        }
      }
    };
    getUser();
  }, [user, setUser]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user && user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user ? (
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
            </div>
          </DropdownMenuLabel>
        ) : (
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">{user && user?.email}</div>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            setBillers([]);
            setUser({});
            setOrganization({} as OrganizationProps);
            await supabase.auth.signOut();
            router.push('/');
          }}
        >
          <LogOut className="mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  // }
}
