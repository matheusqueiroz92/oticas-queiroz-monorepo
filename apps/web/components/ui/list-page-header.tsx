"use client";

import React from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ListPageHeaderProps {
  title: string | React.ReactNode;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount?: number;
  children?: React.ReactNode;
}

// Componente principal
export function ListPageHeader({
  title,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount = 0,
  children,
}: ListPageHeaderProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-[var(--primary-blue)] dark:text-zinc-100">
          {title}
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-3 sm:items-center">
          {/* Busca + filtros inline */}
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Slot para selects de filtro */}
            <ListPageHeaderSlots.FilterSelects>
              {children}
            </ListPageHeaderSlots.FilterSelects>
          </div>

          {/* Botoes de acao */}
          <div className="flex gap-2 justify-end sm:ml-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilters}
              className={activeFiltersCount > 0
                ? "border-[var(--primary-blue)]/40 text-[var(--primary-blue)] dark:text-blue-400"
                : ""}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="info"
                  className="ml-0.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <ListPageHeaderSlots.ActionButtons>
              {children}
            </ListPageHeaderSlots.ActionButtons>
          </div>
        </div>
      </CardHeader>

      {/* Filtros avancados */}
      {showFilters && (
        <ListPageHeaderSlots.AdvancedFilters>
          {children}
        </ListPageHeaderSlots.AdvancedFilters>
      )}
    </Card>
  );
}

// Slots internos
const ListPageHeaderSlots = {
  FilterSelects: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === "FilterSelects"
    );
    return slot || null;
  },
  ActionButtons: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === "ActionButtons"
    );
    return slot || null;
  },
  AdvancedFilters: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === "AdvancedFilters"
    );
    return slot || null;
  },
};

// Componentes auxiliares para os slots
export const FilterSelects: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex flex-col sm:flex-row gap-2">{children}</div>;
};
FilterSelects.displayName = "FilterSelects";

export const ActionButtons: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
ActionButtons.displayName = "ActionButtons";

export const AdvancedFilters: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
AdvancedFilters.displayName = "AdvancedFilters";

// Conteudo da lista
interface ListPageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ListPageContent: React.FC<ListPageContentProps> = ({
  children,
  className = "p-0",
}) => {
  return <CardContent className={className}>{children}</CardContent>;
};
