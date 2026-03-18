export default function AboutSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-12 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            From scattered bills to one control tower
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/70">
            When electricity data sits across billers, sites, and spreadsheets, teams miss deadlines, incur LPSC, and lose time on
            reconciliation. BridgeIT standardizes the whole workflow so you can manage energy bills at scale.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/10 hover:bg-white/15 transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-bold text-white">The challenge</h3>
              <ul className="mt-5 space-y-4 text-white/80">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Manual chasing across 92+ billers and multiple sites.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Delays in digitization lead to errors, rework, and reconciliation pain.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Missed discount windows and late payment risk (LPSC, disconnections).
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Reporting becomes a monthly fire-drill instead of an always-ready insight engine.
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/10 hover:bg-white/15 transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-bold text-white">The BridgeIT solution</h3>
              <p className="mt-4 text-white/80 leading-relaxed">
                BridgeIT automates bill discovery, digitization, approvals/reconciliation, and analytics across your portfolio—so you
                reduce processing cost and stay compliant without the scramble.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/60">1</div>
                  <div className="mt-1 font-semibold text-white">Discovery</div>
                  <div className="mt-1 text-sm text-white/70">Track bills and standardize inputs</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/60">2</div>
                  <div className="mt-1 font-semibold text-white">Digitization</div>
                  <div className="mt-1 text-sm text-white/70">OCR + AI validation from any format</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/60">3</div>
                  <div className="mt-1 font-semibold text-white">Payments</div>
                  <div className="mt-1 text-sm text-white/70">Centralized tracking and reconciliation</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/60">4</div>
                  <div className="mt-1 font-semibold text-white">Analytics</div>
                  <div className="mt-1 text-sm text-white/70">Cost, usage, penalties, and compliance reports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

