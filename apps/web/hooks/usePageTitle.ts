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
      case "/orders":
        return {
          title: "Pedidos",
          description: "Gerencie todos os pedidos da loja"
        };
      case "/customers":
        return {
          title: "Clientes",
          description: "Cadastro e gestão de clientes"
        };
      case "/products":
        return {
          title: "Produtos",
          description: "Catálogo e controle de estoque"
        };
      case "/employees":
        return {
          title: "Funcionários",
          description: "Gestão da equipe e permissões"
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
      case "/profile":
        return {
          title: "Perfil",
          description: "Configurações da sua conta"
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
        if (pathname.includes("/orders/")) {
          return { 
            title: "Detalhes do Pedido",
            description: "Visualize os detalhes do pedido"
          };
        }
        if (pathname.includes("/customers/")) {
          return { 
            title: "Detalhes do Cliente",
            description: "Visualize os detalhes do cliente"
          };
        }
        if (pathname.includes("/products/")) {
          return { 
            title: "Detalhes do Produto",
            description: "Visualize os detalhes do produto"
          };
        }
        if (pathname.includes("/employees/")) {
          return { 
            title: "Detalhes do Funcionário",
            description: "Visualize os detalhes do funcionário"
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