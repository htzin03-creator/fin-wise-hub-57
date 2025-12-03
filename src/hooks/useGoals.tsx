// Hook para gerenciar metas financeiras
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Goal, GoalFormData } from '@/types/finance';
import { toast } from '@/hooks/use-toast';

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
