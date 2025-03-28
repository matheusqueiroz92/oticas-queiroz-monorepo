// Componente para depuração - remova após confirmar que tudo funciona
import { useState } from 'react';

interface DebugFiltersProps {
  filters: Record<string, any>;
}

export const DebugFilters: React.FC<DebugFiltersProps> = ({ filters }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  const hasFilters = filters && Object.keys(filters).length > 0;
  
  return (
    <div className="bg-gray-100 p-2 text-xs border border-gray-300 rounded mb-2">
      <div 
        className="font-bold mb-1 flex justify-between items-center cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <span>Debug - Filtros Ativos: {hasFilters ? Object.keys(filters).length : 'Nenhum'}</span>
        <span>{expanded ? '▼' : '►'}</span>
      </div>
      
      {expanded && (
        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(filters, null, 2)}
        </pre>
      )}
    </div>
  );
};