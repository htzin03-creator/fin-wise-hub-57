import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BankTransaction {
  id: string;
  user_id: string;
  bank_account_id: string;
  pluggy_transaction_id: string;
  description: string | null;
  amount: number;
  date: string;
  type: string | null;
  category: string | null;
  payment_data: any;
  created_at: string;
}

export function useBankTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching bank transactions:", error);
    } else {
      setTransactions((data as BankTransaction[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // Real-time subscription for bank transactions
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for bank_transactions");
    
    const channel = supabase
      .channel('bank-transactions-changes')
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
          setTransactions(prev => [payload.new as BankTransaction, ...prev]);
        }
      )
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
          setTransactions(prev => 
            prev.map(t => t.id === payload.new.id ? payload.new as BankTransaction : t)
          );
        }
      )
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
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Bank transactions realtime subscription status:', status);
      });

    return () => {
      console.log("Cleaning up bank_transactions realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    transactions,
    isLoading,
    fetchTransactions,
  };
}
