import PageContainer from '@/components/layout/page-container';
import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SupportSidebar } from '@/components/sidebar/support-sidebar';
import Header from '@/components/layout/header';
import { UserInitializer } from '@/components/providers/user-initializer';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <UserInitializer />
      <SidebarProvider>
        <SupportSidebar />
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