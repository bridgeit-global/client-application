'use client';

import { useRef, useEffect } from 'react';
import { IssueReportForm } from '@/components/forms/issue-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';

export default function ReportIssuePage() {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cardRef.current) {
            const ctx = gsap.context(() => {
                // Main card entrance
                gsap.from(cardRef.current, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    ease: "power3.out"
                });
            }, cardRef);

            return () => ctx.revert();
        }
    }, []);

    return (
        <div ref={cardRef}>
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <CardTitle className="text-2xl">Report an Issue</CardTitle>
                    </div>
                    <CardDescription>
                        Help us improve by reporting bugs, requesting features, or seeking support. 
                        Your feedback is valuable to us.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IssueReportForm />
                </CardContent>
            </Card>
        </div>
    );
}
