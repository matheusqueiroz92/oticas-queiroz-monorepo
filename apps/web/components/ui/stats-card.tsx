import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
}

export const StatsCard = ({ title, value, trend }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div
              className={`text-sm ${
                trend.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
