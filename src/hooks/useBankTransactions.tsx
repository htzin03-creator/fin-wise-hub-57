/**
 * ================================================
 * HOOK DE TRANSAÇÕES BANCÁRIAS (useBankTransactions)
 * ================================================
 * 
 * Este hook gerencia transações importadas automaticamente
 * das contas bancárias conectadas via Open Banking.
 * 
 * Diferente das transações manuais (useTransactions),
 * estas são sincronizadas automaticamente e atualizadas
 * em tempo real via Supabase Realtime.
 * 
 * Funcionalidades:
 * - Listar transações bancárias
 * - Atualização em tempo real (realtime)
 * - Integração com Pluggy API
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ============================================
// INTERFACE
// ============================================

/**
 * Interface para transação bancária
 * 
 * Representa uma transação importada automaticamente
 * do banco via Open Banking
 */
export interface BankTransaction {
  /** ID único da transação */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** ID da conta bancária de origem */
  bank_account_id: string;
  
  /** ID da transação no Pluggy (para deduplicação) */
  pluggy_transaction_id: string;
  
  /** Descrição da transação (vem do banco) */
  description: string | null;
  
  /** Valor (negativo = saída, positivo = entrada) */
  amount: number;
  
  /** Data da transação (formato YYYY-MM-DD) */
  date: string;
  
  /** Tipo (CREDIT, DEBIT, etc.) */
  type: string | null;
  
  /** Categoria do banco */
  category: string | null;
  
  /** Dados adicionais de pagamento (JSON) */
  payment_data: any;
  
  /** Data de criação do registro */
  created_at: string;
}

/**
 * Hook principal para gerenciamento de transações bancárias
 * 
 * @returns Objeto com transações, estado e função de fetch
 */
export function useBankTransactions() {
  const { user } = useAuth();
  
  // ==========================================
  // ESTADOS
  // ==========================================
  
  /** Lista de transações bancárias */
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  
  /** Flag de carregamento */
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // FUNÇÃO DE FETCH
  // ==========================================
  
  /**
   * Busca todas as transações bancárias do usuário
   * 
   * useCallback para memoização e uso em dependências
   */
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .order("date", { ascending: false }); // Mais recente primeiro

    if (error) {
      console.error("Error fetching bank transactions:", error);
    } else {
      setTransactions((data as BankTransaction[]) || []);
    }
    
    setIsLoading(false);
  }, [user]);

  // ==========================================
  // CARREGAMENTO INICIAL
  // ==========================================
  
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // ==========================================
  // REALTIME: ATUALIZAÇÕES AUTOMÁTICAS
  // ==========================================
  
  /**
   * Subscription realtime para mudanças em bank_transactions
   * 
   * Escuta:
   * - INSERT: Nova transação sincronizada
   * - UPDATE: Transação atualizada (raro)
   * - DELETE: Transação removida
   * 
   * Isso permite que novas transações apareçam automaticamente
   * sem necessidade de refresh manual
   */
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for bank_transactions");
    
    const channel = supabase
      .channel('bank-transactions-changes')
      // Listener para INSERT
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New bank transaction received:', payload);
          // Adiciona nova transação no início da lista
          setTransactions(prev => [payload.new as BankTransaction, ...prev]);
        }
      )
      // Listener para UPDATE
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bank transaction updated:', payload);
          // Atualiza transação existente
          setTransactions(prev => 
            prev.map(t => t.id === payload.new.id ? payload.new as BankTransaction : t)
          );
        }
      )
      // Listener para DELETE
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bank transaction deleted:', payload);
          // Remove transação da lista
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Bank transactions realtime subscription status:', status);
      });

    // Cleanup: Remove subscription quando componente desmonta
    return () => {
      console.log("Cleaning up bank_transactions realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================
  
  return {
    /** Lista de transações bancárias */
    transactions,
    
    /** Flag de carregamento */
    isLoading,
    
    /** Função para recarregar transações */
    fetchTransactions,
  };
}
