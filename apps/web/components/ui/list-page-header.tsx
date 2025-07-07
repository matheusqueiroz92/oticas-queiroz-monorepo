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

interface ListPageHeaderSlotsProps {
  filterSelects?: React.ReactNode;
  actionButtons?: React.ReactNode;
  advancedFilters?: React.ReactNode;
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
    <Card>
      <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
          {/* Área esquerda: Input de busca e slots para filtros */}
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary-blue)]" />
            </div>
            
            {/* Slot para selects de filtro específicos */}
            <ListPageHeaderSlots.FilterSelects>
              {children}
            </ListPageHeaderSlots.FilterSelects>
          </div>

          {/* Área direita: Slot para botões de ação */}
          <div className="flex gap-2 justify-end sm:ml-auto">
            <Button variant="outline" size="sm" onClick={onToggleFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center">
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

      {/* Slot para filtros avançados */}
      {showFilters && (
        <ListPageHeaderSlots.AdvancedFilters>
          {children}
        </ListPageHeaderSlots.AdvancedFilters>
      )}
    </Card>
  );
}

// Componentes de slot para organizar o children
const ListPageHeaderSlots = {
  FilterSelects: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === 'FilterSelects'
    );
    return slot || null;
  },

  ActionButtons: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === 'ActionButtons'
    );
    return slot || null;
  },

  AdvancedFilters: ({ children }: { children: React.ReactNode }) => {
    const slot = React.Children.toArray(children).find(
      (child: any) => child?.type?.displayName === 'AdvancedFilters'
    );
    return slot || null;
  },
};

// Componentes auxiliares para os slots
export const FilterSelects: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex flex-col sm:flex-row gap-2">{children}</div>;
};
FilterSelects.displayName = 'FilterSelects';

export const ActionButtons: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
ActionButtons.displayName = 'ActionButtons';

export const AdvancedFilters: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
AdvancedFilters.displayName = 'AdvancedFilters';

// Componente de conteúdo da lista
interface ListPageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ListPageContent: React.FC<ListPageContentProps> = ({ 
  children, 
  className = "p-0" 
}) => {
  return (
    <CardContent className={className}>
      {children}
    </CardContent>
  );
}; 