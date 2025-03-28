import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center gap-2">
      <AlertCircle className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
};