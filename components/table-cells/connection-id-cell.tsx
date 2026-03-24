import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../ui/context-menu';
import { EyeIcon } from 'lucide-react';
import { CopyIcon } from 'lucide-react';
import { Button } from '../ui/button';

export const ConnectionIdCell = ({ row }: { row: any }) => {
    const router = useRouter();
    const { account_number, is_active, id } = row.original;
    const handleCopy = () => navigator.clipboard.writeText(account_number);
    const goToSite = () => router.push(`/portal/profile?id=${id}`);
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    variant="outline"
                    size="sm"
                    className={`${is_active ? 'hover:bg-primary/40 cursor-pointer' : 'text-muted-foreground'}`}
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
