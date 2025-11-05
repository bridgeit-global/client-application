import PageContainer from '@/components/layout/page-container';
import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SupportSidebar } from '@/components/sidebar/support-sidebar';
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <SupportSidebar />
        <main className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
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