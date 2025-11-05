'use client';

import { useRouter } from 'next/navigation';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../ui/context-menu';
import { CopyIcon, EyeIcon } from 'lucide-react';
import { Button } from '../ui/button';
export const AccountNumberCell = ({ row }: { row: any }) => {
    const router = useRouter();
    const goToSite = () => {
        router.push(`/portal/profile?id=${row.original.connections.id}`);
    };
    const account_number = row.original.connections.account_number;
    const is_active = row.original.connections.is_active;
    const handleCopy = () => navigator.clipboard.writeText(account_number);
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-2 items-center px-3 py-1.5 rounded-full shadow-sm focus:ring-2 focus:ring-secondary/40 transition-all duration-150"
                    disabled={!is_active}
                    onClick={goToSite}
                >
                    {account_number}
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={handleCopy}>
                    <CopyIcon className="w-4 h-4 mr-2" /> Copy
                </ContextMenuItem>
                <ContextMenuItem onSelect={goToSite}>
                    <EyeIcon className="w-4 h-4 mr-2" /> View Connection
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
