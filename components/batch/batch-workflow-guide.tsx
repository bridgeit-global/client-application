'use client';

import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, 
    FileText, 
    Wallet, 
    Archive, 
    ArrowRight, 
    CreditCard,
    X,
    Lightbulb 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BatchWorkflowGuideProps {
    className?: string;
    /** Whether to show the guide in compact mode */
    compact?: boolean;
    /** Callback when user dismisses the guide */
    onDismiss?: () => void;
}

const WORKFLOW_STEPS = [
    {
        icon: FileText,
        title: 'Select Approved Bills',
        description: 'Go to Bills > Approved to select bills for batch payment',
        link: '/portal/bills/approved',
        linkText: 'Go to Approved Bills',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
        icon: Wallet,
        title: 'Or Select Recharges',
        description: 'Go to Recharges > Approved to select prepaid recharges',
        link: '/portal/recharges/approved',
        linkText: 'Go to Approved Recharges',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
        icon: Archive,
        title: 'Review & Create Batch',
        description: 'Use the batch cart to review selected items and create a batch',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
        icon: CreditCard,
        title: 'Process Payment',
        description: 'Process the batch payment to pay all items at once',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
];

const STORAGE_KEY = 'batch-workflow-guide-dismissed';

/**
 * A guide component that helps users understand the batch workflow
 * Shows step-by-step instructions for creating and managing batches
 */
export function BatchWorkflowGuide({ className, compact = false, onDismiss }: BatchWorkflowGuideProps) {
    const [isDismissed, setIsDismissed] = useState(true); // Start as true to prevent flash

    useEffect(() => {
        // Check localStorage after mount
        const dismissed = localStorage.getItem(STORAGE_KEY);
        setIsDismissed(dismissed === 'true');
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsDismissed(true);
        onDismiss?.();
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setIsDismissed(false);
    };

    if (isDismissed) {
        return (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
            >
                <Lightbulb className="h-4 w-4 mr-2" />
                Show Batch Guide
            </Button>
        );
    }

    if (compact) {
        return (
            <Card className={cn("relative", className)}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={handleDismiss}
                    aria-label="Dismiss guide"
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Quick Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                        <Link href="/portal/bills/approved">
                            <Button variant="outline" size="sm" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Approved Bills
                            </Button>
                        </Link>
                        <Link href="/portal/recharges/approved">
                            <Button variant="outline" size="sm" className="text-xs">
                                <Wallet className="h-3 w-3 mr-1" />
                                Approved Recharges
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("relative overflow-hidden", className)}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 z-10"
                onClick={handleDismiss}
                aria-label="Dismiss guide"
            >
                <X className="h-4 w-4" />
            </Button>

            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    How to Create a Batch
                </CardTitle>
                <CardDescription>
                    Follow these steps to create a batch payment for multiple bills or recharges
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {WORKFLOW_STEPS.map((step, index) => (
                        <div key={step.title} className="relative">
                            {/* Connector line for larger screens */}
                            {index < WORKFLOW_STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-8 left-full w-full z-0">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 absolute left-1/2 -translate-x-1/2" />
                                </div>
                            )}
                            
                            <div className={cn(
                                "relative z-10 p-4 rounded-lg border transition-all duration-200",
                                "hover:shadow-md hover:border-primary/30",
                                step.bgColor
                            )}>
                                {/* Step number */}
                                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>

                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className={cn("p-3 rounded-full bg-background", step.color)}>
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">{step.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                    </div>
                                    {step.link && (
                                        <Link href={step.link}>
                                            <Button variant="outline" size="sm" className="text-xs mt-2">
                                                {step.linkText}
                                                <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Start by selecting items you want to pay together
                    </p>
                    <div className="flex gap-2">
                        <Link href="/portal/bills/approved">
                            <Button size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Go to Approved Bills
                            </Button>
                        </Link>
                        <Link href="/portal/recharges/approved">
                            <Button variant="outline" size="sm">
                                <Wallet className="h-4 w-4 mr-2" />
                                Go to Approved Recharges
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Inline tips that can be shown in various contexts
 */
export function BatchTip({ className }: { className?: string }) {
    return (
        <div className={cn(
            "flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
            className
        )}>
            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Tip</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                    Select multiple bills using the checkboxes, then click the cart icon to create a batch payment.
                </p>
            </div>
        </div>
    );
}
