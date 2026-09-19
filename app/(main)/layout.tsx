import { Header } from "@/components/Header";
import { ContentArea } from "@/components/ContentArea";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";

/**
 * Layout for all regular pages — wraps content in the app shell
 * (header, scrollable content area, footer, mobile nav).
 *
 * Pages under `(player)/` bypass this layout entirely, so the video
 * player gets a clean full-screen canvas with no chrome.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Header />
      <ContentArea>{children}</ContentArea>
      <Footer />
      <MobileNav />
    </AppShell>
  );
}
