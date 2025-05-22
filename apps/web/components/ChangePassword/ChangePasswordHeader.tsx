import { Shield, Key } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

interface ChangePasswordHeaderProps {
  onBack: () => void;
}

export function ChangePasswordHeader({ onBack }: ChangePasswordHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <BackButton
          onClick={onBack}
          label="Voltar"
        />
        <h1 className="text-2xl font-bold text-[var(--secondary-red)]">Alterar Senha</h1>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Shield className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Dicas de Segurança</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-start gap-2">
                <Key className="h-3 w-3 mt-1 flex-shrink-0" />
                <span>Use uma senha forte com pelo menos 8 caracteres</span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="h-3 w-3 mt-1 flex-shrink-0" />
                <span>Inclua letras maiúsculas, minúsculas, números e símbolos</span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="h-3 w-3 mt-1 flex-shrink-0" />
                <span>Não compartilhe sua senha com outras pessoas</span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="h-3 w-3 mt-1 flex-shrink-0" />
                <span>Altere sua senha regularmente para maior segurança</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}