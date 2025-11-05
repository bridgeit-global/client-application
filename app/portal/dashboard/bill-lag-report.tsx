import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';
import { SearchParamsProps } from '@/types';
import { LagCardProps, LagDataProps } from '@/types/dashboard-type';

function LagCard({ index, title, count, buttonColor }: LagCardProps) {
  const isDisable = count == 0;

  const lagFilterBody = {
    page: 0,
    limit: 10,
    lag_type: String(index)
  };
  return (
    <Link
      href={`/portal/site?lagFilterBody=${JSON.stringify(
        lagFilterBody
      )}#lag-site`}
      scroll={false}
    >
      <Card className={`w-full ${!isDisable ? ' hover:bg-yellow-50' : ''}`}>
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <h2
              className={`text-lg font-semibold ${isDisable ? 'text-gray-500' : ''
                }`}
            >
              {title}
            </h2>
            <Megaphone className="h-5 w-5 text-gray-400" />
          </div>
          <p
            className={`mb-1 text-4xl font-semibold ${isDisable ? 'text-gray-500' : ''
              }`}
          >
            {count}
          </p>
          <p className={`mb-4 text-sm text-gray-500`}>Check site details!</p>
          <Button
            disabled={isDisable}
            className={`w-full ${isDisable ? 'bg-gray-700' : buttonColor
              } text-white`}
          >
            Check now
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
export default function BillLagReport({
  lagData
}: {
  lagData: LagDataProps[];
}) {
  const bgColor: SearchParamsProps = {
    0: 'bg-red-500 hover:bg-red-600',
    1: 'bg-orange-500 hover:bg-orange-600',
    2: 'bg-orange-400 hover:bg-orange-500'
  };
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {lagData?.map((e: LagDataProps, index: number) => {
          return (
            <LagCard
              key={index}
              index={index}
              title={e.age}
              count={e.count}
              buttonColor={bgColor[index] || 'bg-gray-500 hover:bg-gray-600'}
            />
          );
        })}
      </div>
    </div>
  );
}
