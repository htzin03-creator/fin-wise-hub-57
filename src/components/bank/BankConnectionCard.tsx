import { useState } from "react";
import { Building2, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankConnection } from "@/hooks/useBankConnections";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BankConnectionCardProps {
  connection: BankConnection;
  onRemove: (id: string) => Promise<boolean>;
  onSync: (connectionId: string, pluggyItemId: string) => Promise<boolean>;
  isSyncing?: boolean;
}

export function BankConnectionCard({ 
  connection, 
  onRemove, 
  onSync,
  isSyncing = false 
}: BankConnectionCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(connection.id);
    setIsRemoving(false);
  };

  const handleSync = async () => {
    await onSync(connection.id, connection.pluggy_item_id);
  };

  const lastSyncText = connection.last_sync_at
    ? `Sincronizado ${formatDistanceToNow(new Date(connection.last_sync_at), {
        addSuffix: true,
        locale: ptBR,
      })}`
    : "Nunca sincronizado";

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-3">
        {connection.connector_logo ? (
          <img
            src={connection.connector_logo}
            alt={connection.connector_name || "Bank"}
            className="w-10 h-10 rounded-full object-contain bg-background p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">
            {connection.connector_name || "Conta Bancária"}
          </p>
          <p className="text-sm text-muted-foreground">{lastSyncText}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={isSyncing}
          title="Sincronizar"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-destructive hover:text-destructive"
          title="Remover"
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
