'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, AlertCircle } from "lucide-react";
import { AllBillTableProps } from "@/types/bills-type";
import { useBatchCartStore } from "@/lib/store/batch-cart-store";
interface BatchRecommendationProps {
    overdueBillsData: AllBillTableProps[];
    discountDateBillsData: AllBillTableProps[];
    currentDueBillsData: AllBillTableProps[];
    nextSevenDaysBillsData: AllBillTableProps[];
    totalBillsData: AllBillTableProps[];
}

export function BatchRecommendations({
    totalBillsData,
    overdueBillsData,
    discountDateBillsData,
    currentDueBillsData,
    nextSevenDaysBillsData,
}: BatchRecommendationProps) {
    const { addItem, openModal, setBatchName, items } = useBatchCartStore();

    // Filter out bills already in the cart for each category
    const filterOutCartItems = (data: AllBillTableProps[]) =>
        data.filter(item => !items.some(cartItem => cartItem.id === item.id));

    const filteredTotalBillsData = filterOutCartItems(totalBillsData);
    const filteredOverdueBillsData = filterOutCartItems(overdueBillsData);
    const filteredDiscountDateBillsData = filterOutCartItems(discountDateBillsData);
    const filteredCurrentDueBillsData = filterOutCartItems(currentDueBillsData);
    const filteredNextSevenDaysBillsData = filterOutCartItems(nextSevenDaysBillsData);

    // Calculate number of visible cards
    const visibleCardsCount = [
        filteredTotalBillsData.length,
        filteredOverdueBillsData.length,
        filteredDiscountDateBillsData.length,
        filteredCurrentDueBillsData.length,
        filteredNextSevenDaysBillsData.length
    ].filter(count => count > 0).length;

    // Determine grid columns based on visible cards
    const gridCols = visibleCardsCount <= 2 ? visibleCardsCount :
        visibleCardsCount === 3 ? 3 : 4;

    const handleCardClick = (category: string, data: AllBillTableProps[]) => {
        data.forEach(item => {
            // Only add if item is not already in the cart
            if (!items.some(existingItem => existingItem.id === item.id)) {
                addItem(item);
            }
        });
        openModal();
        setBatchName(`${category.charAt(0).toUpperCase() + category.slice(1)} Bills - ${new Date().toLocaleDateString()}`);
    };


    return (
        <>
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Approved Bills</h2>
                {filteredTotalBillsData.length > 0 ? <p className="text-muted-foreground">Click on any card to create a batch payment for that category.</p> : null}
            </div>
            <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${gridCols >= 3 ? 'lg:grid-cols-3' : ''}
                } ${gridCols === 4 ? 'xl:grid-cols-4' : ''}`}>

                {/* Total Bills Card */}
                {filteredTotalBillsData.length > 0 && (
                    <Card
                        className="relative border bg-white hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleCardClick('total', filteredTotalBillsData)}
                        tabIndex={0}
                        aria-label="Add all total bills to batch"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                Total Bills
                            </CardTitle>
                            <CalendarDays className="w-5 h-5 text-gray-400" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-center min-h-[80px]">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-purple-700">{filteredTotalBillsData.length}</span>
                                <span className="text-sm text-gray-500">total bills</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                All bills in the system
                            </p>
                            <span className="absolute right-4 bottom-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                Click to add <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </CardContent>
                    </Card>
                )}

                {/* Overdue Bills Card */}
                {filteredOverdueBillsData.length > 0 && (
                    <Card
                        className="relative border bg-white hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleCardClick('overdue', filteredOverdueBillsData)}
                        tabIndex={0}
                        aria-label="Add all overdue bills to batch"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                Overdue Bills
                            </CardTitle>
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-center min-h-[80px]">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-red-700">{filteredOverdueBillsData.length}</span>
                                <span className="text-sm text-gray-500">bills pending</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Recommended for immediate batch processing
                            </p>
                            <span className="absolute right-4 bottom-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                Click to add <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </CardContent>
                    </Card>
                )}

                {/* Discount Date Bills Card */}
                {filteredDiscountDateBillsData.length > 0 && (
                    <Card
                        className="relative border bg-white hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleCardClick('discount', filteredDiscountDateBillsData)}
                        tabIndex={0}
                        aria-label="Add all discount date bills to batch"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                Discount Date Bills
                            </CardTitle>
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-center min-h-[80px]">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-yellow-700">{filteredDiscountDateBillsData.length}</span>
                                <span className="text-sm text-gray-500">bills approaching</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Process soon to avail discount benefits
                            </p>
                            <span className="absolute right-4 bottom-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                Click to add <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </CardContent>
                    </Card>
                )}

                {/* Current Due Date Bills Card */}
                {filteredCurrentDueBillsData.length > 0 && (
                    <Card
                        className="relative border bg-white hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleCardClick("today's", filteredCurrentDueBillsData)}
                        tabIndex={0}
                        aria-label="Add all current due bills to batch"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                Current Due Bills
                            </CardTitle>
                            <CalendarDays className="w-5 h-5 text-blue-500" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-center min-h-[80px]">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-blue-700">{filteredCurrentDueBillsData.length}</span>
                                <span className="text-sm text-gray-500">bills due</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Regular bills within due date
                            </p>
                            <span className="absolute right-4 bottom-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                Click to add <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </CardContent>
                    </Card>
                )}

                {/* Next Seven Days Bills Card */}
                {filteredNextSevenDaysBillsData.length > 0 && (
                    <Card
                        className="relative border bg-white hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleCardClick('next seven days', filteredNextSevenDaysBillsData)}
                        tabIndex={0}
                        aria-label="Add all next seven days bills to batch"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                Next Seven Days Bills
                            </CardTitle>
                            <CalendarDays className="w-5 h-5 text-emerald-400" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-center min-h-[80px]">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-emerald-700">{filteredNextSevenDaysBillsData.length}</span>
                                <span className="text-sm text-gray-500">bills due</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Bills due in the next seven days
                            </p>
                            <span className="absolute right-4 bottom-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                Click to add <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </CardContent>
                    </Card>
                )}

            </div>
        </>
    );
} 