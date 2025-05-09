import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  
  return (
    <div className={`flex items-center gap-2 text-destructive text-sm mt-1 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}