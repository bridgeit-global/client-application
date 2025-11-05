import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ViewBillButtonProps {
    billId: string;
}

const ViewBillButton: React.FC<ViewBillButtonProps> = ({ billId }) => {
    const router = useRouter();
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        aria-label="View Bill Details"
                        className="flex gap-2 items-center px-3 py-1.5 rounded-full shadow-sm  focus:ring-2 focus:ring-secondary/40 transition-all duration-150"
                        onClick={() => router.push(`/portal/bills/${billId}`)}
                    >
                        <Eye className='w-4 h-4' />
                        <span className="font-medium">View Bill</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    View Bill Details
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default ViewBillButton; 