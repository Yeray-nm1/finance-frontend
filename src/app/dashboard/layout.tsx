import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:ml-64 min-h-screen">
      <Sidebar />
      {children}
    </div>
  );
}
