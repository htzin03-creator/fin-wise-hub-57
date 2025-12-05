/**
 * ================================================
 * TIPOS TYPESCRIPT PARA O SISTEMA FINANCEIRO
 * ================================================
 * 
 * Este arquivo define todas as interfaces e tipos
 * utilizados no sistema de controle financeiro.
 * 
 * Organização:
 * - Tipos básicos (enums)
 * - Interfaces de entidades (Category, Transaction, Goal, Profile)
 * - Tipos para formulários
 * - Tipos para estatísticas
 */

// ============================================
// TIPOS BÁSICOS (ENUMS)
// ============================================

/**
 * Tipo de transação financeira
 * - 'income': Receita/Entrada de dinheiro
 * - 'expense': Despesa/Saída de dinheiro
 */
export type TransactionType = 'income' | 'expense';

/**
 * Tipos de moeda suportados
 * - 'BRL': Real Brasileiro
 * - 'USD': Dólar Americano
 */
export type CurrencyType = 'BRL' | 'USD';

// ============================================
// INTERFACES DE ENTIDADES
// ============================================

/**
 * Interface para Categoria
 * 
 * Categorias são usadas para classificar transações
 * Ex: Alimentação, Transporte, Salário, etc.
 */
export interface Category {
  /** ID único da categoria (UUID) */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** Nome da categoria */
  name: string;
  
  /** Nome do ícone Lucide a ser exibido */
  icon: string;
  
  /** Cor em formato hexadecimal (#RRGGBB) */
  color: string;
  
  /** Tipo: receita ou despesa */
  type: TransactionType;
  
  /** Se é uma categoria padrão do sistema (não pode ser excluída) */
  is_default: boolean;
  
  /** Data de criação */
  created_at: string;
}

/**
 * Interface para Transação
 * 
 * Representa uma movimentação financeira (entrada ou saída)
 */
export interface Transaction {
  /** ID único da transação (UUID) */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** ID da categoria associada (pode ser null) */
  category_id: string | null;
  
  /** Descrição da transação */
  description: string;
  
  /** Valor monetário */
  amount: number;
  
  /** Moeda (BRL ou USD) */
  currency: CurrencyType;
  
  /** Tipo: receita ou despesa */
  type: TransactionType;
  
  /** Data da transação (formato YYYY-MM-DD) */
  date: string;
  
  /** Data de criação do registro */
  created_at: string;
  
  /** Data da última atualização */
  updated_at: string;
  
  /** Categoria expandida (quando fazemos JOIN) */
  category?: Category;
}

/**
 * Interface para Meta Financeira
 * 
 * Representa um objetivo de economia
 * Ex: Viagem, Reserva de emergência, etc.
 */
export interface Goal {
  /** ID único da meta (UUID) */
  id: string;
  
  /** ID do usuário proprietário */
  user_id: string;
  
  /** Nome/título da meta */
  name: string;
  
  /** Valor alvo a ser atingido */
  target_amount: number;
  
  /** Valor atual já economizado */
  current_amount: number;
  
  /** Moeda da meta */
  currency: CurrencyType;
  
  /** Data limite (opcional, formato YYYY-MM-DD) */
  deadline: string | null;
  
  /** Data de criação */
  created_at: string;
  
  /** Data da última atualização */
  updated_at: string;
}

/**
 * Interface para Perfil do Usuário
 * 
 * Informações adicionais do usuário além da autenticação
 */
export interface Profile {
  /** ID do usuário (mesmo do auth.users) */
  id: string;
  
  /** Nome completo do usuário */
  full_name: string | null;
  
  /** URL da foto de perfil */
  avatar_url: string | null;
  
  /** Moeda preferida para exibição */
  preferred_currency: CurrencyType;
  
  /** Data de criação do perfil */
  created_at: string;
  
  /** Data da última atualização */
  updated_at: string;
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

/**
 * Dados do formulário de transação
 * 
 * Usado ao criar ou editar uma transação
 */
export interface TransactionFormData {
  /** Descrição da transação */
  description: string;
  
  /** Valor monetário */
  amount: number;
  
  /** Moeda selecionada */
  currency: CurrencyType;
  
  /** Tipo: receita ou despesa */
  type: TransactionType;
  
  /** ID da categoria selecionada */
  category_id: string;
  
  /** Data da transação */
  date: string;
}

/**
 * Dados do formulário de meta
 * 
 * Usado ao criar ou editar uma meta financeira
 */
export interface GoalFormData {
  /** Nome da meta */
  name: string;
  
  /** Valor alvo */
  target_amount: number;
  
  /** Moeda da meta */
  currency: CurrencyType;
  
  /** Prazo (opcional) */
  deadline: string | null;
}

/**
 * Dados do formulário de categoria
 * 
 * Usado ao criar ou editar uma categoria
 */
export interface CategoryFormData {
  /** Nome da categoria */
  name: string;
  
  /** Nome do ícone */
  icon: string;
  
  /** Cor em hexadecimal */
  color: string;
  
  /** Tipo: receita ou despesa */
  type: TransactionType;
}

// ============================================
// TIPOS PARA ESTATÍSTICAS
// ============================================

/**
 * Estatísticas financeiras gerais
 * 
 * Usado no dashboard para exibir resumo financeiro
 */
export interface FinancialStats {
  /** Total de receitas */
  totalIncome: number;
  
  /** Total de despesas */
  totalExpense: number;
  
  /** Saldo (receitas - despesas) */
  balance: number;
  
  /** Tendência comparada ao período anterior */
  trend: 'up' | 'down' | 'stable';
  
  /** Percentual de variação */
  trendPercentage: number;
}

/**
 * Estatísticas por categoria
 * 
 * Usado no gráfico de pizza do dashboard
 */
export interface CategoryStats {
  /** Dados da categoria */
  category: Category;
  
  /** Valor total gasto/recebido nessa categoria */
  total: number;
  
  /** Porcentagem do total */
  percentage: number;
  
  /** Quantidade de transações */
  count: number;
}

/**
 * Estatísticas mensais
 * 
 * Usado nos gráficos de barras e linha do dashboard
 */
export interface MonthlyStats {
  /** Mês no formato YYYY-MM */
  month: string;
  
  /** Total de receitas do mês */
  income: number;
  
  /** Total de despesas do mês */
  expense: number;
  
  /** Saldo do mês */
  balance: number;
}
