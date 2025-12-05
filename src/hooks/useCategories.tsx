/**
 * ================================================
 * HOOK DE CATEGORIAS (useCategories)
 * ================================================
 * 
 * Este hook gerencia todas as operações relacionadas
 * a categorias de transações (receitas e despesas).
 * 
 * Categorias são usadas para classificar transações,
 * permitindo análises como "gastos por categoria".
 * 
 * Funcionalidades:
 * - CRUD de categorias
 * - Filtros por tipo (income/expense)
 * - Proteção de categorias padrão (não podem ser deletadas)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Category, CategoryFormData } from '@/types/finance';
import { toast } from '@/hooks/use-toast';

/**
 * Hook principal para gerenciamento de categorias
 * 
 * @returns Objeto com categorias, filtros, estados e funções CRUD
 */
export function useCategories() {
  // Obtém o usuário autenticado
  const { user } = useAuth();
  
  // Cliente do React Query para invalidar cache
  const queryClient = useQueryClient();

  // ==========================================
  // QUERY: BUSCAR CATEGORIAS
  // ==========================================
  
  /**
   * Query para buscar todas as categorias do usuário
   * 
   * Retorna tanto categorias customizadas quanto padrão
   * Ordenado alfabeticamente por nome
   */
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', user?.id],
    
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name'); // Ordem alfabética

      if (error) throw error;
      return data as Category[];
    },
    
    enabled: !!user,
  });

  // ==========================================
  // FILTROS DERIVADOS
  // ==========================================
  
  /**
   * Categorias filtradas por tipo
   * 
   * Útil para formulários de transação onde só mostramos
   * categorias relevantes ao tipo selecionado
   */
  
  /** Categorias de receita (salário, investimentos, etc.) */
  const incomeCategories = categories.filter(c => c.type === 'income');
  
  /** Categorias de despesa (alimentação, transporte, etc.) */
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // ==========================================
  // MUTATION: ADICIONAR CATEGORIA
  // ==========================================
  
  /**
   * Mutação para criar nova categoria
   * 
   * Categorias criadas pelo usuário são marcadas como
   * is_default: false, permitindo exclusão
   */
  const addCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: data.name,
        icon: data.icon,      // Nome do ícone Lucide
        color: data.color,    // Cor em hexadecimal
        type: data.type,      // 'income' ou 'expense'
        is_default: false,    // Categorias do usuário nunca são default
      });

      if (error) throw error;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Categoria criada!',
        description: 'Sua categoria foi criada com sucesso.',
      });
    },
    
    onError: (error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // MUTATION: ATUALIZAR CATEGORIA
  // ==========================================
  
  /**
   * Mutação para atualizar categoria existente
   * 
   * Permite atualização de nome, ícone, cor e tipo
   */
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Categoria atualizada!',
        description: 'Sua categoria foi atualizada com sucesso.',
      });
    },
    
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // MUTATION: DELETAR CATEGORIA
  // ==========================================
  
  /**
   * Mutação para deletar categoria
   * 
   * IMPORTANTE: Só deleta categorias não-padrão (is_default = false)
   * Categorias padrão são protegidas pelo filtro na query
   */
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_default', false); // Proteção adicional: não deleta defaults

      if (error) throw error;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Categoria removida!',
        description: 'Sua categoria foi removida com sucesso.',
      });
    },
    
    onError: (error) => {
      toast({
        title: 'Erro ao remover categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // RETORNO DO HOOK
  // ==========================================
  
  return {
    /** Todas as categorias do usuário */
    categories,
    
    /** Categorias filtradas: apenas receitas */
    incomeCategories,
    
    /** Categorias filtradas: apenas despesas */
    expenseCategories,
    
    /** Indica se está carregando */
    isLoading,
    
    /** Erro da query */
    error,
    
    /** Função para criar categoria */
    addCategory,
    
    /** Função para atualizar categoria */
    updateCategory,
    
    /** Função para deletar categoria */
    deleteCategory,
  };
}
