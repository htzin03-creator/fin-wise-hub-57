/**
 * ================================================
 * COMPONENTE PRINCIPAL DA APLICAÇÃO (App.tsx)
 * ================================================
 * 
 * Este é o componente raiz que configura toda a estrutura da aplicação:
 * - Providers de contexto (Auth, Query, Tooltip)
 * - Sistema de notificações (Toaster)
 * - Roteamento com React Router
 * - Layout principal para rotas protegidas
 */

// ============================================
// IMPORTAÇÕES DE COMPONENTES DE UI
// ============================================

// Componente de notificações toast (estilo shadcn)
import { Toaster } from "@/components/ui/toaster";

// Componente de notificações toast (estilo Sonner - mais moderno)
import { Toaster as Sonner } from "@/components/ui/sonner";

// Provider para tooltips em toda aplicação
import { TooltipProvider } from "@/components/ui/tooltip";

// ============================================
// IMPORTAÇÕES DE GERENCIAMENTO DE ESTADO
// ============================================

// React Query para cache e gerenciamento de estado servidor
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ============================================
// IMPORTAÇÕES DE ROTEAMENTO
// ============================================

// Componentes do React Router para navegação SPA
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ============================================
// IMPORTAÇÕES DE CONTEXTO E LAYOUT
// ============================================

// Provider de autenticação personalizado
import { AuthProvider } from "@/hooks/useAuth";

// Layout principal com sidebar e header
import { MainLayout } from "@/components/layout/MainLayout";

// ============================================
// IMPORTAÇÕES DE PÁGINAS
// ============================================

// Página inicial (landing page)
import Index from "./pages/Index";

// Página de login/cadastro
import Auth from "./pages/Auth";

// Página de redefinição de senha
import ResetPassword from "./pages/ResetPassword";

// Dashboard com estatísticas e gráficos
import Dashboard from "./pages/Dashboard";

// Lista de transações financeiras
import Transactions from "./pages/Transactions";

// Gerenciamento de metas financeiras
import Goals from "./pages/Goals";

// Gerenciamento de categorias
import Categories from "./pages/Categories";

// Relatórios financeiros
import Reports from "./pages/Reports";

// Configurações do usuário
import Settings from "./pages/Settings";

// Gerenciamento de contas bancárias conectadas
import BankAccounts from "./pages/BankAccounts";

// Página 404 - não encontrado
import NotFound from "./pages/NotFound";

/**
 * Cria uma instância do QueryClient
 * 
 * O QueryClient é responsável por:
 * - Gerenciar o cache de requisições
 * - Controlar refetch automático
 * - Gerenciar estado de loading/error
 */
const queryClient = new QueryClient();

/**
 * COMPONENTE APP
 * 
 * Estrutura hierárquica dos providers:
 * 1. QueryClientProvider - Habilita React Query em toda aplicação
 * 2. AuthProvider - Fornece contexto de autenticação
 * 3. TooltipProvider - Habilita tooltips globalmente
 * 4. Toaster/Sonner - Sistemas de notificação
 * 5. BrowserRouter - Habilita roteamento
 */
const App = () => (
  // Provider do React Query - deve envolver toda a aplicação
  <QueryClientProvider client={queryClient}>
    {/* Provider de autenticação - gerencia estado do usuário */}
    <AuthProvider>
      {/* Provider de tooltips - necessário para componentes Radix */}
      <TooltipProvider>
        {/* Sistema de notificações toast (shadcn) */}
        <Toaster />
        {/* Sistema de notificações toast (Sonner) */}
        <Sonner />
        
        {/* Router principal da aplicação */}
        <BrowserRouter>
          <Routes>
            {/* =====================================
                ROTAS PÚBLICAS
                Acessíveis sem autenticação
            ===================================== */}
            
            {/* Página inicial - landing page */}
            <Route path="/" element={<Index />} />
            
            {/* Página de login/cadastro */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Página de redefinição de senha */}
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* =====================================
                ROTAS PROTEGIDAS
                Requerem autenticação
                Usam o MainLayout como wrapper
            ===================================== */}
            <Route element={<MainLayout />}>
              {/* Dashboard - visão geral das finanças */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Transações - lista e gerenciamento */}
              <Route path="/transactions" element={<Transactions />} />
              
              {/* Metas financeiras */}
              <Route path="/goals" element={<Goals />} />
              
              {/* Categorias de receitas/despesas */}
              <Route path="/categories" element={<Categories />} />
              
              {/* Relatórios e análises */}
              <Route path="/reports" element={<Reports />} />
              
              {/* Configurações do usuário */}
              <Route path="/settings" element={<Settings />} />
              
              {/* Contas bancárias conectadas */}
              <Route path="/bank-accounts" element={<BankAccounts />} />
            </Route>

            {/* =====================================
                ROTA 404
                Captura todas as rotas não encontradas
            ===================================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
