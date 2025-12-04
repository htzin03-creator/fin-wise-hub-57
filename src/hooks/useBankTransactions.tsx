import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
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
  };

  return {
    transactions,
    isLoading,
    fetchTransactions,
  };
}
