import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Óticas Queiroz",
  description: "Painel de controle do sistema das Óticas Queiroz",
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
