export default function StepsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl text-white font-bold text-center mb-8 md:mb-12">
          Streamline in 4 simple steps
        </h2>
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Step 1 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Register your sites and providers</h3>
                <p className="text-white/80 leading-relaxed">
                  Easily onboard all your locations and electricity providers through our
                  intuitive interface. Map connections and organize your portfolio efficiently.
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Digitize and process bills automatically</h3>
                <p className="text-white/80 leading-relaxed">
                  Our advanced OCR and AI systems automatically process and validate your
                  electricity bills, eliminating manual data entry and reducing errors.
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Reconcile payments across locations</h3>
                <p className="text-white/80 leading-relaxed">
                  Track and manage payments centrally. Get real-time updates on payment
                  status and automate reconciliation across all your locations.
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">4</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Get insights through advanced analytics</h3>
                <p className="text-white/80 leading-relaxed">
                  Leverage powerful analytics to identify cost-saving opportunities and
                  optimize your electricity consumption patterns across your portfolio.
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

