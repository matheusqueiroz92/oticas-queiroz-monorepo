import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { BackButton } from "../ui/back-button";

interface ErrorCashRegisterCardProps {
  errorMessage: string;
  navigateToCashRegister: () => void;
}

export function ErrorCashRegisterCard({ 
  errorMessage,
  navigateToCashRegister
}: ErrorCashRegisterCardProps) {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800">Erro</CardTitle>
        <CardDescription className="text-red-700">
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <BackButton
          onClick={navigateToCashRegister}
          label="Voltar para Caixas"
        />
      </CardFooter>
    </Card>
  );
}