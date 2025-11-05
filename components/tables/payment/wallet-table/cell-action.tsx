'use client';
import { useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ClientPaymentsProps } from '@/types/payments-type';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue
} from '@/components/ui/select';

interface CellActionProps {
    data: ClientPaymentsProps;
}

const STATUS_OPTIONS = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' },
    { value: 'settled', label: 'Settled' },
    { value: 'refunded', label: 'Refunded' },
];

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const supabase = createClient();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('client_payments')
            .update({ status })
            .eq('id', id)
            .select();
        if (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update status.'
            });
            return;
        }
        toast({
            variant: 'success',
            title: 'Success',
            description: `Status updated to ${status}`
        });
        router.refresh();
    };

    return (
        <Select
            value={data.status || ''}
            onValueChange={newStatus => {
                startTransition(() => {
                    updateStatus(data.id, newStatus);
                });
            }}
            disabled={isPending}
        >
            <SelectTrigger className="w-[120px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}; 