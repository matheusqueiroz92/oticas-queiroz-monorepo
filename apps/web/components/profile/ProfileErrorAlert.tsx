import { Button } from "react-day-picker";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ProfileErrorAlertProps {
  handleBackToDashboard: () => void;
}

export function ProfileErrorAlert({ handleBackToDashboard }: ProfileErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Não foi possível carregar seu perfil. Por favor, tente novamente mais tarde.
      </AlertDescription>
      <Button className="mt-4" onClick={handleBackToDashboard}>
        Voltar para o Dashboard
      </Button>
  </Alert>
  );
}