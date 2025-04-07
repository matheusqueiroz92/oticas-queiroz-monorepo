import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { formatCurrency, formatDate, getOrderStatusClass, translateOrderStatus } from "@/app/utils/formatters";
import { useUsers } from "@/hooks/useUsers";
import type { Order } from "@/app/types/order";

interface OrderSearchResult extends Partial<Order> {
  _id: string;
  clientId: string;
  finalPrice: number;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  serviceOrder?: string;
  cpf?: string;
  orderDate?: string | Date;
  createdAt?: string | Date;
}

interface QuickOrderSearchProps {
  className?: string;
}

export const QuickOrderSearch: React.FC<QuickOrderSearchProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { getUserName, fetchUsers } = useUsers();

  // Função para buscar pedidos
  const searchOrders = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchParams: Record<string, string> = {};
      
      const cleanSearch = query.trim().replace(/\D/g, '');
      
      if (/^\d{11}$/.test(cleanSearch)) {
        searchParams.cpf = cleanSearch;
      } else if (/^\d{4,7}$/.test(cleanSearch)) {
        searchParams.serviceOrder = cleanSearch;
      } else {
        searchParams.search = query.trim();
      }
      
      // Adicionar timestamp para evitar cache
      searchParams._t = Date.now().toString();
      
      const response = await api.get(API_ROUTES.ORDERS.LIST, {
        params: searchParams,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Timestamp': Date.now().toString()
        }
      });

      let results: OrderSearchResult[] = [];
      if (Array.isArray(response.data)) {
        results = response.data;
      } else if (response.data?.orders) {
        results = response.data.orders;
      }

      // Extrair todos os IDs de clientes para pré-carregar
      const clientIds = results.map(order => 
        typeof order.clientId === 'string' ? order.clientId : ''
      ).filter(Boolean);
      
      // Pré-carregar dados dos clientes
      if (clientIds.length > 0) {
        fetchUsers(clientIds);
      }

      setSearchResults(results.slice(0, 5)); // Limitado a 5 resultados
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para debounce da busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchOrders(searchQuery);
        // Só mostrar resultados se estiver digitando algo
        setShowResults(true);
      } else {
        setSearchResults([]);
        // Não mostrar dropdown vazio
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Efeito para fechar o dropdown quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Efeito para carregar dados dos clientes quando os resultados mudam
  useEffect(() => {
    if (searchResults.length > 0) {
      // Extrair todos os IDs de clientes para carregamento
      const clientIds = searchResults
        .map(order => {
          // Lidar com diferentes formatos possíveis de clientId
          if (typeof order.clientId === 'string') {
            // Se for uma string com ObjectId, extrair o ID
            if (order.clientId.includes('ObjectId')) {
              try {
                const matches = order.clientId.match(/ObjectId\('([^']+)'\)/);
                if (matches && matches[1]) {
                  return matches[1];
                }
              } catch (err) {
                console.error("Erro ao extrair ID do cliente:", err);
              }
            }
            return order.clientId;
          }
          // Se for um objeto, extrair o _id se disponível
          else if (
            typeof order.clientId === 'object' &&
            order.clientId !== null &&
            '_id' in order.clientId
          ) {
            return (order.clientId as { _id: string })._id;
          }
          return '';
        })
        .filter(Boolean);

      // Carregar dados dos clientes se houver IDs
      if (clientIds.length > 0) {
        fetchUsers(clientIds);
      }
    }
  }, [searchResults, fetchUsers]);

  // Função para visualizar um pedido
  const viewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  // Função para limpar a busca
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Função para obter o nome do cliente
  const getClientName = (clientId: string | any): string => {
    if (!clientId) return "Cliente";
    
    // Se for um objeto com propriedade 'name'
    if (typeof clientId === 'object' && clientId !== null && clientId.name) {
      return clientId.name;
    }
    
    // Se for uma string que representa um ObjectId
    if (typeof clientId === 'string' && clientId.includes('ObjectId')) {
      try {
        const matches = clientId.match(/ObjectId\('([^']+)'\)/);
        if (matches && matches[1]) {
          return getUserName(matches[1]);
        }
      } catch (err) {
        console.error("Erro ao extrair ID do cliente:", err);
      }
    }
    
    // Caso padrão: tenta obter o nome a partir da string de ID
    return getUserName(clientId);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-4 w-4 mr-2 text-primary" />
          Busca Rápida de Pedidos
        </CardTitle>
        <CardDescription>
          Pesquise por cliente, CPF ou número da O.S.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="relative">
            <Input
              placeholder="Buscar pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(!!searchQuery)}
              className="pl-9 pr-8"
              aria-label="Buscar pedido por cliente, CPF ou O.S."
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            
            {searchQuery && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showResults && (searchResults.length > 0 || isLoading) && (
            <div 
              ref={resultsRef}
              className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
            >
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Buscando pedidos...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((order) => (
                    <div 
                      key={order._id} 
                      className="cursor-pointer hover:bg-slate-100 p-3 border-b transition-colors"
                      onClick={() => viewOrder(order._id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">
                              {getClientName(order.clientId) === "Carregando..." ? (
                                <span className="flex items-center">
                                  <span>Cliente</span>
                                  <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                                </span>
                              ) : (
                                getClientName(order.clientId)
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.serviceOrder ? `O.S.: ${order.serviceOrder}` : ''} 
                            {order.serviceOrder && order.cpf ? ' • ' : ''}
                            {order.cpf ? `CPF: ${order.cpf}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.finalPrice)}</div>
                          <div className="mt-1">
                            <Badge className={getOrderStatusClass(order.status)}>
                              {translateOrderStatus(order.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDate(order.orderDate || order.createdAt)}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-primary justify-center h-10"
                    onClick={() => router.push('/orders')}
                  >
                    Ver todos os pedidos
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhum pedido encontrado
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Dicas de pesquisa */}
        <div className="mt-3 text-xs text-muted-foreground">
          <p>Dicas:</p>
          <ul className="mt-1 list-disc pl-4 space-y-1">
            <li>Digite o nome do cliente para buscar por cliente</li>
            <li>Digite 11 dígitos para buscar por CPF</li>
            <li>Digite 4-7 dígitos para buscar por número de O.S.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};