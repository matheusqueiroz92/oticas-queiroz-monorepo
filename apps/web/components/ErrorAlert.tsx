import { AlertCircle } from "lucide-react"; // Importe o ícone de alerta do Lucide

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
      <AlertCircle className="h-5 w-5" /> {/* Ícone de alerta do Lucide */}
      <span>{message}</span>
    </div>
  );
};
