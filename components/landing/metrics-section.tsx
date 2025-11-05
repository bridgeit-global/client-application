import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function MetricsSection() {
  return (
    <section className="my-8 flex items-center justify-center py-4 md:snap-start">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
            Why BridgeIT?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-white">
            Our impact in numbers
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span className="text-3xl font-bold text-primary">1 Mn+</span>
                <span>Energy Units</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              We have successfully processed over a million bills,
              streamlining operations for our clients across multiple locations.
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span className="text-3xl font-bold text-primary">10 Mn+</span>
                <span>Data Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              Our advanced data engineering capabilities have handled over
              10 million bill parameters with complete accuracy.
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span className="text-3xl font-bold text-primary">₹1000 Cr+</span>
                <span>Processed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              We&apos;ve facilitated over 1000 Crore rupees in payments,
              ensuring timely and accurate transactions.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

