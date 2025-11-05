import Image from 'next/image';

export default function FeaturesSection() {
  return (
    <section id="about" className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl text-white font-bold text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Multi-Location Management */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Image
                    src="/images/cdn-globe-locations-svgrepo-com.svg"
                    alt="Multi-location icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Multi-Location Management</h3>
                <p className="text-white/80 leading-relaxed">
                  Centralized control for managing electricity bills from 92+
                  billers across India, with smart meter integrations and FTP
                  inputs for seamless data collection
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Cost Optimization */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Image
                    src="/images/budget-cost-svgrepo-com.svg"
                    alt="Cost optimization icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Cost Optimization</h3>
                <p className="text-white/80 leading-relaxed">
                  Advanced analytics to identify cost-saving opportunities,
                  optimize electricity consumption, and avoid penalties and
                  arrears through timely payment tracking
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Automated Processing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Image
                    src="/images/standardization-svgrepo-com.svg"
                    alt="Automation icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Digitized Bill Processing</h3>
                <p className="text-white/80 leading-relaxed">
                  Eliminate manual data entry with automated bill download, extraction and
                  validation across all providers, ensuring accurate data
                  from diverse bill formats
                </p>
              </div>
              <div className="hidden md:block flex-1" />
            </div>
          </div>

          {/* Compliance & Reporting */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-1">
                <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Image
                    src="/images/cloud-build-svgrepo-com.svg"
                    alt="Compliance icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Compliance & Reporting</h3>
                <p className="text-white/80 leading-relaxed">
                  Ensure regulatory compliance, Track environmental metrics and generate
                  comprehensive compliance reports for informed decision-making
                  and regulatory requirements
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

