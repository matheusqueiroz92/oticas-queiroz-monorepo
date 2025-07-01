import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  description?: ReactNode | string;
  badge?: {
    text: string;
    className?: string;
  };
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
  badge,
  isLoading = false,
  skeletonWidth = "w-24",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-normal">{title}</CardTitle>
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
            {badge && (
              <Badge 
                variant="secondary" 
                className={`text-xs mt-1 pointer-events-none ${badge.className || 'bg-blue-500 text-white border-0'}`}
              >
                {badge.text}
              </Badge>
            )}
            {description && !badge && (
              <div className="text-xs text-muted-foreground mt-1">
                {description}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 