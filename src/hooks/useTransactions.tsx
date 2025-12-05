/**
 * ================================================
 * HOOK DE TRANSAÇÕES (useTransactions)
 * ================================================
 * 
 * Este hook gerencia todas as operações relacionadas
 * a transações financeiras (receitas e despesas).
 * 
 * Utiliza React Query para:
 * - Cache automático de dados
 * - Refetch automático
 * - Mutações otimistas
 * - Gerenciamento de loading/error
 * 
 * Operações disponíveis:
 * - Listar transações
 * - Adicionar nova transação
 * - Atualizar transação existente
 * - Deletar transação
 */

// React Query hooks para queries e mutações
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Cliente Supabase
import { supabase } from '@/integrations/supabase/client';

// Hook de autenticação para obter o usuário atual
import { useAuth } from './useAuth';

// Tipos TypeScript
import { Transaction, TransactionFormData } from '@/types/finance';

// Hook de toast para notificações
import { toast } from '@/hooks/use-toast';

/**
 * Hook principal para gerenciamento de transações
 * 
 * @returns Objeto com transações, estados de loading e funções CRUD
 */
export function useTransactions() {
  // Obtém o usuário autenticado
  const { user } = useAuth();
  
  // Cliente do React Query para invalidar cache
  const queryClient = useQueryClient();

  // ==========================================
  // QUERY: BUSCAR TRANSAÇÕES
  // ==========================================
  
  /**
   * Query para buscar todas as transações do usuário
   * 
   * Características:
   * - Faz JOIN com a tabela de categorias
   * - Ordenado por data (mais recente primeiro)
   * - Só executa se houver usuário autenticado
   */
  const { data: transactions = [], isLoading, error } = useQuery({
    // Chave única para o cache (inclui user.id para isolar dados por usuário)
    queryKey: ['transactions', user?.id],
    
    // Função que busca os dados
    queryFn: async () => {
      // Se não há usuário, retorna array vazio
      if (!user) return [];
      
      // Busca transações com JOIN na tabela de categorias
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false }); // Mais recente primeiro

      if (error) throw error;
      return data as Transaction[];
    },
    
    // Só executa a query se houver usuário
    enabled: !!user,
  });

  // ==========================================
  // MUTATION: ADICIONAR TRANSAÇÃO
  // ==========================================
  
  /**
   * Mutação para adicionar nova transação
   * 
   * Após sucesso:
   * - Invalida o cache para refetch
   * - Exibe toast de sucesso
   */
  const addTransaction = useMutation({
    // Função que executa a mutação
    mutationFn: async (data: TransactionFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,          // ID do usuário proprietário
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        category_id: data.category_id || null, // Categoria opcional
        date: data.date,
      });

      if (error) throw error;
    },
    
    // Callback de sucesso
    onSuccess: () => {
      // Invalida o cache para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Notifica o usuário
      toast({
        title: 'Transação adicionada!',
        description: 'Sua transação foi registrada com sucesso.',
      });
    },
    
    // Callback de erro
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // MUTATION: ATUALIZAR TRANSAÇÃO
  // ==========================================
  
  /**
   * Mutação para atualizar transação existente
   * 
   * @param id - ID da transação a atualizar
   * @param data - Dados parciais para atualização
   */
  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id); // Garante que só atualiza transações do próprio usuário

      if (error) throw error;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Transação atualizada!',
        description: 'Sua transação foi atualizada com sucesso.',
      });
    },
    
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // MUTATION: DELETAR TRANSAÇÃO
  // ==========================================
  
  /**
   * Mutação para deletar transação
   * 
   * @param id - ID da transação a deletar
   */
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Garante que só deleta transações do próprio usuário

      if (error) throw error;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Transação removida!',
        description: 'Sua transação foi removida com sucesso.',
      });
    },
    
    onError: (error) => {
      toast({
        title: 'Erro ao remover transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================
  
  return {
    /** Array de transações do usuário */
    transactions,
    
    /** Indica se está carregando os dados */
    isLoading,
    
    /** Erro da query (se houver) */
    error,
    
    /** Função para adicionar transação */
    addTransaction,
    
    /** Função para atualizar transação */
    updateTransaction,
    
    /** Função para deletar transação */
    deleteTransaction,
  };
}
