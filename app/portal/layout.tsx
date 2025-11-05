import PageContainer from '@/components/layout/page-container';
import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PortalSidebar } from '@/components/sidebar/portal-sidebar';
import Header from '@/components/layout/header';
import { createClient } from '@/lib/supabase/server';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <PortalSidebar />
        <main className="w-full flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-hidden min-h-0">
            <PageContainer scrollable>
              {children}
            </PageContainer>
          </div>
          <Footer />
        </main>
      </SidebarProvider>
    </div>
  );
}
