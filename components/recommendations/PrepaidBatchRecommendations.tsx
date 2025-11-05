'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, AlertCircle } from "lucide-react";
import { PrepaidRechargeTableProps } from "@/types/connections-type";
import { useBatchCartStore } from "@/lib/store/batch-cart-store";
interface BatchRecommendationProps {
    totalRechargesData: PrepaidRechargeTableProps[] | null;
    currentDueRechargesData: PrepaidRechargeTableProps[] | null;
    nextSevenDaysRechargesData: PrepaidRechargeTableProps[] | null;
}

export function PrepaidBatchRecommendations({
    totalRechargesData,
    currentDueRechargesData,
    nextSevenDaysRechargesData
}: BatchRecommendationProps) {
    const { addItem, openModal, setBatchName, items } = useBatchCartStore();

    // Filter out recharges already in the cart for each category
    const filterOutCartItems = (data: PrepaidRechargeTableProps[] | null) =>
        data ? data.filter(item => !items.some(cartItem => cartItem.id === item.id)) : [];

    const filteredTotalRechargesData = filterOutCartItems(totalRechargesData);
    const filteredCurrentDueRechargesData = filterOutCartItems(currentDueRechargesData);
    const filteredNextSevenDaysRechargesData = filterOutCartItems(nextSevenDaysRechargesData);

    // Calculate filtered counts
    const filteredTotalRecharges = filteredTotalRechargesData.length;
    const filteredCurrentDueRecharges = filteredCurrentDueRechargesData.length;
    const filteredNextSevenDaysRecharges = filteredNextSevenDaysRechargesData.length;

    // Calculate number of visible cards
    const visibleCardsCount = [
        filteredTotalRecharges,
        filteredCurrentDueRecharges,
        filteredNextSevenDaysRecharges
    ].filter(count => count > 0).length;

    // Determine grid columns based on visible cards
    const gridCols = visibleCardsCount <= 2 ? visibleCardsCount :
        visibleCardsCount === 3 ? 3 : 4;

    const handleCardClick = (category: string, data: PrepaidRechargeTableProps[]) => {
        data.forEach(item => {
            // Only add if item is not already in the cart
            if (!items.some(existingItem => existingItem.id === item.id)) {
                addItem(item);
            }
        });
        openModal();
        setBatchName(`${category.charAt(0).toUpperCase() + category.slice(1)} Recharges - ${new Date().toLocaleDateString()}`);
    };

    return (
        <>
            {filteredTotalRecharges > 0 ?
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Prepaid Recharge Recommendations</h2>
                    <p className="text-muted-foreground">Click on any card to create a batch recharge for that category.</p>
                </div>
                : null}
            <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${gridCols >= 3 ? 'lg:grid-cols-3' : ''
                } ${gridCols === 4 ? 'xl:grid-cols-4' : ''}`}>

                {/* Total Recharges Card */}
                {filteredTotalRecharges > 0 && (
                    <Card
                        className="border-purple-200 bg-purple-50 cursor-pointer transition-all hover:scale-105"
                        onClick={() => handleCardClick('total', filteredTotalRechargesData)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-purple-700">
                                Total Recharges
                            </CardTitle>
                            <CalendarDays className="w-4 h-4 text-purple-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-purple-700">{filteredTotalRecharges}</span>
                                <span className="text-sm text-purple-600">total recharges</span>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                                All recharges in the system
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Current Due Recharges Card */}
                {filteredCurrentDueRecharges > 0 && (
                    <Card
                        className="border-red-200 bg-red-50 cursor-pointer transition-all hover:scale-105"
                        onClick={() => handleCardClick('current due', filteredCurrentDueRechargesData)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-red-700">
                                Current Due Recharges
                            </CardTitle>
                            <AlertCircle className="w-4 h-4 text-red-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-red-700">{filteredCurrentDueRecharges}</span>
                                <span className="text-sm text-red-600">recharges pending</span>
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                                Recommended for immediate batch processing
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Next Seven Days Recharges Card */}
                {filteredNextSevenDaysRecharges > 0 && (
                    <Card
                        className="border-blue-200 bg-blue-50 cursor-pointer transition-all hover:scale-105"
                        onClick={() => handleCardClick('next seven days', filteredNextSevenDaysRechargesData)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-blue-700">
                                Next Seven Days Recharges
                            </CardTitle>
                            <Clock className="w-4 h-4 text-blue-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-blue-700">{filteredNextSevenDaysRecharges}</span>
                                <span className="text-sm text-blue-600">recharges due</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                Recharges due in the next seven days
                            </p>
                        </CardContent>
                    </Card>
                )}

            </div>
        </>
    );
} 