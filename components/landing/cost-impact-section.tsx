import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function CostImpactSection() {
  return (
    <section className="my-8 flex items-center justify-center py-4 md:snap-start">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
            Our offerings
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-white">
            Tangible impact on your business
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
            <CardHeader>
              <CardTitle className="items-center gap-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">100%</span>
                </div>
                <span className="text-xl text-white">Bill Digitization</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white">
                Complete digital transformation of your billing process
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Zero manual data entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">99.9% accuracy rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Instant digital archiving</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
            <CardHeader>
              <span className="text-sm text-white mr-1">up to</span>
              <CardTitle className="items-center gap-2">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">120MINS</span>
                </div>
                <span className="text-xl text-white">saved per bill</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white">
                Dramatic reduction in processing time per bill
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Process 1000s of bills simultaneously</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">75% faster approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Real-time processing status</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
            <CardHeader>
              <CardTitle className="items-center gap-2">
                <div className="items-baseline">
                  <span className="text-4xl font-bold text-primary">100%</span>
                </div>
                <span className="text-xl text-white">timely payments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white">
                Significant reduction in operational costs
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Eliminate late payment penalties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Reduce processing costs by 85%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-white">Average ROI in 3 months</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

