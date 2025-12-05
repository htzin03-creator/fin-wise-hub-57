/**
 * ================================================
 * HOOK DE METAS FINANCEIRAS (useGoals)
 * ================================================
 * 
 * Este hook gerencia todas as operações relacionadas
 * a metas financeiras (objetivos de economia).
 * 
 * Funcionalidades:
 * - CRUD de metas (criar, ler, atualizar, deletar)
 * - Adicionar valor a uma meta
 * - Auto-progresso baseado em receitas bancárias (realtime)
 * 
 * Utiliza React Query para cache e Supabase Realtime
 * para atualizações automáticas.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Goal, GoalFormData } from '@/types/finance';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

/**
 * Hook principal para gerenciamento de metas financeiras
 * 
 * @returns Objeto com metas, estados de loading e funções CRUD
 */
export function useGoals() {
  // Obtém o usuário autenticado
  const { user } = useAuth();
  
  // Cliente do React Query para invalidar cache
  const queryClient = useQueryClient();
  
  // Ref para evitar processamento duplicado de saldo
  const lastProcessedBalance = useRef<number | null>(null);

  // ==========================================
  // QUERY: BUSCAR METAS
  // ==========================================
  
  /**
   * Query para buscar todas as metas do usuário
   * 
   * Ordenado por deadline (mais próximo primeiro)
   * Metas sem deadline ficam por último
   */
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

  // ==========================================
  // REALTIME: AUTO-PROGRESSO DE METAS
  // ==========================================
  
  /**
   * Efeito que configura subscription realtime para
   * auto-progresso de metas quando novas receitas são detectadas
   * 
   * Funciona assim:
   * 1. Escuta inserções na tabela bank_transactions
   * 2. Quando detecta uma receita (amount > 0)
   * 3. Adiciona 10% do valor à primeira meta incompleta
   */
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for goal auto-progress");
    
    // Cria canal de subscription para transações bancárias
    const channel = supabase
      .channel('bank-transactions-for-goals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',                    // Só escuta inserções
          schema: 'public',
          table: 'bank_transactions',
          filter: `user_id=eq.${user.id}`     // Filtra pelo usuário atual
        },
        async (payload) => {
          // Extrai dados da nova transação
          const transaction = payload.new as { amount: number; type: string | null };
          
          // Só processa se for receita (valor positivo ou tipo CREDIT)
          if (transaction.amount > 0 || transaction.type === 'CREDIT') {
            const incomeAmount = Math.abs(transaction.amount);
            console.log("New income detected for goals:", incomeAmount);
            
            // Busca metas atuais do usuário
            const { data: currentGoals } = await supabase
              .from('goals')
              .select('*')
              .eq('user_id', user.id)
              .order('deadline', { ascending: true, nullsFirst: false });
            
            if (currentGoals && currentGoals.length > 0) {
              // Filtra metas que ainda não foram completadas
              const incompleteGoals = currentGoals.filter(
                g => Number(g.current_amount) < Number(g.target_amount)
              );
              
              if (incompleteGoals.length > 0) {
                // Pega a primeira meta incompleta (mais urgente)
                const targetGoal = incompleteGoals[0];
                
                // Calcula 10% da receita para adicionar à meta
                const amountToAdd = incomeAmount * 0.1;
                
                // Calcula novo valor (não excede o target)
                const newAmount = Math.min(
                  Number(targetGoal.current_amount) + amountToAdd,
                  Number(targetGoal.target_amount)
                );
                
                // Atualiza a meta no banco
                await supabase
                  .from('goals')
                  .update({ current_amount: newAmount })
                  .eq('id', targetGoal.id);
                
                // Invalida cache para atualizar UI
                queryClient.invalidateQueries({ queryKey: ['goals'] });
                
                // Notifica o usuário
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

    // Cleanup: Remove o canal quando componente desmonta
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // ==========================================
  // MUTATION: ADICIONAR META
  // ==========================================
  
  /**
   * Mutação para criar nova meta
   * Inicializa current_amount como 0
   */
  const addGoal = useMutation({
    mutationFn: async (data: GoalFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name: data.name,
        target_amount: data.target_amount,
        currency: data.currency,
        deadline: data.deadline || null,
        current_amount: 0, // Começa do zero
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

  // ==========================================
  // MUTATION: ATUALIZAR META
  // ==========================================
  
  /**
   * Mutação para atualizar meta existente
   * Permite atualização parcial dos campos
   */
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

  // ==========================================
  // MUTATION: DELETAR META
  // ==========================================
  
  /**
   * Mutação para deletar meta
   */
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

  // ==========================================
  // MUTATION: ADICIONAR VALOR À META
  // ==========================================
  
  /**
   * Mutação para adicionar valor manualmente a uma meta
   * 
   * @param id - ID da meta
   * @param amount - Valor a adicionar
   */
  const addToGoal = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Busca a meta atual para somar ao current_amount
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Meta não encontrada');

      // Calcula novo valor
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

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================
  
  return {
    /** Array de metas do usuário */
    goals,
    
    /** Indica se está carregando */
    isLoading,
    
    /** Erro da query */
    error,
    
    /** Função para criar meta */
    addGoal,
    
    /** Função para atualizar meta */
    updateGoal,
    
    /** Função para deletar meta */
    deleteGoal,
    
    /** Função para adicionar valor à meta */
    addToGoal,
  };
}
