/**
 * ================================================
 * FUNÇÕES UTILITÁRIAS DE FORMATAÇÃO
 * ================================================
 * 
 * Este arquivo contém funções para formatar valores
 * para exibição na interface do usuário.
 * 
 * Funções disponíveis:
 * - formatCurrency: Formata valores monetários
 * - formatDate: Formata datas para exibição
 * - formatDateForInput: Formata datas para inputs HTML
 * - formatPercentage: Formata porcentagens
 * - getMonthName: Retorna nome do mês
 * - getDaysRemaining: Calcula dias restantes
 * - formatCompactNumber: Formata números grandes
 */

import { CurrencyType } from '@/types/finance';

/**
 * Formata valor monetário de acordo com a moeda
 * 
 * @param value - Valor numérico a ser formatado
 * @param currency - Moeda (BRL ou USD), padrão: BRL
 * @returns String formatada (ex: "R$ 1.234,56" ou "US$ 1,234.56")
 * 
 * @example
 * formatCurrency(1234.56, 'BRL') // "R$ 1.234,56"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 */
export function formatCurrency(value: number, currency: CurrencyType = 'BRL'): string {
  // Usa Intl.NumberFormat para formatação localizada
  const formatter = new Intl.NumberFormat(
    currency === 'BRL' ? 'pt-BR' : 'en-US', // Locale baseado na moeda
    {
      style: 'currency',        // Estilo de moeda
      currency: currency,       // Código da moeda ISO
      minimumFractionDigits: 2, // Mínimo de casas decimais
      maximumFractionDigits: 2, // Máximo de casas decimais
    }
  );

  return formatter.format(value);
}

/**
 * Formata data para exibição (corrige problema de fuso horário)
 * 
 * IMPORTANTE: Quando uma data vem do banco no formato YYYY-MM-DD,
 * o JavaScript interpreta como UTC, causando diferença de fuso.
 * Esta função faz o parse manual para evitar esse problema.
 * 
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @param format - 'short' para DD/MM/YYYY, 'long' para formato extenso
 * @returns String formatada
 * 
 * @example
 * formatDate('2024-03-15', 'short') // "15/03/2024"
 * formatDate('2024-03-15', 'long')  // "sexta-feira, 15 de março de 2024"
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  // Verifica se é string no formato YYYY-MM-DD (formato do banco de dados)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Faz parse manual para evitar conversão UTC
    const [year, month, day] = date.split('-').map(Number);
    
    // Cria data usando componentes locais (não UTC)
    // month - 1 porque os meses em JS são 0-indexados
    const d = new Date(year, month - 1, day);
    
    if (format === 'long') {
      // Formato extenso: "sexta-feira, 15 de março de 2024"
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',  // Nome do dia da semana
        year: 'numeric',  // Ano com 4 dígitos
        month: 'long',    // Nome completo do mês
        day: 'numeric',   // Dia do mês
      });
    }
    
    // Formato curto: "15/03/2024"
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',   // Dia com 2 dígitos
      month: '2-digit', // Mês com 2 dígitos
      year: 'numeric',  // Ano com 4 dígitos
    });
  }
  
  // Se não for string YYYY-MM-DD, converte normalmente
  const d = new Date(date);
  
  if (format === 'long') {
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data para input HTML do tipo date
 * 
 * Inputs HTML do tipo date esperam formato YYYY-MM-DD
 * Esta função garante que a data local seja usada,
 * não a data UTC
 * 
 * @param date - Data como string ou objeto Date
 * @returns String no formato YYYY-MM-DD
 * 
 * @example
 * formatDateForInput(new Date()) // "2024-03-15"
 */
export function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  
  // Usa métodos locais (não UTC) para evitar problemas de fuso
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // +1 porque mês é 0-indexado
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata porcentagem
 * 
 * @param value - Valor numérico
 * @param decimals - Casas decimais (padrão: 1)
 * @returns String formatada com símbolo %
 * 
 * @example
 * formatPercentage(75.567, 1) // "75.6%"
 * formatPercentage(100, 0)    // "100%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Retorna o nome do mês por índice
 * 
 * @param monthIndex - Índice do mês (0 = Janeiro, 11 = Dezembro)
 * @param short - Se true, retorna abreviação de 3 letras
 * @returns Nome do mês em português
 * 
 * @example
 * getMonthName(0)       // "Janeiro"
 * getMonthName(0, true) // "Jan"
 */
export function getMonthName(monthIndex: number, short: boolean = false): string {
  // Arrays com nomes dos meses em português
  const months = short
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    : ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  return months[monthIndex];
}

/**
 * Calcula dias restantes até uma data limite
 * 
 * Útil para mostrar countdown em metas financeiras
 * 
 * @param deadline - Data limite
 * @returns Número de dias (negativo se já passou)
 * 
 * @example
 * getDaysRemaining('2024-12-31') // 290 (se hoje for 15/03/2024)
 */
export function getDaysRemaining(deadline: string | Date): number {
  const now = new Date();
  const target = new Date(deadline);
  
  // Diferença em milissegundos
  const diffTime = target.getTime() - now.getTime();
  
  // Converte para dias (arredonda para cima)
  // 1000ms * 60s * 60min * 24h = 86.400.000ms por dia
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Formata número grande com abreviação
 * 
 * Útil para exibir valores em espaços limitados
 * 
 * @param value - Valor numérico
 * @returns String com abreviação K (mil) ou M (milhão)
 * 
 * @example
 * formatCompactNumber(1500)    // "1.5K"
 * formatCompactNumber(2500000) // "2.5M"
 * formatCompactNumber(500)     // "500"
 */
export function formatCompactNumber(value: number): string {
  // Valores >= 1 milhão
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  
  // Valores >= 1 mil
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  // Valores menores que 1000 - retorna como está
  return value.toString();
}
