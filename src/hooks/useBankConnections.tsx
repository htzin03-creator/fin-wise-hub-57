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

export function useBankConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

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
    toast.success("Conta bancária conectada com sucesso!");
    return data;
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
    toast.success("Conexão bancária removida");
    return true;
  };

  return {
    connections,
    isLoading,
    fetchConnections,
    addConnection,
    removeConnection,
  };
}
