import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Selecione uma opção no menu lateral para começar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
