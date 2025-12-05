// Hook para gerenciar metas financeiras
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Goal, GoalFormData } from '@/types/finance';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastProcessedBalance = useRef<number | null>(null);

  // Buscar todas as metas do usuário
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  // Auto-progress goals when bank balance increases (new income)
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for goal auto-progress");
    
    const channel = supabase
      .channel('bank-transactions-for-goals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const transaction = payload.new as { amount: number; type: string | null };
          
          // Only process income (positive amounts or type='CREDIT')
          if (transaction.amount > 0 || transaction.type === 'CREDIT') {
            const incomeAmount = Math.abs(transaction.amount);
            console.log("New income detected for goals:", incomeAmount);
            
            // Get current goals and distribute income
            const { data: currentGoals } = await supabase
              .from('goals')
              .select('*')
              .eq('user_id', user.id)
              .order('deadline', { ascending: true, nullsFirst: false });
            
            if (currentGoals && currentGoals.length > 0) {
              // Find incomplete goals and add percentage of income
              const incompleteGoals = currentGoals.filter(
                g => Number(g.current_amount) < Number(g.target_amount)
              );
              
              if (incompleteGoals.length > 0) {
                // Add 10% of income to the first incomplete goal
                const targetGoal = incompleteGoals[0];
                const amountToAdd = incomeAmount * 0.1; // 10% of income
                const newAmount = Math.min(
                  Number(targetGoal.current_amount) + amountToAdd,
                  Number(targetGoal.target_amount)
                );
                
                await supabase
                  .from('goals')
                  .update({ current_amount: newAmount })
                  .eq('id', targetGoal.id);
                
                queryClient.invalidateQueries({ queryKey: ['goals'] });
                
                toast({
                  title: 'Meta atualizada automaticamente!',
                  description: `Adicionado R$ ${amountToAdd.toFixed(2)} à meta "${targetGoal.name}"`,
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Goals auto-progress subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Adicionar nova meta
  const addGoal = useMutation({
    mutationFn: async (data: GoalFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name: data.name,
        target_amount: data.target_amount,
        currency: data.currency,
        deadline: data.deadline || null,
        current_amount: 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Meta criada!',
        description: 'Sua meta foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar meta
  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Goal> }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('goals')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Meta atualizada!',
        description: 'Sua meta foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar meta
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Meta removida!',
        description: 'Sua meta foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Adicionar valor à meta
  const addToGoal = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Meta não encontrada');

      const newAmount = Number(goal.current_amount) + amount;

      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Valor adicionado!',
        description: 'O valor foi adicionado à sua meta.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar valor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
  };
}
