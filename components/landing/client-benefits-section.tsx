import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Clock, IndianRupee, AlertTriangle } from 'lucide-react';

export default function ClientBenefitsSection() {
  return (
    <section className="my-8 flex items-center justify-center py-4 md:snap-start">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
            Benefits for you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-white/90">
            Save time, cut costs, and stay on top of arrears and anomalies
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          {/* Time savings */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-white text-lg font-medium">
                  Time savings
                </CardTitle>
              </div>
              <CardTitle className="items-center gap-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">200+ hrs</span>
                </div>
                <span className="text-xl text-white">saved annually</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/90">
                No more chasing bills, manual data entry, or reconciliation. One dashboard for all locations—year round.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Single view across 92+ billers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Automated download and validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Bulk approvals in minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost savings */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-white text-lg font-medium">
                  Cost savings
                </CardTitle>
              </div>
              <CardTitle className="items-center gap-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">85%</span>
                </div>
                <span className="text-xl text-white">lower processing cost</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/90">
                Fewer errors, timely payments, and better visibility so you pay only what you owe.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Avoid late payment penalties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Discount-window reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Reduced admin and reconciliation cost</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arrears, penalties & abnormal bills */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-white text-lg font-medium">
                  Arrears & anomalies
                </CardTitle>
              </div>
              <CardTitle className="items-center gap-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">Clear</span>
                </div>
                <span className="text-xl text-white">visibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/90">
                Spot overdue amounts, penalties, and unusual bills before they become a problem.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Arrears and dues highlighted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Penalty and surcharge breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-white">Abnormal or spiking bills flagged</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
