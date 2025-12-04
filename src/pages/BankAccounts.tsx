import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectBankButton } from "@/components/bank/ConnectBankButton";
import { BankConnectionCard } from "@/components/bank/BankConnectionCard";
import { useBankConnections } from "@/hooks/useBankConnections";
import { Building2, Loader2, Wallet, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function BankAccounts() {
  const { 
    connections, 
    accounts,
    isLoading, 
    isSyncing,
    addConnection, 
    removeConnection,
    syncConnection,
    getTotalBalance,
  } = useBankConnections();

  const handleConnectionSuccess = async (
    itemId: string,
    connectorName?: string,
    connectorLogo?: string
  ) => {
    await addConnection(itemId, connectorName, connectorLogo);
  };

  const totalBalance = getTotalBalance();

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

      {/* Balance Summary */}
      {accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Em {accounts.length} conta(s)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Suas Contas</CardTitle>
            <CardDescription>
              Saldos atualizados das suas contas conectadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {account.name || "Conta"}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {account.type} {account.subtype && `• ${account.subtype}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${account.balance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">{account.currency}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Conexões Bancárias</CardTitle>
            <CardDescription>
              {connections.length} conexão(ões) ativa(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((connection) => (
              <BankConnectionCard
                key={connection.id}
                connection={connection}
                onRemove={removeConnection}
                onSync={syncConnection}
                isSyncing={isSyncing}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
