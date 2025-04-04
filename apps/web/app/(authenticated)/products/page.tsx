"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Loader2, 
  Plus, 
  Filter,
  ChevronRight,
  Package,
  ShoppingBag,
  Eye,
  Edit,
  AlertCircle
} from "lucide-react";
import { getProductTypeName } from "@/app/services/productService";
import { PageTitle } from "@/components/PageTitle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product } from "@/app/types/product";
import { PaginationItems } from "@/components/PaginationItems";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const {
    products,
    loading,
    error,
    totalPages,
    totalProducts,
    currentPage,
    updateFilters,
    setCurrentPage,
    navigateToProductDetails,
    navigateToCreateProduct,
    navigateToEditProduct,
    formatCurrency,
  } = useProducts();

  // Filtrar produtos com base no estoque
  const filteredProducts = products.filter(product => {
    // Se não for um produto com estoque e o filtro não for "all", não mostrar
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return stockFilter === "all";
    }
    
    // Obter o valor do estoque
    const stock = (product as any).stock || 0;
    
    // Aplicar o filtro específico
    switch (stockFilter) {
      case "low":
        return stock > 0 && stock <= 5;
      case "out":
        return stock === 0;
      case "all":
      default:
        return true;
    }
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    updateFilters({ 
      productType: value !== "all" ? value as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame" : undefined 
    });
  };

  // Função que retorna o ícone correto para cada tipo de produto
  const getProductTypeIcon = (type: Product['productType']) => {
    switch (type) {
      case "lenses":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "clean_lenses":
        return <Package className="h-4 w-4 text-green-500" />;
      case "prescription_frame":
        return <ShoppingBag className="h-4 w-4 text-purple-500" />;
      case "sunglasses_frame":
        return <ShoppingBag className="h-4 w-4 text-orange-500" />;
      default:
        return <ShoppingBag className="h-4 w-4 text-gray-500" />;
    }
  };

  // Renderizar o status de estoque
  const renderStockBadge = (product: Product) => {
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return null;
    }
    
    const stock = (product as any).stock || 0;
    
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="absolute top-2 right-2">
          Sem estoque
        </Badge>
      );
    }
    
    if (stock <= 5) {
      return (
        <Badge variant="outline" className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
          Estoque baixo: {stock}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="absolute top-2 right-2 bg-green-50 text-green-700 border-green-200">
        Em estoque: {stock}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredProducts.map((product) => (
        <Card key={product._id} className="overflow-hidden group hover:shadow-md transition-shadow">
          <div className="aspect-square relative bg-gray-50">
            {renderStockBadge(product)}
            {product.image ? (
              <img
              src={process.env.NEXT_PUBLIC_API_URL+product.image}
              alt={product.name}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Package className="h-16 w-16 opacity-20" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="h-9"
              onClick={(e) => {
                e.stopPropagation();
                navigateToProductDetails(product._id);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                navigateToEditProduct(product._id);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-1">
            <Badge variant="outline" className="flex items-center gap-1">
              {getProductTypeIcon(product.productType)}
              <span className="text-xs">{getProductTypeName(product.productType)}</span>
            </Badge>
            {product.brand && (
              <span className="text-xs text-muted-foreground">{product.brand}</span>
            )}
          </div>
          <h3 className="font-semibold truncate mt-1">{product.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.sellPrice)}
            </span>
            {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                Estoque: {(product as any).stock || 0}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const renderTableView = () => (
  <div className="border rounded-md overflow-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Produto
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tipo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Preço
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Estoque
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredProducts.map((product) => (
          <tr key={product._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md mr-4 overflow-hidden">
                  {product.image ? (
                    <img
                      src={process.env.NEXT_PUBLIC_API_URL+product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.brand || "-"}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {getProductTypeIcon(product.productType)}
                <span className="text-xs">{getProductTypeName(product.productType)}</span>
              </Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-primary">{formatCurrency(product.sellPrice)}</div>
              {product.costPrice !== undefined && (
                <div className="text-xs text-gray-500">Custo: {formatCurrency(product.costPrice)}</div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') ? (
                <div>
                  {(product as any).stock === 0 ? (
                    <Badge variant="destructive" className="font-normal">Sem estoque</Badge>
                  ) : (product as any).stock <= 5 ? (
                    <Badge variant="outline" className="font-normal bg-amber-500 hover:bg-amber-600">Baixo: {(product as any).stock}</Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">{(product as any).stock} unidades</Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">N/A</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <span className="sr-only">Abrir menu</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigateToProductDetails(product._id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateToEditProduct(product._id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

return (
  <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
    <PageTitle
      title="Produtos"
      description="Gerenciamento de produtos da loja"
    />
    <Card>
      <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">Lista de Produtos</CardTitle>
        <Button onClick={navigateToCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </form>
            <div className="flex gap-2">
              <Select value={productType} onValueChange={handleProductTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="lenses">Lentes</SelectItem>
                  <SelectItem value="clean_lenses">Limpa-lentes</SelectItem>
                  <SelectItem value="prescription_frame">Armação de Grau</SelectItem>
                  <SelectItem value="sunglasses_frame">Armação Solar</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtro de Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => setViewMode("table")}
                >
                  <div className="flex flex-col justify-between h-4 w-4">
                    <div className="h-0.5 w-full bg-current rounded-sm"></div>
                    <div className="h-0.5 w-full bg-current rounded-sm"></div>
                    <div className="h-0.5 w-full bg-current rounded-sm"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {(productType !== "all" || stockFilter !== "all" || searchTerm) && (
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="px-2 py-1 h-7">
                <Filter className="h-3 w-3 mr-1" />
                Filtros Ativos
              </Badge>
              {productType !== "all" && (
                <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
                  Tipo: {getProductTypeName(productType as any)}
                  <button 
                    className="ml-1 text-primary/70 hover:text-primary"
                    onClick={() => handleProductTypeChange("all")}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {stockFilter !== "all" && (
                <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
                  Estoque: {stockFilter === "low" ? "Baixo" : "Zerado"}
                  <button 
                    className="ml-1 text-primary/70 hover:text-primary"
                    onClick={() => setStockFilter("all")}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
                  Busca: {searchTerm}
                  <button 
                    className="ml-1 text-primary/70 hover:text-primary"
                    onClick={() => {
                      setSearchTerm("");
                      updateFilters({ search: "" });
                    }}
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7 px-2"
                onClick={() => {
                  setProductType("all");
                  setStockFilter("all");
                  setSearchTerm("");
                  updateFilters({});
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Não foi possível encontrar produtos que correspondam aos filtros aplicados. Tente ajustar seus critérios de busca.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setProductType("all");
                setStockFilter("all");
                setSearchTerm("");
                updateFilters({});
              }}
              className="mt-4"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          viewMode === "grid" ? renderGridView() : renderTableView()
        )}

        <PaginationItems
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalProducts}
          pageSize={products.length}
        />
      </CardContent>
    </Card>
  </div>
);
}