"use client";

import { Header } from "@/components/layout/app-header";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageTitle = usePageTitle();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header 
          title={pageTitle.title}
          description={pageTitle.description}
        />
        <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}