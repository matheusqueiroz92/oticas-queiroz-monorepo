import { Product } from "@/app/_types/product";
import { ProductTableRow } from "./ProductTableRow";

interface ProductTableViewProps {
  products: Product[];
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  navigateToEditProduct: (id: string) => void;
}

export function ProductTableView({
  products,
  formatCurrency,
  navigateToProductDetails,
  navigateToEditProduct,
}: ProductTableViewProps) {
  return (
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
          {products.map((product) => (
            <ProductTableRow
              key={product._id}
              product={product}
              formatCurrency={formatCurrency}
              navigateToProductDetails={navigateToProductDetails}
              navigateToEditProduct={navigateToEditProduct}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}