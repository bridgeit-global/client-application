import { Footer } from '@/components/layout/footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SupportSidebar } from '@/components/sidebar/support-sidebar';
import { MainWithScrollHeader } from '@/components/layout/main-with-scroll-header';
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
        <MainWithScrollHeader footer={<Footer />}>
          {children}
        </MainWithScrollHeader>
      </SidebarProvider>
    </div>
  );
}