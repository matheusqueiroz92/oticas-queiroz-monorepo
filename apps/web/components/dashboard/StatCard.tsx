import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  description?: ReactNode;
  isLoading?: boolean;
  skeletonWidth?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  description,
  isLoading = false,
  skeletonWidth = "w-24",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
        <div className={`rounded-full ${bgColor} p-2 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className={`h-8 ${skeletonWidth}`} />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 