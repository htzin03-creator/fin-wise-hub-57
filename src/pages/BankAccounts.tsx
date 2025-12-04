import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectBankButton } from "@/components/bank/ConnectBankButton";
import { BankConnectionCard } from "@/components/bank/BankConnectionCard";
import { useBankConnections } from "@/hooks/useBankConnections";
import { Building2, Loader2 } from "lucide-react";

export default function BankAccounts() {
  const { connections, isLoading, addConnection, removeConnection } =
    useBankConnections();

  const handleConnectionSuccess = async (
    itemId: string,
    connectorName?: string,
    connectorLogo?: string
  ) => {
    await addConnection(itemId, connectorName, connectorLogo);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Contas Bancárias
          </h1>
          <p className="text-muted-foreground">
            Conecte suas contas para importar transações automaticamente
          </p>
        </div>
        <ConnectBankButton onSuccess={handleConnectionSuccess} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : connections.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma conta conectada
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Conecte suas contas bancárias para importar suas transações
              automaticamente e ter uma visão completa das suas finanças.
            </p>
            <ConnectBankButton onSuccess={handleConnectionSuccess} />
          </CardContent>
        </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Contas Conectadas</CardTitle>
                <CardDescription>
                  {connections.length} conta(s) conectada(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.map((connection) => (
                  <BankConnectionCard
                    key={connection.id}
                    connection={connection}
                    onRemove={removeConnection}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}
