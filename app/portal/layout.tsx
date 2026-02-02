import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PortalSidebar } from '@/components/sidebar/portal-sidebar';
import { MainWithScrollHeader } from '@/components/layout/main-with-scroll-header';
import { UserInitializer } from '@/components/providers/user-initializer';
import { BatchFab } from '@/components/batch/batch-fab';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <UserInitializer />
      <SidebarProvider>
        <PortalSidebar />
        <MainWithScrollHeader footer={<Footer />}>
          {children}
        </MainWithScrollHeader>
        {/* Floating Action Button for batch management - shows only on relevant pages */}
        <BatchFab />
      </SidebarProvider>
    </div>
  );
}
