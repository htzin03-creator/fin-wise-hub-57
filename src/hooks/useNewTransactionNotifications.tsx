/**
 * Hook para notificações de novas transações bancárias
 * 
 * Gerencia o contador de novas transações e notificações
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "last_seen_bank_transactions_count";

export function useNewTransactionNotifications() {
  const { user } = useAuth();
  const [newTransactionsCount, setNewTransactionsCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Busca contagem inicial
  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setTotalCount(count);
        
        // Verifica se há novas transações desde a última vez
        const lastSeenCount = parseInt(localStorage.getItem(STORAGE_KEY) || "0");
        const newCount = Math.max(0, count - lastSeenCount);
        setNewTransactionsCount(newCount);
      }
    };

    fetchCount();
  }, [user]);

  // Escuta novas transações em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-transactions-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New transaction notification:', payload);
          setNewTransactionsCount(prev => prev + 1);
          setTotalCount(prev => prev + 1);
          
          // Mostra notificação toast
          toast.success("Nova transação bancária detectada!", {
            description: payload.new.description || "Transação sincronizada",
            action: {
              label: "Ver",
              onClick: () => window.location.href = "/transactions",
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Marca todas como visualizadas
  const markAllAsSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, totalCount.toString());
    setNewTransactionsCount(0);
  }, [totalCount]);

  // Limpa contagem
  const clearNotifications = useCallback(() => {
    setNewTransactionsCount(0);
    localStorage.setItem(STORAGE_KEY, totalCount.toString());
  }, [totalCount]);

  return {
    newTransactionsCount,
    markAllAsSeen,
    clearNotifications,
    hasNewTransactions: newTransactionsCount > 0,
  };
}
