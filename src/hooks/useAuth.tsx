/**
 * ================================================
 * HOOK DE AUTENTICAÇÃO (useAuth)
 * ================================================
 * 
 * Este hook gerencia todo o estado de autenticação da aplicação.
 * Utiliza o Supabase Auth para:
 * - Registro de novos usuários (signUp)
 * - Login de usuários existentes (signIn)
 * - Logout (signOut)
 * - Persistência de sessão
 * - Listener de mudanças de estado
 * 
 * Implementa o padrão Context + Provider para disponibilizar
 * o estado de autenticação em toda a aplicação.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Tipos do Supabase para User e Session
import { User, Session } from '@supabase/supabase-js';

// Cliente Supabase configurado
import { supabase } from '@/integrations/supabase/client';

// ============================================
// INTERFACE DO CONTEXTO
// ============================================

/**
 * Define a estrutura do contexto de autenticação
 * 
 * Contém:
 * - Estado do usuário e sessão
 * - Flag de loading
 * - Funções de autenticação
 */
interface AuthContextType {
  /** Objeto do usuário logado (null se não autenticado) */
  user: User | null;
  
  /** Sessão atual (contém tokens de acesso) */
  session: Session | null;
  
  /** Indica se está carregando o estado de autenticação */
  loading: boolean;
  
  /** Função para criar nova conta */
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  
  /** Função para fazer login */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  
  /** Função para fazer logout */
  signOut: () => Promise<void>;
}

// ============================================
// CRIAÇÃO DO CONTEXTO
// ============================================

/**
 * Contexto de autenticação
 * 
 * Inicializado como undefined para detectar uso fora do Provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// COMPONENTE PROVIDER
// ============================================

/**
 * AuthProvider - Componente que fornece o contexto de autenticação
 * 
 * Deve envolver toda a aplicação (ou as partes que precisam de auth)
 * Gerencia:
 * - Estado do usuário/sessão
 * - Listener de mudanças de autenticação
 * - Funções de login/logout/registro
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ==========================================
  // ESTADO LOCAL
  // ==========================================
  
  /** Usuário atualmente autenticado */
  const [user, setUser] = useState<User | null>(null);
  
  /** Sessão atual (contém access_token e refresh_token) */
  const [session, setSession] = useState<Session | null>(null);
  
  /** Flag de carregamento inicial */
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EFEITO: CONFIGURAR LISTENER DE AUTH
  // ==========================================
  
  useEffect(() => {
    /**
     * Configura o listener de mudança de estado de autenticação
     * 
     * IMPORTANTE: Deve ser configurado ANTES de verificar a sessão existente
     * para garantir que mudanças de estado sejam capturadas corretamente
     * 
     * Eventos que disparam o callback:
     * - SIGNED_IN: Usuário fez login
     * - SIGNED_OUT: Usuário fez logout
     * - TOKEN_REFRESHED: Token de acesso foi renovado
     * - USER_UPDATED: Dados do usuário foram atualizados
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Atualiza o estado com a nova sessão/usuário
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    /**
     * Verifica se existe uma sessão ativa no localStorage/cookies
     * 
     * Isso permite que o usuário permaneça logado mesmo após
     * fechar e reabrir o navegador
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    /**
     * Cleanup: Remove o listener quando o componente é desmontado
     * Previne memory leaks e comportamentos inesperados
     */
    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // FUNÇÃO: CRIAR CONTA (SIGN UP)
  // ==========================================
  
  /**
   * Cria uma nova conta de usuário
   * 
   * @param email - Email do usuário
   * @param password - Senha (mínimo 6 caracteres)
   * @param fullName - Nome completo do usuário
   * @returns Objeto com erro (null se sucesso)
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    // URL para redirecionamento após confirmação de email
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // URL de callback após confirmar email
        emailRedirectTo: redirectUrl,
        // Metadados adicionais do usuário
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  // ==========================================
  // FUNÇÃO: LOGIN (SIGN IN)
  // ==========================================
  
  /**
   * Faz login com email e senha
   * 
   * @param email - Email cadastrado
   * @param password - Senha do usuário
   * @returns Objeto com erro (null se sucesso)
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  // ==========================================
  // FUNÇÃO: LOGOUT (SIGN OUT)
  // ==========================================
  
  /**
   * Faz logout do usuário atual
   * 
   * Remove a sessão do localStorage e invalida os tokens
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ==========================================
  // RENDERIZAÇÃO DO PROVIDER
  // ==========================================
  
  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK CUSTOMIZADO
// ============================================

/**
 * Hook para acessar o contexto de autenticação
 * 
 * IMPORTANTE: Só pode ser usado dentro de um AuthProvider
 * 
 * @returns Objeto com estado e funções de autenticação
 * @throws Error se usado fora do AuthProvider
 * 
 * @example
 * const { user, signIn, signOut } = useAuth();
 * 
 * if (user) {
 *   console.log('Logado como:', user.email);
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Valida que o hook está sendo usado dentro do Provider
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
