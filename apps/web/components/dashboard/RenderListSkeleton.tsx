import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface RenderListSkeletonProps {
    rows: number;
}

export function RenderListSkeleton({ rows }: RenderListSkeletonProps) {
    return (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {Array(rows).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
}
