import { usePathname } from "next/navigation";

export function usePageTitle() {
  const pathname = usePathname();

  const getPageTitle = (): { title: string; description?: string } => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "Dashboard",
          description: "Visão geral do negócio e ações rápidas"
        };
      case "/profile":
        return {
          title: "Perfil",
          description: "Configurações da sua conta"
        };
      case "/customers":
        return {
          title: "Clientes",
          description: "Cadastro e gestão de clientes"
        };
      case "/employees":
        return {
          title: "Funcionários",
          description: "Gestão da equipe e permissões"
        };
      case "/orders":
        return {
          title: "Pedidos",
          description: "Gerencie todos os pedidos da loja"
        };
      case "/my-orders":
        return {
          title: "Meus Pedidos",
          description: "Histórico dos seus pedidos"
        };
      case "/my-debts":
        return {
          title: "Meus Débitos",
          description: "Controle das suas pendências financeiras"
        };
      case "/products":
        return {
          title: "Produtos",
          description: "Catálogo e controle de estoque"
        };
      case "/payments":
        return {
          title: "Pagamentos",
          description: "Controle financeiro e transações"
        };
      case "/cash-register":
        return {
          title: "Caixa",
          description: "Controle de abertura e fechamento de caixa"
        };
      case "/laboratories":
        return {
          title: "Laboratórios",
          description: "Gestão de laboratórios parceiros"
        };
      case "/reports":
        return {
          title: "Relatórios",
          description: "Análises e relatórios gerenciais"
        };
      case "/legacy-clients":
        return {
          title: "Clientes Legados",
          description: "Clientes do sistema anterior"
        };
      case "/institutions":
        return {
          title: "Instituições",
          description: "Gestão de instituições parceiras"
        };
      case "/checks":
        return {
          title: "Gestão de Cheques",
          description: "Controle de cheques recebidos"
        };
      default:
        // Para rotas dinâmicas, extrair o título da URL
        if (pathname.includes("/customers/")) {
          return { 
            title: "Detalhes do Cliente",
            description: "Visualize os detalhes do cliente"
          };
        }
        if (pathname.includes("/employees/")) {
          return { 
            title: "Detalhes do Funcionário",
            description: "Visualize os detalhes do funcionário"
          };
        }
        if (pathname.includes("/orders/")) {
          return { 
            title: "Detalhes do Pedido",
            description: "Visualize os detalhes do pedido"
          };
        }
        if (pathname.includes("/products/")) {
          return { 
            title: "Detalhes do Produto",
            description: "Visualize os detalhes do produto"
          };
        }
        if (pathname.includes("/payments/")) {
          return { 
            title: "Detalhes do Pagamento",
            description: "Visualize os detalhes do pagamento"
          };
        }
        if (pathname.includes("/cash-register/")) {
          return { 
            title: "Detalhes do caixa",
            description: "Visualize os detalhes do caixa"
          };
        }
        if (pathname.includes("/laboratories/")) {
          return { 
            title: "Detalhes do Laboratório",
            description: "Visualize os detalhes do laboratório"
          };
        }
        if (pathname.includes("/reports/")) {
          return { 
            title: "Relatórios",
            description: "Visualize os relatórios"
          };
        }
        if (pathname.includes("/legacy-clients/")) {
          return { 
            title: "Detalhes do Cliente Legado",
            description: "Visualize os detalhes do cliente legado"
          };
        }
        if (pathname.includes("/institutions/")) {
          return { 
            title: "Detalhes da Instituição",
            description: "Visualize os detalhes da instituição"
          };
        }
        if (pathname.includes("/checks/")) {
          return { 
            title: "Detalhes do Cheque",
            description: "Visualize os detalhes do cheque"
          };
        }
        return { 
          title: "Página",
          description: "Página não encontrada"
        };
    }
  };

  return getPageTitle();
} 