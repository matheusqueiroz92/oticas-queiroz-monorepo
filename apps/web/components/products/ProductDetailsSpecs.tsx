import { Card, CardContent } from "@/components/ui/card";
import { Layers, Eye, Palette, Hash, Star, Calendar } from "lucide-react";
import { getProductSpecifications } from "@/app/_utils/product-details-utils";

interface ProductDetailsSpecsProps {
  product: any;
}

const iconMap = {
  Eye,
  Palette,
  Hash,
  Star,
  Calendar,
};

export function ProductDetailsSpecs({ product }: ProductDetailsSpecsProps) {
  const specifications = getProductSpecifications(product);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Especificações
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specifications.map((spec, index) => {
            const IconComponent = iconMap[spec.icon as keyof typeof iconMap];
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm text-muted-foreground">{spec.label}</p>
                  <p className="font-medium">{spec.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 