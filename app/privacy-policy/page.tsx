import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/landing/header'), {
  ssr: true
});

export default function PrivacyPolicy() {
  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-20 pb-12 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="mb-4">
              BridgeIT (we, our, us) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our utility management
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              2. Information We Collect
            </h2>
            <p className="mb-4">
              We collect information that you provide directly to us, such as:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>
                Contact information (e.g., name, email address, phone number)
              </li>
              <li>Billing information</li>
              <li>Utility account details</li>
              <li>Usage data related to your utility consumption</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              3. How We Use Your Information
            </h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>
                Respond to your comments, questions, and customer service
                requests
              </li>
              <li>
                Analyze usage patterns and trends to improve user experience
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              4. Data Sharing and Disclosure
            </h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your
              information with third parties only in the following
              circumstances:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>
                In connection with a merger, sale, or acquisition of all or a
                portion of our company
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to
              protect your information against unauthorized or unlawful
              processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Your Rights</h2>
            <p className="mb-4">
              You have the right to access, correct, or delete your personal
              information. To exercise these rights, please contact us using the
              information provided in the Contact Us section.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              7. Changes to This Privacy Policy
            </h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the Last Updated date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p>
              BridgeIT
              <br />
              Email: support@bridgeit.in
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
