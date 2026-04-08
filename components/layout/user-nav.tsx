'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { OrganizationProps } from '@/types/organization-type';
import { cn } from '@/lib/utils';

export function UserNav() {
  const supabase = createClient();
  const { setBillers } = useBillerBoardStore();
  const { user, setUser, setOrganization } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const userName =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : '';
  const userEmail = user?.email ?? '';
  const role = user?.user_metadata?.role as string | undefined;
  const isAdmin = role === 'admin';
  const isOperator = role === 'operator';
  const isSupport = user?.role === 'service_role';
  const isPortalPage = pathname.includes('portal');

  const handleLogout = async () => {
    setBillers([]);
    setUser({});
    setOrganization({} as OrganizationProps);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative rounded-full',
            'h-10 w-10 sm:h-11 sm:w-11',
            'border border-border/40',
            'shadow-sm hover:shadow-md',
            'transition-all duration-200 ease-in-out',
          )}
        >
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
            <AvatarImage
              src={user?.user_metadata?.avatar_url || ''}
              alt={userName || ''}
            />
            <AvatarFallback className="text-xs font-medium">
              {userName
                ? userName.slice(0, 2).toUpperCase()
                : userEmail?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" forceMount>
        {/* User identity */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userName || 'Anonymous User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Common items (all roles) */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/portal/user-profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>

          {!isOperator && (
            <DropdownMenuItem
              onClick={() => router.push('/portal/accounts/notifications')}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notification Preferences
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Administration
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push('/portal/accounts')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Accounts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/portal/accounts/api-clients')}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                API Clients
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push('/portal/accounts/site-zone-config')
                }
              >
                <MapPin className="mr-2 h-4 w-4" />
                Site &amp; Zone Config
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {/* Support section */}
        {isSupport && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Support
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {isPortalPage ? (
                <DropdownMenuItem
                  onClick={() => router.push('/support/dashboard')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Support Dashboard
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => router.push('/portal/dashboard')}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Portal Dashboard
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
