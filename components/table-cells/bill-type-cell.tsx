import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { BillsProps, SingleBillProps } from '@/types/bills-type';

const BillTypeCell = ({ row }: { row: { original: BillsProps | SingleBillProps } }) => {
  const bill_type = row?.original?.bill_type;
  const validation = row.original?.bill_type_reason as Record<string, boolean>;
  const isAbnormal = bill_type?.toLowerCase() !== 'normal';
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            isAbnormal ? 'text-red-700 font-semibold underline cursor-pointer' : ''
          )}
        >
          {bill_type}
        </div>
      </HoverCardTrigger>
      {isAbnormal && validation && (
        <HoverCardContent className="w-fit">
          <div className="space-y-2">
            {Object.keys(validation).map((key) =>
              validation[key] === false ? (
                <div key={key}>
                  {camelCaseToTitleCase(key) + ' discrepancy'}
                </div>
              ) : null
            )}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};

export default BillTypeCell;
