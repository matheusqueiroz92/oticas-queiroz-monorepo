import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Óticas Queiroz",
  description: "Painel de controle do sistema das Óticas Queiroz",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
