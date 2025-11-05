'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ChargeCategory {
  title: string;
  charges: { [key: string]: number };
}

export interface ChargesProps {
  additionalCharges: ChargeCategory;
  adherenceCharges: ChargeCategory;
  regulatoryCharges: ChargeCategory;
  coreCharges: ChargeCategory;
}

export function ChargesCard({
  additionalCharges,
  adherenceCharges,
  regulatoryCharges,
  coreCharges
}: ChargesProps) {
  const chargeCategories = [
    coreCharges,
    additionalCharges,
    adherenceCharges,
    regulatoryCharges
  ];

  return (
    <div className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Charges Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargeCategories.map(
          (category, index) =>
            category.charges && (
              <div key={category.title} className="mb-6">
                <h3 className="mb-2 text-lg font-semibold">{category.title}</h3>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {Object.entries(category.charges).map(
                    ([chargeName, amount]) =>
                      chargeName != 'id' &&
                      chargeName != 'created_at' &&
                      chargeName != 'updated_at' && (
                        <div
                          key={chargeName}
                          className="flex items-center justify-between rounded-md bg-muted p-2"
                        >
                          <span className="font-medium">
                            {formatChargeName(chargeName).toUpperCase()}:
                          </span>
                          <span className={amount < 0 ? 'text-green-600' : ''}>
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      )
                  )}
                </div>
                {index < chargeCategories.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            )
        )}
      </CardContent>
    </div>
  );
}

function formatChargeName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
