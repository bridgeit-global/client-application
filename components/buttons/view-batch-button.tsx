import { Button } from '@/components/ui/button';
import { CopyIcon, Eye, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger
} from '@/components/ui/context-menu';

interface ViewBatchButtonProps {
    link?: string;
    batchId: string;
}

const ViewBatchButton: React.FC<ViewBatchButtonProps> = ({ link, batchId }) => {
    const router = useRouter();

    const handleViewBatch = () => {
        if (link) {
            router.push(link);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(batchId);
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Button
                    onClick={handleViewBatch}
                    variant="outline"
                    size="sm"
                    aria-label="View Batch Details"
                    className="flex gap-2 items-center px-3 py-1.5 rounded-full shadow-sm focus:ring-2 focus:ring-secondary/40 transition-all duration-150"
                >
                    <code className="text-xs font-mono text-gray-800">
                        {batchId}
                    </code>
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={handleCopy}>
                    <CopyIcon className="w-4 h-4 mr-2" /> Copy Batch ID
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={handleViewBatch}
                    disabled={!link}
                    className="flex items-center gap-2"
                >
                    <Eye className='w-4 h-4' />
                    View Batch Details
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default ViewBatchButton; 