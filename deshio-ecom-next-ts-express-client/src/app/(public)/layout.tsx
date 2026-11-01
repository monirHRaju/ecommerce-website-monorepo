import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* pb leaves room for the mobile bottom tab bar */}
      <main className="flex-1 pb-[4.5rem] lg:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
