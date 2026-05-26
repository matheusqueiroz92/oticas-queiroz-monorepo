import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

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
  headerAction?: ReactNode;
  footerAction?: ReactNode;
  isCashRegisterOpen?: boolean;
  showOpenCashRegisterButton?: boolean;
  cashRegisterOpenHref?: string;
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
  headerAction,
  footerAction,
  isCashRegisterOpen,
  showOpenCashRegisterButton = false,
  cashRegisterOpenHref = "/cash-register/open",
}: StatCardProps) {
  const showCashRegisterFooter =
    isCashRegisterOpen !== undefined || showOpenCashRegisterButton;
  const showCustomFooter = !!footerAction;

  return (
    <Card className="bg-primary/10 border border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm sm:text-base md:text-xl font-normal text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {headerAction}
          <div
            className={`rounded-full ${bgColor} p-2 flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {isLoading ? (
          <Skeleton className={`h-6 ${skeletonWidth}`} />
        ) : (
          <>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 break-words">
              {value}
            </div>
            {badge && (
              <Badge
                variant="secondary"
                className={`text-xs mt-1 pointer-events-none ${badge.className || "bg-blue-500 text-white border-0"}`}
              >
                {badge.text}
              </Badge>
            )}

            {showCashRegisterFooter && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {description && !badge && (
                  <div className="text-xs min-w-0 flex-1">{description}</div>
                )}

                {showOpenCashRegisterButton && !isCashRegisterOpen && (
                  <Button
                    asChild
                    size="sm"
                    className="shrink-0 bg-[var(--primary-blue)] text-white hover:bg-primary hover:text-white"
                  >
                    <Link href={cashRegisterOpenHref}>
                      Abrir caixa
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {showCustomFooter && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {description && !badge && (
                  <div className="text-xs text-muted-foreground min-w-0 flex-1">{description}</div>
                )}
                {footerAction}
              </div>
            )}

            {description && !badge && !showCashRegisterFooter && !showCustomFooter && (
              <div className="text-xs text-[var(--primary-blue)] mt-1">
                {description}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
