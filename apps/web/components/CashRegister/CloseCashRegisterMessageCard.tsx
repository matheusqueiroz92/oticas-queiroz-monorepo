import router from "next/router";
import { Button } from "react-day-picker";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function CloseCashRegisterMessageCard() {
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-yellow-800">Caixa já fechado</CardTitle>
        <CardDescription className="text-yellow-700">
          Este caixa já foi fechado e não pode ser fechado novamente.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => router.push("/cash-register")}>
          Voltar para Caixas
        </Button>
      </CardFooter>
    </Card>
  );
}