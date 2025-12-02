import { buttonVariants } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ViewBillButtonProps {
    billId: string;
}

const ViewBillButton: React.FC<ViewBillButtonProps> = ({ billId }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={`/portal/bills/${billId}`}
                        aria-label="View Bill Details"
                        className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            "group flex gap-2 items-center px-4 py-2 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200/60 dark:border-violet-800/40 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/40 dark:hover:to-purple-900/30 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm hover:shadow-md transition-all duration-200"
                        )}
                    >
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                            <FileText className='w-3.5 h-3.5' />
                        </div>
                        <span className="font-semibold text-violet-700 dark:text-violet-300 text-sm">View Bill</span>
                        <ExternalLink className="w-3 h-3 text-violet-400 dark:text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-violet-600 text-white border-violet-600">
                    <p className="text-xs font-medium">View complete bill details</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default ViewBillButton; 