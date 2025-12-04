import { Building2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BankConnection } from "@/hooks/useBankConnections";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BankConnectionCardProps {
  connection: BankConnection;
  onRemove: (id: string) => void;
  onSync?: (id: string) => void;
}

export function BankConnectionCard({
  connection,
  onRemove,
  onSync,
}: BankConnectionCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connection.connector_logo ? (
              <img
                src={connection.connector_logo}
                alt={connection.connector_name || "Banco"}
                className="w-10 h-10 rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">
                {connection.connector_name || "Conta Bancária"}
              </p>
              <p className="text-xs text-muted-foreground">
                {connection.last_sync_at
                  ? `Sincronizado em ${format(
                      new Date(connection.last_sync_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}`
                  : "Nunca sincronizado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSync && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSync(connection.id)}
                title="Sincronizar"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(connection.id)}
              className="text-destructive hover:text-destructive"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
