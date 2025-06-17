import { Plus, Package, UserPlus, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const QuickActions = () => {
  const actions = [
    {
      title: "Novo Pedido",
      icon: Plus,
      description: "Criar um novo pedido para cliente",
      onClick: () => console.log("Novo pedido"),
    },
    {
      title: "Consultar Estoque",
      icon: Package,
      description: "Verificar produtos disponíveis",
      onClick: () => console.log("Consultar estoque"),
    },
    {
      title: "Cadastrar Cliente",
      icon: UserPlus,
      description: "Adicionar novo cliente ao sistema",
      onClick: () => console.log("Cadastrar cliente"),
    },
    {
      title: "Buscar Pedido",
      icon: FileSearch,
      description: "Pesquisar pedidos existentes",
      onClick: () => console.log("Buscar pedido"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              onClick={action.onClick}
              className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left w-full"
            >
              <action.icon className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">{action.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {action.description}
              </p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
