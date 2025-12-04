import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BankConnection {
  id: string;
  user_id: string;
  pluggy_item_id: string;
  connector_name: string | null;
  connector_logo: string | null;
  status: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_connection_id: string;
  pluggy_account_id: string;
  name: string | null;
  type: string | null;
  subtype: string | null;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useBankConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchAccounts();
    }
  }, [user]);

  // Real-time subscription for bank accounts (balance changes)
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for bank_accounts");
    
    const channel = supabase
      .channel('bank-accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bank account change received:', payload);
          if (payload.eventType === 'INSERT') {
            setAccounts(prev => [payload.new as BankAccount, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAccounts(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new as BankAccount : a)
            );
          } else if (payload.eventType === 'DELETE') {
            setAccounts(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Bank accounts realtime subscription status:', status);
      });

    return () => {
      console.log("Cleaning up bank_accounts realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (!user || connections.length === 0) return;

    const syncAllConnections = async () => {
      console.log("Auto-syncing all bank connections...");
      for (const connection of connections) {
        await syncConnection(connection.id, connection.pluggy_item_id);
      }
    };

    // Sync on mount if there are connections
    syncAllConnections();

    // Set up interval for periodic sync (every 5 minutes)
    const intervalId = setInterval(syncAllConnections, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user, connections.length]);

  const fetchConnections = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("bank_connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bank connections:", error);
      toast.error("Erro ao carregar conexões bancárias");
    } else {
      setConnections(data || []);
    }
    setIsLoading(false);
  };

  const fetchAccounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bank accounts:", error);
    } else {
      setAccounts((data as BankAccount[]) || []);
    }
  };

  const addConnection = async (
    pluggyItemId: string,
    connectorName?: string,
    connectorLogo?: string
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("bank_connections")
      .insert({
        user_id: user.id,
        pluggy_item_id: pluggyItemId,
        connector_name: connectorName,
        connector_logo: connectorLogo,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding bank connection:", error);
      toast.error("Erro ao salvar conexão bancária");
      return null;
    }

    setConnections((prev) => [data, ...prev]);
    toast.success("Conta bancária conectada! Sincronizando dados...");
    
    // Auto sync after adding
    await syncConnection(data.id, pluggyItemId);
    
    return data;
  };

  const syncConnection = async (connectionId: string, pluggyItemId: string) => {
    if (!user) return false;

    setIsSyncing(true);

    try {
      console.log("Starting sync for connection:", connectionId);
      // Note: userId is now extracted from JWT token server-side for security
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { 
          action: "sync",
          itemId: pluggyItemId,
          connectionId: connectionId,
        },
      });

      if (error) {
        console.error("Sync error:", error);
        toast.error("Erro ao sincronizar dados");
        return false;
      }

      console.log("Sync result:", data);
      toast.success(`Sincronizado: ${data.accounts} conta(s), ${data.transactions} transação(ões)`);
      
      // Refresh data
      await fetchConnections();
      await fetchAccounts();
      
      return true;
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Erro ao sincronizar dados");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const removeConnection = async (id: string) => {
    const { error } = await supabase
      .from("bank_connections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing bank connection:", error);
      toast.error("Erro ao remover conexão bancária");
      return false;
    }

    setConnections((prev) => prev.filter((c) => c.id !== id));
    setAccounts((prev) => prev.filter((a) => a.bank_connection_id !== id));
    toast.success("Conexão bancária removida");
    return true;
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };

  return {
    connections,
    accounts,
    isLoading,
    isSyncing,
    fetchConnections,
    fetchAccounts,
    addConnection,
    syncConnection,
    removeConnection,
    getTotalBalance,
  };
}
