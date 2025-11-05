import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/landing/header'), {
  ssr: true
});

export default function CookiePolicy() {
  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-20 pb-12 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold">Cookie Policy</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="mb-4">
              This Cookie Policy explains how BridgeIT (we, our, us) uses
              cookies and similar technologies to recognize you when you visit
              our website and use our services. It explains what these
              technologies are and why we use them, as well as your rights to
              control our use of them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              2. What are cookies?
            </h2>
            <p className="mb-4">
              Cookies are small data files that are placed on your computer or
              mobile device when you visit a website. Cookies are widely used by
              website owners in order to make their websites work, or to work
              more efficiently, as well as to provide reporting information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              3. Why do we use cookies?
            </h2>
            <p className="mb-4">We use cookies for the following purposes:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>To enable certain functions of the service</li>
              <li>To provide analytics</li>
              <li>To store your preferences</li>
              <li>
                To enable advertisements delivery, including behavioral
                advertising
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              4. Types of cookies we use
            </h2>
            <p className="mb-4">We use the following types of cookies:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>
                <strong>Essential Cookies:</strong> These cookies are essential
                to provide you with services available through our website and
                to enable you to use some of its features.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> These cookies allow us to
                analyze how our website is used and to monitor its performance,
                which helps us to provide a better user experience.
              </li>
              <li>
                <strong>Functionality Cookies:</strong> These cookies allow our
                website to remember choices you make when you use our website.
              </li>
              <li>
                <strong>Advertising Cookies:</strong> These cookies are used to
                make advertising messages more relevant to you.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              5. How can you control cookies?
            </h2>
            <p className="mb-4">
              You have the right to decide whether to accept or reject cookies.
              You can set or amend your web browser controls to accept or refuse
              cookies. If you choose to reject cookies, you may still use our
              website though your access to some functionality and areas of our
              website may be restricted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              6. How often will we update this Cookie Policy?
            </h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time in order to
              reflect, for example, changes to the cookies we use or for other
              operational, legal or regulatory reasons. Please therefore
              re-visit this Cookie Policy regularly to stay informed about our
              use of cookies and related technologies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              7. Where can you get further information?
            </h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or other
              technologies, please email us at support@bridgeit.in or by post
              to:
            </p>
            <p>
              BridgeIT
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
