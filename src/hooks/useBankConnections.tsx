/**
 * ================================================
 * HOOK DE CONEXÕES BANCÁRIAS (useBankConnections)
 * ================================================
 * 
 * Este hook gerencia a integração com contas bancárias
 * através da API Pluggy (Open Banking).
 * 
 * Funcionalidades:
 * - Listar conexões bancárias
 * - Listar contas bancárias
 * - Adicionar nova conexão
 * - Sincronizar dados (transações e saldos)
 * - Remover conexão
 * - Auto-sync a cada 15 minutos
 * - Realtime para atualizações de saldo
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// ============================================
// INTERFACES
// ============================================

/**
 * Interface para conexão bancária
 * 
 * Representa a ligação com uma instituição financeira
 */
export interface BankConnection {
  /** ID único da conexão */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** ID do item no Pluggy */
  pluggy_item_id: string;
  
  /** Nome do banco/instituição */
  connector_name: string | null;
  
  /** URL do logo do banco */
  connector_logo: string | null;
  
  /** Status da conexão (UPDATED, UPDATING, LOGIN_ERROR, etc.) */
  status: string | null;
  
  /** Data da última sincronização */
  last_sync_at: string | null;
  
  /** Data de criação */
  created_at: string;
  
  /** Data da última atualização */
  updated_at: string;
}

/**
 * Interface para conta bancária
 * 
 * Uma conexão pode ter múltiplas contas (corrente, poupança, etc.)
 */
export interface BankAccount {
  /** ID único da conta */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** ID da conexão bancária pai */
  bank_connection_id: string;
  
  /** ID da conta no Pluggy */
  pluggy_account_id: string;
  
  /** Nome da conta */
  name: string | null;
  
  /** Tipo (CHECKING, SAVINGS, etc.) */
  type: string | null;
  
  /** Subtipo mais específico */
  subtype: string | null;
  
  /** Saldo atual */
  balance: number;
  
  /** Moeda (BRL, USD, etc.) */
  currency: string;
  
  /** Data de criação */
  created_at: string;
  
  /** Data da última atualização */
  updated_at: string;
}

/**
 * Hook principal para gerenciamento de conexões bancárias
 */
export function useBankConnections() {
  const { user } = useAuth();
  
  // ==========================================
  // ESTADOS
  // ==========================================
  
  /** Lista de conexões bancárias */
  const [connections, setConnections] = useState<BankConnection[]>([]);
  
  /** Lista de contas bancárias */
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  
  /** Flag de carregamento inicial */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Flag de sincronização em andamento */
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Refs para evitar closure stale em callbacks
  const connectionsRef = useRef<BankConnection[]>([]);
  const isSyncingRef = useRef(false);

  // ==========================================
  // SINCRONIZAÇÃO DE REFS
  // ==========================================
  
  // Mantém refs sincronizadas com state
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  // ==========================================
  // CARREGAMENTO INICIAL
  // ==========================================
  
  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchAccounts();
    }
  }, [user]);

  // ==========================================
  // REALTIME: ATUALIZAÇÕES DE SALDO
  // ==========================================
  
  /**
   * Subscription realtime para mudanças em bank_accounts
   * 
   * Atualiza automaticamente quando o saldo muda
   */
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for bank_accounts");
    
    const channel = supabase
      .channel('bank-accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',                           // Todos os eventos
          schema: 'public',
          table: 'bank_accounts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bank account change received:', payload);
          
          // Trata cada tipo de evento
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

    // Cleanup
    return () => {
      console.log("Cleaning up bank_accounts realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ==========================================
  // AUTO-SYNC PERIÓDICO
  // ==========================================
  
  /**
   * Efeito que configura sincronização automática
   * 
   * - Sync inicial após 5 segundos
   * - Sync periódico a cada 15 minutos
   */
  useEffect(() => {
    if (!user) return;

    const autoSync = async () => {
      const currentConnections = connectionsRef.current;
      
      // Não sincroniza se não tem conexões ou já está sincronizando
      if (currentConnections.length === 0 || isSyncingRef.current) {
        console.log("Skipping auto-sync: no connections or already syncing");
        return;
      }

      console.log("Auto-syncing all bank connections...", new Date().toLocaleTimeString());
      
      // Sincroniza cada conexão
      for (const connection of currentConnections) {
        try {
          await syncConnectionDirect(connection.id, connection.pluggy_item_id);
        } catch (error) {
          console.error("Auto-sync error for connection:", connection.id, error);
        }
      }
    };

    // Sync inicial após 5 segundos
    const initialTimeout = setTimeout(() => {
      autoSync();
    }, 5000);

    // Sync periódico a cada 5 minutos
    const intervalId = setInterval(autoSync, 5 * 60 * 1000);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [user]);

  // ==========================================
  // FUNÇÕES DE FETCH
  // ==========================================
  
  /**
   * Busca todas as conexões bancárias do usuário
   */
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

  /**
   * Busca todas as contas bancárias do usuário
   */
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

  // ==========================================
  // FUNÇÕES DE CONEXÃO
  // ==========================================
  
  /**
   * Adiciona nova conexão bancária
   * 
   * @param pluggyItemId - ID do item retornado pelo Pluggy Connect
   * @param connectorName - Nome do banco
   * @param connectorLogo - URL do logo
   */
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

    // Atualiza estado local
    setConnections((prev) => [data, ...prev]);
    toast.success("Conta bancária conectada! Sincronizando dados...");
    
    // Auto sync após adicionar
    await syncConnection(data.id, pluggyItemId);
    
    return data;
  };

  /**
   * Solicita refresh completo dos dados ao banco
   * 
   * Diferente do sync, isso pede ao Pluggy para
   * buscar dados atualizados diretamente do banco
   */
  const refreshConnection = async (connectionId: string, pluggyItemId: string) => {
    if (!user) return false;

    setIsSyncing(true);

    try {
      console.log("Triggering refresh for connection:", connectionId);
      toast.info("Solicitando novos dados ao banco...");
      
      // Chama edge function para solicitar refresh
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke("pluggy", {
        body: { 
          action: "refresh",
          itemId: pluggyItemId,
          connectionId: connectionId,
        },
      });

      if (refreshError) {
        console.error("Refresh error:", refreshError);
        toast.error("Erro ao solicitar atualização do banco");
        return false;
      }

      console.log("Refresh triggered:", refreshData);
      
      // Polling para aguardar conclusão (máximo 30 segundos)
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: statusData } = await supabase.functions.invoke("pluggy", {
          body: { 
            action: "get-item-status",
            itemId: pluggyItemId,
            connectionId: connectionId,
          },
        });
        
        console.log("Item status:", statusData?.status);
        
        // Sai do loop se atualização completou ou falhou
        if (statusData?.status === 'UPDATED' || statusData?.status === 'LOGIN_ERROR') {
          break;
        }
        
        if (statusData?.status === 'UPDATING') {
          attempts++;
          continue;
        }
        
        break;
      }
      
      // Agora sincroniza os dados
      return await syncConnection(connectionId, pluggyItemId);
    } catch (error) {
      console.error("Error refreshing:", error);
      toast.error("Erro ao atualizar dados");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sync silencioso para auto-sync (sem toasts exceto para novas transações)
   */
  const syncConnectionDirect = async (connectionId: string, pluggyItemId: string) => {
    try {
      console.log("Auto-sync for connection:", connectionId);
      
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { 
          action: "sync",
          itemId: pluggyItemId,
          connectionId: connectionId,
        },
      });

      if (error) {
        console.error("Auto-sync error:", error);
        return false;
      }

      console.log("Auto-sync result:", data);
      
      // Só notifica se houver novas transações
      if (data.transactions > 0) {
        toast.success(`${data.transactions} nova(s) transação(ões) sincronizada(s)`);
        await fetchConnections();
        await fetchAccounts();
      }
      
      return true;
    } catch (error) {
      console.error("Auto-sync error:", error);
      return false;
    }
  };

  /**
   * Sincroniza dados de uma conexão (com feedback visual)
   */
  const syncConnection = async (connectionId: string, pluggyItemId: string) => {
    if (!user) return false;

    setIsSyncing(true);

    try {
      console.log("Starting sync for connection:", connectionId);
      
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
      
      // Feedback baseado no resultado
      if (data.transactions > 0) {
        toast.success(`Sincronizado: ${data.accounts} conta(s), ${data.transactions} nova(s) transação(ões)`);
      } else {
        toast.info("Sincronizado - nenhuma transação nova encontrada");
      }
      
      // Atualiza dados locais
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

  /**
   * Remove conexão bancária
   * 
   * Remove também todas as contas e transações associadas (cascade)
   */
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

    // Atualiza estado local
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setAccounts((prev) => prev.filter((a) => a.bank_connection_id !== id));
    toast.success("Conexão bancária removida");
    return true;
  };

  // ==========================================
  // FUNÇÕES UTILITÁRIAS
  // ==========================================
  
  /**
   * Calcula saldo total de todas as contas
   */
  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================
  
  return {
    /** Lista de conexões bancárias */
    connections,
    
    /** Lista de contas bancárias */
    accounts,
    
    /** Flag de carregamento */
    isLoading,
    
    /** Flag de sincronização */
    isSyncing,
    
    /** Recarrega conexões */
    fetchConnections,
    
    /** Recarrega contas */
    fetchAccounts,
    
    /** Adiciona nova conexão */
    addConnection,
    
    /** Solicita refresh ao banco */
    refreshConnection,
    
    /** Sincroniza dados */
    syncConnection,
    
    /** Remove conexão */
    removeConnection,
    
    /** Calcula saldo total */
    getTotalBalance,
  };
}
