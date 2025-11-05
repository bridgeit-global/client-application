import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/landing/header'), {
  ssr: true
});

export default function TermsOfService() {
  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-20 pb-12 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              1. Acceptance of Terms
            </h2>
            <p className="mb-4">
              By accessing or using the services provided by BridgeIT (we, our,
              us), you agree to be bound by these Terms of Service. If you do
              not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              2. Description of Services
            </h2>
            <p className="mb-4">
              BridgeIT provides utility management services, including but not
              limited to bill discovery, digitization, financial delegation,
              bill payments, and analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features of our services, you may be required to
              create an account. You are responsible for maintaining the
              confidentiality of your account information and for all activities
              that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. User Obligations</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>
                Provide accurate and complete information when using our
                services
              </li>
              <li>Use the services only for lawful purposes</li>
              <li>
                Not interfere with or disrupt the services or servers connected
                to the services
              </li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              5. Intellectual Property
            </h2>
            <p className="mb-4">
              All content, features, and functionality of our services are owned
              by BridgeIT and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              6. Limitation of Liability
            </h2>
            <p className="mb-4">
              BridgeIT shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your
              use of or inability to use the services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              7. Modifications to Services
            </h2>
            <p className="mb-4">
              We reserve the right to modify or discontinue, temporarily or
              permanently, the services with or without notice. You agree that
              we shall not be liable to you or any third party for any
              modification, suspension, or discontinuance of the services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Governing Law</h2>
            <p className="mb-4">
              These Terms of Service shall be governed by and construed in
              accordance with the laws of [Your Jurisdiction], without regard to
              its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to update or change these Terms of Service at
              any time. We will provide notice of any material changes by
              posting the new Terms of Service on this page and updating the
              Last Updated date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <p>
              BridgeIT
              <br />
              Email: support@bridgeit.in
              <br />
            </p>
          </section>

          <p className="text-sm text-muted-foreground">
            Last Updated: September 30, {new Date().getFullYear()}
          </p>
        </main>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} BridgeIT. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </ScrollArea>
  );
}
